import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Mail, Lock, User, AlertCircle, UserCheck, ArrowRight, ArrowLeft, Eye, EyeOff, Phone } from 'lucide-react';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { CustomGoogleLogin } from './CustomGoogleLogin';
import validateGoogleConfig from '../../services/googleAuthDebug';
// @ts-expect-error - Missing type declarations for this JS module
import setupGoogleAuth from '../../utils/googleAuthSetup';
import { OTPVerification } from './OTPVerification';
import { redirectToDashboard } from '../../utils/authRedirectUtils';
import { FacebookLogin } from './FacebookLogin';
import { AxiosError } from 'axios';
import api from '../../utils/api';
import { GoogleRoleSelection } from './GoogleRoleSelection';

export function LoginForm() {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);

  // Debug Google Sign-In configuration on component mount
  useEffect(() => {
    validateGoogleConfig();
    setupGoogleAuth();
  }, []);

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
  const [pendingFacebookCode, setPendingFacebookCode] = useState('');
  const [authSource, setAuthSource] = useState<'google' | 'facebook'>('google');
  const [googleUserInfo, setGoogleUserInfo] = useState<{ name: string, email: string } | null>(null);

  // Get auth context including OTP verification
  const { login, register, googleLogin, googleSignupWithRole, facebookSignupWithRole, pendingVerification, cancelVerification, logout, decodeGoogleToken } = useAuth();

  const validateIndianPhone = (phone: string) => {
    // Basic Indian phone validation
    // Allow +91 or just 10 digits
    const clean = phone.replace(/[\s\-\+]/g, '');
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
      console.log(`Submitting form with role: ${formData.role}`);

      const success = isLogin
        ? await login(formData.email, formData.password)
        : await register(formData.name, formData.email, formData.password, formData.role, formData.phoneNumber);

      if (!success) {
        setError(isLogin ? 'Invalid email or password' : `Registration failed. Please check if your email is already registered.`);
      } else {
        redirectToDashboard();
      }
    } catch (err) {
      console.error('Auth error:', err);
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An error occurred. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (token: string) => {
    try {
      if (token) {
        console.log('Google token received...');

        logout();
        setError('');

        console.log('Attempting Google login...');
        try {
          const success = await googleLogin(token);
          if (success) {
            console.log('Google authentication successful, redirecting to dashboard...');
            redirectToDashboard();
            return;
          }
        } catch (loginError: any) {
          console.log('Google login failed:', loginError);

          // Check if "Account not found"
          if (loginError.message && loginError.message.includes('Account not found')) {
            console.log('User not found. Initiating signup flow...');

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
            setError(loginError.message || 'Google authentication failed.');
          }
        }
      }
    } catch (err) {
      console.error('Google auth error:', err);
      setError('Google authentication failed. Please try again.');
      setLoading(false);
    }
  };

  const handleRoleSelected = async (role: 'user' | 'agent' | 'analytics' | 'admin', organization?: string, phoneNumber?: string) => {
    setLoading(true);
    try {
      let success = false;
      if (authSource === 'google' && pendingGoogleToken) {
        success = await googleSignupWithRole(pendingGoogleToken, role, organization, phoneNumber);
      } else if (authSource === 'facebook' && pendingFacebookCode) {
        // Note: facebookSignupWithRole expects 'code' in the body, but here we might pass accessToken as 'code' depending on how it's implemented in context.
        // Actually the helper in AuthContext likely takes 'token' as argument and sends as 'code' or 'token'.
        // Let's verify AuthContext facebookSignupWithRole signature.
        // Assuming it's similar: (token, role, org, phone)
        if (facebookSignupWithRole) {
          success = await facebookSignupWithRole(pendingFacebookCode, role, organization, phoneNumber);
        } else {
          throw new Error("Facebook signup not supported");
        }
      }

      if (success) {
        redirectToDashboard();
      } else {
        setError('Failed to create account with selected role.');
        setShowRoleSelection(false);
      }
    } catch (err: any) {
      setError(err.message || 'Signup failed');
      setShowRoleSelection(false);
    } finally {
      setLoading(false);
    }
  };

  // Handle Facebook login success
  const handleFacebookSuccess = async (response: {
    profile: { id: string; name: string; email: string; picture: { data: { url: string } } };
    auth: { accessToken: string }
  }) => {
    setLoading(true);
    setError('');

    try {
      console.log('Facebook authentication successful, sending to backend...');

      const apiResponse = await api.post('/auth/facebook', {
        accessToken: response.auth.accessToken,
        isSignup: !isLogin
      });

      const data = apiResponse.data;

      if (data.token) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        redirectToDashboard();
      } else {
        setError(data.message || 'Facebook authentication failed');
      }
    } catch (err: unknown) {
      console.error('Facebook auth error:', err);
      const errorResponse = (err as AxiosError<{ message?: string; requiresSignup?: boolean; facebookData?: any }>).response?.data;

      if (errorResponse?.requiresSignup && errorResponse.facebookData) {
        console.log('Facebook user not found. Initiating signup flow...');
        setGoogleUserInfo({
          name: errorResponse.facebookData.name,
          email: errorResponse.facebookData.email
        });
        setPendingFacebookCode(response.auth.accessToken); // We use access token as code
        setAuthSource('facebook');
        setShowRoleSelection(true);
      } else {
        setError(errorResponse?.message || 'Failed to authenticate with Facebook.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleFacebookFailure = (error: string) => {
    console.error('Facebook login failed:', error);
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
        <div className="min-h-screen bg-gray-50 flex">
          {/* Left Side */}
          <div className="hidden lg:flex lg:w-1/2 bg-[#0F172A] relative overflow-hidden flex-col justify-center items-center">
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
              <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-600/20 rounded-full blur-[120px]"></div>
              <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-600/20 rounded-full blur-[120px]"></div>
            </div>
            <div className="relative z-10 px-12 text-center">
              <h1 className="text-4xl font-bold text-white mb-4">Security Verification</h1>
              <p className="text-xl text-gray-400">Please verify your identity to continue.</p>
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
      <div className="min-h-screen bg-gray-50 flex font-sans">

        {/* Left Side - Branding */}
        <div className="hidden lg:flex lg:w-1/2 bg-[#0F172A] relative overflow-hidden flex-col justify-between p-12">
          <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
            <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-600/20 rounded-full blur-[120px]"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-600/20 rounded-full blur-[120px]"></div>
          </div>

          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-8">
              {/* Logo placeholder if needed */}
            </div>
          </div>

          <div className="relative z-10 my-auto">
            <h1 className="text-5xl font-bold text-white mb-6 leading-tight">
              {isLogin ? 'Welcome Back!' : 'Join our Community'}
            </h1>
            <p className="text-xl text-gray-400 max-w-md leading-relaxed">
              {isLogin
                ? 'Access your intelligent complaint management dashboard.'
                : 'Start your journey with AI-powered customer service automation.'}
            </p>
          </div>

          {/* Illustration or Image */}
          <div className="relative z-10 mt-8 rounded-2xl overflow-hidden shadow-2xl border border-white/10 max-w-md mx-auto transform hover:scale-[1.02] transition-transform duration-500">
            <img
              src={isLogin ? "/login.png" : "/Signup.webp"}
              alt="Visual"
              className="w-full h-auto object-cover opacity-90 hover:opacity-100 transition-opacity"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0F172A] to-transparent"></div>
          </div>
        </div>

        {/* Right Side - Form */}
        <div className="w-full lg:w-1/2 flex flex-col justify-center items-center p-6 lg:p-12 overflow-y-auto bg-white/50 backdrop-blur-md">
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
                onSuccess={handleFacebookSuccess}
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
                      onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
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