import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load env vars FIRST
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

async function testTwilio() {
    console.log('\n🔍 Testing Twilio Configuration...\n');

    // Dynamic import to ensure env vars are loaded
    const { sendSMS, SMS_EVENTS } = await import('../src/services/smsService.js');

    // 1. Check Env Vars
    if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN || !process.env.TWILIO_PHONE_NUMBER) {
        console.error('❌ Missing Twilio Environment Variables in .env file!');
        if (!process.env.TWILIO_ACCOUNT_SID) console.error(' - TWILIO_ACCOUNT_SID is missing');
        if (!process.env.TWILIO_AUTH_TOKEN) console.error(' - TWILIO_AUTH_TOKEN is missing');
        if (!process.env.TWILIO_PHONE_NUMBER) console.error(' - TWILIO_PHONE_NUMBER is missing (From number)');
        process.exit(1);
    }

    console.log('✅ Environment Variables found.');
    console.log(`   Account SID: ${process.env.TWILIO_ACCOUNT_SID.substring(0, 6)}...`);
    // Mask auth token
    console.log(`   Auth Token:  ${process.env.TWILIO_AUTH_TOKEN ? 'Present (Hidden)' : 'Missing'} `);
    console.log(`   From Number: ${process.env.TWILIO_PHONE_NUMBER} `);

    // 2. Determine Target Number
    const targetNumber = process.argv[2];

    if (!targetNumber) {
        console.log('\n⚠️  No target phone number provided.');
        console.log('   Using dummy number +919999999999 to test authentication only.');
        console.log('   To test actual delivery, run: node scripts/test-sms.js <your-verified-number>');
    }

    const testNumber = targetNumber || '+919999999999';
    console.log(`\n📨 Attempting to send test SMS to: ${testNumber} `);

    try {
        const result = await sendSMS({
            userName: 'Test User',
            phoneNumber: testNumber,
            eventType: SMS_EVENTS.SIGNUP, // Uses the welcome template
            customMessage: '🔔 This is a test message from your QuickFix Application to verify Twilio integration.'
        });

        console.log('\n---------------------------------------------------');
        if (result.success) {
            console.log('✅ SMS REQUEST ACCEPTED BY TWILIO!');
            console.log(`   SID: ${result.messageSid} `);
            console.log(`   Status: ${result.status} `);
            console.log('\n   Check your phone for the message.');
        } else {
            console.log('❌ SMS SEND FAILED');
            console.log(`   Error Code: ${result.errorCode} `);
            console.log(`   Error Message: ${result.error} `);

            console.log('\n   ANALYSIS:');
            if (result.errorCode == 21408) {
                console.log('   ✅ AUTHENTICATION SUCCESSFUL (Credentials are correct)');
                console.log('   ⚠️  PERMISSION DENIED (Trial Account Limitation)');
                console.log('   Explanation: You are using a Twilio Trial Account which can only send to verified numbers.');
                console.log('   Solution: Verify this number on Twilio Console OR upgrade your account.');
            } else if (result.errorCode == 20003) {
                console.log('   ❌ AUTHENTICATION FAILED');
                console.log('   Explanation: Your Account SID or Auth Token is incorrect.');
            } else if (result.errorCode == 21211) {
                console.log('   ❌ INVALID PHONE NUMBER');
                console.log('   Explanation: The phone number format is invalid.');
            } else if (result.errorCode == 21608) {
                console.log('   ❌ UNVERIFIED NUMBER');
                console.log('   Explanation: This number is not verified on your trial account.');
            } else {
                console.log('   Check Twilio Error Code docs for more info.');
            }
        }
        console.log('---------------------------------------------------\n');

    } catch (err) {
        console.error('Unexpected Error:', err);
    }

    process.exit(0);
}

testTwilio();
