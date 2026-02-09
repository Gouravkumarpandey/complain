/**
 * SMS Test Script
 * Tests the SMS notification system by sending a test message
 */

import { sendSMS, SMS_EVENTS } from './src/services/smsService.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function testSMS() {
    console.log('\n🧪 Testing SMS Notification System\n');
    console.log('='.repeat(60));

    // Test configuration
    const testConfig = {
        userName: 'Gourav Pandey',
        phoneNumber: '+919876543210', // ⚠️ REPLACE WITH YOUR ACTUAL PHONE NUMBER
        eventType: SMS_EVENTS.SIGNUP,
        eventData: {},
        userId: 'test-user-id'
    };

    console.log('\n📋 Test Configuration:');
    console.log('   Name:', testConfig.userName);
    console.log('   Phone:', testConfig.phoneNumber);
    console.log('   Event:', testConfig.eventType);
    console.log('\n' + '='.repeat(60));

    // Check Twilio credentials
    console.log('\n🔐 Checking Twilio Credentials...');
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const twilioPhone = process.env.TWILIO_PHONE_NUMBER;

    if (!accountSid || !authToken || !twilioPhone) {
        console.error('\n❌ ERROR: Twilio credentials not found in .env file!');
        console.log('\nPlease ensure these variables are set:');
        console.log('   - TWILIO_ACCOUNT_SID');
        console.log('   - TWILIO_AUTH_TOKEN');
        console.log('   - TWILIO_PHONE_NUMBER');
        process.exit(1);
    }

    console.log('   ✅ TWILIO_ACCOUNT_SID:', accountSid.substring(0, 10) + '...');
    console.log('   ✅ TWILIO_AUTH_TOKEN:', '***' + authToken.substring(authToken.length - 4));
    console.log('   ✅ TWILIO_PHONE_NUMBER:', twilioPhone);

    // Send test SMS
    console.log('\n📱 Sending Test SMS...\n');

    try {
        const result = await sendSMS(testConfig);

        if (result.success) {
            console.log('\n✅ SUCCESS! SMS sent successfully!\n');
            console.log('   Message SID:', result.messageSid);
            console.log('   Status:', result.status);
            console.log('   Message:', result.message);
            console.log('\n📲 Check your phone for the SMS!');
        } else {
            console.log('\n❌ FAILED! SMS could not be sent.\n');
            console.log('   Error:', result.error);
            console.log('   Error Code:', result.errorCode);
        }
    } catch (error) {
        console.error('\n❌ ERROR:', error.message);
        console.error('\nStack trace:', error.stack);
    }

    console.log('\n' + '='.repeat(60));
    console.log('\n✨ Test Complete!\n');
}

// Run the test
testSMS()
    .then(() => {
        console.log('Exiting...');
        process.exit(0);
    })
    .catch((error) => {
        console.error('Fatal error:', error);
        process.exit(1);
    });
