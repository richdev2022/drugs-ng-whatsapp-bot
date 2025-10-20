const axios = require('axios');

// WhatsApp API configuration
const whatsappAPI = axios.create({
  baseURL: 'https://graph.facebook.com/v15.0',
  headers: {
    'Authorization': `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
    'Content-Type': 'application/json'
  }
});

// Send message via WhatsApp
const sendWhatsAppMessage = async (phoneNumber, message) => {
  try {
    console.log(`📤 Sending WhatsApp message to ${phoneNumber}: "${message.substring(0, 50)}..."`);

    const payload = {
      messaging_product: 'whatsapp',
      to: phoneNumber,
      text: { body: message }
    };

    const response = await whatsappAPI.post(`/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`, payload);
    console.log(`✅ Message sent successfully to ${phoneNumber}. Message ID:`, response.data.messages?.[0]?.id);
    return response.data;
  } catch (error) {
    console.error(`❌ Error sending WhatsApp message to ${phoneNumber}:`, {
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message
    });
    throw error;
  }
};

// Send interactive message with buttons
const sendInteractiveMessage = async (phoneNumber, bodyText, buttons) => {
  try {
    const response = await whatsappAPI.post(`/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`, {
      messaging_product: 'whatsapp',
      to: phoneNumber,
      interactive: {
        type: 'button',
        body: {
          text: bodyText
        },
        action: {
          buttons: buttons.map(btn => ({
            type: 'reply',
            reply: {
              id: btn.id,
              title: btn.title
            }
          }))
        }
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error sending interactive message:', error);
    throw error;
  }
};

// Mark message as read
const markMessageAsRead = async (messageId) => {
  try {
    const response = await whatsappAPI.post(`/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`, {
      messaging_product: 'whatsapp',
      status: 'read',
      message_id: messageId
    });
    return response.data;
  } catch (error) {
    console.error('Error marking message as read:', error);
    // Don't throw error, just log it
    return null;
  }
};

module.exports = {
  sendWhatsAppMessage,
  sendInteractiveMessage,
  markMessageAsRead
};
