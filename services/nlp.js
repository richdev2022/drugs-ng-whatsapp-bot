const FEATURE_COMMANDS = {
  '1': { intent: 'search_products', label: 'Search Medicines' },
  '2': { intent: 'search_doctors', label: 'Find Doctors' },
  '3': { intent: 'track_order', label: 'Track Orders' },
  '4': { intent: 'book_appointment', label: 'Book Appointment' },
  '5': { intent: 'place_order', label: 'Place Order' },
  '6': { intent: 'support', label: 'Customer Support' },
  '7': { intent: 'diagnostic_tests', label: 'Book Diagnostic Tests' },
  '8': { intent: 'healthcare_products', label: 'Browse Healthcare Products' }
};

const HELP_MESSAGE = `🏥 *Drugs.ng WhatsApp Bot - Available Services:*

1️⃣ *Search Medicines* - Type "1" or "find paracetamol"
2️⃣ *Find Doctors* - Type "2" or "find a cardiologist"
3️⃣ *Track Orders* - Type "3" or "track 12345"
4️⃣ *Book Appointment* - Type "4" or "book a doctor"
5️⃣ *Place Order* - Type "5" or "order medicines"
6️⃣ *Customer Support* - Type "6" or "connect me to support"
7️⃣ *Book Diagnostic Tests* - Type "7" or "book a blood test"
8️⃣ *Healthcare Products* - Type "8" or "browse health products"

Simply reply with a number (1-8) or describe what you need!`;

const processMessage = async (message, phoneNumber, session) => {
  try {
    if (!message || typeof message !== 'string') {
      return createResponse('unknown', {}, 'Invalid message format');
    }

    const lowerMessage = message.toLowerCase().trim();

    // Check for numeric command first (e.g., "1", "2", etc.)
    if (/^\d+$/.test(lowerMessage)) {
      const commandKey = lowerMessage.trim();
      if (FEATURE_COMMANDS[commandKey]) {
        return createResponse(FEATURE_COMMANDS[commandKey].intent, {}, null, 'numeric');
      }
    }

    // Help intent
    if (/^(help|menu|what can you do|capabilities|features|\?)$/.test(lowerMessage)) {
      return createResponse('help', {}, HELP_MESSAGE);
    }

    // Logout intent
    if (/^(logout|exit|bye|goodbye|sign out|log out)$/.test(lowerMessage)) {
      return createResponse('logout', {}, null);
    }

    // Greeting intents
    if (/^(hello|hi|hey|greetings|good morning|good afternoon|good evening|start|begin)$/.test(lowerMessage)) {
      return createResponse('greeting', {}, null);
    }

    // Registration intents
    if (/^(register|signup|sign up|create account|new account)/.test(lowerMessage)) {
      return handleRegistrationIntent(message);
    }

    // Login intents
    if (/^(login|signin|sign in|log in|authenticate)/.test(lowerMessage)) {
      return handleLoginIntent(message);
    }

    // Product search intents
    if (/^(search|find|show|look for|do you have|give me|send me).*?(medicine|drug|product|medication|pill|tablet)/.test(lowerMessage) ||
        /^(medicine|drug|product|medication|pill|tablet)/.test(lowerMessage) ||
        lowerMessage === '1') {
      return handleProductSearchIntent(message);
    }

    // Add to cart intents
    if (/^(add|put|move).*?(cart|basket)/.test(lowerMessage)) {
      return handleAddToCartIntent(message);
    }

    // Order/Checkout intents
    if (/^(order|checkout|place order|buy|purchase|proceed to|complete|confirm order)/.test(lowerMessage) ||
        lowerMessage === '5') {
      return handlePlaceOrderIntent(message);
    }

    // Track order intents
    if (/^(track|where is|status of|check|trace|update on).*?(order|delivery|package)/.test(lowerMessage) ||
        lowerMessage === '3') {
      return handleTrackOrderIntent(message);
    }

    // Doctor search intents
    if (/^(find|search|need|looking for|want to see|book|appointment with).*?(doctor|physician|specialist|cardiologist|pediatrician|dermatologist|gynecologist|neurologist|orthopedic)/.test(lowerMessage) ||
        /^(doctor|physician|specialist)/.test(lowerMessage) ||
        lowerMessage === '2') {
      return handleDoctorSearchIntent(message);
    }

    // Appointment booking intents
    if (/^(book|schedule|make|arrange|reserve).*?(appointment|consultation|visit)/.test(lowerMessage) ||
        lowerMessage === '4') {
      return handleBookAppointmentIntent(message);
    }

    // Payment intents
    if (/^(pay|payment|process payment|pay for|settle)/.test(lowerMessage)) {
      return handlePaymentIntent(message);
    }

    // Support/Chat intents
    if (/^(support|agent|help me|speak to|chat with|contact|complaint|issue|problem|help|talk to agent)/.test(lowerMessage) ||
        lowerMessage === '6') {
      return createResponse('support', {}, 'Connecting you to our support team...');
    }

    // Default: Try to extract intent from keywords
    const extractedIntent = extractIntentFromMessage(lowerMessage);
    if (extractedIntent && extractedIntent.intent !== 'unknown') {
      return extractedIntent;
    }

    return createResponse('unknown', {}, "I didn't understand that. Type 'help' to see what I can do.");
  } catch (error) {
    console.error('NLP processing error:', error);
    return createResponse('error', {}, 'I encountered an error processing your message. Please try again.');
  }
};

