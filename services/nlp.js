const { sessionClient, createDialogflowSession, isDialogflowEnabled } = require('../config/dialogflow');

// Process user message with Dialogflow (with fallback)
const processMessage = async (message, sessionId) => {
  try {
    // Validate input
    if (!message || typeof message !== 'string') {
      throw new Error('Invalid message input');
    }

    if (!sessionId || typeof sessionId !== 'string') {
      throw new Error('Invalid session ID');
    }

    // Use fallback if Dialogflow is not enabled
    if (!isDialogflowEnabled()) {
      console.log('Dialogflow not enabled, using fallback NLP');
      return fallbackNLP(message);
    }

    try {
      const sessionPath = createDialogflowSession(sessionId);

      const request = {
        session: sessionPath,
        queryInput: {
          text: {
            text: message.trim(),
            languageCode: 'en-US',
          },
        },
      };

      const responses = await sessionClient.detectIntent(request);
      const result = responses[0].queryResult;

      // Extract parameters properly from Dialogflow response
      const parameters = {};
      if (result.parameters && result.parameters.fields) {
        Object.keys(result.parameters.fields).forEach(key => {
          const field = result.parameters.fields[key];
          if (field.stringValue) {
            parameters[key] = field.stringValue;
          } else if (field.numberValue) {
            parameters[key] = field.numberValue;
          } else if (field.listValue) {
            parameters[key] = field.listValue.values.map(v => v.stringValue || v.numberValue);
          }
        });
      }

      return {
        intent: result.intent ? result.intent.displayName : 'unknown',
        parameters: parameters,
        fulfillmentText: result.fulfillmentText || 'I did not understand that. Please try again.',
        confidence: result.intentDetectionConfidence || 0,
        source: 'dialogflow'
      };
    } catch (dialogflowError) {
      console.warn('Dialogflow API error, falling back to keyword matching:', dialogflowError.message);
      return fallbackNLP(message);
    }
  } catch (error) {
    console.error('NLP processing error:', error);
    return {
      intent: 'unknown',
      parameters: {},
      fulfillmentText: "I'm having trouble processing your message. Please try again.",
      confidence: 0,
      source: 'error'
    };
  }
};

