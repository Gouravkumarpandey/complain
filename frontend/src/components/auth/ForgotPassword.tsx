import React, { useState } from 'react';
import { i18n } from '../../i18n';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, ArrowLeft, AlertCircle, CheckCircle, Shield } from 'lucide-react';
import { Trans } from 'react-i18next';
import apiService from '../../services/apiService';
import { LanguageDropdown } from '../common/LanguageSelector';

export function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' | '' }>({ text: '', type: '' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      setMessage({ text: i18n.t('please_enter_your_email_address'), type: 'error' });
      return;
    }

    setIsSubmitting(true);
    setMessage({ text: '', type: '' });

    try {
      console.log("Submitting forgot password request for:", email);
      const response = await apiService.forgotPassword(email);
      
      console.log("Forgot password response:", response);
      
      if (response.error) {
        setMessage({ 
          text: response.error, 
          type: 'error' 
        });
      } else if (response.data && response.data.success) {
        setMessage({ 
          text: response.message || response.data.message || i18n.t('if_your_email_is_registered_you_will_receive_a_password_rese'), 
          type: 'success' 
        });
        setEmail(''); // Clear the form
      } else {
        // Handle ambiguous response
        setMessage({ 
          text: i18n.t('if_your_email_is_registered_you_will_receive_a_password_rese'), 
          type: 'success' 
        });
        setEmail(''); // Clear the form for security
      }
    } catch (error) {
      console.error('Forgot password error:', error);
      const errorMessage = error instanceof Error ? error.message : i18n.t('an_error_occurred_please_try_again_later');
      setMessage({ 
        text: errorMessage, 
        type: 'error' 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

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
              <span className="text-sm text-gray-500 ml-1">{i18n.t('ai_powered_support')}</span>
            </div>
            {/* Language selector */}
            <div className="flex items-center space-x-4">
              <Link to="/language-settings" className="text-sm text-blue-600 hover:text-blue-700">
                {i18n.t('language_settings')}
              </Link>
              <LanguageDropdown />
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
              <Trans i18nKey="forgot_your_password">Forgot your <span className="text-orange-500">password?</span></Trans>
            </h1>
            <p className="text-xl text-gray-600 mb-6">
              {i18n.t('no_worries_we_ll_send_you_a_secure_link_to_reset_your_passwo')}
            </p>
            <div className="rounded-2xl overflow-hidden shadow-xl">
              <img 
                src="Forgetpass.jpg" 
                alt={i18n.t('customer_support')} 
                className="w-full h-auto"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.onerror = null;
                  target.src = "https://placehold.co/600x400/f5faff/1a3564?text=Customer+Support";
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
              <h2 className="text-2xl font-bold text-gray-900">Reset your password</h2>
              <p className="mt-2 text-gray-600">
                Enter your email address and we'll send you instructions to reset your password
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
                <label htmlFor="email-address" className="block text-sm font-medium text-gray-700 mb-1">
                  Email address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="email-address"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    className="appearance-none rounded-lg relative block w-full pl-10 pr-3 py-2.5 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-orange-500 focus:border-orange-500 focus:z-10 sm:text-sm"
                    placeholder="your.email@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
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
                      Sending...
                    </>
                  ) : (
                    'Reset Password'
                  )}
                </button>
              </div>
              
              <div className="text-center mt-6">
                <button 
                  type="button"
                  onClick={() => navigate('/login')}
                  className="flex items-center justify-center mx-auto text-sm text-blue-600 hover:text-blue-700 font-medium cursor-pointer"
                >
                  <ArrowLeft className="h-4 w-4 mr-1" /> Back to Login
                </button>
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

export default ForgotPassword;