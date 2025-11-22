import { User, getUserModelByRole, findUserByEmail, findUserById } from "../models/User.js";
import jwt from "jsonwebtoken";
import { OAuth2Client } from "google-auth-library";
import fetch from "node-fetch";
import crypto from "crypto";
import { sendOtpEmail, generateOTP, sendPasswordResetEmail } from "../services/emailService.js";

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Generate JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "7d" });
};

// Generate Refresh Token (longer expiration)
const generateRefreshToken = (id) => {
  return jwt.sign({ id, tokenType: 'refresh' }, process.env.JWT_SECRET, { expiresIn: "30d" });
};

// Simple validation helper
const validateSignup = (name, email, password) => {
  const errors = [];

  if (!name || name.trim().length < 2) {
    errors.push("Name must be at least 2 characters long");
  }

  if (!email || !/\S+@\S+\.\S+/.test(email)) {
    errors.push("Please provide a valid email");
  }

  if (!password || password.length < 6) {
    errors.push("Password must be at least 6 characters long");
  }

  return errors;
};

// Signup with OTP verification
export const registerUser = async (req, res) => {
  const { name, email, password, role = "user" } = req.body;
  
  console.log("Registration request received:", { name, email, role });

  try {
    // Validate input
    if (!name || !email || !password) {
      console.log("Missing required fields");
      return res.status(400).json({
        message: "Missing required fields: name, email, and password are all required",
      });
    }
    
    const validationErrors = validateSignup(name, email, password);
    if (validationErrors.length > 0) {
      console.log("Validation errors:", validationErrors);
      return res.status(400).json({
        message: "Validation failed",
        errors: validationErrors,
      });
    }

    // Validate role
    if (role && !["user", "admin", "agent", "analytics"].includes(role)) {
      console.log("Invalid role:", role);
      return res.status(400).json({
        message: "Invalid role. Must be 'user', 'admin', 'agent', or 'analytics'",
      });
    }

    // Check if user already exists in ANY collection
    const { user: existingUser } = await findUserByEmail(email);
    if (existingUser) {
      return res
        .status(400)
        .json({ message: "User already exists with this email" });
    }

    console.log(`Attempting to create user with role: ${role}`);
    
    // Special check for admin role to enforce additional security
    if (role === "admin") {
      // For development purposes, allow admin creation
      // In production, you might want to restrict this or require additional verification
      console.log("Creating admin account - special permissions granted for development");
    }
    
    // Generate OTP for verification
    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes expiry
    
    // Get the appropriate model based on role
    const UserModel = getUserModelByRole(role);
    console.log(`Using model for collection: ${UserModel.collection.name}`);
    
    // Generate unique username
    const username = await UserModel.generateUsername(email, name);
    console.log(`Generated username: ${username}`);
    
    // Create user in the role-specific collection
    const user = await UserModel.create({
      name: name.trim(),
      username: username,
      email: email.toLowerCase().trim(),
      password,
      role,
      otp,
      otpExpiry,
      isVerified: false
    });

    // Send OTP via email
    try {
      await sendOtpEmail(user.email, user.name, otp);
      console.log("OTP email sent to user");
    } catch (emailError) {
      console.error("Failed to send OTP email:", emailError);
      // We continue even if email fails, but log the error
    }

    console.log("User registered (unverified) in collection:", {
      collection: UserModel.collection.name,
      id: user._id,
      name: user.name,
      username: user.username,
      email: user.email,
      role: user.role,
    });

    res.status(201).json({
      success: true,
      message: "User registered successfully. Please verify your email with the OTP sent to your inbox.",
      user: {
        id: user._id,
        name: user.name,
        username: user.username,
        email: user.email,
        role: user.role,
        isVerified: false
      },
      requiresVerification: true,
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ message: "Server error during registration" });
  }
};

// Login
export const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Please provide email and password" });
    }

    // Find user across all collections
    const { user, model } = await findUserByEmail(email);

    if (user && (await user.matchPassword(password))) {
      // Check if user is verified (except for OAuth users who are pre-verified)
      if (!user.isVerified && !user.isGoogleUser && !user.isFacebookUser) {
        // Generate new OTP for unverified users
        const otp = generateOTP();
        const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);
        
        user.otp = otp;
        user.otpExpiry = otpExpiry;
        await user.save();
        
        // Send new OTP
        await sendOtpEmail(user.email, user.name, otp);
        
        return res.status(401).json({
          message: "Account not verified. A new verification OTP has been sent to your email.",
          requiresVerification: true,
          userId: user._id
        });
      }
      
      console.log("User logged in successfully from collection:", {
        collection: model?.collection?.name || 'unknown',
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      });

      // Generate both access and refresh tokens
      const accessToken = generateToken(user._id);
      const refreshToken = generateRefreshToken(user._id);
      
      res.json({
        success: true,
        user: {
          id: user._id,
          name: user.name || `${user.firstName} ${user.lastName}`,
          username: user.username,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          role: user.role,
        },
        token: accessToken,
        refreshToken: refreshToken,
      });
    } else {
      res.status(401).json({ message: "Invalid email or password" });
    }
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Server error during login" });
  }
};

