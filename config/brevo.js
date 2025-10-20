const brevoSDK = require('brevo');

// Initialize Brevo client with API key
const brevoClient = new brevoSDK.ApiClient();
brevoClient.authentications['api-key'].apiKey = process.env.BREVO_API_KEY;

const transactionalEmailApi = new brevoSDK.TransactionalEmailsApi();

// Send OTP email
const sendOTPEmail = async (email, otp, recipientName = 'User') => {
  try {
    const sendSmtpEmail = new brevoSDK.SendSmtpEmail();
    sendSmtpEmail.subject = 'Your OTP for Drugs.ng Verification';
    sendSmtpEmail.htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: Arial, sans-serif; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9; }
            .header { background-color: #2c3e50; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
            .content { background-color: white; padding: 30px; border-radius: 0 0 5px 5px; }
            .otp-box { background-color: #ecf0f1; padding: 20px; text-align: center; border-radius: 5px; margin: 20px 0; }
            .otp-code { font-size: 32px; font-weight: bold; color: #e74c3c; letter-spacing: 5px; }
            .footer { text-align: center; font-size: 12px; color: #7f8c8d; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🏥 Drugs.ng</h1>
            </div>
            <div class="content">
              <p>Hello ${recipientName},</p>
              <p>Your one-time password (OTP) for email verification is:</p>
              <div class="otp-box">
                <div class="otp-code">${otp}</div>
              </div>
              <p>This OTP is valid for <strong>5 minutes</strong>. Please do not share this code with anyone.</p>
              <p>If you didn't request this code, you can safely ignore this email.</p>
              <div class="footer">
                <p>&copy; ${new Date().getFullYear()} Drugs.ng. All rights reserved.</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;
    sendSmtpEmail.sender = {
      name: 'Drugs.ng',
      email: process.env.BREVO_SENDER_EMAIL || 'noreply@drugs.ng'
    };
    sendSmtpEmail.to = [{
      email: email,
      name: recipientName
    }];

    const response = await transactionalEmailApi.sendTransacEmail(sendSmtpEmail);
    console.log(`✉️  OTP email sent to ${email}. Message ID: ${response.messageId}`);
    return { success: true, messageId: response.messageId };
  } catch (error) {
    console.error('Error sending OTP email via Brevo:', error);
    throw error;
  }
};

// Send password reset email with OTP
const sendPasswordResetEmail = async (email, otp, recipientName = 'User') => {
  try {
    const sendSmtpEmail = new brevoSDK.SendSmtpEmail();
    sendSmtpEmail.subject = 'Reset Your Drugs.ng Password';
    sendSmtpEmail.htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: Arial, sans-serif; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9; }
            .header { background-color: #2c3e50; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
            .content { background-color: white; padding: 30px; border-radius: 0 0 5px 5px; }
            .otp-box { background-color: #ecf0f1; padding: 20px; text-align: center; border-radius: 5px; margin: 20px 0; }
            .otp-code { font-size: 32px; font-weight: bold; color: #e74c3c; letter-spacing: 5px; }
            .footer { text-align: center; font-size: 12px; color: #7f8c8d; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🏥 Drugs.ng</h1>
            </div>
            <div class="content">
              <p>Hello ${recipientName},</p>
              <p>We received a request to reset your password. Use the code below to verify your identity:</p>
              <div class="otp-box">
                <div class="otp-code">${otp}</div>
              </div>
              <p>This verification code is valid for <strong>5 minutes</strong>.</p>
              <p>If you didn't request this password reset, please ignore this email and your account will remain secure.</p>
              <div class="footer">
                <p>&copy; ${new Date().getFullYear()} Drugs.ng. All rights reserved.</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;
    sendSmtpEmail.sender = {
      name: 'Drugs.ng',
      email: process.env.BREVO_SENDER_EMAIL || 'noreply@drugs.ng'
    };
    sendSmtpEmail.to = [{
      email: email,
      name: recipientName
    }];

    const response = await transactionalEmailApi.sendTransacEmail(sendSmtpEmail);
    console.log(`✉️  Password reset email sent to ${email}. Message ID: ${response.messageId}`);
    return { success: true, messageId: response.messageId };
  } catch (error) {
    console.error('Error sending password reset email via Brevo:', error);
    throw error;
  }
};

// Send booking confirmation email
const sendBookingConfirmationEmail = async (email, bookingDetails, recipientName = 'User') => {
  try {
    const sendSmtpEmail = new brevoSDK.SendSmtpEmail();
    sendSmtpEmail.subject = '✅ Appointment Booking Confirmed - Drugs.ng';
    sendSmtpEmail.htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: Arial, sans-serif; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9; }
            .header { background-color: #27ae60; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
            .content { background-color: white; padding: 30px; border-radius: 0 0 5px 5px; }
            .details-box { background-color: #ecf0f1; padding: 15px; border-radius: 5px; margin: 15px 0; }
            .footer { text-align: center; font-size: 12px; color: #7f8c8d; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>✅ Appointment Confirmed</h1>
            </div>
            <div class="content">
              <p>Dear ${recipientName},</p>
              <p>Your appointment has been successfully booked!</p>
              <div class="details-box">
                <p><strong>Doctor:</strong> ${bookingDetails.doctorName || 'N/A'}</p>
                <p><strong>Specialty:</strong> ${bookingDetails.specialty || 'N/A'}</p>
                <p><strong>Date & Time:</strong> ${bookingDetails.dateTime || 'N/A'}</p>
                <p><strong>Booking ID:</strong> ${bookingDetails.bookingId || 'N/A'}</p>
              </div>
              <p>Please arrive 10 minutes before your scheduled appointment time. If you need to reschedule or cancel, contact us through the Drugs.ng app.</p>
              <div class="footer">
                <p>&copy; ${new Date().getFullYear()} Drugs.ng. All rights reserved.</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;
    sendSmtpEmail.sender = {
      name: 'Drugs.ng',
      email: process.env.BREVO_SENDER_EMAIL || 'noreply@drugs.ng'
    };
    sendSmtpEmail.to = [{
      email: email,
      name: recipientName
    }];

    const response = await transactionalEmailApi.sendTransacEmail(sendSmtpEmail);
    console.log(`✉️  Booking confirmation email sent to ${email}`);
    return { success: true, messageId: response.messageId };
  } catch (error) {
    console.error('Error sending booking confirmation email via Brevo:', error);
    throw error;
  }
};

module.exports = {
  sendOTPEmail,
  sendPasswordResetEmail,
  sendBookingConfirmationEmail
};
