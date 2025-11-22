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
      subject: `✅ Complaint Accepted - We're Working On It! [Ticket: ${complaintId}]`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa;">
          <div style="background-color: #ffffff; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <!-- Header with checkmark -->
            <div style="text-align: center; margin-bottom: 30px;">
              <div style="display: inline-block; width: 60px; height: 60px; background-color: #10b981; border-radius: 50%; line-height: 60px; font-size: 35px; color: white;">
                ✓
              </div>
              <h2 style="color: #10b981; margin-top: 15px; margin-bottom: 5px;">Complaint Accepted!</h2>
              <p style="color: #6b7280; margin: 0;">We're working on resolving your issue</p>
            </div>

            <p style="color: #374151; font-size: 16px;">Hello ${name},</p>
            
            <p style="color: #374151; font-size: 15px; line-height: 1.6;">
              Thank you for reaching out to QuickFix Support. We have <strong>accepted your complaint</strong> and our team is already <strong>working on it</strong>.
            </p>
            
            <!-- Complaint Details Box -->
            <div style="margin: 25px 0; padding: 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 8px; color: white;">
              <h3 style="margin: 0 0 15px 0; color: white; font-size: 16px;">📋 Your Complaint Details</h3>
              <table style="width: 100%; color: white;">
                <tr>
                  <td style="padding: 8px 0;"><strong>Ticket ID:</strong></td>
                  <td style="padding: 8px 0; text-align: right; font-weight: bold; font-size: 18px;">${complaintId}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0;"><strong>Title:</strong></td>
                  <td style="padding: 8px 0; text-align: right;">${title}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0;"><strong>Category:</strong></td>
                  <td style="padding: 8px 0; text-align: right;">${category}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0;"><strong>Priority:</strong></td>
                  <td style="padding: 8px 0; text-align: right;">
                    <span style="background-color: rgba(255,255,255,0.2); padding: 4px 12px; border-radius: 12px; font-weight: bold;">
                      ${priority} ${priority === 'High' || priority === 'Urgent' || priority === 'Critical' ? '🔴' : priority === 'Medium' ? '🟡' : '🟢'}
                    </span>
                  </td>
                </tr>
              </table>
            </div>

            <!-- What Happens Next -->
            <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 25px 0;">
              <h3 style="color: #1f2937; margin-top: 0; font-size: 16px;">🚀 What Happens Next?</h3>
              <ul style="color: #4b5563; line-height: 1.8; padding-left: 20px;">
                <li>Our support team is <strong>actively reviewing</strong> your complaint</li>
                <li>You'll receive updates as we make progress</li>
                <li>Expected response time: <strong>Within 24 hours</strong></li>
                <li>We'll notify you via email when there's an update</li>
              </ul>
            </div>

            <!-- Description -->
            <div style="margin: 20px 0; padding: 15px; background-color: #fffbeb; border-left: 4px solid #f59e0b; border-radius: 4px;">
              <p style="margin: 0; color: #92400e;"><strong>Your Issue:</strong></p>
              <p style="margin: 10px 0 0 0; color: #78350f;">${description}</p>
            </div>
            
            <!-- CTA Button -->
            <div style="text-align: center; margin: 30px 0;">
              <a href="${dashboardUrl}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                📊 Track Your Complaint
              </a>
              <p style="color: #6b7280; font-size: 13px; margin-top: 10px;">Click to view live updates on your dashboard</p>
            </div>

            <!-- Footer -->
            <div style="border-top: 2px solid #e5e7eb; padding-top: 20px; margin-top: 30px;">
              <p style="color: #6b7280; font-size: 14px; margin: 5px 0;">
                Need urgent assistance? Reply to this email or contact us at <strong>${process.env.EMAIL_USER}</strong>
              </p>
              <p style="color: #374151; font-size: 15px; margin-top: 20px;">
                Thank you for choosing QuickFix! 🙏<br>
                <strong>The QuickFix Support Team</strong>
              </p>
            </div>
          </div>
          
          <!-- Bottom Note -->
          <p style="text-align: center; color: #9ca3af; font-size: 12px; margin-top: 20px;">
            This is an automated confirmation email. Please do not reply to this message.
          </p>
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