import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Lock, ArrowLeft, AlertCircle, CheckCircle, Eye, EyeOff, Shield } from 'lucide-react';
import apiService from '../../services/apiService';

export function ResetPassword() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isTokenValid, setIsTokenValid] = useState<boolean | null>(null);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' | '' }>({ text: '', type: '' });

  // Verify token validity when component mounts
  useEffect(() => {
    if (!token) {
      setIsTokenValid(false);
      setMessage({ 
        text: 'Reset token is missing', 
        type: 'error' 
      });
      return;
    }

    const verifyToken = async () => {
      try {
        console.log("Verifying token:", token);
        const response = await apiService.verifyResetToken(token);
        
        if (!response.error) {
          console.log("Token is valid");
          setIsTokenValid(true);
        } else {
          console.error("Token verification failed:", response.error);
          setIsTokenValid(false);
          setMessage({ 
            text: response.networkError 
              ? 'Unable to verify the reset link. Please check your internet connection.' 
              : 'This password reset link is invalid or has expired.', 
            type: 'error' 
          });
        }
      } catch (error) {
        console.error('Token verification error:', error);
        setIsTokenValid(false);
        setMessage({ 
          text: 'This password reset link is invalid or has expired.', 
          type: 'error' 
        });
      }
    };

    verifyToken();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (password.length < 6) {
      setMessage({ text: 'Password must be at least 6 characters long', type: 'error' });
      return;
    }
    
    if (password !== confirmPassword) {
      setMessage({ text: 'Passwords do not match', type: 'error' });
      return;
    }

    setIsSubmitting(true);
    setMessage({ text: '', type: '' });

    try {
      if (!token) {
        throw new Error('Reset token is missing');
      }
      
      console.log("Submitting password reset");
      const response = await apiService.resetPassword(token, password);
      console.log("Password reset response:", response);
      
      if (!response.error) {
        setMessage({ 
          text: 'Your password has been successfully reset. You will be redirected to the login page.', 
          type: 'success' 
        });
        
        // Redirect to login after 3 seconds
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      } else {
        // Handle different error scenarios
        const errorMessage = response.networkError 
          ? 'Unable to reset password. Please check your internet connection and try again.' 
          : response.error || 'Something went wrong. Please try again.';
          
        setMessage({ 
          text: errorMessage, 
          type: 'error' 
        });
        
        // If token is invalid, mark it as such to show the appropriate UI
        if (response.error.includes('invalid') || response.error.includes('expired')) {
          setIsTokenValid(false);
        }
      }
    } catch (error) {
      console.error('Reset password error:', error);
      const errorMessage = error instanceof Error ? error.message : 'An error occurred. Please try again later.';
      setMessage({ 
        text: errorMessage, 
        type: 'error' 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isTokenValid === null) {
    // Token verification in progress
    return (
      <div className="min-h-screen flex flex-col bg-white">
        {/* Navigation */}
        <nav className="bg-white border-b border-gray-100 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              {/* Logo */}
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
                  <Shield className="w-5 h-5 text-white" />
                </div>
                <span className="text-2xl font-bold text-gray-900">QuickFix</span>
                <span className="text-sm text-gray-500 ml-1">AI-Powered Support</span>
              </div>
            </div>
          </div>
        </nav>

        {/* Main content area */}
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-lg border border-gray-100 text-center">
            <div className="animate-spin mx-auto rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
            <p className="mt-6 text-gray-700">Verifying your reset link...</p>
          </div>
        </div>
        
        {/* Footer */}
        <div className="w-full bg-gray-50 py-6 border-t border-gray-200 mt-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row items-center justify-between">
              <div className="flex items-center space-x-2 mb-4 md:mb-0">
                <div className="w-6 h-6 bg-orange-500 rounded-md flex items-center justify-center">
                  <Shield className="w-4 h-4 text-white" />
                </div>
                <span className="font-medium text-gray-700">QuickFix</span>
              </div>
              <p className="text-sm text-gray-500">
                © {new Date().getFullYear()} QuickFix AI-Powered Support. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isTokenValid === false) {
    // Invalid token
    return (
      <div className="min-h-screen flex flex-col bg-white">
        {/* Navigation */}
        <nav className="bg-white border-b border-gray-100 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              {/* Logo */}
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
                  <Shield className="w-5 h-5 text-white" />
                </div>
                <span className="text-2xl font-bold text-gray-900">QuickFix</span>
                <span className="text-sm text-gray-500 ml-1">AI-Powered Support</span>
              </div>
            </div>
          </div>
        </nav>

        {/* Main content area */}
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-lg border border-gray-100">
            <div className="flex flex-col items-center justify-center">
              <div className="rounded-full bg-red-50 p-4">
                <AlertCircle className="h-12 w-12 text-red-600" />
              </div>
              <h2 className="mt-6 text-center text-2xl font-bold text-gray-900">Invalid Reset Link</h2>
              <p className="mt-3 text-center text-gray-600">
                This password reset link is invalid or has expired.
              </p>
              <div className="mt-8">
                <Link 
                  to="/forgot-password" 
                  className="text-orange-500 hover:text-orange-600 font-medium"
                >
                  Request a new reset link
                </Link>
              </div>
            </div>
          </div>
        </div>
        
        {/* Footer */}
        <div className="w-full bg-gray-50 py-6 border-t border-gray-200 mt-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row items-center justify-between">
              <div className="flex items-center space-x-2 mb-4 md:mb-0">
                <div className="w-6 h-6 bg-orange-500 rounded-md flex items-center justify-center">
                  <Shield className="w-4 h-4 text-white" />
                </div>
                <span className="font-medium text-gray-700">QuickFix</span>
              </div>
              <p className="text-sm text-gray-500">
                © {new Date().getFullYear()} QuickFix AI-Powered Support. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Navigation */}
      <nav className="bg-white border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <span className="text-2xl font-bold text-gray-900">QuickFix</span>
              <span className="text-sm text-gray-500 ml-1">AI-Powered Support</span>
            </div>
          </div>
        </div>
      </nav>

      {/* Main content area */}
      <div className="flex-1 flex flex-col md:flex-row w-full max-w-7xl mx-auto pt-10 md:pt-16">
        {/* Left section (desktop only) */}
        <div className="hidden md:flex md:w-1/2 items-center justify-center p-8 bg-gradient-to-br from-gray-50 to-white">
          <div className="max-w-md">
            <h1 className="text-4xl font-bold text-gray-900 mb-6">
              Create a new <span className="text-orange-500">password</span>
            </h1>
            <p className="text-xl text-gray-600 mb-6">
              Choose a strong password that you don't use for other websites. A secure password helps protect your account and customer data.
            </p>
            <div className="rounded-2xl overflow-hidden shadow-xl">
              <img 
                src="/security-verification.png" 
                alt="Account Security" 
                className="w-full h-auto"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.onerror = null;
                  target.src = "https://placehold.co/600x400/f5faff/1a3564?text=Account+Security";
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent rounded-2xl"></div>
            </div>
          </div>
        </div>
        
        {/* Right section with form */}
        <div className="w-full md:w-1/2 flex items-center justify-center p-4 md:p-8">
          <div className="max-w-md w-full bg-white p-8 md:p-10 rounded-lg shadow-lg border border-gray-100">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900">Reset Your Password</h2>
              <p className="mt-2 text-gray-600">
                Please create a new password for your account
              </p>
            </div>
            
            {message.text && (
              <div className={`p-4 mb-6 rounded-md ${
                message.type === 'success' 
                  ? 'bg-green-50 border border-green-200' 
                  : 'bg-red-50 border border-red-200'
              }`}>
                <div className="flex">
                  <div className="flex-shrink-0">
                    {message.type === 'success' ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-red-500" />
                    )}
                  </div>
                  <div className="ml-3">
                    <p className={`text-sm ${
                      message.type === 'success' ? 'text-green-700' : 'text-red-700'
                    }`}>
                      {message.text}
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                  New Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    required
                    className="appearance-none rounded-lg relative block w-full pl-10 pr-10 py-2.5 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-orange-500 focus:border-orange-500 focus:z-10 sm:text-sm"
                    placeholder="Enter new password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isSubmitting}
                    minLength={6}
                  />
                  <button 
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5 text-gray-400" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-400" />
                    )}
                  </button>
                </div>
                <p className="mt-1 text-xs text-gray-500">Minimum 6 characters</p>
              </div>
              
              <div>
                <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700 mb-1">
                  Confirm Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="confirm-password"
                    name="confirm-password"
                    type={showPassword ? "text" : "password"}
                    required
                    className="appearance-none rounded-lg relative block w-full pl-10 pr-10 py-2.5 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-orange-500 focus:border-orange-500 focus:z-10 sm:text-sm"
                    placeholder="Confirm new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white ${
                    isSubmitting 
                      ? 'bg-blue-400 cursor-not-allowed' 
                      : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transform hover:scale-105 transition-all duration-200 shadow-md hover:shadow-lg'
                  }`}
                >
                  {isSubmitting ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Resetting...
                    </>
                  ) : (
                    'Reset Password'
                  )}
                </button>
              </div>
              
              <div className="text-center mt-6">
                <Link 
                  to="/login" 
                  className="flex items-center justify-center text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  <ArrowLeft className="h-4 w-4 mr-1" /> Back to Login
                </Link>
              </div>
            </form>
          </div>
        </div>
      </div>
      
      {/* Footer */}
      <div className="w-full bg-gray-50 py-6 border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <div className="w-6 h-6 bg-orange-500 rounded-md flex items-center justify-center">
                <Shield className="w-4 h-4 text-white" />
              </div>
              <span className="font-medium text-gray-700">QuickFix</span>
            </div>
            <p className="text-sm text-gray-500">
              © {new Date().getFullYear()} QuickFix AI-Powered Support. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ResetPassword;