const createResponse = (intent, parameters = {}, fulfillmentText = null, source = 'custom-nlp') => {
  const defaultMessages = {
    help: HELP_MESSAGE,
    greeting: null,
    register: "I'll help you register. Please provide your full name, email, and a password.\n\nExample: register John Doe john@example.com mypassword",
    login: "I'll help you login. Please provide your email and password.\n\nExample: login john@example.com mypassword",
    search_products: "What medicine or product are you looking for?",
    add_to_cart: 'Please specify the product number and quantity.\n\nExample: add 1 2 (adds 2 units of product 1)',
    place_order: 'I can help you place an order. Please provide your delivery address and payment method.',
    track_order: 'Please provide your order ID to track it.\n\nExample: track 12345',
    search_doctors: 'What type of doctor are you looking for? (e.g., cardiologist, pediatrician)',
    book_appointment: 'I can help you book an appointment. Please provide the doctor and your preferred date and time.',
    payment: 'I can help you make a payment. Please provide your order ID and preferred payment method.',
    support: 'Connecting you to our support team. Please describe your issue.',
    logout: 'You have been logged out. Type "help" to get started again.',
    unknown: "I'm not sure how to help with that. Type 'help' to see available options.",
    error: 'I encountered an error. Please try again.'
  };

  return {
    intent,
    parameters,
    fulfillmentText: fulfillmentText || defaultMessages[intent] || defaultMessages['unknown'],
    confidence: 0.9,
    source
  };
};

const handleRegistrationIntent = (message) => {
  const parameters = {};

  // Try to extract registration data
  const emailMatch = message.match(/[\w.-]+@[\w.-]+\.\w+/);
  if (emailMatch) {
    parameters.email = emailMatch[0];
  }

  const afterRegister = message.replace(/^(register|signup|sign up|create account|new account)\s+/i, '').trim();
  const parts = afterRegister.split(/\s+/);

  let emailIndex = -1;
  for (let i = 0; i < parts.length; i++) {
    if (parts[i].includes('@')) {
      emailIndex = i;
      break;
    }
  }

  if (emailIndex > 0) {
    parameters.name = parts.slice(0, emailIndex).join(' ');
  }

  if (emailIndex !== -1) {
    parameters.email = parts[emailIndex];
  }

  if (emailIndex !== -1 && emailIndex + 1 < parts.length) {
    parameters.password = parts.slice(emailIndex + 1).join(' ');
  }

  return createResponse('register', parameters);
};

const handleLoginIntent = (message) => {
  const parameters = {};

  const emailMatch = message.match(/[\w.-]+@[\w.-]+\.\w+/);
  if (emailMatch) {
    parameters.email = emailMatch[0];
  }

  const afterLogin = message.replace(/^(login|signin|sign in|log in|authenticate)\s+/i, '').trim();
  const parts = afterLogin.split(/\s+/);

  for (let i = 0; i < parts.length; i++) {
    if (parts[i].includes('@')) {
      parameters.email = parts[i];
      if (i + 1 < parts.length) {
        parameters.password = parts.slice(i + 1).join(' ');
      }
      break;
    }
  }

  return createResponse('login', parameters);
};

const handleProductSearchIntent = (message) => {
  const parameters = {};
  const lowerMessage = message.toLowerCase();

  const searchKeywords = ['search', 'find', 'show', 'look for', 'do you have', 'give me', 'send me'];
  const productKeywords = ['medicine', 'drug', 'product', 'medication', 'pill', 'tablet'];

  let productName = message;

  for (const keyword of searchKeywords) {
    const index = lowerMessage.indexOf(keyword);
    if (index !== -1) {
      productName = message.substring(index + keyword.length).trim();
      break;
    }
  }

  // Remove common words and product type keywords
  productName = productName.replace(/^(for|a|an|the)\s+/i, '').trim();
  for (const keyword of productKeywords) {
    productName = productName.replace(new RegExp(`\\b${keyword}\\b`, 'i'), '').trim();
  }

  if (productName) {
    parameters.product = productName;
  }

  return createResponse('search_products', parameters);
};

