import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    username: { 
      type: String, 
      unique: true, 
      sparse: true, // Allows null values to be non-unique
      trim: true,
      lowercase: true
    },
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

// Generate unique username from email
userSchema.statics.generateUsername = async function(email, name) {
  // Create base username from email (part before @)
  let baseUsername = email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '');
  
  // If baseUsername is too short, use name
  if (baseUsername.length < 3) {
    baseUsername = name.toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 15);
  }
  
  // Check if username exists
  let username = baseUsername;
  let counter = 1;
  
  // Keep trying until we find a unique username
  while (true) {
    const existing = await this.findOne({ username });
    if (!existing) {
      return username;
    }
    username = `${baseUsername}${counter}`;
    counter++;
  }
};

// Main User model for all users (stored in 'users' collection by default)
export const User = mongoose.model("User", userSchema);

// Role-specific models that use the same schema but different collections
// This allows MongoDB Atlas cluster visualization to show separate collections

// Admin users - stored in 'admin' collection
export const AdminUser = mongoose.model("AdminUser", userSchema, "admin");

// Agent users - stored in 'agent' collection  
export const AgentUser = mongoose.model("AgentUser", userSchema, "agent");

// Analytics users - stored in 'analytics' collection
export const AnalyticsUser = mongoose.model("AnalyticsUser", userSchema, "analytics");

// Helper function to get the appropriate model based on role
export const getUserModelByRole = (role) => {
  switch (role) {
    case 'admin':
      return AdminUser;
    case 'agent':
      return AgentUser;
    case 'analytics':
      return AnalyticsUser;
    case 'user':
    default:
      return User;
  }
};

// Helper function to find user across all role-specific collections
export const findUserByEmail = async (email) => {
  // Search in all collections
  const normalizedEmail = email.toLowerCase().trim();
  
  // Check main users collection
  let user = await User.findOne({ email: normalizedEmail });
  if (user) return { user, model: User };
  
  // Check admin collection
  user = await AdminUser.findOne({ email: normalizedEmail });
  if (user) return { user, model: AdminUser };
  
  // Check agent collection
  user = await AgentUser.findOne({ email: normalizedEmail });
  if (user) return { user, model: AgentUser };
  
  // Check analytics collection
  user = await AnalyticsUser.findOne({ email: normalizedEmail });
  if (user) return { user, model: AnalyticsUser };
  
  return { user: null, model: null };
};

// Helper function to find user by ID across all collections
export const findUserById = async (userId) => {
  // Try to find in all collections
  let user = await User.findById(userId).catch(() => null);
  if (user) return { user, model: User };
  
  user = await AdminUser.findById(userId).catch(() => null);
  if (user) return { user, model: AdminUser };
  
  user = await AgentUser.findById(userId).catch(() => null);
  if (user) return { user, model: AgentUser };
  
  user = await AnalyticsUser.findById(userId).catch(() => null);
  if (user) return { user, model: AnalyticsUser };
  
  return { user: null, model: null };
};