// Simple fallback NLP when Dialogflow fails
const fallbackNLP = (message) => {
  try {
    const lowerMessage = message.toLowerCase().trim();

    // Validate input
    if (!message || message.length === 0) {
      return {
        intent: 'unknown',
        parameters: {},
        fulfillmentText: 'Please send me a message to get started.',
        source: 'fallback'
      };
    }

    const words = message.split(/\s+/);
    const parameters = {};

    // Greeting intents
    if (/^(hello|hi|hey|greetings|good morning|good afternoon|good evening)/.test(lowerMessage)) {
      return {
        intent: 'greeting',
        parameters: {},
        fulfillmentText: 'Hello! Welcome to Drugs.ng. How can I assist you today? You can:\n1. Search for medicines\n2. Find doctors\n3. Track your orders\n4. Get support\n\nJust tell me what you need!',
        source: 'fallback'
      };
    }

    // Registration intents
    if (/^(register|signup|sign up|create account|new account)/.test(lowerMessage)) {
      const emailMatch = message.match(/[\w.-]+@[\w.-]+\.\w+/);
      if (emailMatch) parameters.email = emailMatch[0];

      // Parse registration data: "register John Doe john@example.com mypassword"
      const registerMatch = message.match(/^(register|signup|sign up|create account|new account)\s+(.+?)(?:\s+[\w.-]+@[\w.-]+\.\w+)?(?:\s+\S+)?$/i);
      if (registerMatch) {
        const afterRegister = message.replace(/^(register|signup|sign up|create account|new account)\s+/i, '').trim();
        const parts = afterRegister.split(/\s+/);

        // Find email position
        let emailIndex = -1;
        for (let i = 0; i < parts.length; i++) {
          if (parts[i].includes('@')) {
            emailIndex = i;
            break;
          }
        }

        // Extract name (everything before email)
        if (emailIndex > 0) {
          parameters.name = parts.slice(0, emailIndex).join(' ');
        }

        // Extract email
        if (emailIndex !== -1) {
          parameters.email = parts[emailIndex];
        }

        // Extract password (everything after email)
        if (emailIndex !== -1 && emailIndex + 1 < parts.length) {
          parameters.password = parts.slice(emailIndex + 1).join(' ');
        }
      }

      return {
        intent: 'register',
        parameters,
        fulfillmentText: 'I\'ll help you register. Please provide:\n1. Your full name\n2. Email address\n3. A password\n\nExample: "register John Doe john@example.com mypassword"',
        source: 'fallback'
      };
    }

    // Login intents
    if (/^(login|signin|sign in|log in)/.test(lowerMessage)) {
      const emailMatch = message.match(/[\w.-]+@[\w.-]+\.\w+/);
      if (emailMatch) parameters.email = emailMatch[0];
      return {
        intent: 'login',
        parameters,
        fulfillmentText: 'I\'ll help you login. Please provide:\n1. Your email\n2. Your password\n\nExample: "login john@example.com mypassword"',
        source: 'fallback'
      };
    }

    // Product search intents
    if (/^(search|find|show|look for|do you have).*?(medicine|drug|product|medication|pill|tablet)/.test(lowerMessage) ||
        /^(medicine|drug|product|medication|pill|tablet)/.test(lowerMessage)) {
      // Extract product name
      const searchKeywords = ['search', 'find', 'show', 'look for', 'do you have'];
      let productName = message;

      for (const keyword of searchKeywords) {
        const index = lowerMessage.indexOf(keyword);
        if (index !== -1) {
          productName = message.substring(index + keyword.length).trim();
          break;
        }
      }

      // Remove common words
      productName = productName.replace(/^(for|a|an)\s+/i, '').trim();
      if (productName) parameters.product = productName;

      return {
        intent: 'search_products',
        parameters,
        fulfillmentText: `I'll help you search for medicines. ${productName ? `Searching for: ${productName}` : 'What medicine are you looking for?'}`,
        source: 'fallback'
      };
    }

    // Add to cart intents
    if (/^(add|put).*?(cart|basket)/.test(lowerMessage)) {
      const numbers = message.match(/\d+/g);
      if (numbers && numbers.length >= 1) {
        parameters.productIndex = numbers[0];
        if (numbers.length >= 2) {
          parameters.quantity = numbers[1];
        } else {
          parameters.quantity = '1';
        }
      }
      return {
        intent: 'add_to_cart',
        parameters,
        fulfillmentText: 'I can add items to your cart. Reply with: "add [product number] [quantity]"\nExample: "add 1 2" for 2 units of product 1',
        source: 'fallback'
      };
    }

    // Order/Checkout intents
    if (/^(order|checkout|place order|buy|purchase|proceed to|complete)/.test(lowerMessage)) {
      return {
        intent: 'place_order',
        parameters,
        fulfillmentText: 'I\'ll help you place an order. Please provide:\n1. Delivery address\n2. Payment method (Flutterwave, Paystack, or Cash on Delivery)\n\nExample: "order 123 Main St, Lagos Flutterwave"',
        source: 'fallback'
      };
    }

    // Track order intents
    if (/^(track|where is|status of|check|trace).*?(order|delivery|package)/.test(lowerMessage)) {
      const numbers = message.match(/\d+/g);
      if (numbers && numbers.length > 0) {
        parameters.orderId = numbers[0];
      }
      return {
        intent: 'track_order',
        parameters,
        fulfillmentText: `I can help you track your order. ${parameters.orderId ? `Tracking order #${parameters.orderId}` : 'Please provide your order ID.'}`,
        source: 'fallback'
      };
    }

    // Doctor search intents
    if (/^(find|search|need|looking for|want to see).*?(doctor|physician|specialist)/.test(lowerMessage) ||
        /^(doctor|physician|specialist)/.test(lowerMessage)) {
      const specialties = ['cardiologist', 'pediatrician', 'dermatologist', 'gynecologist', 'general practitioner', 'neurologist', 'orthopedic'];
      for (const specialty of specialties) {
        if (lowerMessage.includes(specialty)) {
          parameters.specialty = specialty;
          break;
        }
      }

      // Extract location if provided
      const locationMatch = lowerMessage.match(/in\s+([A-Za-z\s]+)/i);
      if (locationMatch) {
        parameters.location = locationMatch[1].trim();
      }

      return {
        intent: 'search_doctors',
        parameters,
        fulfillmentText: 'I can help you find doctors. Which specialty do you need?\nExamples: cardiologist, pediatrician, dermatologist, gynecologist, general practitioner',
        source: 'fallback'
      };
    }

    // Appointment booking intents
    if (/^(book|schedule|make|arrange).*?(appointment|consultation|visit)/.test(lowerMessage)) {
      return {
        intent: 'book_appointment',
        parameters,
        fulfillmentText: 'I can help you book an appointment. Please provide:\n1. Doctor number\n2. Date (YYYY-MM-DD)\n3. Time (HH:MM)\n\nExample: "book 1 2024-01-15 14:00"',
        source: 'fallback'
      };
    }

    // Payment intents
    if (/^(pay|payment|process payment)/.test(lowerMessage)) {
      return {
        intent: 'payment',
        parameters,
        fulfillmentText: 'I can help you make a payment. Please provide:\n1. Order ID\n2. Payment provider (flutterwave or paystack)\n\nExample: "pay 12345 flutterwave"',
        source: 'fallback'
      };
    }

    // Help intents
    if (/^(help|menu|what can you do|capabilities|features)/.test(lowerMessage)) {
      return {
        intent: 'help',
        parameters,
        fulfillmentText: `🏥 *Drugs.ng WhatsApp Bot - Available Services:*

1️⃣ *Find Medicines* - "Find paracetamol"
2️⃣ *Find Doctors* - "Find a cardiologist in Lagos"
3️⃣ *Order Medicines* - Search → Add to cart → Order
4️⃣ *Track Orders* - "Track 12345"
5️⃣ *Book Appointments* - "Book a cardiologist on 2024-01-15 at 14:00"
6️⃣ *Customer Support* - "Support" to chat with an agent

Type any of these or describe what you need!`,
        source: 'fallback'
      };
    }

    // Support/Chat intents
    if (/^(support|agent|help me|speak to|chat with|contact|complaint|issue)/.test(lowerMessage)) {
      return {
        intent: 'support',
        parameters,
        fulfillmentText: 'Connecting you to our support team. Please describe your issue and a support agent will assist you shortly.',
        source: 'fallback'
      };
    }

    // Default unknown intent
    return {
      intent: 'unknown',
      parameters,
      fulfillmentText: "I'm not sure how to help with that. Type 'help' to see what I can do for you.",
      source: 'fallback'
    };
  } catch (error) {
    console.error('Fallback NLP error:', error);
    return {
      intent: 'unknown',
      parameters: {},
      fulfillmentText: "I encountered an error processing your message. Please try again.",
      source: 'fallback-error'
    };
  }
};

module.exports = {
  processMessage
};
