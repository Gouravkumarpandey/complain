import { sendComplaintConfirmationEmail } from './src/services/emailService.js';

async function testEmail() {
  try {
    console.log('Testing email service...');
    console.log('Sending test email to: gouravstudyjam2025@gmail.com');
    
    const result = await sendComplaintConfirmationEmail(
      'gouravstudyjam2025@gmail.com',
      'Test User',
      'TEST-12345',
      'Test Complaint',
      'This is a test complaint to verify email delivery',
      'Technical Support',
      'Medium'
    );
    
    console.log('✅ Email sent successfully!');
    console.log('Message ID:', result.messageId);
    console.log('Response:', result.response);
  } catch (error) {
    console.error('❌ Email sending failed:');
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
  }
  
  process.exit(0);
}

testEmail();
