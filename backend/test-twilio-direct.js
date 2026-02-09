/**
 * Simple SMS Test - Direct Twilio Test
 * Tests Twilio connection directly
 */

import twilio from 'twilio';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function testTwilioConnection() {
    console.log('\n🧪 Testing Twilio SMS Service\n');
    console.log('='.repeat(70));

    // Get credentials from environment
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const twilioPhone = process.env.TWILIO_PHONE_NUMBER;

    console.log('\n📋 Configuration Check:');
    console.log('   Account SID:', accountSid ? `${accountSid.substring(0, 10)}...` : '❌ NOT SET');
    console.log('   Auth Token:', authToken ? `***${authToken.substring(authToken.length - 4)}` : '❌ NOT SET');
    console.log('   Twilio Phone:', twilioPhone || '❌ NOT SET');

    if (!accountSid || !authToken || !twilioPhone) {
        console.error('\n❌ ERROR: Missing Twilio credentials!');
        console.log('\nPlease add these to backend/.env:');
        console.log('   TWILIO_ACCOUNT_SID=your_account_sid');
        console.log('   TWILIO_AUTH_TOKEN=your_auth_token');
        console.log('   TWILIO_PHONE_NUMBER=+1234567890');
        process.exit(1);
    }

    // Validate Account SID format
    if (!accountSid.startsWith('AC')) {
        console.error('\n❌ ERROR: Invalid Account SID format!');
        console.log('   Account SID must start with "AC"');
        console.log('   Current value:', accountSid);
        process.exit(1);
    }

    console.log('\n✅ All credentials are set!');

    // Initialize Twilio client
    console.log('\n🔌 Initializing Twilio client...');
    let client;

    try {
        client = twilio(accountSid, authToken);
        console.log('✅ Twilio client initialized successfully!');
    } catch (error) {
        console.error('❌ Failed to initialize Twilio client:', error.message);
        process.exit(1);
    }

    // Test SMS sending
    console.log('\n📱 Sending Test SMS...');
    console.log('\n⚠️  IMPORTANT: Replace the phone number below with YOUR actual phone number!');

    const testPhone = '+919876543210'; // ⚠️ REPLACE WITH YOUR PHONE NUMBER

    console.log(`\n   From: ${twilioPhone}`);
    console.log(`   To: ${testPhone}`);
    console.log('   Message: "Hello from QuickFix! This is a test SMS."');

    try {
        const message = await client.messages.create({
            body: 'Hello from QuickFix! 👋\n\nThis is a test SMS to verify the notification system is working.\n\nIf you received this, SMS notifications are working perfectly!\n\n– QuickFix Team',
            from: twilioPhone,
            to: testPhone
        });

        console.log('\n✅ SUCCESS! SMS sent successfully!');
        console.log('\n📊 Message Details:');
        console.log('   Message SID:', message.sid);
        console.log('   Status:', message.status);
        console.log('   Date Created:', message.dateCreated);
        console.log('   Price:', message.price || 'N/A');
        console.log('   Price Unit:', message.priceUnit || 'N/A');

        console.log('\n📲 Check your phone for the SMS!');
        console.log('\n💡 TIP: It may take a few seconds to arrive.');

    } catch (error) {
        console.error('\n❌ FAILED to send SMS!');
        console.error('\n   Error Code:', error.code);
        console.error('   Error Message:', error.message);

        if (error.code === 21608) {
            console.log('\n💡 This error means the "To" phone number is not verified.');
            console.log('   For Twilio trial accounts, you must verify phone numbers first.');
            console.log('   Go to: https://console.twilio.com/us1/develop/phone-numbers/manage/verified');
        } else if (error.code === 21211) {
            console.log('\n💡 Invalid "To" phone number format.');
            console.log('   Make sure the number is in E.164 format: +[country code][number]');
            console.log('   Example: +919876543210 for India');
        } else if (error.code === 21606) {
            console.log('\n💡 The "From" phone number is not a valid Twilio number.');
            console.log('   Check your Twilio console for your active phone number.');
        }
    }

    console.log('\n' + '='.repeat(70));
    console.log('\n✨ Test Complete!\n');
}

// Run the test
testTwilioConnection()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error('\n💥 Fatal Error:', error);
        process.exit(1);
    });
