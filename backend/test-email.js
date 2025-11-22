import { sendComplaintConfirmationEmail } from './src/services/emailService.js';
import dotenv from 'dotenv';

dotenv.config();

console.log('📧 Testing Email Service...\n');
console.log('EMAIL_USER:', process.env.EMAIL_USER);
console.log('EMAIL_PASS:', process.env.EMAIL_PASS ? '***configured***' : 'MISSING');
console.log('FRONTEND_URL:', process.env.FRONTEND_URL);
console.log('\n');

// Test email
const testEmail = async () => {
  try {
    console.log('Sending test complaint confirmation email...\n');
    
    await sendComplaintConfirmationEmail(
      'kumarpandeygourav1024@gmail.com', // Send to your email
      'Gourav Kumar Pandey',
      'TEST-12345',
      'Test Complaint - Email Service Check',
      'This is a test complaint to verify the email service is working correctly.',
      'Technical Support',
      'High'
    );
    
    console.log('\n✅ Test email sent successfully!');
    console.log('📬 Check your inbox: kumarpandeygourav1024@gmail.com');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Test email failed:', error.message);
    console.error('\nFull error:', error);
    process.exit(1);
  }
};

testEmail();
