const Tesseract = require('tesseract.js');
const { Prescription, Order } = require('../models');
const fs = require('fs');
const path = require('path');

// Initialize Tesseract worker
let worker = null;

// Initialize OCR worker
const initializeOCRWorker = async () => {
  try {
    if (!worker) {
      worker = await Tesseract.createWorker();
    }
    return worker;
  } catch (error) {
    console.error('Error initializing OCR worker:', error);
    throw error;
  }
};

// Extract text from prescription image/PDF
const extractPrescriptionText = async (imagePath) => {
  try {
    if (!imagePath) {
      throw new Error('Image path is required');
    }

    // Initialize worker if needed
    const ocrWorker = await initializeOCRWorker();

    // Perform OCR
    const { data: { text } } = await ocrWorker.recognize(imagePath, 'eng');

    // Parse extracted text for common prescription patterns
    const prescriptionData = parsePrescriptionText(text);

    return {
      success: true,
      extractedText: text,
      parsedData: prescriptionData
    };
  } catch (error) {
    console.error('Error extracting prescription text:', error);
    throw error;
  }
};

// Parse prescription text to extract key information
const parsePrescriptionText = (text) => {
  try {
    const prescription = {
      patientName: null,
      doctorName: null,
      medicines: [],
      instructions: [],
      issueDate: null
    };

    // Extract patient name (usually after "Patient:" or "Name:")
    const patientMatch = text.match(/(?:Patient:|Name:)\s*([^\n]+)/i);
    if (patientMatch) {
      prescription.patientName = patientMatch[1].trim();
    }

    // Extract doctor name (usually after "Doctor:" or "Dr.")
    const doctorMatch = text.match(/(?:Doctor:|Dr\.?)\s*([^\n]+)/i);
    if (doctorMatch) {
      prescription.doctorName = doctorMatch[1].trim();
    }

    // Extract medicines (look for common patterns like "Rx" or medicine names followed by dosage)
    const medicinePattern = /([A-Za-z\s]+)\s*(\d+\s*mg|\d+\s*ml|\d+\s*[a-z]+)?\s*(?:,|\|)?(?:\s*\d+\s*times?)?/gi;
    const medicineMatches = text.match(medicinePattern);
    if (medicineMatches) {
      prescription.medicines = medicineMatches.slice(0, 10).map(m => m.trim()).filter(m => m.length > 3);
    }

    // Extract date
    const dateMatch = text.match(/(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/);
    if (dateMatch) {
      prescription.issueDate = dateMatch[1];
    }

    return prescription;
  } catch (error) {
    console.error('Error parsing prescription text:', error);
    return {
      patientName: null,
      doctorName: null,
      medicines: [],
      instructions: [],
      issueDate: null
    };
  }
};

// Save prescription for an order
const savePrescription = async (orderId, fileUrl, extractedText = null, parsedData = null) => {
  try {
    if (!orderId || !fileUrl) {
      throw new Error('Order ID and file URL are required');
    }

    // Verify order exists
    const order = await Order.findByPk(orderId);
    if (!order) {
      throw new Error('Order not found');
    }

    // Check if prescription already exists
    let prescription = await Prescription.findOne({ where: { orderId } });

    if (prescription) {
      // Update existing prescription
      prescription.fileUrl = fileUrl;
      if (extractedText) {
        prescription.extractedText = extractedText;
      }
      await prescription.save();
    } else {
      // Create new prescription
      prescription = await Prescription.create({
        orderId,
        fileUrl,
        extractedText,
        verificationStatus: 'Pending'
      });
    }

    return {
      success: true,
      message: 'Prescription saved successfully',
      prescriptionId: prescription.id,
      verificationStatus: prescription.verificationStatus
    };
  } catch (error) {
    console.error('Error saving prescription:', error);
    throw error;
  }
};

// Get prescription for an order
const getPrescription = async (orderId) => {
  try {
    const prescription = await Prescription.findOne({
      where: { orderId },
      include: [
        {
          model: Order,
          attributes: ['id', 'userId', 'totalAmount', 'paymentStatus']
        }
      ]
    });

    if (!prescription) {
      throw new Error('Prescription not found for this order');
    }

    return prescription;
  } catch (error) {
    console.error('Error getting prescription:', error);
    throw error;
  }
};

// Verify prescription by pharmacist
const verifyPrescription = async (prescriptionId, verificationStatus, pharmacistNotes = null, pharmacistName = null) => {
  try {
    if (!prescriptionId || !verificationStatus) {
      throw new Error('Prescription ID and verification status are required');
    }

    if (!['Verified', 'Rejected'].includes(verificationStatus)) {
      throw new Error('Verification status must be either Verified or Rejected');
    }

    const prescription = await Prescription.findByPk(prescriptionId);
    if (!prescription) {
      throw new Error('Prescription not found');
    }

    prescription.verificationStatus = verificationStatus;
    prescription.verifiedAt = new Date();
    if (pharmacistNotes) {
      prescription.pharmacistNotes = pharmacistNotes;
    }
    if (pharmacistName) {
      prescription.verifiedBy = pharmacistName;
    }

    await prescription.save();

    return {
      success: true,
      message: `Prescription ${verificationStatus.toLowerCase()} successfully`,
      prescription
    };
  } catch (error) {
    console.error('Error verifying prescription:', error);
    throw error;
  }
};

// Get pending prescriptions (for pharmacist verification)
const getPendingPrescriptions = async (limit = 20) => {
  try {
    const prescriptions = await Prescription.findAll({
      where: { verificationStatus: 'Pending' },
      include: [
        {
          model: Order,
          attributes: ['id', 'userId', 'totalAmount', 'createdAt']
        }
      ],
      order: [['createdAt', 'ASC']],
      limit
    });

    return prescriptions;
  } catch (error) {
    console.error('Error getting pending prescriptions:', error);
    throw error;
  }
};

// Terminate OCR worker when shutting down
const terminateOCRWorker = async () => {
  try {
    if (worker) {
      await worker.terminate();
      worker = null;
    }
  } catch (error) {
    console.error('Error terminating OCR worker:', error);
  }
};

module.exports = {
  extractPrescriptionText,
  parsePrescriptionText,
  savePrescription,
  getPrescription,
  verifyPrescription,
  getPendingPrescriptions,
  terminateOCRWorker,
  initializeOCRWorker
};
