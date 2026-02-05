import mongoose from "mongoose";

const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || process.env.MONGO_URI;
    
    console.log('🔍 Environment check:');
    console.log('  - NODE_ENV:', process.env.NODE_ENV);
    console.log('  - MONGODB_URI present:', !!process.env.MONGODB_URI);
    console.log('  - MONGO_URI present:', !!process.env.MONGO_URI);
    
    if (!mongoURI) {
      console.error('❌ MongoDB URI Error Details:');
      console.error('  - MONGODB_URI:', process.env.MONGODB_URI ? 'SET' : 'NOT SET');
      console.error('  - MONGO_URI:', process.env.MONGO_URI ? 'SET' : 'NOT SET');
      console.error('  - Available env vars starting with MONGO:', 
        Object.keys(process.env).filter(key => key.startsWith('MONGO')));
      throw new Error('MONGODB_URI is not defined in environment variables');
    }

    console.log('🔗 Attempting to connect to MongoDB...');
    console.log('📍 URI format check:', mongoURI.startsWith('mongodb://') || mongoURI.startsWith('mongodb+srv://') ? 'VALID' : 'INVALID');
    
    // Configure connection options with retry capability
    const options = {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 10000, // Increased timeout to 10 seconds for production
      maxPoolSize: 10, // Maintain up to 10 socket connections
      retryWrites: true,
      w: 'majority'
    };

    await mongoose.connect(mongoURI, options);
    console.log("✅ MongoDB Connected...");
    console.log(`📊 Database: ${mongoose.connection.name}`);
    
    // List all collections in the database
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log(`📋 Available collections in '${mongoose.connection.name}':`, collections.map(c => c.name));
    
    // Verify that role-specific collections exist or will be created
    const requiredCollections = ['users', 'admin', 'agent', 'analytics', 'complaints', 'notifications', 'account', 'organizations'];
    console.log(`🔍 Required collections for multi-dashboard system: ${requiredCollections.join(', ')}`);
    
    // Add event listeners for connection issues
    mongoose.connection.on('error', (err) => {
      console.error('MongoDB connection error:', err);
    });
    
    mongoose.connection.on('disconnected', () => {
      console.warn('MongoDB disconnected. Attempting to reconnect...');
    });
    
    mongoose.connection.on('reconnected', () => {
      console.log('MongoDB reconnected successfully');
    });
    
  } catch (error) {
    console.error("❌ MongoDB Connection Error:", error.message);
    console.error("🔍 Error details:", error.name, error.code);
    
    if (error.message.includes('MONGODB_URI is not defined')) {
      console.log("🚨 ENVIRONMENT VARIABLE ISSUE:");
      console.log("  1. Check Render dashboard > Environment Variables");
      console.log("  2. Ensure 'MONGODB_URI' is set (case-sensitive)");
      console.log("  3. Value should start with 'mongodb+srv://' or 'mongodb://'");
      console.log("  4. After adding, redeploy the service");
    } else if (error.message.includes('authentication failed') || error.code === 18) {
      console.log("🔐 AUTHENTICATION ISSUE:");
      console.log("  1. Check MongoDB username/password in connection string");
      console.log("  2. Ensure user has correct permissions");
      console.log("  3. Verify cluster is accessible");
    } else if (error.message.includes('ENOTFOUND') || error.message.includes('ECONNREFUSED')) {
      console.log("🌐 NETWORK ACCESS ISSUE:");
      console.log("  1. Check MongoDB Atlas Network Access settings");
      console.log("  2. Add Render's IP range or use 0.0.0.0/0 for testing");
      console.log("  3. Verify cluster hostname in connection string");
    } else if (error.code === 8000) {
      console.log("⏰ CONNECTION TIMEOUT:");
      console.log("  1. Check if MongoDB cluster is running");
      console.log("  2. Increase serverSelectionTimeoutMS");
      console.log("  3. Check network connectivity");
    }
    
    console.log("⚠️ General MongoDB troubleshooting:");
    console.log("  • MongoDB Atlas: https://cloud.mongodb.com");
    console.log("  • Check Network Access (allow 0.0.0.0/0 for testing)");
    console.log("  • Verify Database User has readWrite permissions");
    console.log("  • Ensure cluster is not paused");
    
    if (process.env.NODE_ENV === 'production') {
      console.error("💥 PRODUCTION: Exiting due to database connection failure");
      process.exit(1);
    } else {
      console.log("⚠️ DEVELOPMENT: Continuing without database. Some features may not work.");
    }
  }
};

export default connectDB;