const handleAddToCartIntent = (message) => {
  const parameters = {};
  const numbers = message.match(/\d+/g);

  if (numbers && numbers.length >= 1) {
    parameters.productIndex = numbers[0];
    parameters.quantity = numbers.length >= 2 ? numbers[1] : '1';
  }

  return createResponse('add_to_cart', parameters);
};

const handlePlaceOrderIntent = (message) => {
  const parameters = {};

  // Look for address patterns (usually contains comma or specific location words)
  const addressMatch = message.match(/(?:at|to|address|location)?\s*([^,]+(,[^,]+)?)/i);
  if (addressMatch) {
    parameters.address = addressMatch[1].trim();
  }

  // Look for payment method
  if (/flutterwave/i.test(message)) {
    parameters.paymentMethod = 'Flutterwave';
  } else if (/paystack/i.test(message)) {
    parameters.paymentMethod = 'Paystack';
  } else if (/cash/i.test(message)) {
    parameters.paymentMethod = 'Cash on Delivery';
  }

  return createResponse('place_order', parameters);
};

const handleTrackOrderIntent = (message) => {
  const parameters = {};
  const numbers = message.match(/\d+/g);

  if (numbers && numbers.length > 0) {
    parameters.orderId = numbers[0];
  }

  return createResponse('track_order', parameters);
};

const handleDoctorSearchIntent = (message) => {
  const parameters = {};
  const lowerMessage = message.toLowerCase();

  const specialties = [
    'cardiologist', 'pediatrician', 'dermatologist', 'gynecologist',
    'general practitioner', 'neurologist', 'orthopedic', 'ophthalmologist',
    'pulmonologist', 'gastroenterologist', 'urologist', 'psychiatrist'
  ];

  for (const specialty of specialties) {
    if (lowerMessage.includes(specialty)) {
      parameters.specialty = specialty;
      break;
    }
  }

  // Extract location
  const locationMatch = lowerMessage.match(/in\s+([A-Za-z\s]+?)(?:\s+on|\s+at|$)/i);
  if (locationMatch) {
    parameters.location = locationMatch[1].trim();
  }

  return createResponse('search_doctors', parameters);
};

const handleBookAppointmentIntent = (message) => {
  const parameters = {};

  const numbers = message.match(/\d+/g);
  if (numbers && numbers.length >= 1) {
    parameters.doctorIndex = numbers[0];
  }

  // Try to extract date (YYYY-MM-DD format)
  const dateMatch = message.match(/(\d{4}-\d{2}-\d{2}|\d{1,2}\/\d{1,2}\/\d{4})/);
  if (dateMatch) {
    parameters.date = dateMatch[1];
  }

  // Try to extract time (HH:MM format)
  const timeMatch = message.match(/(\d{1,2}):(\d{2})\s*(am|pm)?/i);
  if (timeMatch) {
    parameters.time = timeMatch[0].trim();
  }

  return createResponse('book_appointment', parameters);
};

const handlePaymentIntent = (message) => {
  const parameters = {};
  const lowerMessage = message.toLowerCase();

  const numbers = message.match(/\d+/g);
  if (numbers && numbers.length > 0) {
    parameters.orderId = numbers[0];
  }

  if (/flutterwave/i.test(lowerMessage)) {
    parameters.provider = 'Flutterwave';
  } else if (/paystack/i.test(lowerMessage)) {
    parameters.provider = 'Paystack';
  }

  return createResponse('payment', parameters);
};

const extractIntentFromMessage = (lowerMessage) => {
  const keywords = [
    {
      patterns: [/medicine|drug|pharmacy|health|medicinal/],
      intent: 'search_products'
    },
    {
      patterns: [/doctor|physician|clinic|medical|health professional/],
      intent: 'search_doctors'
    },
    {
      patterns: [/appointment|consultation|visit|schedule/],
      intent: 'book_appointment'
    },
    {
      patterns: [/order|purchase|buy|checkout|cart/],
      intent: 'place_order'
    },
    {
      patterns: [/deliver|shipping|progress|arrive|when|where/],
      intent: 'track_order'
    }
  ];

  for (const { patterns, intent } of keywords) {
    for (const pattern of patterns) {
      if (pattern.test(lowerMessage)) {
        return createResponse(intent, {});
      }
    }
  }

  return null;
};

const formatResponseWithOptions = (message, isLoggedIn) => {
  let optionsText = '\n\n---\n';

  if (isLoggedIn) {
    optionsText += '📋 *Options:* Type "help" for menu | "logout" to sign out';
  } else {
    optionsText += '📋 *Options:* Type "help" for menu | "login" to sign in | "register" to create account';
  }

  return message + optionsText;
};

module.exports = {
  processMessage,
  formatResponseWithOptions,
  FEATURE_COMMANDS,
  HELP_MESSAGE
};
