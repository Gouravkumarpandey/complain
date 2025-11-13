import React, { useState, useEffect } from 'react';
import { CheckCircle, X, Zap, Crown, Gift, Loader2, AlertCircle, Shield, ChevronDown, ChevronUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import subscriptionService from '../../services/subscriptionService';
import { PlanDetails, PlanType } from '../../types/subscription';

export const PricingPlans: React.FC = () => {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [plans, setPlans] = useState<PlanDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [processingPlan, setProcessingPlan] = useState<PlanType | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    loadPlans();
    
    // Check if user just logged in and had selected a plan
    const selectedPlan = localStorage.getItem('selectedPlan');
    if (selectedPlan && isAuthenticated) {
      localStorage.removeItem('selectedPlan');
      // Auto-trigger the selected plan after a short delay
      setTimeout(() => {
        handleUpgrade(selectedPlan as PlanType);
      }, 1000);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  const loadPlans = async () => {
    try {
      setLoading(true);
      const planData = await subscriptionService.getPlanFeatures();
      setPlans(planData);
    } catch (err) {
      setError('Failed to load plan details');
      console.error('Error loading plans:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = async (planType: PlanType) => {
    // Check if user is authenticated
    if (!isAuthenticated) {
      // Save the selected plan to localStorage to redirect back after login
      localStorage.setItem('selectedPlan', planType);
      setError('Please login to purchase a plan');
      // Redirect to login after 2 seconds
      setTimeout(() => {
        navigate('/login');
      }, 2000);
      return;
    }

    if (planType === 'Free') {
      // Downgrade to free
      try {
        setProcessingPlan(planType);
        setError(null);
        setSuccess(null);

        const result = await subscriptionService.downgradePlan();
        setSuccess(result.message);
        
        // Reload to get updated user data
        window.location.reload();
      } catch (err) {
        setError('Failed to downgrade plan');
        console.error('Error downgrading:', err);
      } finally {
        setProcessingPlan(null);
      }
      return;
    }

    // Redirect to Stripe checkout
    setProcessingPlan(planType);
    setError(null);
    setSuccess(null);

    try {
      // Redirect to Stripe checkout page
      await subscriptionService.redirectToCheckout(
        planType,
        (error) => {
          setError(error.message || 'Failed to initiate payment');
          setProcessingPlan(null);
        }
      );
      // Note: User will be redirected, so no need to reset processingPlan
    } catch (err) {
      setError('Failed to initiate payment');
      console.error('Error initiating payment:', err);
      setProcessingPlan(null);
    }
  };

  const getPlanIcon = (planName: string) => {
    switch (planName) {
      case 'Free':
        return <Gift className="w-8 h-8" />;
      case 'Pro':
        return <Zap className="w-8 h-8" />;
      case 'Premium':
        return <Crown className="w-8 h-8" />;
      default:
        return null;
    }
  };

  const getPlanColor = (planName: string) => {
    switch (planName) {
      case 'Free':
        return 'from-gray-500 to-gray-600';
      case 'Pro':
        return 'from-blue-500 to-blue-600';
      case 'Premium':
        return 'from-purple-500 to-purple-600';
      default:
        return 'from-gray-500 to-gray-600';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading pricing plans...</p>
        </div>
      </div>
    );
  }

  if (!plans) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
          <p className="text-gray-600">Failed to load pricing plans</p>
          <button
            onClick={loadPlans}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-gradient-to-br from-gray-50 to-blue-50 py-12 px-4">
        <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Choose Your Plan
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Select the perfect plan for your needs. Upgrade or downgrade anytime.
          </p>
          {!isAuthenticated && (
            <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-blue-50 rounded-full shadow-sm border border-blue-200">
              <span className="text-sm text-blue-800">
                Please login or create an account to purchase a plan
              </span>
            </div>
          )}
          {user && (
            <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-white rounded-full shadow-sm">
              <span className="text-sm text-gray-600">Current Plan:</span>
              <span className="font-semibold text-blue-600">{user.planType || 'Free'}</span>
            </div>
          )}
        </div>

        {/* Error/Success Messages */}
        {error && (
          <div className="max-w-md mx-auto mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {success && (
          <div className="max-w-md mx-auto mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <p className="text-green-800">{success}</p>
          </div>
        )}

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {Object.entries(plans).map(([key, plan]) => {
            const planName = key as PlanType;
            const isCurrentPlan = user?.planType === planName;
            const isProcessing = processingPlan === planName;

            return (
              <div
                key={planName}
                className={`relative bg-white rounded-2xl shadow-lg overflow-hidden transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 ${
                  planName === 'Pro' ? 'ring-2 ring-blue-500 md:scale-105' : ''
                }`}
              >
                {/* Recommended Badge */}
                {planName === 'Pro' && (
                  <div className="absolute top-0 right-0 bg-blue-500 text-white text-xs font-bold px-3 py-1 rounded-bl-lg">
                    RECOMMENDED
                  </div>
                )}

                {/* Plan Header */}
                <div className={`bg-gradient-to-r ${getPlanColor(planName)} p-6 text-white transition-all duration-300`}>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="transition-transform duration-300 hover:scale-110">
                      {getPlanIcon(planName)}
                    </div>
                    <h3 className="text-2xl font-bold">{plan.name}</h3>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold">
                      ${(plan.price / 100).toFixed(2)}
                    </span>
                    {plan.price > 0 && (
                      <span className="text-white/80">/month</span>
                    )}
                  </div>
                </div>

                {/* Features List */}
                <div className="p-6">
                  <div className="space-y-3 mb-6">
                    {plan.features.map((feature: string, index: number) => (
                      <div key={index} className="flex items-start gap-2">
                        <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                        <span className="text-gray-700 text-sm">{feature}</span>
                      </div>
                    ))}
                  </div>

                  {/* Limitations */}
                  {plan.limitations.length > 0 && (
                    <div className="space-y-2 mb-6 pt-4 border-t border-gray-200">
                      {plan.limitations.slice(0, 3).map((limitation: string, index: number) => (
                        <div key={index} className="flex items-start gap-2">
                          <X className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                          <span className="text-gray-500 text-sm">{limitation}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* CTA Button */}
                  <button
                    onClick={() => handleUpgrade(planName)}
                    disabled={isCurrentPlan || isProcessing}
                    className={`w-full py-3 px-4 rounded-lg font-semibold transition-all duration-200 flex items-center justify-center gap-2 transform hover:scale-105 ${
                      isCurrentPlan
                        ? 'bg-gray-100 text-gray-500 cursor-not-allowed hover:scale-100'
                        : isProcessing
                        ? 'bg-gray-400 text-white cursor-wait hover:scale-100'
                        : planName === 'Pro'
                        ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg hover:shadow-xl'
                        : planName === 'Premium'
                        ? 'bg-purple-600 text-white hover:bg-purple-700 shadow-lg hover:shadow-xl'
                        : 'bg-gray-600 text-white hover:bg-gray-700 hover:shadow-lg'
                    }`}
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Processing...
                      </>
                    ) : isCurrentPlan ? (
                      'Current Plan'
                    ) : !isAuthenticated && planName !== 'Free' ? (
                      'Login to Purchase'
                    ) : planName === 'Free' ? (
                      'Downgrade to Free'
                    ) : (
                      `Upgrade to ${planName}`
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Additional Info */}
        <div className="mt-12 text-center text-gray-600">
          <p className="mb-2">All plans include email support and basic features</p>
          <p className="text-sm">Need help choosing? <a href="/contact" className="text-blue-600 hover:underline">Contact us</a></p>
        </div>

        {/* Promotional Banner */}
        <div className="mt-24 max-w-6xl mx-auto flex justify-center">
          <img 
            src="/Subscription.png" 
            alt="QuickFix Pro Version" 
            className="w-full max-w-4xl rounded-3xl shadow-2xl object-contain"
          />
        </div>

        {/* FAQ Section */}
        <div className="mt-24 max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-lg text-gray-600">
              Everything you need to know about our pricing plans
            </p>
          </div>

          <div className="space-y-4">
            {[
              {
                question: "Can I switch plans anytime?",
                answer: "Yes! You can upgrade or downgrade your plan at any time. Changes will be reflected in your next billing cycle. If you upgrade, you'll get immediate access to new features."
              },
              {
                question: "What payment methods do you accept?",
                answer: "We accept all major credit cards (Visa, MasterCard, American Express) through our secure Stripe payment gateway. All transactions are encrypted and PCI-compliant."
              },
              {
                question: "Is there a free trial available?",
                answer: "Yes! Our Free plan is available forever with basic features. You can start with the Free plan and upgrade to Pro or Premium at any time to access advanced features."
              },
              {
                question: "What happens if I cancel my subscription?",
                answer: "You can cancel your subscription at any time. Your account will remain active until the end of your billing period, after which you'll be downgraded to the Free plan."
              },
              {
                question: "Do you offer refunds?",
                answer: "We offer a 30-day money-back guarantee for all paid plans. If you're not satisfied, contact our support team within 30 days of your purchase for a full refund."
              },
              {
                question: "Can I add more users to my plan?",
                answer: "The Premium plan includes up to 10 users. For larger teams or enterprise needs, please contact our sales team for custom pricing and unlimited user options."
              },
              {
                question: "Is my data secure?",
                answer: "Absolutely! We use enterprise-grade encryption, regular security audits, and comply with GDPR and other data protection regulations. Your data is stored in secure data centers with 99.9% uptime."
              },
              {
                question: "Do you offer discounts for annual billing?",
                answer: "Yes! If you choose annual billing, you'll get 2 months free (equivalent to 16% discount). Contact us for more details about annual plans."
              }
            ].map((faq, index) => (
              <div
                key={index}
                className="bg-white rounded-lg border border-gray-200 overflow-hidden transition-all duration-200 hover:shadow-md"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === index ? null : index)}
                  className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
                >
                  <span className="font-semibold text-gray-900 pr-8">
                    {faq.question}
                  </span>
                  {openFaq === index ? (
                    <ChevronUp className="w-5 h-5 text-blue-600 flex-shrink-0" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0" />
                  )}
                </button>
                {openFaq === index && (
                  <div className="px-6 pb-4 text-gray-600 leading-relaxed">
                    {faq.answer}
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="mt-12 text-center p-6 bg-blue-50 rounded-xl border border-blue-200">
            <p className="text-gray-900 font-medium mb-2">Still have questions?</p>
            <p className="text-gray-600 mb-4">Can't find the answer you're looking for? Please chat with our friendly team.</p>
            <a
              href="/contact"
              className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              Contact Support
            </a>
          </div>
        </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white w-full mt-0">
        <div className="max-w-full px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 mb-12">
            {/* Logo and Description */}
            <div className="lg:col-span-2">
              <div className="flex items-center space-x-2 mb-6">
                <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
                  <Shield className="w-5 h-5 text-white" />
                </div>
                <span className="text-2xl font-bold">QuickFix</span>
              </div>
              <p className="text-gray-300 mb-6 max-w-md">
                AI-powered complaint management system that revolutionizes customer support with 
                intelligent automation, real-time analytics, and seamless resolution workflows.
              </p>
              <div className="flex space-x-4">
                <a href="#" className="text-gray-400 hover:text-orange-400 transition-colors">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                  </svg>
                </a>
                <a href="#" className="text-gray-400 hover:text-orange-400 transition-colors">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                  </svg>
                </a>
                <a href="#" className="text-gray-400 hover:text-orange-400 transition-colors">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.174-.105-.949-.199-2.403.041-3.439.219-.937 1.404-5.958 1.404-5.958s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.889 2.741.099.12.112.225.085.345-.09.375-.293 1.199-.334 1.363-.053.225-.172.271-.402.165-1.495-.69-2.433-2.878-2.433-4.646 0-3.776 2.748-7.252 7.92-7.252 4.158 0 7.392 2.967 7.392 6.923 0 4.135-2.607 7.462-6.233 7.462-1.214 0-2.357-.629-2.746-1.378l-.749 2.848c-.269 1.045-1.004 2.352-1.498 3.146 1.123.345 2.306.535 3.55.535 6.624 0 11.99-5.367 11.99-11.987C24.007 5.367 18.641.001 12.017.001z"/>
                  </svg>
                </a>
                <a href="#" className="text-gray-400 hover:text-orange-400 transition-colors">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                  </svg>
                </a>
              </div>
            </div>

            {/* Products */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Products</h3>
              <ul className="space-y-3">
                <li><a href="#" className="text-gray-300 hover:text-orange-400 transition-colors">QuickFix Helpdesk</a></li>
                <li><a href="#" className="text-gray-300 hover:text-orange-400 transition-colors">AI Chat Support</a></li>
                <li><a href="#" className="text-gray-300 hover:text-orange-400 transition-colors">Analytics Dashboard</a></li>
                <li><a href="#" className="text-gray-300 hover:text-orange-400 transition-colors">Mobile App</a></li>
                <li><a href="#" className="text-gray-300 hover:text-orange-400 transition-colors">API & Integrations</a></li>
              </ul>
            </div>

            {/* Solutions */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Solutions</h3>
              <ul className="space-y-3">
                <li><a href="#" className="text-gray-300 hover:text-orange-400 transition-colors">Customer Support</a></li>
                <li><a href="#" className="text-gray-300 hover:text-orange-400 transition-colors">IT Service Management</a></li>
                <li><a href="#" className="text-gray-300 hover:text-orange-400 transition-colors">Enterprise</a></li>
                <li><a href="#" className="text-gray-300 hover:text-orange-400 transition-colors">Small Business</a></li>
                <li><a href="#" className="text-gray-300 hover:text-orange-400 transition-colors">E-commerce</a></li>
              </ul>
            </div>

            {/* Company */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Company</h3>
              <ul className="space-y-3">
                <li><a href="#" className="text-gray-300 hover:text-orange-400 transition-colors">About Us</a></li>
                <li><a href="#" className="text-gray-300 hover:text-orange-400 transition-colors">Careers</a></li>
                <li><a href="#" className="text-gray-300 hover:text-orange-400 transition-colors">Press & News</a></li>
                <li><a href="#" className="text-gray-300 hover:text-orange-400 transition-colors">Security</a></li>
                <li><a href="#" className="text-gray-300 hover:text-orange-400 transition-colors">Contact Us</a></li>
              </ul>
            </div>
          </div>

          {/* Bottom Section */}
          <div className="border-t border-gray-800 pt-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-center">
              {/* Legal Links */}
              <div className="flex flex-wrap gap-6">
                <a href="#" className="text-gray-400 hover:text-orange-400 transition-colors text-sm">Privacy Policy</a>
                <a href="#" className="text-gray-400 hover:text-orange-400 transition-colors text-sm">Terms of Service</a>
                <a href="#" className="text-gray-400 hover:text-orange-400 transition-colors text-sm">Cookie Policy</a>
                <a href="#" className="text-gray-400 hover:text-orange-400 transition-colors text-sm">Accessibility</a>
              </div>

              {/* Copyright */}
              <div className="text-center">
                <p className="text-gray-400 text-sm">
                  © 2025 QuickFix Inc. All Rights Reserved
                </p>
              </div>

              {/* App Store Links */}
              <div className="flex justify-end space-x-4">
                <a href="#" className="bg-gray-800 hover:bg-gray-700 transition-colors rounded-lg p-3">
                  <img src="https://developer.apple.com/assets/elements/badges/download-on-the-app-store.svg" alt="Download on App Store" className="h-12" />
                </a>
                <a href="#" className="bg-gray-800 hover:bg-gray-700 transition-colors rounded-lg p-3">
                  <img src="https://play.google.com/intl/en_us/badges/static/images/badges/en_badge_web_generic.png" alt="Get it on Google Play" className="h-12" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
};

export default PricingPlans;
