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
    const response = await whatsappAPI.post(`/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`, {
      messaging_product: 'whatsapp',
      to: phoneNumber,
      text: { body: message }
    });
    return response.data;
  } catch (error) {
    console.error('Error sending WhatsApp message:', error);
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