// Google Login
export const googleLogin = async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ message: "Google token is required" });
    }

    if (!process.env.GOOGLE_CLIENT_ID) {
      console.error("GOOGLE_CLIENT_ID environment variable is not set");
      return res.status(500).json({ message: "Server configuration error" });
    }

    // Verify token
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    if (!payload) {
      return res.status(400).json({ message: "Invalid Google token" });
    }

    const { name, email, email_verified } = payload;

    if (!email_verified) {
      return res.status(400).json({ message: "Email not verified with Google" });
    }

    if (!email || !name) {
      return res.status(400).json({ message: "Required user information not available from Google" });
    }

    const { user: existingUser } = await findUserByEmail(email);
    let user = existingUser;

    if (!user) {
      // Create user if not exists - Google users go to 'users' collection by default
      const UserModel = getUserModelByRole('user');
      user = await UserModel.create({
        name: name.trim(),
        email: email.toLowerCase().trim(),
        password: Math.random().toString(36).slice(-8), // dummy password
        role: "user",
        isGoogleUser: true, // Mark as Google user
        isVerified: true, // Google users are pre-verified
      });
      
      console.log("New Google user created:", {
        id: user._id,
        name: user.name,
        email: user.email,
      });
    } else {
      console.log("Existing Google user logged in:", {
        id: user._id,
        name: user.name,
        email: user.email,
      });
    }

    res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      token: generateToken(user._id),
    });
  } catch (error) {
    console.error("Google login error:", error);
    
    // More specific error messages
    if (error.message && error.message.includes('Token used too early')) {
      return res.status(400).json({ message: "Invalid token timing. Please try again." });
    }
    
    if (error.message && error.message.includes('Invalid token signature')) {
      return res.status(400).json({ message: "Invalid Google token. Please try again." });
    }
    
    if (error.message && error.message.includes('Token expired')) {
      return res.status(400).json({ message: "Google token expired. Please try again." });
    }

    res.status(500).json({ 
      message: "Server error during Google login",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Decode Google token without creating user
export const decodeGoogleToken = async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ message: "Google token is required" });
    }

    if (!process.env.GOOGLE_CLIENT_ID) {
      console.error("GOOGLE_CLIENT_ID environment variable is not set");
      return res.status(500).json({ message: "Server configuration error" });
    }

    // Verify token
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    if (!payload) {
      return res.status(400).json({ message: "Invalid Google token" });
    }

    const { name, email, email_verified } = payload;

    if (!email_verified) {
      return res.status(400).json({ message: "Email not verified with Google" });
    }

    if (!email || !name) {
      return res.status(400).json({ message: "Required user information not available from Google" });
    }

    // Check if user already exists
    const { user: existingUser } = await findUserByEmail(email);

    res.json({
      success: true,
      name: name.trim(),
      email: email.toLowerCase().trim(),
      userExists: !!existingUser,
    });
  } catch (error) {
    console.error("Google token decode error:", error);
    
    if (error.message && error.message.includes('Token used too early')) {
      return res.status(400).json({ message: "Invalid token timing. Please try again." });
    }
    
    if (error.message && error.message.includes('Invalid token signature')) {
      return res.status(400).json({ message: "Invalid Google token. Please try again." });
    }
    
    if (error.message && error.message.includes('Token expired')) {
      return res.status(400).json({ message: "Google token expired. Please try again." });
    }

    res.status(500).json({ 
      message: "Server error during Google token decode",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Google signup with role selection
export const googleSignupWithRole = async (req, res) => {
  try {
    const { token, role = "user", organization } = req.body;

    if (!token) {
      return res.status(400).json({ message: "Google token is required" });
    }

    // Validate role
    if (!["user", "admin", "agent", "analytics"].includes(role)) {
      return res.status(400).json({
        message: "Invalid role. Must be 'user', 'admin', 'agent', or 'analytics'",
      });
    }

    // Validate organization for non-user roles
    if (role !== "user" && !organization) {
      return res.status(400).json({
        message: "Organization name is required for agent, admin, and analytics roles",
      });
    }

    if (!process.env.GOOGLE_CLIENT_ID) {
      console.error("GOOGLE_CLIENT_ID environment variable is not set");
      return res.status(500).json({ message: "Server configuration error" });
    }

    // Verify token
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    if (!payload) {
      return res.status(400).json({ message: "Invalid Google token" });
    }

    const { name, email, email_verified } = payload;

    if (!email_verified) {
      return res.status(400).json({ message: "Email not verified with Google" });
    }

    if (!email || !name) {
      return res.status(400).json({ message: "Required user information not available from Google" });
    }

    // Check if user already exists
    const { user: existingUser } = await findUserByEmail(email);
    
    if (existingUser) {
      return res.status(409).json({ 
        message: "User already exists. Please use regular Google login instead." 
      });
    }

    // Create new user with selected role in appropriate collection
    const UserModel = getUserModelByRole(role);
    const userData = {
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: Math.random().toString(36).slice(-8), // dummy password
      role: role,
      isGoogleUser: true,
      isVerified: true, // Google users are pre-verified
    };

    // Add organization if provided
    if (organization) {
      userData.organization = organization.trim();
    }

    const user = await UserModel.create(userData);
    
    console.log("New Google user created with role:", {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      organization: user.organization,
    });

    res.status(201).json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      token: generateToken(user._id),
    });
  } catch (error) {
    console.error("Google signup error:", error);
    
    if (error.message && error.message.includes('Token used too early')) {
      return res.status(400).json({ message: "Invalid token timing. Please try again." });
    }
    
    if (error.message && error.message.includes('Invalid token signature')) {
      return res.status(400).json({ message: "Invalid Google token. Please try again." });
    }
    
    if (error.message && error.message.includes('Token expired')) {
      return res.status(400).json({ message: "Google token expired. Please try again." });
    }

    if (error.code === 11000) {
      return res.status(409).json({ message: "User with this email already exists" });
    }

    res.status(500).json({ 
      message: "Server error during Google signup",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Facebook Login
export const facebookLogin = async (req, res) => {
  try {
    const { code } = req.body;

    if (!code) {
      return res.status(400).json({ message: "Facebook authorization code is required" });
    }

    if (!process.env.FACEBOOK_APP_ID || !process.env.FACEBOOK_APP_SECRET) {
      console.error("Facebook OAuth environment variables are not set");
      return res.status(500).json({ message: "Server configuration error" });
    }

    // Exchange code for access token
    const tokenResponse = await fetch('https://graph.facebook.com/v18.0/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
  client_id: process.env.FACEBOOK_APP_ID,
  client_secret: process.env.FACEBOOK_APP_SECRET,
  redirect_uri: 'http://localhost:5000/auth/facebook/callback',
  code: code,
      }),
    });

    const tokenData = await tokenResponse.json();

    if (tokenData.error) {
      return res.status(400).json({ 
        message: "Facebook authentication failed", 
        error: tokenData.error.message 
      });
    }

    // Get user information
    const userResponse = await fetch(`https://graph.facebook.com/v18.0/me?access_token=${tokenData.access_token}&fields=id,name,email`);
    const facebookUser = await userResponse.json();

    if (facebookUser.error) {
      return res.status(400).json({ 
        message: "Failed to get user information from Facebook", 
        error: facebookUser.error.message 
      });
    }

    const { name, email, id } = facebookUser;

    if (!email) {
      return res.status(400).json({ 
        message: "Email not available from Facebook account" 
      });
    }

    let user = await User.findOne({ email: email.toLowerCase().trim() });

    if (!user) {
      // Create user if not exists
      user = await User.create({
        name: name,
        email: email.toLowerCase().trim(),
        password: Math.random().toString(36).slice(-8), // dummy password
        role: "user",
        isFacebookUser: true, // Mark as Facebook user
        facebookId: id,
      });
      
      console.log("New Facebook user created:", {
        id: user._id,
        name: user.name,
        email: user.email,
        facebookId: id,
      });
    } else {
      // Update Facebook info if user exists
      if (!user.facebookId) {
        user.facebookId = id;
        user.isFacebookUser = true;
        await user.save();
      }
      
      console.log("Existing Facebook user logged in:", {
        id: user._id,
        name: user.name,
        email: user.email,
        facebookId: id,
      });
    }

    res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      token: generateToken(user._id),
    });
  } catch (error) {
    console.error("Facebook login error:", error);

    if (error.message && error.message.includes('fetch')) {
      return res.status(500).json({ 
        message: "Facebook API temporarily unavailable. Please try again." 
      });
    }

    res.status(500).json({ 
      message: "Server error during Facebook login",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Decode GitHub code and get user info without creating user
export const decodeGithubCode = async (req, res) => {
  try {
    const { code } = req.body;

    if (!code) {
      return res.status(400).json({ message: "GitHub authorization code is required" });
    }

    if (!process.env.GITHUB_CLIENT_ID || !process.env.GITHUB_CLIENT_SECRET) {
      console.error("GitHub OAuth environment variables are not set");
      return res.status(500).json({ message: "Server configuration error" });
    }

    // Exchange code for access token
    const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code: code,
      }),
    });

    const tokenData = await tokenResponse.json();

    if (tokenData.error) {
      return res.status(400).json({ 
        message: "GitHub authentication failed", 
        error: tokenData.error_description 
      });
    }

    // Get user information
    const userResponse = await fetch('https://api.github.com/user', {
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`,
        'Accept': 'application/vnd.github.v3+json',
      },
    });

    const githubUser = await userResponse.json();

    if (!githubUser.email) {
      // Get user's primary email if not public
      const emailResponse = await fetch('https://api.github.com/user/emails', {
        headers: {
          'Authorization': `Bearer ${tokenData.access_token}`,
          'Accept': 'application/vnd.github.v3+json',
        },
      });

      const emails = await emailResponse.json();
      const primaryEmail = emails.find(email => email.primary && email.verified);
      
      if (!primaryEmail) {
        return res.status(400).json({ 
          message: "No verified email found in GitHub account" 
        });
      }
      
      githubUser.email = primaryEmail.email;
    }

    const { name, email, login } = githubUser;

    if (!email || !login) {
      return res.status(400).json({ 
        message: "Required user information not available from GitHub" 
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });

    res.json({
      success: true,
      name: name || login,
      email: email.toLowerCase().trim(),
      githubUsername: login,
      userExists: !!existingUser,
    });
  } catch (error) {
    console.error("GitHub code decode error:", error);

    if (error.message && error.message.includes('fetch')) {
      return res.status(500).json({ 
        message: "GitHub API temporarily unavailable. Please try again." 
      });
    }

    res.status(500).json({ 
      message: "Server error during GitHub code decode",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// GitHub signup with role selection
export const githubSignupWithRole = async (req, res) => {
  try {
    const { code, role = "user" } = req.body;

    if (!code) {
      return res.status(400).json({ message: "GitHub authorization code is required" });
    }

    // Validate role
    if (!["user", "admin", "agent", "analytics"].includes(role)) {
      return res.status(400).json({
        message: "Invalid role. Must be 'user', 'admin', 'agent', or 'analytics'",
      });
    }

    if (!process.env.GITHUB_CLIENT_ID || !process.env.GITHUB_CLIENT_SECRET) {
      console.error("GitHub OAuth environment variables are not set");
      return res.status(500).json({ message: "Server configuration error" });
    }

    // Exchange code for access token
    const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code: code,
      }),
    });

    const tokenData = await tokenResponse.json();

    if (tokenData.error) {
      return res.status(400).json({ 
        message: "GitHub authentication failed", 
        error: tokenData.error_description 
      });
    }

    // Get user information
    const userResponse = await fetch('https://api.github.com/user', {
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`,
        'Accept': 'application/vnd.github.v3+json',
      },
    });

    const githubUser = await userResponse.json();

    if (!githubUser.email) {
      // Get user's primary email if not public
      const emailResponse = await fetch('https://api.github.com/user/emails', {
        headers: {
          'Authorization': `Bearer ${tokenData.access_token}`,
          'Accept': 'application/vnd.github.v3+json',
        },
      });

      const emails = await emailResponse.json();
      const primaryEmail = emails.find(email => email.primary && email.verified);
      
      if (!primaryEmail) {
        return res.status(400).json({ 
          message: "No verified email found in GitHub account" 
        });
      }
      
      githubUser.email = primaryEmail.email;
    }

    const { name, email, login } = githubUser;

    if (!email || !login) {
      return res.status(400).json({ 
        message: "Required user information not available from GitHub" 
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    
    if (existingUser) {
      return res.status(409).json({ 
        message: "User already exists. Please use regular GitHub login instead." 
      });
    }

    // Create new user with selected role
    const user = await User.create({
      name: name || login,
      email: email.toLowerCase().trim(),
      password: Math.random().toString(36).slice(-8), // dummy password
      role: role,
      isGithubUser: true,
      githubId: githubUser.id,
      githubUsername: login,
    });
    
    console.log("New GitHub user created with role:", {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      githubUsername: login,
    });

    res.status(201).json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      token: generateToken(user._id),
    });
  } catch (error) {
    console.error("GitHub signup error:", error);

    if (error.message && error.message.includes('fetch')) {
      return res.status(500).json({ 
        message: "GitHub API temporarily unavailable. Please try again." 
      });
    }

    if (error.code === 11000) {
      return res.status(409).json({ message: "User with this email already exists" });
    }

    res.status(500).json({ 
      message: "Server error during GitHub signup",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// AI Service Integration for Complaint Auto-Generation
const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:5001';

// Helper function to call AI service
const callAIService = async (endpoint, data) => {
  try {
    const response = await fetch(`${AI_SERVICE_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      throw new Error(`AI Service error: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('AI Service call failed:', error);
    throw error;
  }
};

// Auto-generate complaint from user chat
export const generateComplaintFromChat = async (req, res) => {
  try {
    const { userId, chatHistory, userMessage } = req.body;

    if (!userId || !chatHistory || !userMessage) {
      return res.status(400).json({ 
        message: "User ID, chat history, and user message are required" 
      });
    }

    // Verify user exists
    const { user } = await findUserById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Step 1: Get chatbot response from AI service
    const chatbotResponse = await callAIService('/api/chatbot/message', {
      message: userMessage,
      session_id: userId,
      user_context: {
        name: user.name,
        email: user.email,
        role: user.role
      }
    });

    // Step 2: Analyze chat for complaint indicators
    const complaintAnalysis = await callAIService('/classify', {
      text: `${chatHistory}\nUser: ${userMessage}\nBot: ${chatbotResponse.response}`
    });

    // Step 3: Check if this conversation indicates a complaint
    const isComplaintWorthy = complaintAnalysis.category !== 'general_inquiry' && 
                             (complaintAnalysis.sentiment === 'negative' || 
                              complaintAnalysis.priority === 'high' ||
                              complaintAnalysis.category.includes('complaint'));

    if (isComplaintWorthy) {
      // Step 4: Generate structured complaint from chat
      const complaintData = await generateStructuredComplaint(chatHistory, userMessage, complaintAnalysis, user);
      
      return res.json({
        success: true,
        chatbotResponse: chatbotResponse.response,
        complaintGenerated: true,
        complaintData: complaintData,
        analysis: complaintAnalysis,
        message: "I've detected this might be a complaint. Would you like me to automatically create a complaint ticket for you?"
      });
    } else {
      // Regular chat response
      return res.json({
        success: true,
        chatbotResponse: chatbotResponse.response,
        complaintGenerated: false,
        analysis: complaintAnalysis,
        message: chatbotResponse.response
      });
    }

  } catch (error) {
    console.error("Complaint generation error:", error);
    
    // Fallback response if AI service is down
    return res.json({
      success: true,
      chatbotResponse: "I understand your concern. Let me help you with that. Could you please provide more details about the issue you're experiencing?",
      complaintGenerated: false,
      error: "AI service temporarily unavailable",
      message: "I'm here to help! Please describe your issue and I'll assist you."
    });
  }
};

// Generate structured complaint data
const generateStructuredComplaint = async (chatHistory, userMessage, analysis, user) => {
  try {
    // Extract key information from chat
    const fullConversation = `${chatHistory}\nUser: ${userMessage}`;
    
    // Use AI to extract structured data
    const extractedData = await callAIService('/api/extract-complaint-data', {
      conversation: fullConversation,
      analysis: analysis,
      user_info: {
        name: user.name,
        email: user.email,
        role: user.role
      }
    });

    return {
      title: extractedData.title || `${analysis.category} - Auto-generated from chat`,
      description: extractedData.description || fullConversation,
      category: analysis.category,
      priority: analysis.priority,
      sentiment: analysis.sentiment,
      tags: extractedData.tags || [analysis.category, 'auto-generated', 'chat-based'],
      source: 'ai-chat',
      confidence: analysis.confidence,
      extractedEntities: extractedData.entities || {},
      suggestedActions: extractedData.actions || [],
      estimatedResolutionTime: extractedData.estimatedTime || '24-48 hours'
    };
  } catch (error) {
    console.error("Error generating structured complaint:", error);
    
    // Fallback structure
    return {
      title: `${analysis.category} - Auto-generated Complaint`,
      description: `${chatHistory}\nUser: ${userMessage}`,
      category: analysis.category,
      priority: analysis.priority,
      sentiment: analysis.sentiment,
      tags: ['auto-generated', 'chat-based', analysis.category],
      source: 'ai-chat',
      confidence: analysis.confidence || 0.7
    };
  }
};

// Process chat and potentially create complaint
export const processChatForComplaint = async (req, res) => {
  try {
    const { userId, message, sessionId } = req.body;

    if (!userId || !message) {
      return res.status(400).json({ 
        message: "User ID and message are required" 
      });
    }

    const { user } = await findUserById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Get AI chatbot response
    const aiResponse = await callAIService('/api/chatbot/message', {
      message: message,
      session_id: sessionId || userId,
      user_context: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });

    // Analyze message for complaint indicators
    const analysis = await callAIService('/classify', {
      text: message
    });

    // Check if user wants to create a complaint
    const createComplaint = analysis.intent === 'create_complaint' || 
                           message.toLowerCase().includes('complaint') ||
                           message.toLowerCase().includes('issue') ||
                           analysis.sentiment === 'negative' && analysis.priority === 'high';

    res.json({
      success: true,
      response: aiResponse.response,
      shouldCreateComplaint: createComplaint,
      analysis: {
        category: analysis.category,
        priority: analysis.priority,
        sentiment: analysis.sentiment,
        confidence: analysis.confidence
      },
      sessionId: sessionId || userId
    });

  } catch (error) {
    console.error("Chat processing error:", error);
    
    // Fallback response
    res.json({
      success: true,
      response: "I'm here to help you! Could you please tell me more about what you need assistance with?",
      shouldCreateComplaint: false,
      error: "AI service temporarily unavailable"
    });
  }
};

// Send message to AI Assistant (DeepSeek R1)
export const chatWithAI = async (req, res) => {
  try {
    const { userId, message, conversationHistory = [], conversationState = {} } = req.body;

    if (!userId || !message) {
      return res.status(400).json({ 
        message: "User ID and message are required" 
      });
    }

    const { user } = await findUserById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const messageLower = message.toLowerCase().trim();
    
    console.log('Chatbot State:', {
      message: messageLower,
      state: conversationState,
      historyLength: conversationHistory.length
    });

    // ============================================
    // STRUCTURED FLOW: Problem → 3 Steps → Resolution Check → Complaint Filing
    // ============================================

    // STEP 1: Detect if user is reporting a technical problem (initial message)
    const technicalKeywords = ['internet', 'wifi', 'connection', 'slow', 'down', 'not working', 'broken', 'error', 
                               'laptop', 'computer', 'phone', 'device', 'dth', 'tv', 'signal', 'service', 'start', 'won\'t'];
    const hasTechnicalIssue = technicalKeywords.some(keyword => messageLower.includes(keyword));
    
    if (hasTechnicalIssue && !conversationState.troubleshootingStarted) {
      // User just described their problem - show first 3 troubleshooting steps
      const allSteps = generateQuickTroubleshootingSteps(messageLower);
      const firstThreeSteps = allSteps.slice(0, 3);
      
      return res.json({
        success: true,
        response: `I understand you're experiencing: "${message}"\n\n📋 Here are 3 solutions to try:\n\n${firstThreeSteps.map((step, i) => `${i + 1}. ${step}`).join('\n\n')}\n\nPlease try these steps and let me know - did this resolve your problem?`,
        conversationState: {
          troubleshootingStarted: true,
          problemDescription: message,
          allSteps: allSteps,
          currentStepIndex: 3, // We showed first 3 steps
          waitingForResolution: true
        },
        model: 'structured-flow'
      });
    }

    // STEP 2: User responds to "did it resolve?" question
    if (conversationState.waitingForResolution) {
      
      // Check if user says YES (problem is resolved)
      const positiveResponses = ['yes', 'yeah', 'yep', 'sure', 'worked', 'fixed', 'solved', 'resolved', 'good', 'great', 'perfect', 'thank'];
      const isResolved = positiveResponses.some(word => messageLower.includes(word)) && 
                         !messageLower.includes('not') && 
                         !messageLower.includes('no') &&
                         !messageLower.includes('didn\'t');
      
      if (isResolved) {
        return res.json({
          success: true,
          response: "🎉 Wonderful! I'm so glad the solution worked for you! If you need any other assistance in the future, feel free to reach out. Have a great day!",
          conversationState: {
            resolved: true,
            problemDescription: conversationState.problemDescription
          },
          model: 'structured-flow'
        });
      }
      
      // Check if user says NO (problem NOT resolved)
      const negativeResponses = ['no', 'nope', 'not', 'nothing', 'didn\'t', 'doesn\'t', 'still', 'same', 'persist', 'issue'];
      const isNotResolved = negativeResponses.some(word => messageLower.includes(word));
      
      if (isNotResolved) {
        return res.json({
          success: true,
          response: "I understand the issue is still not resolved. Let me file a complaint for you right away so our technical team can assist you further.\n\n📝 Creating your complaint ticket...",
          shouldGenerateComplaint: true,
          conversationState: {
            resolved: false,
            problemDescription: conversationState.problemDescription,
            troubleshootingAttempted: true
          },
          model: 'structured-flow'
        });
      }
      
      // User's response is unclear - ask again
      return res.json({
        success: true,
        response: "I'd like to help you better. Could you please let me know - did any of the solutions I provided work for you? Just reply with 'yes' if it's fixed, or 'no' if you still need help.",
        conversationState: conversationState,
        model: 'structured-flow'
      });
    }

    // STEP 3: Handle direct complaint requests
    const complaintKeywords = ['complaint', 'complain', 'register', 'file', 'raise', 'ticket', 'issue'];
    const wantsComplaint = complaintKeywords.some(keyword => messageLower.includes(keyword));
    
    if (wantsComplaint && conversationState.problemDescription) {
      return res.json({
        success: true,
        response: "Got it! I'm filing your complaint now based on the issue you described.\n\n📝 Creating your complaint ticket...",
        shouldGenerateComplaint: true,
        conversationState: {
          resolved: false,
          problemDescription: conversationState.problemDescription,
          directComplaintRequest: true
        },
        model: 'structured-flow'
      });
    }

    // STEP 4: Handle generic greeting or unclear messages
    if (messageLower.match(/^(hi|hello|hey|hy|helo|hii)$/)) {
      return res.json({
        success: true,
        response: "Hello! 👋 I'm here to help you solve any issues. Please describe your problem, and I'll guide you through some solutions before filing a complaint if needed. What seems to be the issue?",
        model: 'structured-flow'
      });
    }

    // STEP 5: Fallback - ask user to describe their problem
    if (!conversationState.problemDescription) {
      return res.json({
        success: true,
        response: "I'm here to assist you! Could you please describe the issue you're facing? For example:\n• 'My internet is not working'\n• 'My DTH signal is down'\n• 'My laptop won't start'\n\nOnce you describe your problem, I'll provide troubleshooting steps to help you!",
        model: 'structured-flow'
      });
    }

    // STEP 6: For any other complex queries, use AI but maintain context
    const deepseekService = (await import('../services/deepseekService.js')).default;
    
    const systemContext = {
      userName: user.name,
      userRole: user.role,
      userEmail: user.email,
      conversationState: conversationState
    };

    const result = await deepseekService.chat(message, conversationHistory, systemContext);
    
    res.json({
      success: result.success,
      response: result.response,
      conversationState: conversationState, // Preserve state
      model: result.model,
      fallback: result.fallback || false,
      user: {
        id: user._id,
        name: user.name,
        role: user.role
      }
    });

  } catch (error) {
    console.error("Chatbot error:", error);
    
    res.json({
      success: true,
      response: "I'm here to help you! Could you please tell me more about your concern?",
      error: "AI Assistant temporarily unavailable",
      fallback: true
    });
  }
};

// Helper function to generate quick troubleshooting steps
function generateQuickTroubleshootingSteps(issueLower) {
  // Internet/WiFi issues
  if (issueLower.includes('internet') || issueLower.includes('wifi') || issueLower.includes('connection')) {
    return [
      "**Restart your router**: Unplug your router, wait 30 seconds, then plug it back in. Wait 2 minutes for it to fully restart.",
      "**Check cables**: Ensure all cables (power, ethernet) are securely connected to your router and modem.",
      "**Move closer to router**: If using WiFi, move closer to the router and check if signal strength improves.",
      "**Restart your device**: Turn off your device completely, wait 10 seconds, then turn it back on.",
      "**Check for service outages**: Contact your ISP or check their website/app for reported outages in your area.",
      "**Forget and reconnect WiFi**: On your device, forget the WiFi network, then reconnect with the password.",
      "**Factory reset router**: As a last resort, press the reset button on your router for 10 seconds (note: you'll need to reconfigure)."
    ];
  }
  
  // DTH/TV service issues
  if (issueLower.includes('dth') || issueLower.includes('tv') || issueLower.includes('television')) {
    return [
      "**Check power connections**: Ensure your set-top box and TV are properly plugged in and powered on. Look for indicator lights on the set-top box.",
      "**Verify dish alignment**: Go outside and visually check if the satellite dish is properly aligned. Strong winds or storms can misalign it.",
      "**Check cable connections**: Ensure the cable from the dish to the set-top box is securely connected at both ends. Look for any visible damage.",
      "**Restart set-top box**: Unplug the set-top box, wait 30 seconds, plug it back in, and wait for it to fully reboot (3-5 minutes).",
      "**Check account status**: Log into your DTH provider's website/app to ensure your subscription is active and payment is up to date.",
      "**Test with different channel**: Switch to different channels to see if it's a specific channel issue or all channels.",
      "**Contact provider support**: If the above steps don't work, contact your DTH provider's technical support for signal strength check."
    ];
  }
  
  // Laptop/Computer issues
  if (issueLower.includes('laptop') || issueLower.includes('computer') || issueLower.includes('start')) {
    return [
      "**Check power connections**: Ensure the laptop is plugged into a working power outlet and the charger is securely connected. Try a different outlet.",
      "**Perform hard reset**: Remove the charger and battery (if removable), then hold the power button for 30 seconds. Reconnect charger (without battery) and try to power on.",
      "**Check for indicator lights**: Look for any LED lights on the laptop. If charging light is on but laptop won't start, there may be a display or power button issue.",
      "**Test display**: Connect an external monitor via HDMI. If the external display works, your laptop screen or internal display cable may be faulty.",
      "**Listen for sounds**: When you press the power button, listen for fan noise, beeps, or hard drive sounds. This helps identify if it's a display issue or complete power failure.",
      "**Check RAM**: If comfortable, open the laptop and reseat the RAM modules. Faulty RAM can prevent booting.",
      "**Seek professional help**: If none of these work, the issue may be hardware failure (motherboard, power supply) requiring professional repair."
    ];
  }
  
  // Generic troubleshooting for other issues
  return [
    "**Restart the device**: Turn off the device completely, wait 30 seconds, then turn it back on.",
    "**Check connections**: Verify all cables and connections are secure.",
    "**Update software**: Check if there are any pending software or firmware updates.",
    "**Clear cache/data**: Clear temporary files or cache that might be causing issues.",
    "**Check for conflicts**: Ensure no other software or devices are causing conflicts.",
    "**Contact support**: If the issue persists, contact customer support with error codes or messages you're seeing."
  ];
}

// Generate complaint from conversation (DeepSeek R1 powered)
export const generateComplaintFromAI = async (req, res) => {
  try {
    const { userId, conversationHistory, currentMessage } = req.body;

    if (!userId || !conversationHistory) {
      return res.status(400).json({ 
        message: "User ID and conversation history are required" 
      });
    }

    const { user } = await findUserById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Use DeepSeek R1
    const deepseekService = (await import('../services/deepseekService.js')).default;
    
    const fullConversation = currentMessage 
      ? `${conversationHistory}\n\nLatest message: ${currentMessage}`
      : conversationHistory;

    const userInfo = {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role
    };

    const result = await deepseekService.generateComplaint(fullConversation, userInfo);

    if (!result.success) {
      return res.status(500).json({
        success: false,
        message: "Error generating complaint from conversation"
      });
    }

    const complaintData = {
      ...result.complaint,
      tags: ['ai-generated', 'deepseek', 'chatbot'],
      source: 'chat-conversation',
      aiModel: result.model,
      confidence: result.fallback ? 0.7 : 0.9
    };

    res.json({
      success: true,
      response: "I've analyzed the conversation and prepared a complaint ticket for you.",
      complaintData: complaintData,
      user: userInfo,
      model: result.model,
      fallback: result.fallback || false
    });

  } catch (error) {
    console.error("Complaint generation error:", error);
    
    res.status(500).json({
      success: false,
      message: "Error generating complaint from conversation",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Facebook signup with role selection
export const facebookSignupWithRole = async (req, res) => {
  try {
    const { code, role = "user" } = req.body;

    if (!code) {
      return res.status(400).json({ message: "Facebook authorization code is required" });
    }

    // Validate role
    if (!["user", "admin", "agent", "analytics"].includes(role)) {
      return res.status(400).json({
        message: "Invalid role. Must be 'user', 'admin', 'agent', or 'analytics'",
      });
    }

    if (!process.env.FACEBOOK_APP_ID || !process.env.FACEBOOK_APP_SECRET) {
      console.error("Facebook OAuth environment variables are not set");
      return res.status(500).json({ message: "Server configuration error" });
    }

    // Exchange code for access token
    const tokenResponse = await fetch('https://graph.facebook.com/v18.0/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
  client_id: process.env.FACEBOOK_APP_ID,
  client_secret: process.env.FACEBOOK_APP_SECRET,
  redirect_uri: 'http://localhost:5000/auth/facebook/callback',
  code: code,
      }),
    });

    const tokenData = await tokenResponse.json();

    if (tokenData.error) {
      return res.status(400).json({ 
        message: "Facebook authentication failed", 
        error: tokenData.error.message 
      });
    }

    // Get user information
    const userResponse = await fetch(`https://graph.facebook.com/v18.0/me?access_token=${tokenData.access_token}&fields=id,name,email`);
    const facebookUser = await userResponse.json();

    if (facebookUser.error) {
      return res.status(400).json({ 
        message: "Failed to get user information from Facebook", 
        error: facebookUser.error.message 
      });
    }

    const { name, email, id } = facebookUser;

    if (!email) {
      return res.status(400).json({ 
        message: "Email not available from Facebook account" 
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    
    if (existingUser) {
      // If user exists, update Facebook info and return user data
      if (!existingUser.facebookId) {
        existingUser.facebookId = id;
        existingUser.isFacebookUser = true;
        await existingUser.save();
      }

      return res.json({
        success: true,
        user: {
          id: existingUser._id,
          name: existingUser.name,
          email: existingUser.email,
          role: existingUser.role,
        },
        token: generateToken(existingUser._id),
      });
    }

    // Create new user with specified role
    const user = await User.create({
      name: name,
      email: email.toLowerCase().trim(),
      password: Math.random().toString(36).slice(-8), // dummy password
      role: role,
      isFacebookUser: true,
      facebookId: id,
    });

    console.log("New Facebook user created with role:", {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      facebookId: id,
    });

    res.status(201).json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      token: generateToken(user._id),
    });
  } catch (error) {
    console.error("Facebook signup error:", error);

    if (error.code === 11000) {
      return res.status(409).json({ message: "User with this email already exists" });
    }

    res.status(500).json({ 
      message: "Server error during Facebook signup",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Token Refresh Endpoint
export const refreshToken = async (req, res) => {
  try {
    // Get the token from the request
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }
    
    try {
      // Verify the token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Find the user
      const user = await User.findById(decoded.id).select('-password');
      
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      // Generate new tokens
      const newToken = generateToken(user._id);
      const newRefreshToken = generateRefreshToken(user._id);
      
      // Return the new tokens
      return res.status(200).json({
        token: newToken,
        refreshToken: newRefreshToken,
        user: {
          id: user._id,
          name: `${user.firstName} ${user.lastName}`,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          role: user.role
        }
      });
    } catch (tokenError) {
      // If token verification fails, try the refresh token
      const refreshToken = req.body.refreshToken;
      
      if (!refreshToken) {
        return res.status(401).json({ message: 'No refresh token provided' });
      }
      
      try {
        const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);
        
        // Check if it's actually a refresh token
        if (!decoded.tokenType || decoded.tokenType !== 'refresh') {
          return res.status(401).json({ message: 'Invalid refresh token' });
        }
        
        const user = await User.findById(decoded.id).select('-password');
        
        if (!user) {
          return res.status(404).json({ message: 'User not found' });
        }
        
        // Generate new tokens
        const newToken = generateToken(user._id);
        const newRefreshToken = generateRefreshToken(user._id);
        
        // Return the new tokens
        return res.status(200).json({
          token: newToken,
          refreshToken: newRefreshToken,
          user: {
            id: user._id,
            name: `${user.firstName} ${user.lastName}`,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            role: user.role
          }
        });
      } catch (refreshError) {
        return res.status(401).json({ message: 'Invalid or expired refresh token' });
      }
    }
  } catch (error) {
    console.error('Error in token refresh:', error);
    return res.status(500).json({ message: 'Server error during token refresh' });
  }
};

// Verify OTP
export const verifyOTP = async (req, res) => {
  const { email, otp } = req.body;

  try {
    if (!email || !otp) {
      return res.status(400).json({ message: "Email and OTP are required" });
    }

    const { user } = await findUserByEmail(email);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if OTP matches and has not expired
    if (user.otp !== otp) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    if (user.otpExpiry && new Date() > new Date(user.otpExpiry)) {
      return res.status(400).json({ message: "OTP has expired. Please request a new one" });
    }

    // Mark user as verified and clear OTP fields
    user.isVerified = true;
    user.otp = undefined;
    user.otpExpiry = undefined;
    await user.save();

    console.log("User verified successfully:", user.email);

    // Generate tokens after verification
    const accessToken = generateToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    res.json({
      success: true,
      message: "Email verified successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isVerified: true
      },
      token: accessToken,
      refreshToken: refreshToken
    });
  } catch (error) {
    console.error("OTP verification error:", error);
    res.status(500).json({ message: "Server error during OTP verification" });
  }
};

// Resend OTP
export const resendOTP = async (req, res) => {
  const { email } = req.body;

  try {
    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const { user } = await findUserByEmail(email);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.isVerified) {
      return res.status(400).json({ message: "Email already verified" });
    }

    // Generate new OTP
    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    user.otp = otp;
    user.otpExpiry = otpExpiry;
    await user.save();

    // Send new OTP via email
    await sendOtpEmail(user.email, user.name, otp);

    res.json({
      success: true,
      message: "New OTP sent to your email",
    });
  } catch (error) {
    console.error("Resend OTP error:", error);
    res.status(500).json({ message: "Server error during OTP resend" });
  }
};

// Forgot Password - Send reset email
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ 
        success: false, 
        message: "Please provide your email" 
      });
    }
    
    // Find the user by email across all collections
    const { user } = await findUserByEmail(email);
    if (!user) {
      // For security reasons, don't reveal that the user doesn't exist
      return res.json({ 
        success: true, 
        message: "If your email is registered, you'll receive a password reset link shortly" 
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    
    // Hash the token and store in database
    user.resetPasswordToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');
      
    // Set token expiry (30 minutes)
    user.resetPasswordExpire = Date.now() + 30 * 60 * 1000;
    
    await user.save();
    
    try {
      // Send email with reset token
      await sendPasswordResetEmail(user.email, user.name, resetToken);
      
      res.json({ 
        success: true, 
        message: "Password reset link sent to your email" 
      });
    } catch (emailError) {
      console.error("Failed to send password reset email:", emailError);
      
      // Remove reset token from database if email fails
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save();
      
      return res.status(500).json({ 
        success: false, 
        message: "Failed to send reset email. Please try again later." 
      });
    }
  } catch (error) {
    console.error("Forgot password error:", error);
    res.status(500).json({ 
      success: false, 
      message: "Server error. Please try again later."
    });
  }
};

// Reset Password - Process reset request
export const resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;
    
    if (!token || !password) {
      return res.status(400).json({ 
        success: false, 
        message: "Please provide reset token and new password" 
      });
    }
    
    // Hash the token to compare with stored hash
    const hashedToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');
      
    // Find user with valid token
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: Date.now() }
    });
    
    if (!user) {
      return res.status(400).json({ 
        success: false, 
        message: "Invalid or expired reset token. Please request a new one." 
      });
    }
    
    // Validate password
    if (password.length < 6) {
      return res.status(400).json({ 
        success: false, 
        message: "Password must be at least 6 characters long" 
      });
    }
    
    // Update password
    user.password = password;
    
    // Clear reset token fields
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    
    await user.save();
    
    console.log("Password reset successful for user:", user.email);
    
    res.json({ 
      success: true, 
      message: "Password reset successful. Please login with your new password." 
    });
  } catch (error) {
    console.error("Reset password error:", error);
    res.status(500).json({ 
      success: false, 
      message: "Server error. Please try again later." 
    });
  }
};

// Verify Reset Token - Check if token is valid before showing reset form
export const verifyResetToken = async (req, res) => {
  try {
    const { token } = req.params;
    
    if (!token) {
      return res.status(400).json({ 
        success: false, 
        message: "Reset token is required" 
      });
    }
    
    // Hash the token to compare with stored hash
    const hashedToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');
      
    // Find user with valid token
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: Date.now() }
    });
    
    if (!user) {
      return res.status(400).json({ 
        success: false, 
        message: "Invalid or expired reset token" 
      });
    }
    
    res.json({ 
      success: true, 
      message: "Token is valid" 
    });
  } catch (error) {
    console.error("Verify reset token error:", error);
    res.status(500).json({ 
      success: false, 
      message: "Server error. Please try again later." 
    });
  }
};
