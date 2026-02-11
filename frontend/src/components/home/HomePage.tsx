import { Link } from 'react-router-dom';
// i18n removed
import { ArrowRight, Users, MessageSquare, BarChart3, Shield, CheckCircle, Play, Globe, Menu, X } from 'lucide-react';
import TestimonialCarousel from './TestimonialCarousel';
import HomePageChatBot from './HomePageChatBot';
import { useTranslation } from 'react-i18next';
import { useState } from 'react';

export function HomePage() {
  const { t, i18n } = useTranslation();
  const [showLanguageMenu, setShowLanguageMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  const languages = [
    { code: 'en', name: 'English' },
    { code: 'zh', name: 'Mandarin Chinese' },
    { code: 'hi', name: 'Hindi' },
    { code: 'es', name: 'Spanish' },
    { code: 'ar', name: 'Standard Arabic' },
    { code: 'fr', name: 'French' },
    { code: 'bn', name: 'Bengali' },
    { code: 'pt', name: 'Portuguese' },
    { code: 'ru', name: 'Russian' },
    { code: 'id', name: 'Indonesian' },
    { code: 'ur', name: 'Urdu' },
    { code: 'de', name: 'Standard German' }
  ];

  const changeLanguage = (code: string) => {
    i18n.changeLanguage(code);
    setShowLanguageMenu(false);
  };
  return (
    <div className="bg-white">
      {/* Navigation */}
      <nav className="bg-white border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl sm:text-2xl font-bold text-gray-900">QuickFix</span>
              <span className="hidden sm:inline text-sm text-gray-500 ml-1">AI Powered Support</span>
            </div>

            {/* Desktop Navigation Links */}
            <div className="hidden lg:flex items-center space-x-8">
              <a href="#features" className="text-gray-600 hover:text-gray-900 font-medium">{t('common.features')}</a>
              <a href="#pricing" className="text-gray-600 hover:text-gray-900 font-medium">{t('common.plans')}</a>
              <a href="#how-it-works" className="text-gray-600 hover:text-gray-900 font-medium">{t('common.howItWorks')}</a>
              <a href="#about" className="text-gray-600 hover:text-gray-900 font-medium">{t('common.aboutUs')}</a>

              {/* Language Selector */}
              <div className="relative">
                <button
                  onClick={() => setShowLanguageMenu(!showLanguageMenu)}
                  className="flex items-center text-gray-600 hover:text-gray-900 border-r border-gray-200 pr-4 mr-2 gap-1"
                >
                  <Globe className="w-4 h-4" />
                  <span className="text-sm font-semibold uppercase">{i18n.language.split('-')[0]}</span>
                </button>

                {showLanguageMenu && (
                  <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-2xl border border-gray-100 z-[60] py-2 animate-in fade-in slide-in-from-top-2">
                    <div className="px-4 py-2 border-b border-gray-50 mb-1">
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Select Language</p>
                    </div>
                    <div className="max-h-96 overflow-y-auto custom-scrollbar">
                      {languages.map((lang) => (
                        <button
                          key={lang.code}
                          onClick={() => changeLanguage(lang.code)}
                          className={`w-full flex items-center justify-between px-4 py-3 text-left hover:bg-gray-50 transition-colors ${i18n.language === lang.code ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                            }`}
                        >
                          <div>
                            <p className="text-sm font-bold">{lang.name}</p>
                          </div>
                          {i18n.language === lang.code && <CheckCircle className="w-4 h-4 text-blue-600" />}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <Link
                to="/login"
                className="bg-orange-500 text-white px-6 py-2 rounded-lg font-semibold hover:bg-orange-600 transition-colors"
              >
                {t('common.getStarted')}
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <div className="lg:hidden flex items-center gap-3">
              <button
                onClick={() => setShowLanguageMenu(!showLanguageMenu)}
                className="p-2 text-gray-600 hover:text-gray-900"
              >
                <Globe className="w-5 h-5" />
              </button>
              <button
                onClick={() => setShowMobileMenu(!showMobileMenu)}
                className="p-2 text-gray-600 hover:text-gray-900"
              >
                {showMobileMenu ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>

          {/* Mobile Menu */}
          {showMobileMenu && (
            <div className="lg:hidden border-t border-gray-100 py-4 space-y-3">
              <a
                href="#features"
                onClick={() => setShowMobileMenu(false)}
                className="block px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg font-medium"
              >
                {t('common.features')}
              </a>
              <a
                href="#pricing"
                onClick={() => setShowMobileMenu(false)}
                className="block px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg font-medium"
              >
                {t('common.plans')}
              </a>
              <a
                href="#how-it-works"
                onClick={() => setShowMobileMenu(false)}
                className="block px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg font-medium"
              >
                {t('common.howItWorks')}
              </a>
              <a
                href="#about"
                onClick={() => setShowMobileMenu(false)}
                className="block px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg font-medium"
              >
                {t('common.aboutUs')}
              </a>
              <Link
                to="/login"
                onClick={() => setShowMobileMenu(false)}
                className="block mx-4 text-center bg-orange-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-orange-600 transition-colors"
              >
                {t('common.getStarted')}
              </Link>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-12 sm:pt-16 pb-16 sm:pb-24 bg-gradient-to-br from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-8 sm:gap-12 items-center">
            {/* Left side - Text content */}
            <div className="text-center lg:text-left">
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-4 sm:mb-6 leading-tight">
                {t('common.heroTitleNormal')} <span className="text-orange-500">{t('common.heroTitleHighlight')}</span>
              </h1>
              <p className="text-base sm:text-lg md:text-xl text-gray-600 mb-8 sm:mb-12 leading-relaxed">
                {t('common.heroSubtitle')}
              </p>

              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center lg:justify-start mb-6 sm:mb-8">
                <Link
                  to="/login"
                  className="bg-orange-500 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-lg font-semibold text-base sm:text-lg hover:bg-orange-600 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                >
                  {t('common.tryItFree')}
                </Link>
                <button className="border-2 border-gray-300 text-gray-700 px-6 sm:px-8 py-3 sm:py-4 rounded-lg font-semibold text-base sm:text-lg hover:border-orange-500 hover:text-orange-500 transition-all duration-200 flex items-center justify-center gap-2">
                  <Play className="w-4 h-4 sm:w-5 sm:h-5" />
                  {t('common.bookDemo')}
                </button>
              </div>
            </div>

            {/* Right side - Hero Image */}
            <div className="lg:order-2">
              <div className="relative">
                <img
                  src="/messaging-and-live-chat-fd.webp"
                  alt="QuickFix AI-Powered Customer Service Platform"
                  className="w-full h-auto rounded-2xl shadow-2xl"
                  loading="eager"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent rounded-2xl"></div>
              </div>
            </div>
          </div>

          {/* Trust Bar - moved below hero content */}
          <div className="text-center mt-16 sm:mt-24">
            <p className="text-xs sm:text-sm text-gray-500 mb-4 sm:mb-6">Trusted by 73,000 businesses worldwide</p>
            <div className="relative overflow-hidden">
              <div className="flex animate-scroll gap-6 sm:gap-8 items-center opacity-60">
                {/* First set of logos */}
                <img src="https://dam.freshworks.com/m/172addb8908823a/original/bridgestone-logo.webp" alt="Bridgestone" className="h-6 sm:h-8 grayscale flex-shrink-0" />
                <img src="https://dam.freshworks.com/m/6b09343713112137/original/Tata-Digital-Trustbar-logo.webp" alt="Tata Digital" className="h-6 sm:h-8 grayscale flex-shrink-0" />
                <img src="https://dam.freshworks.com/m/678dcfe0f3352df6/original/S-P-GLobal-Trustbar-logo.webp" alt="S&P Global" className="h-6 sm:h-8 grayscale flex-shrink-0" />
                <img src="https://dam.freshworks.com/m/692895b671757fd/original/Klarna-Trustbar-Logo.webp" alt="Klarna" className="h-6 sm:h-8 grayscale flex-shrink-0" />
                <img src="https://dam.freshworks.com/m/686b5fb695a93fdf/original/Forbes-Trustbar-logo.webp" alt="Forbes" className="h-6 sm:h-8 grayscale flex-shrink-0" />
                <img src="https://dam.freshworks.com/m/65934d5b088a71e4/original/Pepsico-Trustbar-logo.webp" alt="PepsiCo" className="h-6 sm:h-8 grayscale flex-shrink-0" />
                <img src="https://dam.freshworks.com/m/716392be1c61bd75/original/Ingram-Trustbar-logo.webp" alt="Ingram Micro" className="h-6 sm:h-8 grayscale flex-shrink-0" />
                <img src="https://dam.freshworks.com/m/770b19ddd352c7cf/original/pearson-Trustbar-logo.webp" alt="Pearson" className="h-6 sm:h-8 grayscale flex-shrink-0" />

                {/* Duplicate set for seamless loop */}
                <img src="https://dam.freshworks.com/m/172addb8908823a/original/bridgestone-logo.webp" alt="Bridgestone" className="h-6 sm:h-8 grayscale flex-shrink-0" />
                <img src="https://dam.freshworks.com/m/6b09343713112137/original/Tata-Digital-Trustbar-logo.webp" alt="Tata Digital" className="h-6 sm:h-8 grayscale flex-shrink-0" />
                <img src="https://dam.freshworks.com/m/678dcfe0f3352df6/original/S-P-GLobal-Trustbar-logo.webp" alt="S&P Global" className="h-6 sm:h-8 grayscale flex-shrink-0" />
                <img src="https://dam.freshworks.com/m/692895b671757fd/original/Klarna-Trustbar-Logo.webp" alt="Klarna" className="h-6 sm:h-8 grayscale flex-shrink-0" />
                <img src="https://dam.freshworks.com/m/686b5fb695a93fdf/original/Forbes-Trustbar-logo.webp" alt="Forbes" className="h-6 sm:h-8 grayscale flex-shrink-0" />
                <img src="https://dam.freshworks.com/m/65934d5b088a71e4/original/Pepsico-Trustbar-logo.webp" alt="PepsiCo" className="h-6 sm:h-8 grayscale flex-shrink-0" />
                <img src="https://dam.freshworks.com/m/716392be1c61bd75/original/Ingram-Trustbar-logo.webp" alt="Ingram Micro" className="h-6 sm:h-8 grayscale flex-shrink-0" />
                <img src="https://dam.freshworks.com/m/770b19ddd352c7cf/original/pearson-Trustbar-logo.webp" alt="Pearson" className="h-6 sm:h-8 grayscale flex-shrink-0" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Value Proposition */}
      <section className="py-16 sm:py-20 md:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-4 sm:mb-6">
              Seamless support, smarter agents, faster resolutions
            </h2>
            <p className="text-lg sm:text-xl text-gray-600 max-w-4xl mx-auto">
              Unify every channel, cut the noise, and give agents an easy tool
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 mb-12 sm:mb-16">
            <div className="text-center p-6 sm:p-8 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50">
              <div className="w-14 h-14 sm:w-16 sm:h-16 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
                <MessageSquare className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-3 sm:mb-4">Turn email tickets into instant resolutions</h3>
              <p className="text-sm sm:text-base text-gray-600">
                Answer email queries with email AI agents that read every incoming message
              </p>
            </div>

            <div className="text-center p-6 sm:p-8 rounded-2xl bg-gradient-to-br from-green-50 to-emerald-50">
              <div className="w-14 h-14 sm:w-16 sm:h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
                <Users className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-3 sm:mb-4">Auto-resolve issues with conversational AI agents</h3>
              <p className="text-sm sm:text-base text-gray-600">
                Deploy intelligent chatbots that understand context, provide instant answers
              </p>
            </div>

            <div className="text-center p-6 sm:p-8 rounded-2xl bg-gradient-to-br from-purple-50 to-violet-50 sm:col-span-2 lg:col-span-1">
              <div className="w-14 h-14 sm:w-16 sm:h-16 bg-purple-500 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
                <BarChart3 className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-3 sm:mb-4">Empower support teams with intelligent assistance</h3>
              <p className="text-sm sm:text-base text-gray-600">
                Give your human agents AI-powered insights and suggested responses
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Video Section */}
      <section className="py-16 sm:py-20 md:py-24 bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-4 sm:mb-6">
              See QuickFix in action
            </h2>
            <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto">
              Watch how our AI-powered complaint management system transforms support
            </p>
          </div>

          <div className="max-w-5xl mx-auto">
            <div className="relative bg-white rounded-2xl shadow-2xl overflow-hidden">
              <div className="aspect-video">
                <iframe
                  src="https://www.youtube.com/embed/6xQO5Rjz-v8"
                  title="QuickFix Demo Video"
                  className="w-full h-full"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                ></iframe>
              </div>
            </div>

            {/* Video description */}
            <div className="text-center mt-6 sm:mt-8">
              <p className="text-gray-600 text-base sm:text-lg">
                Discover how QuickFix revolutionizes customer support with AI
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* AI Section */}
      <section className="py-16 sm:py-20 md:py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-4 sm:mb-6">
              Meet Freddy AI
            </h2>
            <p className="text-lg sm:text-xl text-gray-600 max-w-4xl mx-auto mb-6 sm:mb-8">
              From AI agents that resolve routine queries instantly to AI that helps with complex issues
            </p>
            <Link
              to="/login"
              className="inline-flex items-center gap-2 text-orange-500 font-semibold hover:text-orange-600"
            >
              Learn more <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Freddy AI Video */}
          <div className="max-w-4xl mx-auto mb-12 sm:mb-16">
            <div className="relative rounded-2xl overflow-hidden shadow-2xl">
              <video
                className="w-full h-auto"
                controls
                autoPlay
                loop
                muted
              >
                <source
                  src="https://dam.freshworks.com/m/3f4f0cf65ec45bed/original/AI-Agent_X2-50.webm"
                  type="video/webm"
                />
                Your browser does not support the video tag.
              </video>
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none rounded-2xl"></div>
            </div>
            <p className="text-center text-gray-500 mt-3 sm:mt-4 text-sm sm:text-base">Freddy AI agents handling customer queries in real-time</p>
          </div>

          {/* Stats with colored cards like image */}
          <div className="mt-8 sm:mt-12 mb-3 sm:mb-4">
            <h3 className="text-xl sm:text-2xl font-bold text-blue-600 text-center mb-4 sm:mb-6">
              Industry-leading results with QuickFix
            </h3>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {/* 83% Card - Mint Green */}
            <div className="bg-green-100 rounded-xl p-6 sm:p-8 flex flex-col justify-center">
              <div className="text-4xl sm:text-5xl md:text-6xl font-bold text-gray-900 mb-3 sm:mb-4">83%</div>
              <div className="text-base sm:text-lg text-gray-700">Reduction in response times</div>
            </div>

            {/* <2 mins Card - Light Purple */}
            <div className="bg-purple-50 rounded-xl p-6 sm:p-8 flex flex-col justify-center">
              <div className="text-4xl sm:text-5xl md:text-6xl font-bold text-gray-900 mb-3 sm:mb-4">&lt;2 mins</div>
              <div className="text-base sm:text-lg text-gray-700">Average conversational resolution time</div>
            </div>

            {/* 97% Card - Cream */}
            <div className="bg-yellow-50 rounded-xl p-6 sm:p-8 flex flex-col justify-center">
              <div className="text-4xl sm:text-5xl md:text-6xl font-bold text-gray-900 mb-3 sm:mb-4">97%</div>
              <div className="text-base sm:text-lg text-gray-700">Omnichannel first contact resolution rate</div>
            </div>

            {/* 60% Card - Light Pink */}
            <div className="bg-red-50 rounded-xl p-6 sm:p-8 flex flex-col justify-center">
              <div className="text-4xl sm:text-5xl md:text-6xl font-bold text-gray-900 mb-3 sm:mb-4">60%</div>
              <div className="text-base sm:text-lg text-gray-700">Improved agent productivity with Freddy AI Copilot</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-16 sm:py-20 md:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-4 sm:mb-6">
              The Full Customer Service Experience
            </h2>
            <p className="text-lg sm:text-xl text-gray-600 max-w-4xl mx-auto mb-8 sm:mb-10">
              Everything you need to support customers and empower teams.
            </p>

            {/* Customer Experience Video */}
            <div className="max-w-4xl mx-auto mb-12 sm:mb-16">
              <div className="relative rounded-2xl overflow-hidden shadow-xl">
                <video
                  className="w-full h-auto"
                  controls
                  autoPlay
                  loop
                  muted
                >
                  <source
                    src="https://dam.freshworks.com/m/5985bfde388a455d/original/Resolution-AI-Assist_Omni_X2-50.webm"
                    type="video/webm"
                  />
                  Your browser does not support the video tag.
                </video>
                <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent pointer-events-none rounded-2xl"></div>
              </div>
              <p className="text-center text-gray-500 mt-3 sm:mt-4 text-sm sm:text-base">See how AI-assisted resolutions enhance the customer experience</p>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            <div className="p-5 sm:p-6 rounded-xl border border-gray-200 hover:border-orange-200 hover:shadow-lg transition-all">
              <MessageSquare className="w-7 h-7 sm:w-8 sm:h-8 text-orange-500 mb-3 sm:mb-4" />
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">Chat and Voice</h3>
              <p className="text-sm sm:text-base text-gray-600">Connect seamlessly across chat and voice channels.</p>
            </div>
            <div className="p-5 sm:p-6 rounded-xl border border-gray-200 hover:border-orange-200 hover:shadow-lg transition-all">
              <Users className="w-7 h-7 sm:w-8 sm:h-8 text-orange-500 mb-3 sm:mb-4" />
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">Self Service</h3>
              <p className="text-sm sm:text-base text-gray-600">Empower customers with comprehensive self-service options.</p>
            </div>
            <div className="p-5 sm:p-6 rounded-xl border border-gray-200 hover:border-orange-200 hover:shadow-lg transition-all">
              <BarChart3 className="w-7 h-7 sm:w-8 sm:h-8 text-orange-500 mb-3 sm:mb-4" />
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">Unified Context</h3>
              <p className="text-sm sm:text-base text-gray-600">Get complete customer context across all touchpoints.</p>
            </div>
            <div className="p-5 sm:p-6 rounded-xl border border-gray-200 hover:border-orange-200 hover:shadow-lg transition-all">
              <CheckCircle className="w-7 h-7 sm:w-8 sm:h-8 text-orange-500 mb-3 sm:mb-4" />
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">Advanced Workflows</h3>
              <p className="text-sm sm:text-base text-gray-600">Automate complex processes with intelligent workflows.</p>
            </div>
            <div className="p-5 sm:p-6 rounded-xl border border-gray-200 hover:border-orange-200 hover:shadow-lg transition-all">
              <BarChart3 className="w-7 h-7 sm:w-8 sm:h-8 text-orange-500 mb-3 sm:mb-4" />
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">Analytics and Insights</h3>
              <p className="text-sm sm:text-base text-gray-600">Make data-driven decisions with powerful analytics.</p>
            </div>
            <div className="p-5 sm:p-6 rounded-xl border border-gray-200 hover:border-orange-200 hover:shadow-lg transition-all">
              <Shield className="w-7 h-7 sm:w-8 sm:h-8 text-orange-500 mb-3 sm:mb-4" />
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">Security & Compliance</h3>
              <p className="text-sm sm:text-base text-gray-600">Enterprise-grade security and compliance features.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Plans Section */}
      <section id="pricing" className="py-16 sm:py-20 md:py-24 bg-gradient-to-br from-gray-50 to-orange-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-4 sm:mb-6">
              Choose the Perfect Plan for Your Business
            </h2>
            <p className="text-lg sm:text-xl text-gray-600 max-w-4xl mx-auto">
              From small teams to large enterprises, we have a plan that fits your needs
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 max-w-6xl mx-auto">
            {/* Free Plan */}
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden border-2 border-slate-200 hover:border-slate-300 transition-all duration-300 hover:shadow-2xl hover:-translate-y-2">
              <div className="bg-gradient-to-r from-slate-600 to-slate-700 p-6 text-white">
                <div className="flex items-center gap-3 mb-2">
                  <MessageSquare className="w-8 h-8 transition-transform duration-300 hover:scale-110" />
                  <h3 className="text-2xl font-bold">Free</h3>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold">₹0</span>
                  <span className="text-white/80">/month</span>
                </div>
                <p className="text-white/90 mt-2">Perfect for getting started</p>
              </div>

              <div className="p-6">
                <ul className="space-y-4 mb-6">
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">Basic issue reporting</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">Up to 5 complaints/month</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">Community support</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">Email notifications</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">Standard response (48-72h)</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">Basic complaint tracking</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">Mobile app access</span>
                  </li>
                </ul>

                <Link
                  to="/pricing"
                  className="w-full block text-center bg-slate-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-slate-700 hover:shadow-lg transition-all duration-200 transform hover:scale-105"
                >
                  Get Started Free
                </Link>
              </div>
            </div>

            {/* Pro Plan - Highlighted */}
            <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border-2 border-cyan-500 relative transform md:scale-105 transition-all duration-300 hover:shadow-3xl hover:-translate-y-2">
              <div className="absolute top-0 right-0 bg-cyan-600 text-white text-xs font-bold px-4 py-1 rounded-bl-lg">
                MOST POPULAR
              </div>

              <div className="bg-gradient-to-r from-cyan-500 to-teal-600 p-6 text-white">
                <div className="flex items-center gap-3 mb-2">
                  <Users className="w-8 h-8 transition-transform duration-300 hover:scale-110" />
                  <h3 className="text-2xl font-bold">Pro</h3>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold">₹499</span>
                  <span className="text-white/80">/month</span>
                </div>
                <p className="text-white/90 mt-2">For growing teams</p>
              </div>

              <div className="p-6">
                <ul className="space-y-4 mb-6">
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-teal-500 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700 font-medium">Everything in Free, plus:</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-teal-500 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">AI-powered diagnosis</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-teal-500 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">Unlimited complaints</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-teal-500 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">Live chat support</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-teal-500 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">Priority support (24h)</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-teal-500 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">Analytics dashboard</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-teal-500 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">Email & SMS notifications</span>
                  </li>
                </ul>

                <Link
                  to="/pricing"
                  className="w-full block text-center bg-teal-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-teal-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  Get Pro
                </Link>
              </div>
            </div>

            {/* Premium Plan */}
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden border-2 border-violet-200 hover:border-violet-300 transition-all duration-300 hover:shadow-2xl hover:-translate-y-2">
              <div className="bg-gradient-to-r from-violet-500 to-purple-600 p-6 text-white">
                <div className="flex items-center gap-3 mb-2">
                  <Shield className="w-8 h-8 transition-transform duration-300 hover:scale-110" />
                  <h3 className="text-2xl font-bold">Premium</h3>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold">₹999</span>
                  <span className="text-white/80">/month</span>
                </div>
                <p className="text-white/90 mt-2">For large enterprises</p>
              </div>

              <div className="p-6">
                <ul className="space-y-4 mb-6">
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-violet-500 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700 font-medium">Everything in Pro, plus:</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-violet-500 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">Video call support</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-violet-500 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">Team management (10 users)</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-violet-500 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">Real-time monitoring</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-violet-500 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">Advanced analytics</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-violet-500 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">Custom branding</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-violet-500 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">Dedicated account manager</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-violet-500 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">API access & integrations</span>
                  </li>
                </ul>

                <Link
                  to="/pricing"
                  className="w-full block text-center bg-violet-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-violet-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  Get Premium
                </Link>
              </div>
            </div>
          </div>

          {/* Feature Comparison Table */}
          <div className="mt-16 bg-white rounded-2xl shadow-xl overflow-hidden">
            <div className="p-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-8 text-center">Detailed Feature Comparison</h3>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b-2 border-gray-200">
                      <th className="text-left py-4 px-6 font-semibold text-gray-900">Feature</th>
                      <th className="text-center py-4 px-6 font-semibold text-slate-600">Free</th>
                      <th className="text-center py-4 px-6 font-semibold text-teal-600">Pro</th>
                      <th className="text-center py-4 px-6 font-semibold text-violet-600">Premium</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    <tr className="hover:bg-gray-50">
                      <td className="py-4 px-6 text-gray-700">Complaint Limit</td>
                      <td className="text-center py-4 px-6">5/month</td>
                      <td className="text-center py-4 px-6 text-teal-600 font-semibold">Unlimited</td>
                      <td className="text-center py-4 px-6 text-violet-600 font-semibold">Unlimited</td>
                    </tr>
                    <tr className="hover:bg-gray-50">
                      <td className="py-4 px-6 text-gray-700">AI Diagnosis</td>
                      <td className="text-center py-4 px-6">—</td>
                      <td className="text-center py-4 px-6"><CheckCircle className="w-5 h-5 text-teal-500 mx-auto" /></td>
                      <td className="text-center py-4 px-6"><CheckCircle className="w-5 h-5 text-violet-500 mx-auto" /></td>
                    </tr>
                    <tr className="hover:bg-gray-50">
                      <td className="py-4 px-6 text-gray-700">Live Chat Support</td>
                      <td className="text-center py-4 px-6">—</td>
                      <td className="text-center py-4 px-6"><CheckCircle className="w-5 h-5 text-teal-500 mx-auto" /></td>
                      <td className="text-center py-4 px-6"><CheckCircle className="w-5 h-5 text-violet-500 mx-auto" /></td>
                    </tr>
                    <tr className="hover:bg-gray-50">
                      <td className="py-4 px-6 text-gray-700">Video Call Support</td>
                      <td className="text-center py-4 px-6">—</td>
                      <td className="text-center py-4 px-6">—</td>
                      <td className="text-center py-4 px-6"><CheckCircle className="w-5 h-5 text-violet-500 mx-auto" /></td>
                    </tr>
                    <tr className="hover:bg-gray-50">
                      <td className="py-4 px-6 text-gray-700">Response Time</td>
                      <td className="text-center py-4 px-6 text-sm">48-72 hours</td>
                      <td className="text-center py-4 px-6 text-sm text-teal-600">24 hours</td>
                      <td className="text-center py-4 px-6 text-sm text-violet-600">Instant</td>
                    </tr>
                    <tr className="hover:bg-gray-50">
                      <td className="py-4 px-6 text-gray-700">Analytics Dashboard</td>
                      <td className="text-center py-4 px-6">—</td>
                      <td className="text-center py-4 px-6"><CheckCircle className="w-5 h-5 text-teal-500 mx-auto" /></td>
                      <td className="text-center py-4 px-6"><CheckCircle className="w-5 h-5 text-violet-500 mx-auto" /></td>
                    </tr>
                    <tr className="hover:bg-gray-50">
                      <td className="py-4 px-6 text-gray-700">Team Management</td>
                      <td className="text-center py-4 px-6">—</td>
                      <td className="text-center py-4 px-6">—</td>
                      <td className="text-center py-4 px-6 text-sm text-violet-600">Up to 10 users</td>
                    </tr>
                    <tr className="hover:bg-gray-50">
                      <td className="py-4 px-6 text-gray-700">Custom Branding</td>
                      <td className="text-center py-4 px-6">—</td>
                      <td className="text-center py-4 px-6">—</td>
                      <td className="text-center py-4 px-6"><CheckCircle className="w-5 h-5 text-violet-500 mx-auto" /></td>
                    </tr>
                    <tr className="hover:bg-gray-50">
                      <td className="py-4 px-6 text-gray-700">API Access</td>
                      <td className="text-center py-4 px-6">—</td>
                      <td className="text-center py-4 px-6">—</td>
                      <td className="text-center py-4 px-6"><CheckCircle className="w-5 h-5 text-violet-500 mx-auto" /></td>
                    </tr>
                    <tr className="hover:bg-gray-50">
                      <td className="py-4 px-6 text-gray-700">Real-time Alerts</td>
                      <td className="text-center py-4 px-6">—</td>
                      <td className="text-center py-4 px-6">—</td>
                      <td className="text-center py-4 px-6"><CheckCircle className="w-5 h-5 text-violet-500 mx-auto" /></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="text-center mt-12">
            <p className="text-gray-600 mb-4">
              Need a custom plan for your organization?
            </p>
            <button className="text-orange-500 font-semibold hover:text-orange-600 inline-flex items-center gap-2">
              Contact us for enterprise pricing
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* Testimonials - Auto-scrolling carousel */}
      <section id="reviews" className="py-12 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Join 73,000+ companies uncomplicating customer service
            </h2>
            <p className="text-xl text-gray-600 max-w-4xl mx-auto mb-8">
              Leaders across industries are transforming customer experiences with QuickFix
            </p>
          </div>

          {/* Auto-scrolling Testimonial Carousel Component */}
          <TestimonialCarousel autoScrollInterval={5000} />

          <div className="text-center mt-12">
            <Link
              to="/customers"
              className="inline-flex items-center gap-2 text-orange-500 font-semibold hover:text-orange-600 text-lg"
            >
              View all customer stories <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Resources Section */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Explore insights & resources on AI-powered customer service
            </h2>
            <p className="text-xl text-gray-600 max-w-4xl mx-auto">
              Real-world stories, practical insights, and tools to help you deliver modern, AI-powered customer service.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Resource Card 1 - Customer Service Report */}
            <div className="group cursor-pointer">
              <div className="bg-gradient-to-br from-orange-200 to-white-100 rounded-2xl p-8 mb-6 hover:shadow-xl transition-all duration-300">
                <img
                  src="exploreinsight.png"
                  alt="QuickFix Customer Service Benchmark Report 2025"
                  className="w-full h-auto rounded-lg"
                />
              </div>
              <div className="space-y-3">
                <span className="inline-block bg-green-200 text-green-800 text-xs font-semibold px-3 py-1 rounded-full">
                  Report
                </span>
                <h3 className="text-2xl font-bold text-gray-900">2025 Customer Service Report</h3>
                <p className="text-gray-600">
                  Evaluate your performance against industry competitors to see how you measure up.
                </p>
              </div>
            </div>

            {/* Resource Card 2 - Forrester TEI Study */}
            <div className="group cursor-pointer">
              <div className="bg-gradient-to-br from-orange-200 to--100 rounded-2xl p-8 mb-6 hover:shadow-xl transition-all duration-300">
                <img
                  src="exploreinsight2.png"
                  alt="The Total Economic Impact of QuickFix"
                  className="w-full h-auto rounded-lg"
                />
              </div>
              <div className="space-y-3">
                <span className="inline-block bg-orange-200 text-orange-800 text-xs font-semibold px-3 py-1 rounded-full">
                  Study
                </span>
                <h3 className="text-2xl font-bold text-gray-900">Forrester on the TEI of QuickFix</h3>
                <p className="text-gray-600">
                  See the Total Economic Impact™ of ticketing and conversational support in one with QuickFix.
                </p>
              </div>
            </div>

            {/* Resource Card 3 - CX Priorities Report */}
            <div className="group cursor-pointer">
              <div className="bg-gradient-to-br from-orange-200 to-white-100 rounded-2xl p-8 mb-6 hover:shadow-xl transition-all duration-300">
                <img
                  src="exploreinsight.png"
                  alt="The Total Economic Impact of QuickFix"
                  className="w-full h-auto rounded-lg"
                />
              </div>
              <div className="space-y-3">
                <span className="inline-block bg-orange-200 text-orange-800 text-xs font-semibold px-3 py-1 rounded-full">
                  Study
                </span>
                <h3 className="text-2xl font-bold text-gray-900">The Total Economic Impact of QuickFix</h3>
                <p className="text-gray-600">
                  See the Total Economic Impact™ of ticketing and conversational support with QuickFix's comprehensive solution.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-br from-orange-500 to-red-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Get Started with QuickFix
          </h2>

          <div className="grid md:grid-cols-3 gap-8 mt-16">
            <div className="bg-white/10 backdrop-blur-sm p-8 rounded-2xl">
              <h3 className="text-2xl font-bold mb-4">Free to Try, Fast to Scale</h3>
              <p className="text-white/90 mb-6">
                Experience the power of QuickFix with a free trial. No credit card required.
              </p>
              <Link
                to="/login"
                className="bg-white text-orange-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors inline-block"
              >
                Try it free
              </Link>
            </div>

            <div className="bg-white/10 backdrop-blur-sm p-8 rounded-2xl">
              <h3 className="text-2xl font-bold mb-4">See rapid impact in action</h3>
              <p className="text-white/90 mb-6">
                Let our product experts show you how QuickFix can solve your toughest challenges.
              </p>
              <button className="bg-white text-orange-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors">
                Book a demo
              </button>
            </div>

            <div className="bg-white/10 backdrop-blur-sm p-8 rounded-2xl">
              <h3 className="text-2xl font-bold mb-4">Learn, Explore, Get Inspired</h3>
              <p className="text-white/90 mb-6">
                Check out the interactive product tour to explore QuickFix's features and benefits.
              </p>
              <button className="bg-white text-orange-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors">
                Take the tour
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-8 mb-8 sm:mb-12">
            {/* Logo and Description */}
            <div className="lg:col-span-2">
              <div className="flex items-center space-x-2 mb-4 sm:mb-6">
                <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
                  <Shield className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl sm:text-2xl font-bold">QuickFix</span>
              </div>
              <p className="text-gray-300 mb-4 sm:mb-6 max-w-md text-sm sm:text-base">
                AI-powered complaint management system that revolutionizes customer service.
              </p>
              <div className="flex space-x-4">
                <a href="#" className="text-gray-400 hover:text-orange-400 transition-colors">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
                  </svg>
                </a>
                <a href="#" className="text-gray-400 hover:text-orange-400 transition-colors">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                  </svg>
                </a>
                <a href="#" className="text-gray-400 hover:text-orange-400 transition-colors">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.174-.105-.949-.199-2.403.041-3.439.219-.937 1.404-5.958 1.404-5.958s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.889 2.741.099.12.112.225.085.345-.09.375-.293 1.199-.334 1.363-.053.225-.172.271-.402.165-1.495-.69-2.433-2.878-2.433-4.646 0-3.776 2.748-7.252 7.92-7.252 4.158 0 7.392 2.967 7.392 6.923 0 4.135-2.607 7.462-6.233 7.462-1.214 0-2.357-.629-2.746-1.378l-.749 2.848c-.269 1.045-1.004 2.352-1.498 3.146 1.123.345 2.306.535 3.55.535 6.624 0 11.99-5.367 11.99-11.987C24.007 5.367 18.641.001.012.001z" />
                  </svg>
                </a>
                <a href="#" className="text-gray-400 hover:text-orange-400 transition-colors">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                  </svg>
                </a>
              </div>
            </div>

            {/* Products */}
            <div>
              <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">Products</h3>
              <ul className="space-y-2 sm:space-y-3">
                <li><a href="#" className="text-sm sm:text-base text-gray-300 hover:text-orange-400 transition-colors">QuickFix Helpdesk</a></li>
                <li><a href="#" className="text-sm sm:text-base text-gray-300 hover:text-orange-400 transition-colors">AI Chat Support</a></li>
                <li><a href="#" className="text-sm sm:text-base text-gray-300 hover:text-orange-400 transition-colors">Analytics Dashboard</a></li>
                <li><a href="#" className="text-sm sm:text-base text-gray-300 hover:text-orange-400 transition-colors">Mobile App</a></li>
                <li><a href="#" className="text-sm sm:text-base text-gray-300 hover:text-orange-400 transition-colors">API Integrations</a></li>
              </ul>
            </div>

            {/* Solutions */}
            <div>
              <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">Solutions</h3>
              <ul className="space-y-2 sm:space-y-3">
                <li><a href="#" className="text-sm sm:text-base text-gray-300 hover:text-orange-400 transition-colors">Customer Support</a></li>
                <li><a href="#" className="text-sm sm:text-base text-gray-300 hover:text-orange-400 transition-colors">IT Service Management</a></li>
                <li><a href="#" className="text-sm sm:text-base text-gray-300 hover:text-orange-400 transition-colors">Enterprise</a></li>
                <li><a href="#" className="text-sm sm:text-base text-gray-300 hover:text-orange-400 transition-colors">Small Business</a></li>
                <li><a href="#" className="text-sm sm:text-base text-gray-300 hover:text-orange-400 transition-colors">E-commerce</a></li>
              </ul>
            </div>

            {/* Company */}
            <div>
              <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">Company</h3>
              <ul className="space-y-2 sm:space-y-3">
                <li><a href="#" className="text-sm sm:text-base text-gray-300 hover:text-orange-400 transition-colors">About Us</a></li>
                <li><a href="#" className="text-sm sm:text-base text-gray-300 hover:text-orange-400 transition-colors">Careers</a></li>
                <li><a href="#" className="text-sm sm:text-base text-gray-300 hover:text-orange-400 transition-colors">Press & News</a></li>
                <li><a href="#" className="text-sm sm:text-base text-gray-300 hover:text-orange-400 transition-colors">Security</a></li>
                <li><a href="#" className="text-sm sm:text-base text-gray-300 hover:text-orange-400 transition-colors">Contact Us</a></li>
              </ul>
            </div>
          </div>

          {/* Bottom Section */}
          <div className="border-t border-gray-800 pt-6 sm:pt-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8 items-center">
              {/* Legal Links */}
              <div className="flex flex-wrap gap-4 sm:gap-6 justify-center lg:justify-start">
                <a href="#" className="text-gray-400 hover:text-orange-400 transition-colors text-xs sm:text-sm">Privacy Policy</a>
                <a href="#" className="text-gray-400 hover:text-orange-400 transition-colors text-xs sm:text-sm">Terms of Service</a>
                <a href="#" className="text-gray-400 hover:text-orange-400 transition-colors text-xs sm:text-sm">Cookie Policy</a>
                <a href="#" className="text-gray-400 hover:text-orange-400 transition-colors text-xs sm:text-sm">Accessibility</a>
                <button
                  onClick={() => window.dispatchEvent(new CustomEvent('openCookieSettings'))}
                  className="text-gray-400 hover:text-orange-400 transition-colors text-xs sm:text-sm"
                >
                  Manage Privacy Preferences
                </button>
              </div>

              {/* Copyright */}
              <div className="text-center order-first lg:order-none">
                <p className="text-gray-400 text-xs sm:text-sm">
                  2025 QuickFix Inc. All rights reserved.
                </p>
              </div>

              {/* App Store Links */}
              <div className="flex justify-center lg:justify-end space-x-3 sm:space-x-4">
                <a href="#" className="bg-gray-800 hover:bg-gray-700 transition-colors rounded-lg p-2 sm:p-3">
                  <img src="https://developer.apple.com/assets/elements/badges/download-on-the-app-store.svg" alt="Download on App Store" className="h-8 sm:h-10 md:h-12" />
                </a>
                <a href="#" className="bg-gray-800 hover:bg-gray-700 transition-colors rounded-lg p-2 sm:p-3">
                  <img src="https://play.google.com/intl/en_us/badges/static/images/badges/en_badge_web_generic.png" alt="Get it on Google Play" className="h-8 sm:h-10 md:h-12" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </footer>

      {/* Homepage Chatbot */}
      <HomePageChatBot />
    </div>
  );
}