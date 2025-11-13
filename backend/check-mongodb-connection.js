// MongoDB Connection Test Script
// Run this with: node check-mongodb-connection.js

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import axios from 'axios';

dotenv.config();

// Function to get current public IP
async function getCurrentIP() {
  try {
    const response = await axios.get('https://api.ipify.org?format=json');
    return response.data.ip;
  } catch (error) {
    console.error('Error getting IP address:', error.message);
    return 'unknown';
  }
}

// Function to test MongoDB connection
async function testConnection() {
  console.log('🔍 Testing MongoDB Atlas connection...');
  
  const mongoURI = process.env.MONGODB_URI;
  
  if (!mongoURI) {
    console.error('❌ MONGODB_URI is not defined in environment variables');
    return;
  }

  const connectionOptions = {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 5000,
    connectTimeoutMS: 10000,
  };

  try {
    const ip = await getCurrentIP();
    console.log(`📡 Your current public IP address is: ${ip}`);
    console.log('🔄 Attempting to connect to MongoDB Atlas...');
    
    await mongoose.connect(mongoURI, connectionOptions);
    
    console.log('✅ Successfully connected to MongoDB Atlas!');
    console.log(`📊 Database: ${mongoose.connection.db.databaseName}`);
    console.log('✅ Your IP address is correctly whitelisted in MongoDB Atlas.');
    
  } catch (error) {
    console.error('❌ MongoDB Connection Error:', error.message);
    console.log('\n⚠️ Your IP address may not be whitelisted in MongoDB Atlas.');
    console.log('\nTo fix this issue:');
    console.log('1. Log in to MongoDB Atlas (https://cloud.mongodb.com)');
    console.log('2. Select your project and navigate to "Network Access" in the sidebar');
    console.log('3. Click "Add IP Address"');
    console.log('4. Click "Add Current IP Address" or enter your IP manually');
    console.log(`   Your current public IP: ${await getCurrentIP()}`);
    console.log('5. Click "Confirm"');
    console.log('\nAlternatively, for development only:');
    console.log('- You can add 0.0.0.0/0 to allow access from anywhere (not secure for production)');
  } finally {
    if (mongoose.connection.readyState) {
      await mongoose.disconnect();
      console.log('🔌 Disconnected from MongoDB Atlas');
    }
  }
}

// Run the test
testConnection().catch(console.error);