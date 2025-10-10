import mongoose from "mongoose";

const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || process.env.MONGO_URI;
    
    if (!mongoURI) {
      throw new Error('MONGODB_URI is not defined in environment variables');
    }

    // Configure connection options with retry capability
    const options = {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000, // Timeout after 5 seconds
      maxPoolSize: 10, // Maintain up to 10 socket connections
    };

    await mongoose.connect(mongoURI, options);
    console.log("✅ MongoDB Connected...");
    console.log(`📊 Database: ${mongoose.connection.name}`);
    
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
    console.log("⚠️ If using MongoDB Atlas, please ensure your IP address is whitelisted:");
    console.log("   1. Log in to MongoDB Atlas (https://cloud.mongodb.com)");
    console.log("   2. Go to Network Access in your cluster settings");
    console.log("   3. Add your current IP address or use 0.0.0.0/0 for development");
    
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    } else {
      console.log("⚠️ Running in development mode without database. Some features may not work.");
    }
  }
};

export default connectDB;
