import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Mail, Lock, User, AlertCircle, UserCheck, ArrowRight, ArrowLeft, Eye, EyeOff, Phone, Shield } from 'lucide-react';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { CustomGoogleLogin } from './CustomGoogleLogin';
import { OTPVerification } from './OTPVerification';
import { redirectToDashboard } from '../../utils/authRedirectUtils';
import { FacebookLogin } from './FacebookLogin';
import { getErrorMessage } from '../../utils/api';
import { GoogleRoleSelection } from './GoogleRoleSelection';

export function LoginForm() {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phoneNumber: '',
    role: 'user' as 'user' | 'agent' | 'analytics',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Google/Facebook Sign-Up State
  const [showRoleSelection, setShowRoleSelection] = useState(false);
  const [pendingGoogleToken, setPendingGoogleToken] = useState('');
  const [authSource, setAuthSource] = useState<'google' | 'facebook'>('google');
  const [googleUserInfo, setGoogleUserInfo] = useState<{ name: string, email: string } | null>(null);

  // Get auth context including OTP verification
  const { login, register, googleLogin, googleSignupWithRole, pendingVerification, cancelVerification, logout, decodeGoogleToken } = useAuth();

  const validateIndianPhone = (phone: string) => {
    // Basic Indian phone validation
    // Allow +91 or just 10 digits
    const clean = phone.replace(/[\s\-+]/g, '');
    if (clean.length < 10) return false;
    const last10 = clean.slice(-10);
    return /^[6-9]\d{9}$/.test(last10);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validation for Sign Up
    if (!isLogin) {
      if (formData.role === 'user' && !validateIndianPhone(formData.phoneNumber)) {
        setError('Please enter a valid Indian phone number (+91...)');
        setLoading(false);
        return;
      }
    }

    try {
      const success = isLogin
        ? await login(formData.email, formData.password)
        : await register(formData.name, formData.email, formData.password, formData.role, formData.phoneNumber);

      if (success) {
        redirectToDashboard();
      }
      // If success is false, it means requiresVerification is true (both login/register return false in that case)
      // The context state pendingVerification will be set, triggering a re-render to the OTP screen.
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (token: string) => {
    try {
      if (token) {
        logout();
        setError('');

        try {
          const success = await googleLogin(token);
          if (success) {
            redirectToDashboard();
            return;
          }
        } catch (loginError: unknown) {
          // Check if "Account not found"
          if (loginError instanceof Error && loginError.message.includes('Account not found')) {
            // Decode token to get info
            const info = await decodeGoogleToken(token);
            if (info) {
              setGoogleUserInfo(info);
              setPendingGoogleToken(token);
              setAuthSource('google');
              setShowRoleSelection(true);
            } else {
              setError('Failed to process Google Account details. Please try again.');
            }
          } else {
            setError(getErrorMessage(loginError));
          }
        }
      }
    } catch (err) {
      setError(getErrorMessage(err));
      setLoading(false);
    }
  };

  const handleRoleSelected = async (role: 'user' | 'agent' | 'analytics' | 'admin', organization?: string, phoneNumber?: string) => {
    setLoading(true);
    try {
      let success = false;
      if (authSource === 'google' && pendingGoogleToken) {
        success = await googleSignupWithRole(pendingGoogleToken, role, organization, phoneNumber);
      }

      if (success) {
        redirectToDashboard();
      } else if (!pendingVerification) {
        setError('Failed to create account with selected role.');
        setShowRoleSelection(false);
      }
    } catch (err: unknown) {
      setError(getErrorMessage(err));
      setShowRoleSelection(false);
    } finally {
      setLoading(false);
    }
  };

  const handleFacebookFailure = (error: string) => {
    setError(error);
  };

  // ----------------------------------------------------------------------
  // RENDER: Google Role Selection Overlay
  // ----------------------------------------------------------------------
  if (showRoleSelection && googleUserInfo) {
    return (
      <GoogleRoleSelection
        userInfo={googleUserInfo}
        onRoleSelected={handleRoleSelected}
        onCancel={() => setShowRoleSelection(false)}
      />
    );
  }

  // ----------------------------------------------------------------------
  // RENDER: OTP Verification
  // ----------------------------------------------------------------------
  if (pendingVerification) {
    return (
      <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID ?? ''}>
        <div className="h-screen bg-white flex">
          {/* Left Side - Blue Gradient */}
          <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600 to-blue-800 relative overflow-hidden">
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-20 left-20 w-32 h-32 bg-white rounded-full"></div>
              <div className="absolute bottom-32 right-20 w-24 h-24 bg-blue-300 rounded-full"></div>
              <div className="absolute top-1/2 right-1/3 w-16 h-16 bg-blue-400 rounded-full"></div>
            </div>

            <div className="relative z-10 flex flex-col justify-center px-12 py-20">
              {/* Logo */}
              <div className="flex items-center space-x-2 mb-12">
                <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
                  <Shield className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold text-white">QuickFix</span>
              </div>

              <h1 className="text-4xl font-bold text-white mb-4">Security Verification</h1>
              <p className="text-xl text-blue-100">Please verify your identity to continue.</p>

              {/* Image */}
              <div className="mt-10 flex justify-center">
                <div className="relative">
                  <img
                    src="/login.png"
                    alt="Verification"
                    className="w-full max-w-2xl h-auto rounded-xl shadow-2xl"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-blue-600/20 to-transparent rounded-lg"></div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side */}
          <div className="w-full lg:w-1/2 flex flex-col justify-center relative p-8">
            <button
              onClick={cancelVerification}
              className="absolute top-8 left-8 text-gray-400 hover:text-blue-600 transition-colors flex items-center gap-2 font-medium"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>

            <OTPVerification
              email={pendingVerification.email}
              onVerifySuccess={redirectToDashboard}
              onBack={cancelVerification}
            />
          </div>
        </div>
      </GoogleOAuthProvider>
    );
  }

  // ----------------------------------------------------------------------
  // RENDER: Main Login/Signup
  // ----------------------------------------------------------------------
  return (
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID ?? ''}>
      <div className="min-h-screen bg-white flex font-sans">

        {/* Left Side - Blue Gradient */}
        <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600 to-blue-800 relative overflow-hidden">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-20 left-20 w-32 h-32 bg-white rounded-full"></div>
            <div className="absolute bottom-32 right-20 w-24 h-24 bg-blue-300 rounded-full"></div>
            <div className="absolute top-1/2 right-1/3 w-16 h-16 bg-blue-400 rounded-full"></div>
          </div>

          {/* Back to Home */}
          <Link
            to="/"
            className="absolute top-8 left-8 text-white hover:text-blue-200 transition-all duration-200 flex items-center gap-2 font-medium text-lg z-20"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Home
          </Link>

          <div className="relative z-10 flex flex-col justify-center px-12 py-20">
            {/* Logo */}
            <div className="flex items-center space-x-2 mb-12">
              <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-white">QuickFix</span>
              <span className="text-sm text-blue-200 ml-1">AI Powered Support</span>
            </div>

            <h1 className="text-4xl font-bold text-white mb-4">
              {isLogin ? 'Welcome Back!' : 'Join our Community'}
            </h1>
            <p className="text-xl text-blue-100 max-w-md">
              {isLogin
                ? 'Access your intelligent complaint management dashboard.'
                : 'Start your journey with AI-powered customer service automation.'}
            </p>

            {/* Image Card */}
            <div className="mt-10">
              <div className="relative">
                <img
                  src={isLogin ? "/login.png" : "/Signup.webp"}
                  alt="QuickFix Platform"
                  className="w-full max-w-2xl h-auto rounded-xl shadow-2xl"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-blue-600/20 to-transparent rounded-lg"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Form */}
        <div className="w-full lg:w-1/2 flex flex-col justify-center items-center p-6 lg:p-12 overflow-y-auto bg-white">
          <div className="max-w-[420px] w-full">

            <div className="text-center mb-10">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                {isLogin ? 'Sign In' : 'Create Account'}
              </h2>
              <p className="text-gray-500">
                {isLogin ? 'Please enter your details.' : 'Get started for free!'}
              </p>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl flex items-start gap-3 animate-fadeIn">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <span className="text-red-700 text-sm">{error}</span>
              </div>
            )}

            {/* Social Auth */}
            <div className="space-y-4 mb-6">
              {/* Google */}
              <CustomGoogleLogin
                onSuccess={handleGoogleSuccess}
                onFailure={() => setError('Google Sign-In Failed')}
                buttonText={isLogin ? "Sign in with Google" : "Sign up with Google"}
                isLoading={loading}
              />

              {/* Facebook */}
              <FacebookLogin
                onFailure={handleFacebookFailure}
                buttonText={isLogin ? "Continue with Facebook" : "Sign up with Facebook"}
              />
            </div>

            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-xs uppercase tracking-wider font-semibold">
                <span className="px-4 bg-white text-gray-400">Or continue with email</span>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {!isLogin && (
                <div className="group">
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5 ml-1">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 group-focus-within:text-blue-500 transition-colors" />
                    <input
                      type="text"
                      required={!isLogin}
                      value={formData.name}
                      onChange={e => setFormData({ ...formData, name: e.target.value })}
                      className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
                      placeholder="Enter your name"
                    />
                  </div>
                </div>
              )}

              {!isLogin && formData.role === 'user' && (
                <div className="group">
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5 ml-1">Phone Number</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 group-focus-within:text-blue-500 transition-colors" />
                    <input
                      type="tel"
                      required={!isLogin}
                      value={formData.phoneNumber}
                      onChange={e => setFormData({ ...formData, phoneNumber: e.target.value })}
                      className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
                      placeholder="+91 98765 43210"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1 ml-1">WhatsApp enabled (+91)</p>
                </div>
              )}

              <div className="group">
                <label className="block text-sm font-semibold text-gray-700 mb-1.5 ml-1">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 group-focus-within:text-blue-500 transition-colors" />
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                    className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
                    placeholder="name@company.com"
                  />
                </div>
              </div>

              <div className="group">
                <label className="block text-sm font-semibold text-gray-700 mb-1.5 ml-1">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 group-focus-within:text-blue-500 transition-colors" />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={formData.password}
                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                    className="w-full pl-10 pr-12 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
                    placeholder="••••••••"
                    autoComplete={isLogin ? "current-password" : "new-password"}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {!isLogin && (
                <div className="group">
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5 ml-1">Account Type</label>
                  <div className="relative">
                    <UserCheck className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
                    <select
                      value={formData.role}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value as 'user' | 'agent' | 'analytics' })}
                      className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium appearance-none cursor-pointer"
                    >
                      <option value="user">Customer / User</option>
                      <option value="agent">Support Agent</option>
                      <option value="analytics">Analytics Manager</option>
                    </select>
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                      <ArrowRight className="w-4 h-4 text-gray-400 rotate-90" />
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-1 ml-1">Admin login is available on a separate page</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-lg shadow-blue-500/30 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:-translate-y-0.5 flex justify-center items-center gap-2"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    {isLogin ? 'Sign In' : 'Create Account'}
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>

              {isLogin && (
                <div className="text-center">
                  <Link to="/forgot-password" className="text-sm font-medium text-blue-600 hover:text-blue-500 hover:underline">
                    Forgot password?
                  </Link>
                </div>
              )}
            </form>

            <div className="mt-8 text-center text-sm text-gray-500">
              {isLogin ? "Don't have an account?" : "Already have an account?"}{' '}
              <button
                onClick={() => {
                  setIsLogin(!isLogin);
                  setError('');
                }}
                className="font-bold text-blue-600 hover:text-blue-500 hover:underline"
              >
                {isLogin ? 'Sign up' : 'Log in'}
              </button>
            </div>

          </div>
        </div>
      </div>
    </GoogleOAuthProvider>
  );
}