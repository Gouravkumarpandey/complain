import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Lock, ArrowLeft, AlertCircle, CheckCircle, Eye, EyeOff } from 'lucide-react';
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
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-900 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8 bg-gray-800 p-10 rounded-xl shadow-lg">
          <div className="flex flex-col items-center justify-center">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
            <p className="mt-4 text-white">Verifying your reset link...</p>
          </div>
        </div>
      </div>
    );
  }

  if (isTokenValid === false) {
    // Invalid token
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-900 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8 bg-gray-800 p-10 rounded-xl shadow-lg">
          <div className="flex flex-col items-center justify-center">
            <AlertCircle className="h-16 w-16 text-red-500" />
            <h2 className="mt-4 text-center text-2xl font-bold text-white">Invalid Reset Link</h2>
            <p className="mt-2 text-center text-gray-400">
              This password reset link is invalid or has expired.
            </p>
            <div className="mt-6">
              <Link 
                to="/forgot-password" 
                className="text-blue-400 hover:text-blue-300 font-medium"
              >
                Request a new reset link
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-900 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-gray-800 p-10 rounded-xl shadow-lg">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-white">Reset Password</h2>
          <p className="mt-2 text-center text-sm text-gray-400">
            Enter your new password below
          </p>
        </div>
        
        {message.text && (
          <div className={`p-4 rounded-md ${message.type === 'success' ? 'bg-green-900 bg-opacity-40 border border-green-500' : 'bg-red-900 bg-opacity-40 border border-red-500'}`}>
            <div className="flex">
              <div className="flex-shrink-0">
                {message.type === 'success' ? (
                  <CheckCircle className="h-5 w-5 text-green-400" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-red-400" />
                )}
              </div>
              <div className="ml-3">
                <p className={`text-sm ${message.type === 'success' ? 'text-green-200' : 'text-red-200'}`}>
                  {message.text}
                </p>
              </div>
            </div>
          </div>
        )}
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div className="relative mb-4">
              <label htmlFor="password" className="sr-only">New Password</label>
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                required
                className="appearance-none rounded-md relative block w-full pl-10 pr-10 py-3 border border-gray-600 bg-gray-700 placeholder-gray-400 text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="New Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isSubmitting}
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
            
            <div className="relative">
              <label htmlFor="confirm-password" className="sr-only">Confirm Password</label>
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="confirm-password"
                name="confirm-password"
                type={showPassword ? "text" : "password"}
                required
                className="appearance-none rounded-md relative block w-full pl-10 pr-3 py-3 border border-gray-600 bg-gray-700 placeholder-gray-400 text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Confirm Password"
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
              className={`group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white ${
                isSubmitting ? 'bg-blue-700 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
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
        </form>
        
        <div className="mt-6 flex items-center justify-center">
          <Link 
            to="/login" 
            className="flex items-center text-sm text-blue-400 hover:text-blue-300"
          >
            <ArrowLeft className="h-4 w-4 mr-1" /> Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
}

export default ResetPassword;