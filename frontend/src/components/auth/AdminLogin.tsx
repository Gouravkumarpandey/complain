import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, AlertCircle, ArrowRight, Eye, EyeOff, ArrowLeft, Shield } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

export function AdminLogin() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const { adminLogin } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const success = await adminLogin(formData.email, formData.password);

      if (success) {
        navigate('/dashboard');
      } else {
        setError('Invalid admin credentials');
      }
    } catch {
      setError('Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600 to-blue-800 relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-32 h-32 bg-white rounded-full"></div>
          <div className="absolute bottom-32 right-20 w-24 h-24 bg-blue-300 rounded-full"></div>
          <div className="absolute top-1/2 right-1/3 w-16 h-16 bg-blue-400 rounded-full"></div>
        </div>

        {/* Back button in left panel */}
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
            Admin Portal
          </h1>
          <p className="text-xl text-blue-100 max-w-md">
            Secure access to the QuickFix administration dashboard.
          </p>

          {/* Image Card */}
          <div className="mt-10">
            <div className="relative">
              <img
                src="/login.png"
                alt="Admin Dashboard Access"
                className="w-full max-w-2xl h-auto rounded-xl shadow-2xl"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-blue-600/20 to-transparent rounded-lg"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center items-center p-6 lg:p-12 overflow-y-auto bg-white">
        <div className="max-w-[420px] w-full">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Administrator Sign In
            </h2>
            <p className="text-gray-500">
              Access your admin dashboard
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl flex items-start gap-3 animate-fadeIn">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <span className="text-red-700 text-sm">{error}</span>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="group">
              <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-1.5 ml-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 group-focus-within:text-blue-500 transition-colors" />
                <input
                  id="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
                  placeholder="admin@company.com"
                />
              </div>
            </div>

            <div className="group">
              <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-1.5 ml-1">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 group-focus-within:text-blue-500 transition-colors" />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
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

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-lg shadow-blue-500/30 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:-translate-y-0.5 flex justify-center items-center gap-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  Sign In
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-8 text-center text-sm text-gray-500">
            Not an admin?{' '}
            <Link
              to="/login"
              className="font-bold text-blue-600 hover:text-blue-500 hover:underline"
            >
              User Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}