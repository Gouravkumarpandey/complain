
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables from .env file in parent directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const emailUser = process.env.EMAIL_USER;
const emailPass = process.env.EMAIL_PASS;

console.log('Testing Email Configuration...');
console.log('Email User:', emailUser ? emailUser : 'Missing');
console.log('Email Pass:', emailPass ? 'Set (Hidden)' : 'Missing');

if (!emailUser || !emailPass) {
    console.error('❌ Missing Email credentials in .env file');
    process.exit(1);
}

const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false, // Use TLS
    auth: {
        user: emailUser,
        pass: emailPass,
    },
    tls: {
        rejectUnauthorized: false
    }
});

const targetEmail = process.argv[2] || emailUser;

console.log(`\nAttempting to send test email to ${targetEmail}...`);

const mailOptions = {
    from: `"QuickFix Test" <${emailUser}>`,
    to: targetEmail,
    subject: 'QuickFix Email Integration Test',
    html: `
    <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #ccc; border-radius: 5px;">
      <h2 style="color: #4a6cf7;">QuickFix Email Test</h2>
      <p>This is a test email to verify that the QuickFix email notification system is working correctly.</p>
      <p>If you received this email, your SMTP configuration is correct! ✅</p>
      <hr>
      <p style="font-size: 12px; color: #777;">Sent at: ${new Date().toLocaleString()}</p>
    </div>
  `
};

transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
        console.error('❌ Failed to send email:');
        console.error(error);
    } else {
        console.log('✅ Email sent successfully!');
        console.log('Message ID:', info.messageId);
        console.log('Preview URL:', nodemailer.getTestMessageUrl(info));
    }
});
