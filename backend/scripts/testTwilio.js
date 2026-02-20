
import twilio from 'twilio';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables from .env file in parent directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;

console.log('Testing Twilio Configuration...');
console.log('Account SID:', accountSid ? 'Set' : 'Missing');
console.log('Auth Token:', authToken ? 'Set' : 'Missing');
console.log('Twilio Phone Number:', twilioPhoneNumber);

if (!accountSid || !authToken || !twilioPhoneNumber) {
    console.error('❌ Missing Twilio credentials in .env file');
    process.exit(1);
}

const client = twilio(accountSid, authToken);

const targetNumber = process.argv[2];

if (!targetNumber) {
    console.log('\nUsage: node scripts/testTwilio.js <TARGET_PHONE_NUMBER>');
    console.log('Example: node scripts/testTwilio.js +1234567890');
    process.exit(0);
}

console.log(`\nAttempting to send test SMS to ${targetNumber}...`);

client.messages
    .create({
        body: '🔔 This is a test message from QuickFix System to verify Twilio integration.',
        from: twilioPhoneNumber,
        to: targetNumber
    })
    .then(message => {
        console.log(`✅ SMS sent successfully!`);
        console.log(`Message SID: ${message.sid}`);
        console.log(`Status: ${message.status}`);
    })
    .catch(error => {
        console.error(`❌ Failed to send SMS:`);
        console.error(`Code: ${error.code}`);
        console.error(`Message: ${error.message}`);
        if (error.code === 21608) {
            console.log('💡 Tip: For trial accounts, you can only send SMS to verified phone numbers.');
        }
    });
