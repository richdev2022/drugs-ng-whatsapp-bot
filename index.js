// Initialize environment and configuration first
const { getEnv } = require('./config/env');
const ENV = getEnv();

require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const { sequelize, initializeDatabase } = require('./models');
const { sendWhatsAppMessage, markMessageAsRead } = require('./config/whatsapp');
const { processMessage, formatResponseWithOptions } = require('./services/nlp');
const {
  registerUser,
  loginUser,
  searchProducts,
  addToCart,
  placeOrder,
  trackOrder,
  searchDoctors,
  bookAppointment
} = require('./services/drugsng');
const { processFlutterwavePayment, processPaystackPayment, verifyPayment } = require('./services/payment');
const { encryptData, decryptData, generateToken } = require('./services/security');
const { handleApiError, handleDbError, handleValidationError, createErrorResponse, createSuccessResponse } = require('./utils/errorHandler');
const { checkRateLimit } = require('./utils/rateLimiter');
const { isValidRegistrationData, isValidLoginData, sanitizeInput, normalizePhoneNumber } = require('./utils/validation');
const {
  notifySupportTeams,
  notifySupportTeam,
  startSupportChat,
  sendSupportMessage,
  endSupportChat,
  getUnreadSupportMessages
} = require('./services/support');

const app = express();
const PORT = ENV.PORT || 3000;

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Initialize database and then start server
async function startServer() {
  try {
    // Start server first
    app.listen(PORT, () => {
      console.log(`Drugs.ng WhatsApp Bot server running on port ${PORT}`);
      const webhookUrl = process.env.NODE_ENV === 'production' 
        ? 'https://drugs-ng-whatsapp-bot.vercel.app/webhook'
        : `http://localhost:${PORT}/webhook`;
      console.log(`Webhook endpoint: ${webhookUrl}`);
    });

    // Try to connect to database in the background with retries
    let retries = 5;
    let connected = false;
    
    while (retries > 0 && !connected) {
      try {
        await sequelize.authenticate();
        console.log('PostgreSQL connection established successfully.');
        connected = true;
        
        // Initialize database
        await initializeDatabase();
        console.log('Database initialized successfully.');
      } catch (dbError) {
        retries--;
        if (retries === 0) {
          console.warn('Database connection failed after multiple attempts - starting server in limited mode:', dbError.message);
          console.warn('Please configure database credentials to enable full functionality.');
        } else {
          console.log(`Database connection attempt failed. Retrying... (${retries} attempts left)`);
          // Wait for 2 seconds before retrying
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }
    }
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Root endpoint for status check
app.get('/', (req, res) => {
  res.status(200).json({
    status: 'ok',
    message: 'Drugs.ng WhatsApp Bot API is running',
    version: '1.0.0',
    databaseConnected: sequelize.authenticate().then(() => true).catch(() => false)
  });
});

// WhatsApp webhook verification
app.get('/webhook', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode && token) {
    if (mode === 'subscribe' && token === process.env.WHATSAPP_VERIFY_TOKEN) {
      console.log('WEBHOOK_VERIFIED');
      res.status(200).send(challenge);
    } else {
      res.sendStatus(403);
    }
  }
});

// WhatsApp webhook handler
app.post('/webhook', async (req, res) => {
  try {
    const data = req.body;

    // Check if this is a WhatsApp message
    if (data.object === 'whatsapp_business_account') {
      // Process each entry
      for (const entry of data.entry) {
        for (const change of entry.changes) {
          if (change.field === 'messages') {
            // Check if messages array exists before accessing
            if (!change.value.messages || change.value.messages.length === 0) {
              continue;
            }

            const message = change.value.messages[0];

            if (message.type === 'text') {
              const phoneNumber = message.from;
              const messageText = message.text.body;
              const messageId = message.id;

              console.log(`📨 Received message from ${phoneNumber}: "${messageText}"`);

              // Mark message as read
              try {
                await markMessageAsRead(messageId);
              } catch (readError) {
                console.warn('Failed to mark message as read:', readError.message);
              }

              // Check if this is a support team message
              const supportTeam = await sequelize.models.SupportTeam.findOne({
                where: { phoneNumber }
              });

              try {
                if (supportTeam) {
                  // This is a message from support team
                  console.log(`👨‍💼 Support team message from ${phoneNumber}`);
                  await handleSupportTeamMessage(phoneNumber, messageText);
                } else {
                  // This is a message from customer
                  console.log(`👤 Customer message from ${phoneNumber}`);
                  await handleCustomerMessage(phoneNumber, messageText);
                }
              } catch (handleError) {
                console.error(`❌ Error handling message from ${phoneNumber}:`, handleError.message);
                // Try to send error message to user
                try {
                  await sendWhatsAppMessage(phoneNumber, 'Sorry, I encountered an error processing your message. Please try again.');
                } catch (errorReplyError) {
                  console.error('Failed to send error reply:', errorReplyError.message);
                }
              }
            }
          }
        }
      }

      res.sendStatus(200);
    } else {
      res.sendStatus(404);
    }
  } catch (error) {
    console.error('Webhook error:', error);
    res.sendStatus(500);
  }
});

// Flutterwave payment webhook
app.post('/webhook/flutterwave', async (req, res) => {
  try {
    const secretHash = process.env.FLUTTERWAVE_SECRET_HASH;
    const signature = req.headers['verif-hash'];

    // Validate webhook signature
    if (!secretHash || !signature || signature !== secretHash) {
      console.warn('Invalid Flutterwave webhook signature');
      return res.status(401).json({ error: 'Invalid signature' });
    }

    const payload = req.body;

    // Validate payload
    if (!payload || typeof payload !== 'object') {
      console.warn('Invalid Flutterwave webhook payload');
      return res.status(400).json({ error: 'Invalid payload' });
    }

    if (payload.status === 'successful') {
      const txRef = payload.txRef || payload.tx_ref;
      let orderId = null;

      // Extract order ID from tx_ref format: drugsng-{orderId}-{timestamp}
      if (txRef && typeof txRef === 'string') {
        const parts = txRef.split('-');
        if (parts.length >= 2 && !isNaN(parts[1])) {
          orderId = parts[1];
        }
      }

      // Fallback to metadata if available
      if (!orderId && payload.meta && payload.meta.orderId) {
        orderId = payload.meta.orderId;
      }

      if (orderId) {
        try {
          // Update order status
          const order = await sequelize.models.Order.findByPk(orderId);
          if (order) {
            order.paymentStatus = 'Paid';
            order.paymentReference = payload.id || payload.transaction_id;
            order.status = 'Shipped'; // Update status to shipped after successful payment
            await order.save();

            // Notify customer
            const user = await sequelize.models.User.findByPk(order.userId);
            if (user) {
              await sendWhatsAppMessage(
                user.phoneNumber,
                `✅ Payment confirmed! Your order #${orderId} has been received and is being processed. You'll receive updates on delivery.`
              );
            }
          } else {
            console.warn(`Order not found for payment: ${orderId}`);
          }
        } catch (dbError) {
          console.error('Database error processing Flutterwave webhook:', dbError);
        }
      } else {
        console.warn('Could not extract order ID from Flutterwave webhook');
      }
    }

    res.json({ success: true, message: 'Webhook processed' });
  } catch (error) {
    console.error('Flutterwave webhook error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

// Paystack payment webhook
app.post('/webhook/paystack', async (req, res) => {
  try {
    const crypto = require('crypto');
    const paystackSecret = process.env.PAYSTACK_SECRET_KEY;

    // Validate webhook signature
    if (!paystackSecret) {
      console.warn('Paystack webhook secret not configured');
      return res.status(400).json({ error: 'Paystack not configured' });
    }

    const signature = req.headers['x-paystack-signature'];
    const hash = crypto.createHmac('sha512', paystackSecret)
      .update(JSON.stringify(req.body))
      .digest('hex');

    if (!signature || hash !== signature) {
      console.warn('Invalid Paystack webhook signature');
      return res.status(401).json({ error: 'Invalid signature' });
    }

    const event = req.body;

    // Validate event
    if (!event || !event.event || !event.data) {
      console.warn('Invalid Paystack webhook payload');
      return res.status(400).json({ error: 'Invalid payload' });
    }

    if (event.event === 'charge.success') {
      const reference = event.data.reference;
      let orderId = null;

      // Try to get order ID from metadata first
      if (event.data.metadata && event.data.metadata.orderId) {
        orderId = event.data.metadata.orderId;
      } else if (reference && typeof reference === 'string') {
        // Fallback: Extract from reference format: drugsng-{orderId}-{timestamp}
        const parts = reference.split('-');
        if (parts.length >= 2 && !isNaN(parts[1])) {
          orderId = parts[1];
        }
      }

      if (orderId) {
        try {
          // Update order status
          const order = await sequelize.models.Order.findByPk(orderId);
          if (order) {
            order.paymentStatus = 'Paid';
            order.paymentReference = reference;
            order.status = 'Shipped'; // Update status to shipped after successful payment
            await order.save();

            // Notify customer
            const user = await sequelize.models.User.findByPk(order.userId);
            if (user) {
              await sendWhatsAppMessage(
                user.phoneNumber,
                `✅ Payment confirmed! Your order #${orderId} has been received and is being processed. You'll receive updates on delivery.`
              );
            }
          } else {
            console.warn(`Order not found for payment: ${orderId}`);
          }
        } catch (dbError) {
          console.error('Database error processing Paystack webhook:', dbError);
        }
      } else {
        console.warn('Could not extract order ID from Paystack webhook');
      }
    }

    res.json({ success: true, message: 'Webhook processed' });
  } catch (error) {
    console.error('Paystack webhook error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

// Payment callback page (for redirect after payment)
app.get('/payment/callback', async (req, res) => {
  try {
    const { status, tx_ref, transaction_id, reference } = req.query;

    // Validate parameters
    const isSuccess = status === 'successful' || status === 'success';
    const provider = tx_ref ? 'flutterwave' : 'paystack';
    const refId = tx_ref || transaction_id || reference || 'Unknown';

    // Log payment callback
    console.log(`Payment callback: status=${status}, provider=${provider}, reference=${refId}`);

    let htmlContent = '';
    if (isSuccess) {
      htmlContent = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Payment Successful</title>
          <style>
            body { font-family: Arial, sans-serif; text-align: center; padding: 50px; background: #f0f8ff; }
            .container { max-width: 500px; margin: 0 auto; background: white; padding: 40px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
            h1 { color: #28a745; }
            .checkmark { font-size: 60px; }
            p { color: #666; line-height: 1.6; }
            .reference { background: #f8f9fa; padding: 10px; border-radius: 5px; margin: 20px 0; word-break: break-all; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="checkmark">✅</div>
            <h1>Payment Successful!</h1>
            <p>Your payment has been confirmed. You will receive a confirmation message on WhatsApp shortly.</p>
            <div class="reference">
              <small>Reference: ${refId}</small>
            </div>
            <p><strong>You can close this page now.</strong></p>
          </div>
        </body>
        </html>
      `;
    } else {
      htmlContent = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Payment Failed</title>
          <style>
            body { font-family: Arial, sans-serif; text-align: center; padding: 50px; background: #ffe8e8; }
            .container { max-width: 500px; margin: 0 auto; background: white; padding: 40px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
            h1 { color: #dc3545; }
            .cross { font-size: 60px; }
            p { color: #666; line-height: 1.6; }
            .reference { background: #f8f9fa; padding: 10px; border-radius: 5px; margin: 20px 0; word-break: break-all; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="cross">❌</div>
            <h1>Payment Failed</h1>
            <p>Your payment could not be processed. Please try again or contact our support team.</p>
            <div class="reference">
              <small>Reference: ${refId}</small>
            </div>
            <p><strong>You can close this page and return to WhatsApp.</strong></p>
          </div>
        </body>
        </html>
      `;
    }

    res.send(htmlContent);
  } catch (error) {
    console.error('Payment callback error:', error);
    res.status(500).send(`
      <!DOCTYPE html>
      <html>
      <head><title>Error</title></head>
      <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
        <h1>⚠️ An Error Occurred</h1>
        <p>There was an issue processing your payment callback. Please contact support.</p>
      </body>
      </html>
    `);
  }
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'Drugs.ng WhatsApp Bot',
    version: '1.0.0',
    status: 'running',
    description: 'WhatsApp Bot for Drugs.ng Healthcare Services',
    endpoints: {
      webhook: '/webhook',
      health: '/health',
      paymentCallback: '/payment/callback',
      webhooks: {
        flutterwave: '/webhook/flutterwave',
        paystack: '/webhook/paystack'
      }
    },
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Handle customer message
const handleCustomerMessage = async (phoneNumber, messageText) => {
  try {
    console.log(`\n🔄 [${phoneNumber}] Processing customer message: "${messageText}"`);

    // Check rate limit
    const rateLimitResult = await checkRateLimit(phoneNumber);
    if (!rateLimitResult.allowed) {
      console.log(`⚠️  Rate limit exceeded for ${phoneNumber}`);
      await sendWhatsAppMessage(phoneNumber, rateLimitResult.message);
      return;
    }

    // Get or create user session
    let session = await sequelize.models.Session.findOne({
      where: { phoneNumber }
    });

    if (!session) {
      console.log(`📝 Creating new session for ${phoneNumber}`);
      session = await sequelize.models.Session.create({
        phoneNumber,
        state: 'NEW',
        data: {}
      });
    } else {
      console.log(`📝 Found existing session for ${phoneNumber}, state: ${session.state}`);
    }

    // Update last activity
    session.lastActivity = new Date();
    await session.save();

    // Check if in support chat
    if (session.state === 'SUPPORT_CHAT') {
      console.log(`💬 ${phoneNumber} is in support chat, forwarding message`);
      // Forward message to support team
      await sendSupportMessage(phoneNumber, messageText, true);
      return;
    }

    // Process with NLP
    console.log(`🤖 Processing with NLP...`);
    const isLoggedIn = session.state === 'LOGGED_IN';
    const nlpResult = await processMessage(messageText, phoneNumber, session);
    const { intent, parameters, fulfillmentText } = nlpResult;
    console.log(`✨ NLP Result: intent="${intent}", source="${nlpResult.source}", confidence=${nlpResult.confidence}`);

    // Handle different intents
    console.log(`🎯 Handling intent: ${intent}`);
    switch (intent) {
      case 'greeting':
        await handleGreeting(phoneNumber, session);
        break;

      case 'register':
        console.log(`📝 Handling registration`);
        await handleRegistration(phoneNumber, session, parameters);
        break;

      case 'login':
        console.log(`🔐 Handling login`);
        await handleLogin(phoneNumber, session, parameters);
        break;

      case 'logout':
        console.log(`🔒 Handling logout`);
        await handleLogout(phoneNumber, session);
        break;

      case 'search_products':
        console.log(`🔍 Handling product search`);
        if (!isLoggedIn && session.state !== 'NEW') {
          await sendAuthRequiredMessage(phoneNumber);
        } else {
          await handleProductSearch(phoneNumber, session, parameters);
        }
        break;

      case 'add_to_cart':
        console.log(`🛒 Handling add to cart`);
        if (!isLoggedIn) {
          await sendAuthRequiredMessage(phoneNumber);
        } else {
          await handleAddToCart(phoneNumber, session, parameters);
        }
        break;

      case 'place_order':
        console.log(`📦 Handling place order`);
        if (!isLoggedIn) {
          await sendAuthRequiredMessage(phoneNumber);
        } else {
          await handlePlaceOrder(phoneNumber, session, parameters);
        }
        break;

      case 'track_order':
        console.log(`📍 Handling track order`);
        if (!isLoggedIn) {
          await sendAuthRequiredMessage(phoneNumber);
        } else {
          await handleTrackOrder(phoneNumber, session, parameters);
        }
        break;

      case 'search_doctors':
        console.log(`👨‍⚕️ Handling doctor search`);
        await handleDoctorSearch(phoneNumber, session, parameters);
        break;

      case 'book_appointment':
        console.log(`📅 Handling book appointment`);
        if (!isLoggedIn) {
          await sendAuthRequiredMessage(phoneNumber);
        } else {
          await handleBookAppointment(phoneNumber, session, parameters);
        }
        break;

      case 'payment':
        console.log(`💳 Handling payment`);
        if (!isLoggedIn) {
          await sendAuthRequiredMessage(phoneNumber);
        } else {
          await handlePayment(phoneNumber, session, parameters);
        }
        break;

      case 'help':
        console.log(`ℹ️  Sending help message`);
        await handleHelp(phoneNumber, isLoggedIn);
        break;

      case 'support':
        console.log(`🆘 Handling support request`);
        await handleSupportRequest(phoneNumber, session, parameters);
        break;

      default:
        console.log(`❓ Unknown intent, sending fallback response`);
        const responseWithOptions = formatResponseWithOptions(fulfillmentText || "I'm not sure how to help with that. Type 'help' for menu.", isLoggedIn);
        await sendWhatsAppMessage(phoneNumber, responseWithOptions);
    }
    console.log(`✅ Successfully processed message from ${phoneNumber}\n`);
  } catch (error) {
    console.error(`❌ Error processing customer message from ${phoneNumber}:`, error.message);
    try {
      await sendWhatsAppMessage(phoneNumber, "Sorry, something went wrong. Please try again later.");
    } catch (sendError) {
      console.error(`❌ Failed to send error message to ${phoneNumber}:`, sendError.message);
    }
  }
};

// Handle support team message
const handleSupportTeamMessage = async (supportPhoneNumber, messageText) => {
  try {
    // Get support team
    const supportTeam = await sequelize.models.SupportTeam.findOne({
      where: { phoneNumber: supportPhoneNumber }
    });
    
    if (!supportTeam) {
      console.error('Support team not found for phone number:', supportPhoneNumber);
      return;
    }
    
    // Check if this is a command
    if (messageText.startsWith('/')) {
      await handleSupportCommand(supportTeam, messageText);
      return;
    }
    
    // Get active chat with customer
    const activeChat = await sequelize.models.SupportChat.findOne({
      where: {
        supportTeamId: supportTeam.id,
        isFromCustomer: false,
        isRead: false
      },
      order: [['timestamp', 'DESC']]
    });
    
    if (!activeChat) {
      await sendWhatsAppMessage(supportTeam.phoneNumber, "No active chat found. Please wait for a customer to initiate a chat.");
      return;
    }
    
    // Forward message to customer
    await sendSupportMessage(activeChat.customerPhoneNumber, messageText, false);
  } catch (error) {
    console.error('Error processing support team message:', error);
    await sendWhatsAppMessage(supportTeam.phoneNumber, "Sorry, something went wrong. Please try again later.");
  }
};

// Handle support team commands
const handleSupportCommand = async (supportTeam, commandText) => {
  try {
    const command = commandText.substring(1).trim().toLowerCase();
    
    switch (command) {
      case 'chats':
        // Get unread messages
        const unreadMessages = await getUnreadSupportMessages(supportTeam.id);
        
        if (unreadMessages.length === 0) {
          await sendWhatsAppMessage(supportTeam.phoneNumber, "No unread messages.");
          return;
        }
        
        let message = `You have ${unreadMessages.length} unread messages:\n\n`;
        unreadMessages.forEach(msg => {
          message += `👤 ${msg.customerPhoneNumber}: ${msg.message}\n\n`;
        });
        
        await sendWhatsAppMessage(supportTeam.phoneNumber, message);
        break;
        
      case 'end':
        // End the most recent chat
        const recentChat = await sequelize.models.SupportChat.findOne({
          where: {
            supportTeamId: supportTeam.id,
            isFromCustomer: true
          },
          order: [['timestamp', 'DESC']]
        });
        
        if (!recentChat) {
          await sendWhatsAppMessage(supportTeam.phoneNumber, "No active chat found.");
          return;
        }
        
        await endSupportChat(recentChat.customerPhoneNumber);
        break;
        
      default:
        await sendWhatsAppMessage(supportTeam.phoneNumber, "Unknown command. Available commands: /chats, /end");
    }
  } catch (error) {
    console.error('Error handling support command:', error);
    await sendWhatsAppMessage(supportTeam.phoneNumber, "Sorry, something went wrong. Please try again later.");
  }
};

// Send authentication required message
const sendAuthRequiredMessage = async (phoneNumber) => {
  const authMessage = `🔐 *Authentication Required*\n\nYou need to be logged in to access this feature.\n\nPlease login with your email and password:\nExample: login john@example.com mypassword\n\nOr register if you're new:\nExample: register John Doe john@example.com mypassword\n\n📋 Type "help" to see all options.`;
  await sendWhatsAppMessage(phoneNumber, authMessage);
};

// Handle logout
const handleLogout = async (phoneNumber, session) => {
  console.log(`🔒 Handling logout for ${phoneNumber}`);
  try {
    session.state = 'NEW';
    session.data = {};
    await session.save();

    const logoutMessage = "👋 You have been logged out successfully.\n\nType 'help' to get started again or 'login' to sign back in.";
    await sendWhatsAppMessage(phoneNumber, logoutMessage);
  } catch (error) {
    console.error('Error during logout:', error);
    await sendWhatsAppMessage(phoneNumber, "Sorry, there was an error logging you out. Please try again.");
  }
};

// Handle greeting
const handleGreeting = async (phoneNumber, session) => {
  console.log(`👋 Handling greeting for ${phoneNumber}, session state: ${session.state}`);
  if (session.state === 'NEW') {
    const greetingMessage = "Welcome to Drugs.ng! Your health companion in Africa. Are you a new user? Reply 'register' to sign up or 'login' if you already have an account.";
    console.log(`📤 Sending new user greeting`);
    await sendWhatsAppMessage(phoneNumber, greetingMessage);
  } else {
    const welcomeBackMessage = `Welcome back! How can I assist you today? You can ask me about medicines, doctors, orders, or type 'help' for assistance.`;
    console.log(`📤 Sending returning user welcome`);
    await sendWhatsAppMessage(phoneNumber, welcomeBackMessage);
  }
};

// Handle registration
const handleRegistration = async (phoneNumber, session, parameters) => {
  if (session.state === 'NEW' || session.state === 'REGISTERING') {
    session.state = 'REGISTERING';
    await session.save();

    // If we have all required parameters
    if (parameters.name && parameters.email && parameters.password) {
      try {
        // Validate input
        const userData = {
          name: sanitizeInput(parameters.name),
          email: sanitizeInput(parameters.email).toLowerCase(),
          password: sanitizeInput(parameters.password),
          phoneNumber: normalizePhoneNumber(phoneNumber)
        };

        const validation = isValidRegistrationData(userData);
        if (!validation.valid) {
          const errorMsg = formatResponseWithOptions(`Registration failed: ${validation.error}`, false);
          await sendWhatsAppMessage(phoneNumber, errorMsg);
          return;
        }

        // Register user in both PostgreSQL and Drugs.ng API
        const result = await registerUser(userData);

        // Update session
        session.state = 'LOGGED_IN';
        session.data.userId = result.userId;
        session.data.token = result.token;
        await session.save();

        // Notify support teams
        await notifySupportTeams(phoneNumber, 'New User Registration', {
          name: userData.name,
          email: userData.email
        });

        const successMsg = formatResponseWithOptions(`✅ Registration successful! Welcome to Drugs.ng, ${userData.name}. You can now access all our services. Type 'help' to get started!`, true);
        await sendWhatsAppMessage(phoneNumber, successMsg);
      } catch (error) {
        console.error('Registration error:', error);
        const errorMessage = handleApiError(error, 'registration').message;
        const errorMsg = formatResponseWithOptions(`❌ Registration failed: ${errorMessage}`, false);
        await sendWhatsAppMessage(phoneNumber, errorMsg);
      }
    } else {
      // Request missing parameters
      let message = "📝 To register, please send your details in one message:\n";
      message += "Example: 'register John Doe john@example.com mypassword'\n\n";
      message += "Requirements:\n";
      if (!parameters.name) message += "• Full name (at least 2 characters)\n";
      if (!parameters.email) message += "• Email address (valid email format)\n";
      if (!parameters.password) message += "• Password (at least 6 characters)\n";

      const msgWithOptions = formatResponseWithOptions(message, false);
      await sendWhatsAppMessage(phoneNumber, msgWithOptions);
    }
  } else {
    const msg = formatResponseWithOptions("You're already registered. Type 'help' to see available services.", session.state === 'LOGGED_IN');
    await sendWhatsAppMessage(phoneNumber, msg);
  }
};

// Handle login
const handleLogin = async (phoneNumber, session, parameters) => {
  if (session.state === 'NEW' || session.state === 'LOGGING_IN') {
    session.state = 'LOGGING_IN';
    await session.save();

    // If we have all required parameters
    if (parameters.email && parameters.password) {
      try {
        const credentials = {
          email: sanitizeInput(parameters.email).toLowerCase(),
          password: sanitizeInput(parameters.password)
        };

        // Validate credentials
        const validation = isValidLoginData(credentials);
        if (!validation.valid) {
          const errorMsg = formatResponseWithOptions(`❌ Login failed: ${validation.error}`, false);
          await sendWhatsAppMessage(phoneNumber, errorMsg);
          return;
        }

        // Login user
        const result = await loginUser(credentials);

        // Update session
        session.state = 'LOGGED_IN';
        session.data.userId = result.userId;
        session.data.token = result.token;
        await session.save();

        const successMsg = formatResponseWithOptions(`✅ Login successful! Welcome back to Drugs.ng. Type 'help' to see what you can do.`, true);
        await sendWhatsAppMessage(phoneNumber, successMsg);
      } catch (error) {
        console.error('Login error:', error);
        const errorMessage = handleApiError(error, 'login').message;
        const errorMsg = formatResponseWithOptions(`❌ Login failed: ${errorMessage}`, false);
        await sendWhatsAppMessage(phoneNumber, errorMsg);
      }
    } else {
      // Request missing parameters
      let message = "🔐 To login, send your credentials in one message:\n";
      message += "Example: 'login john@example.com mypassword'\n\n";
      if (!parameters.email) message += "• Email address\n";
      if (!parameters.password) message += "• Password\n";

      const msgWithOptions = formatResponseWithOptions(message, false);
      await sendWhatsAppMessage(phoneNumber, msgWithOptions);
    }
  } else {
    const msg = formatResponseWithOptions("You're already logged in. Type 'help' to see available services.", true);
    await sendWhatsAppMessage(phoneNumber, msg);
  }
};

// Handle product search
const handleProductSearch = async (phoneNumber, session, parameters) => {
  try {
    const isLoggedIn = session.state === 'LOGGED_IN';

    if (!parameters.product) {
      const msg = formatResponseWithOptions("What medicine or product are you looking for? Please provide a name or category.", isLoggedIn);
      await sendWhatsAppMessage(phoneNumber, msg);
      return;
    }

    const products = await searchProducts(parameters.product);

    if (products.length === 0) {
      const msg = formatResponseWithOptions(`Sorry, we couldn't find any products matching "${parameters.product}". Please try a different search term.`, isLoggedIn);
      await sendWhatsAppMessage(phoneNumber, msg);
      return;
    }

    let message = `Here are some products matching "${parameters.product}":\n\n`;

    products.slice(0, 5).forEach((product, index) => {
      message += `${index + 1}. ${product.name}\n`;
      message += `   Price: ₦${product.price}\n`;
      message += `   Category: ${product.category}\n\n`;
    });

    message += `To add a product to your cart, reply with "add [product number] [quantity]"\nExample: "add 1 2" to add 2 units of the first product.`;

    // Save search results in session for reference
    session.data.searchResults = products.slice(0, 5);
    await session.save();

    const msgWithOptions = formatResponseWithOptions(message, isLoggedIn);
    await sendWhatsAppMessage(phoneNumber, msgWithOptions);
  } catch (error) {
    console.error('Error searching products:', error);
    const msg = formatResponseWithOptions("Sorry, we encountered an error while searching for products. Please try again later.", session.state === 'LOGGED_IN');
    await sendWhatsAppMessage(phoneNumber, msg);
  }
};

// Handle add to cart
const handleAddToCart = async (phoneNumber, session, parameters) => {
  try {
    const isLoggedIn = session.state === 'LOGGED_IN';

    if (!session.data.userId) {
      const msg = formatResponseWithOptions("Please login first to add items to your cart. Type 'login' to proceed.", isLoggedIn);
      await sendWhatsAppMessage(phoneNumber, msg);
      return;
    }

    if (!parameters.productIndex || !parameters.quantity) {
      const msg = formatResponseWithOptions("Please specify which product and quantity to add. Example: 'add 1 2' to add 2 units of the first product from your search results.", isLoggedIn);
      await sendWhatsAppMessage(phoneNumber, msg);
      return;
    }

    const productIndex = parseInt(parameters.productIndex) - 1;
    const quantity = parseInt(parameters.quantity);

    if (!session.data.searchResults || !session.data.searchResults[productIndex]) {
      const msg = formatResponseWithOptions("Please search for products first before adding to cart.", isLoggedIn);
      await sendWhatsAppMessage(phoneNumber, msg);
      return;
    }

    const product = session.data.searchResults[productIndex];
    const result = await addToCart(session.data.userId, product.id, quantity);

    const successMsg = formatResponseWithOptions(`Added ${quantity} units of ${product.name} to your cart. Type 'cart' to view your cart or 'checkout' to place your order.`, isLoggedIn);
    await sendWhatsAppMessage(phoneNumber, successMsg);
  } catch (error) {
    console.error('Error adding to cart:', error);
    const msg = formatResponseWithOptions("Sorry, we encountered an error while adding to your cart. Please try again later.", session.state === 'LOGGED_IN');
    await sendWhatsAppMessage(phoneNumber, msg);
  }
};

// Handle place order
const handlePlaceOrder = async (phoneNumber, session, parameters) => {
  try {
    const isLoggedIn = session.state === 'LOGGED_IN';

    if (!session.data.userId) {
      const msg = formatResponseWithOptions("Please login first to place an order. Type 'login' to proceed.", isLoggedIn);
      await sendWhatsAppMessage(phoneNumber, msg);
      return;
    }

    if (!parameters.address || !parameters.paymentMethod) {
      let message = "📦 To place your order, send address and payment method:\n";
      message += "Example: 'order 123 Main St, Lagos Flutterwave'\n\n";
      message += "Payment methods:\n";
      message += "• Flutterwave\n";
      message += "• Paystack\n";
      message += "• Cash on Delivery\n";
      const msgWithOptions = formatResponseWithOptions(message, isLoggedIn);
      await sendWhatsAppMessage(phoneNumber, msgWithOptions);
      return;
    }

    const orderData = {
      address: sanitizeInput(parameters.address),
      paymentMethod: sanitizeInput(parameters.paymentMethod)
    };

    // Validate order data
    const { isValidOrderData } = require('./utils/validation');
    if (!isValidOrderData(orderData)) {
      const msg = formatResponseWithOptions("❌ Invalid delivery address or payment method. Please try again.", isLoggedIn);
      await sendWhatsAppMessage(phoneNumber, msg);
      return;
    }

    const result = await placeOrder(session.data.userId, orderData);

    // Notify support team
    await notifySupportTeam(phoneNumber, 'orders', 'New Order Placed', {
      orderId: result.orderId,
      paymentMethod: orderData.paymentMethod,
      amount: result.totalAmount || 'TBD'
    });

    const successMsg = formatResponseWithOptions(`✅ Your order has been placed successfully!\n\nOrder ID: #${result.orderId}`, isLoggedIn);
    await sendWhatsAppMessage(phoneNumber, successMsg);

    // Generate payment link if online payment is selected
    const validPaymentMethods = ['Flutterwave', 'Paystack'];
    if (validPaymentMethods.some(method => orderData.paymentMethod.toLowerCase().includes(method.toLowerCase()))) {
      try {
        const user = await sequelize.models.User.findByPk(session.data.userId);
        const order = await sequelize.models.Order.findByPk(result.orderId);

        if (user && order && order.totalAmount > 0) {
          const paymentDetails = {
            amount: order.totalAmount,
            email: user.email,
            phoneNumber: normalizePhoneNumber(user.phoneNumber),
            name: user.name,
            orderId: order.id
          };

          let paymentResponse;
          try {
            if (orderData.paymentMethod.toLowerCase().includes('flutterwave')) {
              paymentResponse = await processFlutterwavePayment(paymentDetails);
              if (paymentResponse.status === 'success' && paymentResponse.data.link) {
                await sendWhatsAppMessage(phoneNumber, `💳 Complete your payment:\n${paymentResponse.data.link}\n\nAmount: ₦${order.totalAmount.toLocaleString()}`);
              }
            } else if (orderData.paymentMethod.toLowerCase().includes('paystack')) {
              paymentResponse = await processPaystackPayment(paymentDetails);
              if (paymentResponse.status === 'success' && paymentResponse.data.authorization_url) {
                await sendWhatsAppMessage(phoneNumber, `💳 Complete your payment:\n${paymentResponse.data.authorization_url}\n\nAmount: ₦${order.totalAmount.toLocaleString()}`);
              }
            }
          } catch (paymentError) {
            console.error('Payment link generation error:', paymentError);
            await sendWhatsAppMessage(phoneNumber, `⚠️  Payment link generation failed. You can pay later or contact support.\nOrder ID: #${result.orderId}`);
          }
        } else {
          await sendWhatsAppMessage(phoneNumber, `Your order is ready. Payment method: ${orderData.paymentMethod}`);
        }
      } catch (error) {
        console.error('Payment handling error:', error);
        await sendWhatsAppMessage(phoneNumber, `Order placed but payment link could not be generated. Contact support with Order ID: #${result.orderId}`);
      }
    } else if (orderData.paymentMethod.toLowerCase().includes('cash')) {
      await sendWhatsAppMessage(phoneNumber, `💵 You've selected Cash on Delivery.\n\nPlease have the exact amount ready when your order arrives. You'll receive delivery updates shortly.`);
    }
  } catch (error) {
    console.error('Error placing order:', error);
    const errorMessage = handleApiError(error, 'place_order').message;
    await sendWhatsAppMessage(phoneNumber, `❌ Failed to place order: ${errorMessage}`);
  }
};

// Handle track order
const handleTrackOrder = async (phoneNumber, session, parameters) => {
  try {
    const isLoggedIn = session.state === 'LOGGED_IN';

    if (!parameters.orderId) {
      const msg = formatResponseWithOptions("📍 To track your order, provide the order ID.\n\nExample: 'track 12345'", isLoggedIn);
      await sendWhatsAppMessage(phoneNumber, msg);
      return;
    }

    const orderId = sanitizeInput(parameters.orderId);
    const orderDetails = await trackOrder(orderId);

    if (!orderDetails) {
      const msg = formatResponseWithOptions(`❌ Order #${orderId} not found. Please verify the order ID.`, isLoggedIn);
      await sendWhatsAppMessage(phoneNumber, msg);
      return;
    }

    const statusEmoji = {
      'Processing': '⏳',
      'Shipped': '🚚',
      'Delivered': '✅',
      'Cancelled': '❌'
    };

    let message = `${statusEmoji[orderDetails.status] || '📦'} *Order #${orderDetails.id} Status*\n\n`;
    message += `Status: ${orderDetails.status}\n`;
    message += `Placed: ${new Date(orderDetails.orderDate).toLocaleDateString()}\n`;
    message += `Amount: ₦${orderDetails.totalAmount?.toLocaleString() || '0'}\n`;
    message += `Payment: ${orderDetails.paymentStatus}\n\n`;

    message += `*Items:*\n`;
    if (orderDetails.items && orderDetails.items.length > 0) {
      orderDetails.items.forEach(item => {
        message += `• ${item.name} x${item.quantity} = ₦${(item.price * item.quantity).toLocaleString()}\n`;
      });
    } else {
      message += `• No items found\n`;
    }

    message += `\n*Delivery Address:*\n${orderDetails.shippingAddress || 'Not provided'}\n\n`;
    message += `Need help? Type 'support' to chat with our team.`;

    const msgWithOptions = formatResponseWithOptions(message, isLoggedIn);
    await sendWhatsAppMessage(phoneNumber, msgWithOptions);
  } catch (error) {
    console.error('Error tracking order:', error);
    const errorMessage = handleApiError(error, 'track_order').message;
    const msg = formatResponseWithOptions(`❌ ${errorMessage}`, session.state === 'LOGGED_IN');
    await sendWhatsAppMessage(phoneNumber, msg);
  }
};

// Handle doctor search
const handleDoctorSearch = async (phoneNumber, session, parameters) => {
  try {
    const isLoggedIn = session.state === 'LOGGED_IN';

    if (!parameters.specialty) {
      const msg = formatResponseWithOptions("What type of doctor are you looking for? Please provide a specialty (e.g., Cardiologist, Pediatrician).", isLoggedIn);
      await sendWhatsAppMessage(phoneNumber, msg);
      return;
    }

    const location = parameters.location || 'Lagos';
    const doctors = await searchDoctors(parameters.specialty, location);

    if (doctors.length === 0) {
      const msg = formatResponseWithOptions(`Sorry, we couldn't find any ${parameters.specialty} in ${location}. Please try a different specialty or location.`, isLoggedIn);
      await sendWhatsAppMessage(phoneNumber, msg);
      return;
    }

    let message = `Here are some ${parameters.specialty} doctors in ${location}:\n\n`;

    doctors.slice(0, 5).forEach((doctor, index) => {
      message += `${index + 1}. Dr. ${doctor.name}\n`;
      message += `   Specialty: ${doctor.specialty}\n`;
      message += `   Location: ${doctor.location}\n`;
      message += `   Rating: ${doctor.rating}/5\n\n`;
    });

    message += `To book an appointment, reply with "book [doctor number] [date] [time]"\nExample: "book 1 2023-06-15 14:00" to book the first doctor on June 15th at 2 PM.`;

    // Save search results in session for reference
    session.data.doctorSearchResults = doctors.slice(0, 5);
    await session.save();

    const msgWithOptions = formatResponseWithOptions(message, isLoggedIn);
    await sendWhatsAppMessage(phoneNumber, msgWithOptions);
  } catch (error) {
    console.error('Error searching doctors:', error);
    const msg = formatResponseWithOptions("Sorry, we encountered an error while searching for doctors. Please try again later.", session.state === 'LOGGED_IN');
    await sendWhatsAppMessage(phoneNumber, msg);
  }
};

// Handle book appointment
const handleBookAppointment = async (phoneNumber, session, parameters) => {
  try {
    const isLoggedIn = session.state === 'LOGGED_IN';

    if (!session.data.userId) {
      const msg = formatResponseWithOptions("Please login first to book an appointment. Type 'login' to proceed.", isLoggedIn);
      await sendWhatsAppMessage(phoneNumber, msg);
      return;
    }

    if (!parameters.doctorIndex || !parameters.date || !parameters.time) {
      const msg = formatResponseWithOptions("Please specify which doctor, date, and time for your appointment. Example: 'book 1 2023-06-15 14:00' to book the first doctor on June 15th at 2 PM.", isLoggedIn);
      await sendWhatsAppMessage(phoneNumber, msg);
      return;
    }

    const doctorIndex = parseInt(parameters.doctorIndex) - 1;
    const dateTime = new Date(`${parameters.date}T${parameters.time}`);

    if (!session.data.doctorSearchResults || !session.data.doctorSearchResults[doctorIndex]) {
      const msg = formatResponseWithOptions("Please search for doctors first before booking an appointment.", isLoggedIn);
      await sendWhatsAppMessage(phoneNumber, msg);
      return;
    }

    const doctor = session.data.doctorSearchResults[doctorIndex];
    const result = await bookAppointment(session.data.userId, doctor.id, dateTime);

    // Notify support team
    await notifySupportTeam(phoneNumber, 'medical', 'New Appointment Booked', {
      doctorName: doctor.name,
      dateTime: dateTime.toISOString()
    });

    const successMsg = formatResponseWithOptions(`Your appointment with Dr. ${doctor.name} has been scheduled for ${dateTime.toLocaleString()}. Appointment ID: ${result.appointmentId}. You will receive a confirmation shortly.`, isLoggedIn);
    await sendWhatsAppMessage(phoneNumber, successMsg);
  } catch (error) {
    console.error('Error booking appointment:', error);
    const msg = formatResponseWithOptions("Sorry, we encountered an error while booking your appointment. Please try again later.", session.state === 'LOGGED_IN');
    await sendWhatsAppMessage(phoneNumber, msg);
  }
};

// Handle payment
const handlePayment = async (phoneNumber, session, parameters) => {
  try {
    if (!session.data.userId) {
      await sendWhatsAppMessage(phoneNumber, "Please login first to make a payment. Type 'login' to proceed.");
      return;
    }
    
    if (!parameters.orderId || !parameters.provider) {
      await sendWhatsAppMessage(phoneNumber, "Please provide your order ID and payment provider. Example: 'pay 12345 flutterwave'");
      return;
    }
    
    let result;
    const paymentDetails = {
      amount: 0, // This would be fetched from the order
      email: '', // This would be fetched from the user
      orderId: parameters.orderId
    };
    
    // Get order details to populate payment info
    try {
      const orderDetails = await trackOrder(parameters.orderId);
      paymentDetails.amount = orderDetails.totalAmount;
      
      // Get user email
      const user = await sequelize.models.User.findByPk(session.data.userId);
      paymentDetails.email = user.email;
    } catch (error) {
      await sendWhatsAppMessage(phoneNumber, "Sorry, we couldn't find that order. Please check the order ID and try again.");
      return;
    }
    
    if (parameters.provider.toLowerCase() === 'flutterwave') {
      result = await processFlutterwavePayment(paymentDetails);
      await sendWhatsAppMessage(phoneNumber, `Please complete your payment using this link: ${result.data.link}`);
    } else if (parameters.provider.toLowerCase() === 'paystack') {
      result = await processPaystackPayment(paymentDetails);
      await sendWhatsAppMessage(phoneNumber, `Please complete your payment using this link: ${result.data.authorization_url}`);
    } else {
      await sendWhatsAppMessage(phoneNumber, "Sorry, we only support Flutterwave and Paystack for online payments.");
    }
  } catch (error) {
    console.error('Error processing payment:', error);
    await sendWhatsAppMessage(phoneNumber, "Sorry, we encountered an error while processing your payment. Please try again later.");
  }
};

// Handle help
const handleHelp = async (phoneNumber, isLoggedIn) => {
  const helpMessage = `🏥 *Drugs.ng WhatsApp Bot - Available Services:*

1️⃣ *Search Medicines* - Type "1" or "Find paracetamol"
2️⃣ *Find Doctors* - Type "2" or "Find a cardiologist"
3️⃣ *Track Orders* - Type "3" or "Track 12345"
4️⃣ *Book Appointment* - Type "4" or "Book a doctor"
5️⃣ *Place Order* - Type "5" or "Order medicines"
6️⃣ *Customer Support* - Type "6" or "Connect me to support"

Simply reply with a number (1-6) or describe what you need!`;

  const messageWithOptions = formatResponseWithOptions(helpMessage, isLoggedIn);
  await sendWhatsAppMessage(phoneNumber, messageWithOptions);
};

// Handle support request
const handleSupportRequest = async (phoneNumber, session, parameters) => {
  try {
    const supportRole = parameters.supportType || 'general';
    const result = await startSupportChat(phoneNumber, supportRole);
    
    await sendWhatsAppMessage(phoneNumber, `You've been connected to our ${supportRole} support team. Please describe your issue and a support agent will assist you shortly.`);
  } catch (error) {
    console.error('Error starting support chat:', error);
    await sendWhatsAppMessage(phoneNumber, "Sorry, we encountered an error while connecting you to support. Please try again later.");
  }
};

// Start the server
startServer();
