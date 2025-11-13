import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { 
      type: String, 
      enum: ['user', 'admin', 'agent', 'analytics'], 
      default: 'user' 
    },
    // Email verification
    isVerified: { type: Boolean, default: false },
    otp: { type: String },
    otpExpiry: { type: Date },
    // Password reset fields
    resetPasswordToken: { type: String },
    resetPasswordExpire: { type: Date },
    // Agent availability status
    availability: {
      type: String,
      enum: ['available', 'busy', 'offline'],
      default: 'available',
    },
    // Google OAuth fields
    isGoogleUser: { type: Boolean, default: false },
    googleId: { type: String },
    
    // Facebook OAuth fields  
    isFacebookUser: { type: Boolean, default: false },
    facebookId: { type: String },
    
    // Organization field (for agents, admins, analytics)
    organization: { type: String, default: null },
    
    // Subscription fields
    planType: {
      type: String,
      enum: ['Free', 'Pro', 'Premium'],
      default: 'Free',
    },
    planExpiresAt: { 
      type: Date,
      default: null 
    },
    subscriptionId: { 
      type: String, // For Razorpay subscription ID
      default: null 
    },
    paymentHistory: [{
      orderId: String,
      paymentId: String,
      amount: Number,
      currency: String,
      status: String,
      planType: String,
      createdAt: { type: Date, default: Date.now }
    }]
  },
  { timestamps: true }
);

// Hash password before saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// Compare password
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

export const User = mongoose.model("User", userSchema);
