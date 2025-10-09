import crypto from 'crypto';
import { User } from "../models/User.js";
import { sendPasswordResetEmail } from "../services/emailService.js";

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
    
    // Find the user by email
    const user = await User.findOne({ email: email.toLowerCase().trim() });
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