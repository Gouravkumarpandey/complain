import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// Create a transporter with your email credentials
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false, // Use TLS
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  tls: {
    rejectUnauthorized: false
  }
});

// Verify transporter configuration on startup
transporter.verify(function (error, success) {
  if (error) {
    console.error('❌ Email transporter verification failed:', error);
  } else {
    console.log('✅ Email server is ready to send messages');
  }
});

/**
 * Send an OTP email for account verification
 * @param {string} to - Recipient email address
 * @param {string} name - Recipient name
 * @param {string} otp - One-time password
 * @returns {Promise} - Nodemailer send mail promise
 */
export const sendOtpEmail = async (to, name, otp) => {
  try {
    const mailOptions = {
      from: `"QuickFix Support" <${process.env.EMAIL_USER}>`,
      to,
      subject: 'Verify Your QuickFix Account',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e4e4e4; border-radius: 5px;">
          <h2 style="color: #4a4a4a; text-align: center;">QuickFix Account Verification</h2>
          <p>Hello ${name},</p>
          <p>Thank you for registering with QuickFix. To complete your registration, please verify your account using the OTP below:</p>
          <div style="background-color: #f4f4f4; padding: 10px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 5px; margin: 20px 0;">
            ${otp}
          </div>
          <p>This OTP will expire in 10 minutes for security reasons.</p>
          <p>If you did not request this verification, please ignore this email.</p>
          <p style="margin-top: 30px;">Best regards,<br>The QuickFix Team</p>
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('OTP email sent:', info.messageId);
    return info;
  } catch (error) {
    console.error('Error sending OTP email:', error);
    throw error;
  }
};

/**
 * Generate a random OTP
 * @param {number} length - Length of the OTP
 * @returns {string} - Generated OTP
 */
export const generateOTP = (length = 6) => {
  const digits = '0123456789';
  let OTP = '';
  
  for (let i = 0; i < length; i++) {
    OTP += digits[Math.floor(Math.random() * 10)];
  }
  
  return OTP;
};

/**
 * Send password reset email with reset link
 * @param {string} to - Recipient email address
 * @param {string} name - Recipient name
 * @param {string} resetToken - Password reset token
 * @returns {Promise} - Nodemailer send mail promise
 */
export const sendPasswordResetEmail = async (to, name, resetToken) => {
  try {
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
    
    const mailOptions = {
      from: `"QuickFix Support" <${process.env.EMAIL_USER}>`,
      to,
      subject: 'Password Reset Request',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e4e4e4; border-radius: 5px;">
          <h2 style="color: #4a4a4a; text-align: center;">QuickFix Password Reset</h2>
          <p>Hello ${name},</p>
          <p>You requested a password reset for your QuickFix account. Please click the button below to create a new password:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" style="background-color: #4a6cf7; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">Reset My Password</a>
          </div>
          <p>If you did not request a password reset, please ignore this email or contact support if you have concerns.</p>
          <p>This link will expire in 30 minutes for security reasons.</p>
          <p style="margin-top: 30px;">Best regards,<br>The QuickFix Team</p>
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Password reset email sent:', info.messageId);
    return info;
  } catch (error) {
    console.error('Error sending password reset email:', error);
    throw error;
  }
};

/**
 * Send complaint confirmation email after complaint creation
 * @param {string} to - Recipient email address
 * @param {string} name - Recipient name
 * @param {string} complaintId - Complaint ticket ID
 * @param {string} title - Complaint title
 * @param {string} description - Complaint description
 * @param {string} category - Complaint category
 * @param {string} priority - Complaint priority
 * @returns {Promise} - Nodemailer send mail promise
 */
export const sendComplaintConfirmationEmail = async (to, name, complaintId, title, description, category, priority) => {
  try {
    console.log(`📧 Attempting to send complaint confirmation email...`);
    console.log(`   To: ${to}`);
    console.log(`   Ticket ID: ${complaintId}`);
    
    const dashboardUrl = `${process.env.FRONTEND_URL}/dashboard`;
    
    const mailOptions = {
      from: `"QuickFix Support" <${process.env.EMAIL_USER}>`,
      to,
      subject: `Complaint Ticket Created - ${complaintId}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <p>Hello ${name},</p>
          
          <p>Thank you for contacting QuickFix Support.</p>
          
          <p>We have received your request and created a new support ticket for you.</p>
          
          <div style="margin: 20px 0; padding: 15px; background-color: #f9f9f9; border-left: 4px solid #4a6cf7;">
            <p style="margin: 5px 0;"><strong>Ticket ID:</strong> ${complaintId}</p>
            <p style="margin: 5px 0;"><strong>Title:</strong> ${title}</p>
            <p style="margin: 5px 0;"><strong>Category:</strong> ${category}</p>
            <p style="margin: 5px 0;"><strong>Priority:</strong> ${priority} ${priority === 'High' || priority === 'Urgent' || priority === 'Critical' ? '🔴' : priority === 'Medium' ? '🟡' : '🟢'}</p>
            <p style="margin: 5px 0;"><strong>Description:</strong> ${description}</p>
          </div>
          
          <p>Our support team will get back to you within 24 hours.</p>
          
          <p>You can check the status of your ticket or add more details here:<br>
          👉 <a href="${dashboardUrl}" style="color: #4a6cf7; text-decoration: none; font-weight: bold;">View Ticket</a></p>
          
          <p style="margin-top: 30px;">Thanks,<br>The QuickFix Support Team</p>
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Complaint confirmation email sent successfully!');
    console.log(`   Message ID: ${info.messageId}`);
    console.log(`   Response: ${info.response}`);
    console.log(`   Accepted: ${info.accepted}`);
    console.log(`   Rejected: ${info.rejected}`);
    return info;
  } catch (error) {
    console.error('❌ Error sending complaint confirmation email:', error);
    console.error('   Error details:', {
      message: error.message,
      code: error.code,
      command: error.command
    });
    throw error;
  }
};