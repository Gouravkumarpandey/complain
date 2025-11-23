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
      subject: `[Ticket #${complaintId}] Thank you for contacting QuickFix Support`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f7fa;">
          <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f5f7fa;">
            <tr>
              <td style="padding: 40px 20px;">
                <table role="presentation" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
                  
                  <!-- Header -->
                  <tr>
                    <td style="background: linear-gradient(135deg, #1e293b 0%, #334155 100%); padding: 30px 40px; text-align: center;">
                      <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 600;">QuickFix</h1>
                      <p style="margin: 8px 0 0 0; color: #e2e8f0; font-size: 14px;">Support Ticket System</p>
                    </td>
                  </tr>
                  
                  <!-- Main Content -->
                  <tr>
                    <td style="padding: 40px;">
                      <p style="margin: 0 0 20px 0; color: #1e293b; font-size: 16px;">Hi ${name},</p>
                      
                      <p style="margin: 0 0 20px 0; color: #475569; font-size: 14px; line-height: 1.6;">
                        Thank you for contacting QuickFix Support. This email is to confirm that we have received your support request and created a ticket for you.
                      </p>
                      
                      <!-- Ticket Info Box -->
                      <table role="presentation" style="width: 100%; border: 1px solid #cbd5e1; border-radius: 4px; margin: 20px 0; background-color: #f8fafc;">
                        <tr>
                          <td style="padding: 20px;">
                            <table role="presentation" style="width: 100%;">
                              <tr>
                                <td style="padding: 8px 0; color: #64748b; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Ticket ID</td>
                                <td style="padding: 8px 0; color: #1e293b; font-size: 14px; font-weight: 600; text-align: right;">#${complaintId}</td>
                              </tr>
                              <tr>
                                <td style="padding: 8px 0; color: #64748b; font-size: 13px;">Subject</td>
                                <td style="padding: 8px 0; color: #1e293b; font-size: 14px; text-align: right;">${title}</td>
                              </tr>
                              <tr>
                                <td style="padding: 8px 0; color: #64748b; font-size: 13px;">Category</td>
                                <td style="padding: 8px 0; color: #1e293b; font-size: 14px; text-align: right;">${category}</td>
                              </tr>
                              <tr>
                                <td style="padding: 8px 0; color: #64748b; font-size: 13px;">Priority</td>
                                <td style="padding: 8px 0; text-align: right;">
                                  <span style="display: inline-block; padding: 4px 12px; background-color: ${priority === 'Critical' || priority === 'High' ? '#ef4444' : priority === 'Medium' ? '#f59e0b' : '#10b981'}; color: #ffffff; font-size: 12px; font-weight: 600; border-radius: 3px; text-transform: uppercase;">${priority}</span>
                                </td>
                              </tr>
                              <tr>
                                <td style="padding: 8px 0; color: #64748b; font-size: 13px;">Status</td>
                                <td style="padding: 8px 0; text-align: right;">
                                  <span style="display: inline-block; padding: 4px 12px; background-color: #1e293b; color: #ffffff; font-size: 12px; font-weight: 600; border-radius: 3px;">OPEN</span>
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                      </table>
                      
                      <!-- Description -->
                      <div style="margin: 20px 0; padding: 16px; background-color: #f8fafc; border-left: 3px solid #1e293b; border-radius: 4px;">
                        <p style="margin: 0 0 8px 0; color: #64748b; font-size: 12px; font-weight: 600; text-transform: uppercase;">Your Message</p>
                        <p style="margin: 0; color: #1e293b; font-size: 14px; line-height: 1.5;">${description}</p>
                      </div>
                      
                      <p style="margin: 20px 0; color: #475569; font-size: 14px; line-height: 1.6;">
                        Our support team will review your request and get back to you as soon as possible. You can expect a response within 24 hours during business days.
                      </p>
                      
                      <!-- CTA Button -->
                      <table role="presentation" style="margin: 30px 0;">
                        <tr>
                          <td style="text-align: center;">
                            <a href="${dashboardUrl}" style="display: inline-block; padding: 14px 32px; background-color: #1e293b; color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 600; border-radius: 4px; text-transform: uppercase; letter-spacing: 0.5px;">View Ticket</a>
                          </td>
                        </tr>
                      </table>
                      
                      <p style="margin: 20px 0 0 0; color: #64748b; font-size: 13px; line-height: 1.5;">
                        You can view the status of your ticket or add additional information by clicking the button above or visiting your support portal.
                      </p>
                    </td>
                  </tr>
                  
                  <!-- Footer -->
                  <tr>
                    <td style="padding: 30px 40px; background-color: #f8fafc; border-top: 1px solid #cbd5e1;">
                      <p style="margin: 0 0 10px 0; color: #64748b; font-size: 13px; line-height: 1.5;">
                        Best regards,<br>
                        <strong style="color: #1e293b;">QuickFix Support Team</strong>
                      </p>
                      <p style="margin: 15px 0 0 0; color: #94a3b8; font-size: 12px; line-height: 1.5;">
                        Need help? Contact us at <a href="mailto:${process.env.EMAIL_USER}" style="color: #1e293b; text-decoration: none;">${process.env.EMAIL_USER}</a>
                      </p>
                    </td>
                  </tr>
                  
                  <!-- Bottom Note -->
                  <tr>
                    <td style="padding: 20px 40px; text-align: center;">
                      <p style="margin: 0; color: #94a3b8; font-size: 11px; line-height: 1.5;">
                        This is an automated message. Please do not reply to this email.<br>
                        Ticket #${complaintId} | QuickFix Support System
                      </p>
                    </td>
                  </tr>
                  
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
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