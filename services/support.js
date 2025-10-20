const { SupportTeam, SupportChat, Session } = require('../models');
const { sendWhatsAppMessage } = require('../config/whatsapp');

// Notify support teams about customer activities
const notifySupportTeams = async (customerPhoneNumber, activity, details) => {
  try {
    // Get support teams from database
    const supportTeams = await SupportTeam.findAll({
      where: { isActive: true }
    });
    
    // Prepare notification message
    let message = `🔔 New Customer Activity:\n\n`;
    message += `Customer: ${customerPhoneNumber}\n`;
    message += `Activity: ${activity}\n`;
    
    if (details) {
      message += `Details: ${JSON.stringify(details)}\n`;
    }
    
    message += `\nReply to this message to chat with the customer.`;
    
    // Send notification to all support teams
    for (const team of supportTeams) {
      try {
        await sendWhatsAppMessage(team.phoneNumber, message);
      } catch (error) {
        console.error(`Error notifying support team ${team.name}:`, error);
      }
    }
  } catch (error) {
    console.error('Error notifying support teams:', error);
  }
};

// Notify specific support team
const notifySupportTeam = async (customerPhoneNumber, supportTeamRole, activity, details) => {
  try {
    // Get support team from database
    const supportTeam = await SupportTeam.findOne({
      where: { role: supportTeamRole, isActive: true }
    });
    
    if (!supportTeam) {
      console.error(`Support team with role ${supportTeamRole} not found`);
      return;
    }
    
    // Prepare notification message
    let message = `🔔 New Customer Activity:\n\n`;
    message += `Customer: ${customerPhoneNumber}\n`;
    message += `Activity: ${activity}\n`;
    
    if (details) {
      message += `Details: ${JSON.stringify(details)}\n`;
    }
    
    message += `\nReply to this message to chat with the customer.`;
    
    // Send notification to the specific support team
    await sendWhatsAppMessage(supportTeam.phoneNumber, message);
  } catch (error) {
    console.error(`Error notifying support team ${supportTeamRole}:`, error);
  }
};

// Start support chat
const startSupportChat = async (customerPhoneNumber, supportTeamRole = 'general') => {
  try {
    // Get or create customer session
    let session = await Session.findOne({
      where: { phoneNumber: customerPhoneNumber }
    });
    
    if (!session) {
      session = await Session.create({
        phoneNumber: customerPhoneNumber,
        state: 'SUPPORT_CHAT'
      });
    } else {
      // Update session state
      session.state = 'SUPPORT_CHAT';
      await session.save();
    }
    
    // Get support team from database
    let supportTeam = await SupportTeam.findOne({
      where: { role: supportTeamRole, isActive: true }
    });
    
    // If not found, get default (general) support team
    if (!supportTeam) {
      supportTeam = await SupportTeam.findOne({
        where: { role: 'general', isActive: true }
      });
    }
    
    if (!supportTeam) {
      throw new Error('No active support team available');
    }
    
    // Update session with support team ID
    session.supportTeamId = supportTeam.id;
    await session.save();
    
    // Notify customer
    await sendWhatsAppMessage(
      customerPhoneNumber,
      `You're now connected with ${supportTeam.name}. Please describe your issue and our support team will assist you shortly.`
    );
    
    // Notify support team
    await sendWhatsAppMessage(
      supportTeam.phoneNumber,
      `🆘 New support request from ${customerPhoneNumber}. Please respond to assist.`
    );
    
    return {
      success: true,
      message: `Connected with ${supportTeam.name}`,
      supportTeamId: supportTeam.id
    };
  } catch (error) {
    console.error('Error starting support chat:', error);
    throw error;
  }
};

// Send message to support chat
const sendSupportMessage = async (customerPhoneNumber, message, isFromCustomer = true) => {
  try {
    // Get customer session
    const session = await Session.findOne({
      where: { phoneNumber: customerPhoneNumber, state: 'SUPPORT_CHAT' }
    });
    
    if (!session || !session.supportTeamId) {
      throw new Error('No active support chat found');
    }
    
    // Get support team
    const supportTeam = await SupportTeam.findByPk(session.supportTeamId);
    
    if (!supportTeam) {
      throw new Error('Support team not found');
    }
    
    // Save message to database
    await SupportChat.create({
      customerPhoneNumber,
      supportTeamId: supportTeam.id,
      message,
      isFromCustomer,
      timestamp: new Date(),
      isRead: false
    });
    
    // Forward message to the other party
    if (isFromCustomer) {
      // Send to support team
      await sendWhatsAppMessage(
        supportTeam.phoneNumber,
        `👤 ${customerPhoneNumber}: ${message}`
      );
    } else {
      // Send to customer
      await sendWhatsAppMessage(
        customerPhoneNumber,
        `👨‍💼 Support: ${message}`
      );
    }
    
    return {
      success: true,
      message: 'Message sent successfully'
    };
  } catch (error) {
    console.error('Error sending support message:', error);
    throw error;
  }
};

// End support chat
const endSupportChat = async (customerPhoneNumber) => {
  try {
    // Get customer session
    const session = await Session.findOne({
      where: { phoneNumber: customerPhoneNumber, state: 'SUPPORT_CHAT' }
    });
    
    if (!session || !session.supportTeamId) {
      throw new Error('No active support chat found');
    }
    
    // Get support team
    const supportTeam = await SupportTeam.findByPk(session.supportTeamId);
    
    // Update session state
    session.state = 'LOGGED_IN';
    session.supportTeamId = null;
    await session.save();
    
    // Notify customer
    await sendWhatsAppMessage(
      customerPhoneNumber,
      'Your support chat has ended. Thank you for contacting Drugs.ng support. Is there anything else I can help you with?'
    );
    
    // Notify support team
    if (supportTeam) {
      await sendWhatsAppMessage(
        supportTeam.phoneNumber,
        `✅ Support chat with ${customerPhoneNumber} has ended.`
      );
    }
    
    return {
      success: true,
      message: 'Support chat ended'
    };
  } catch (error) {
    console.error('Error ending support chat:', error);
    throw error;
  }
};

// Get unread support messages
const getUnreadSupportMessages = async (supportTeamId) => {
  try {
    const messages = await SupportChat.findAll({
      where: {
        supportTeamId,
        isRead: false,
        isFromCustomer: true
      },
      order: [['timestamp', 'ASC']]
    });
    
    // Mark messages as read
    await SupportChat.update(
      { isRead: true },
      {
        where: {
          supportTeamId,
          isRead: false,
          isFromCustomer: true
        }
      }
    );
    
    return messages;
  } catch (error) {
    console.error('Error getting unread support messages:', error);
    throw error;
  }
};

module.exports = {
  notifySupportTeams,
  notifySupportTeam,
  startSupportChat,
  sendSupportMessage,
  endSupportChat,
  getUnreadSupportMessages
};