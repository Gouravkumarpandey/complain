import { Link } from 'react-router-dom';
import { i18n } from '../../i18n';
import { ArrowRight, Users, MessageSquare, BarChart3, Shield, CheckCircle, Play, Globe } from 'lucide-react';
import TestimonialCarousel from './TestimonialCarousel';
import { Trans } from 'react-i18next';
import { useLanguage } from '../../contexts/LanguageContext';

export function HomePage() {
  const { locale, setLocale } = useLanguage();
  
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
              <span className="text-2xl font-bold text-gray-900">QuickFix</span>
              <span className="text-sm text-gray-500 ml-1">{i18n.t('ai_powered_support')}</span>
            </div>

            {/* Navigation Links */}
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-gray-600 hover:text-gray-900 font-medium">{i18n.t('features')}</a>
              <a href="#how-it-works" className="text-gray-600 hover:text-gray-900 font-medium">{i18n.t('how_it_works')}</a>
              <a href="#about" className="text-gray-600 hover:text-gray-900 font-medium">{i18n.t('about_us')}</a>
              
              {/* Language Selector */}
              <div className="relative group">
                <button className="flex items-center text-gray-600 hover:text-gray-900 border-r border-gray-200 pr-4 mr-2">
                  <Globe className="w-4 h-4 mr-1" />
                  <span className="text-sm">{locale.toUpperCase()}</span>
                </button>
                <div className="absolute right-0 top-full mt-2 w-36 bg-white rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-50">
                  <div className="py-1">
                    <button 
                      onClick={async () => {
                        console.log('HomePage: Switching to English');
                        try {
                          await setLocale('en');
                          console.log('HomePage: Switched to English successfully');
                        } catch (e) {
                          console.error('HomePage: Error switching to English:', e);
                        }
                      }}
                      className={`w-full text-left px-4 py-2 text-sm ${locale === 'en' ? 'bg-orange-50 text-orange-700 font-medium' : 'hover:bg-gray-100'}`}
                    >
                      🇬🇧 English
                    </button>
                    <button 
                      onClick={async () => {
                        console.log('HomePage: Switching to Spanish');
                        try {
                          await setLocale('es');
                          console.log('HomePage: Switched to Spanish successfully');
                        } catch (e) {
                          console.error('HomePage: Error switching to Spanish:', e);
                        }
                      }}
                      className={`w-full text-left px-4 py-2 text-sm ${locale === 'es' ? 'bg-orange-50 text-orange-700 font-medium' : 'hover:bg-gray-100'}`}
                    >
                      🇪🇸 Español
                    </button>
                    <button 
                      onClick={async () => {
                        console.log('HomePage: Switching to French');
                        try {
                          await setLocale('fr');
                          console.log('HomePage: Switched to French successfully');
                        } catch (e) {
                          console.error('HomePage: Error switching to French:', e);
                        }
                      }}
                      className={`w-full text-left px-4 py-2 text-sm ${locale === 'fr' ? 'bg-orange-50 text-orange-700 font-medium' : 'hover:bg-gray-100'}`}
                    >
                      🇫🇷 Français
                    </button>
                  </div>
                </div>
              </div>
              
              <Link
                to="/login"
                className="bg-orange-500 text-white px-6 py-2 rounded-lg font-semibold hover:bg-orange-600 transition-colors"
              >
                {i18n.t('get_started')}
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-16 pb-24 bg-gradient-to-br from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left side - Text content */}
            <div className="text-center lg:text-left">
              <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
                <Trans i18nKey="the_agentic_ai_solution_for_modern_customer_service">The agentic AI solution for modern <span className="text-orange-500">customer service</span></Trans>
              </h1>
              <p className="text-xl text-gray-600 mb-12 leading-relaxed">
                {i18n.t('with_quickfix_ai_agents_and_human_agents_work_as_one_resolvi')}
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mb-8">
                <Link
                  to="/login"
                  className="bg-orange-500 text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-orange-600 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                >
                  {i18n.t('try_it_free')}
                </Link>
                <button className="border-2 border-gray-300 text-gray-700 px-8 py-4 rounded-lg font-semibold text-lg hover:border-orange-500 hover:text-orange-500 transition-all duration-200 flex items-center justify-center gap-2">
                  <Play className="w-5 h-5" />
                  {i18n.t('book_a_demo')}
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
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent rounded-2xl"></div>
              </div>
            </div>
          </div>

          {/* Trust Bar - moved below hero content */}
          <div className="text-center mt-24">
            <p className="text-sm text-gray-500 mb-6">{i18n.t('trusted_by_73_000_businesses_worldwide')}</p>
            <div className="relative overflow-hidden">
              <div className="flex animate-scroll gap-8 items-center opacity-60">
                {/* First set of logos */}
                <img src="https://dam.freshworks.com/m/172addb8908823a/original/bridgestone-logo.webp" alt="Bridgestone" className="h-8 grayscale flex-shrink-0" />
                <img src="https://dam.freshworks.com/m/6b09343713112137/original/Tata-Digital-Trustbar-logo.webp" alt="Tata Digital" className="h-8 grayscale flex-shrink-0" />
                <img src="https://dam.freshworks.com/m/678dcfe0f3352df6/original/S-P-GLobal-Trustbar-logo.webp" alt="S&P Global" className="h-8 grayscale flex-shrink-0" />
                <img src="https://dam.freshworks.com/m/692895b671757fd/original/Klarna-Trustbar-Logo.webp" alt="Klarna" className="h-8 grayscale flex-shrink-0" />
                <img src="https://dam.freshworks.com/m/686b5fb695a93fdf/original/Forbes-Trustbar-logo.webp" alt="Forbes" className="h-8 grayscale flex-shrink-0" />
                <img src="https://dam.freshworks.com/m/65934d5b088a71e4/original/Pepsico-Trustbar-logo.webp" alt="PepsiCo" className="h-8 grayscale flex-shrink-0" />
                <img src="https://dam.freshworks.com/m/716392be1c61bd75/original/Ingram-Trustbar-logo.webp" alt="Ingram Micro" className="h-8 grayscale flex-shrink-0" />
                <img src="https://dam.freshworks.com/m/770b19ddd352c7cf/original/pearson-Trustbar-logo.webp" alt="Pearson" className="h-8 grayscale flex-shrink-0" />
                
                {/* Duplicate set for seamless loop */}
                <img src="https://dam.freshworks.com/m/172addb8908823a/original/bridgestone-logo.webp" alt="Bridgestone" className="h-8 grayscale flex-shrink-0" />
                <img src="https://dam.freshworks.com/m/6b09343713112137/original/Tata-Digital-Trustbar-logo.webp" alt="Tata Digital" className="h-8 grayscale flex-shrink-0" />
                <img src="https://dam.freshworks.com/m/678dcfe0f3352df6/original/S-P-GLobal-Trustbar-logo.webp" alt="S&P Global" className="h-8 grayscale flex-shrink-0" />
                <img src="https://dam.freshworks.com/m/692895b671757fd/original/Klarna-Trustbar-Logo.webp" alt="Klarna" className="h-8 grayscale flex-shrink-0" />
                <img src="https://dam.freshworks.com/m/686b5fb695a93fdf/original/Forbes-Trustbar-logo.webp" alt="Forbes" className="h-8 grayscale flex-shrink-0" />
                <img src="https://dam.freshworks.com/m/65934d5b088a71e4/original/Pepsico-Trustbar-logo.webp" alt="PepsiCo" className="h-8 grayscale flex-shrink-0" />
                <img src="https://dam.freshworks.com/m/716392be1c61bd75/original/Ingram-Trustbar-logo.webp" alt="Ingram Micro" className="h-8 grayscale flex-shrink-0" />
                <img src="https://dam.freshworks.com/m/770b19ddd352c7cf/original/pearson-Trustbar-logo.webp" alt="Pearson" className="h-8 grayscale flex-shrink-0" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Value Proposition */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              {i18n.t('seamless_support_smarter_agents_faster_resolutions')}
            </h2>
            <p className="text-xl text-gray-600 max-w-4xl mx-auto">
              {i18n.t('unify_every_channel_cut_the_noise_and_give_agents_an_easy_to')}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-16">
            <div className="text-center p-8 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50">
              <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <MessageSquare className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">{i18n.t('turn_email_tickets_into_instant_resolutions')}</h3>
              <p className="text-gray-600">
                {i18n.t('answer_email_queries_with_email_ai_agents_that_read_every_in')}
              </p>
            </div>

            <div className="text-center p-8 rounded-2xl bg-gradient-to-br from-green-50 to-emerald-50">
              <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <Users className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">{i18n.t('auto_resolve_issues_with_conversational_ai_agents')}</h3>
              <p className="text-gray-600">
                {i18n.t('deploy_intelligent_chatbots_that_understand_context_provide_')}
              </p>
            </div>

            <div className="text-center p-8 rounded-2xl bg-gradient-to-br from-purple-50 to-violet-50">
              <div className="w-16 h-16 bg-purple-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <BarChart3 className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">{i18n.t('empower_support_teams_with_intelligent_assistance')}</h3>
              <p className="text-gray-600">
                {i18n.t('give_your_human_agents_ai_powered_insights_suggested_respons')}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Video Section */}
      <section className="py-24 bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              {i18n.t('see_quickfix_in_action')}
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              {i18n.t('watch_how_our_ai_powered_complaint_management_system_transfo')}
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
            <div className="text-center mt-8">
              <p className="text-gray-600 text-lg">
                  {i18n.t('discover_how_quickfix_revolutionizes_customer_support_with_i')}
                </p>
            </div>
          </div>
        </div>
      </section>

      {/* AI Section */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              {i18n.t('meet_freddy_ai')}
            </h2>
            <p className="text-xl text-gray-600 max-w-4xl mx-auto mb-8">
              {i18n.t('from_ai_agents_that_resolve_routine_queries_instantly_to_ai_')}
            </p>
            <Link
              to="/login"
              className="inline-flex items-center gap-2 text-orange-500 font-semibold hover:text-orange-600"
            >
              Learn more <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Freddy AI Video */}
          <div className="max-w-4xl mx-auto mb-16">
            <div className="relative rounded-2xl overflow-hidden shadow-2xl">
              <video 
                className="w-full h-auto" 
                controls 
                autoPlay 
                loop 
                muted
                poster="/videos/freddy-ai-poster.jpg"
              >
                <source 
                  src="https://dam.freshworks.com/m/3f4f0cf65ec45bed/original/AI-Agent_X2-50.webm" 
                  type="video/webm" 
                />
                Your browser does not support the video tag.
              </video>
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none rounded-2xl"></div>
            </div>
            <p className="text-center text-gray-500 mt-4">Freddy AI agents handling customer queries in real-time</p>
          </div>

          {/* Stats with colored cards like image */}
          <div className="mt-12 mb-4">
            <h3 className="text-2xl font-bold text-blue-600 text-center mb-6">
              {i18n.t('industry_leading_results_with_quickfix')}
            </h3>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* 83% Card - Mint Green */}
            <div className="bg-green-100 rounded-xl p-8 flex flex-col justify-center">
              <div className="text-6xl font-bold text-gray-900 mb-4">83%</div>
              <div className="text-lg text-gray-700">{i18n.t('reduction_in_response_times')}</div>
            </div>
            
            {/* <2 mins Card - Light Purple */}
            <div className="bg-purple-50 rounded-xl p-8 flex flex-col justify-center">
              <div className="text-6xl font-bold text-gray-900 mb-4">&lt;2 mins</div>
              <div className="text-lg text-gray-700">{i18n.t('average_conversational_resolution_time')}</div>
            </div>
            
            {/* 97% Card - Cream */}
            <div className="bg-yellow-50 rounded-xl p-8 flex flex-col justify-center">
              <div className="text-6xl font-bold text-gray-900 mb-4">97%</div>
              <div className="text-lg text-gray-700">{i18n.t('omnichannel_first_contact_resolution_rate')}</div>
            </div>
            
            {/* 60% Card - Light Pink */}
            <div className="bg-red-50 rounded-xl p-8 flex flex-col justify-center">
              <div className="text-6xl font-bold text-gray-900 mb-4">60%</div>
              <div className="text-lg text-gray-700">{i18n.t('improved_agent_productivity_with_freddy_ai_copilot')}</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              {i18n.t('the_full_customer_service_experience')}
            </h2>
            <p className="text-xl text-gray-600 max-w-4xl mx-auto mb-10">
              {i18n.t('everything_you_need_to_support_customers_and_empower_teams_a')}
            </p>
            
            {/* Customer Experience Video */}
            <div className="max-w-4xl mx-auto mb-16">
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
              <p className="text-center text-gray-500 mt-4">See how AI-assisted resolutions enhance the customer experience</p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="p-6 rounded-xl border border-gray-200 hover:border-orange-200 hover:shadow-lg transition-all">
              <MessageSquare className="w-8 h-8 text-orange-500 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{i18n.t('chat_and_voice')}</h3>
              <p className="text-gray-600">{i18n.t('connect_seamlessly_across_chat_and_voice_channels')}</p>
            </div>
            <div className="p-6 rounded-xl border border-gray-200 hover:border-orange-200 hover:shadow-lg transition-all">
              <Users className="w-8 h-8 text-orange-500 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{i18n.t('self_service')}</h3>
              <p className="text-gray-600">{i18n.t('empower_customers_with_comprehensive_self_service_options')}</p>
            </div>
            <div className="p-6 rounded-xl border border-gray-200 hover:border-orange-200 hover:shadow-lg transition-all">
              <BarChart3 className="w-8 h-8 text-orange-500 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{i18n.t('unified_context')}</h3>
              <p className="text-gray-600">{i18n.t('get_complete_customer_context_across_all_touchpoints')}</p>
            </div>
            <div className="p-6 rounded-xl border border-gray-200 hover:border-orange-200 hover:shadow-lg transition-all">
              <CheckCircle className="w-8 h-8 text-orange-500 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{i18n.t('advanced_workflows')}</h3>
              <p className="text-gray-600">{i18n.t('automate_complex_processes_with_intelligent_workflows')}</p>
            </div>
            <div className="p-6 rounded-xl border border-gray-200 hover:border-orange-200 hover:shadow-lg transition-all">
              <BarChart3 className="w-8 h-8 text-orange-500 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{i18n.t('analytics_and_insights')}</h3>
              <p className="text-gray-600">{i18n.t('make_data_driven_decisions_with_powerful_analytics')}</p>
            </div>
            <div className="p-6 rounded-xl border border-gray-200 hover:border-orange-200 hover:shadow-lg transition-all">
              <Shield className="w-8 h-8 text-orange-500 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{i18n.t('security_compliance')}</h3>
              <p className="text-gray-600">{i18n.t('enterprise_grade_security_and_compliance_features')}</p>
            </div>
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
              {i18n.t('get_started_with_quickfix')}
            </h2>
          
          <div className="grid md:grid-cols-3 gap-8 mt-16">
            <div className="bg-white/10 backdrop-blur-sm p-8 rounded-2xl">
              <h3 className="text-2xl font-bold mb-4">{i18n.t('free_to_try_fast_to_scale')}</h3>
              <p className="text-white/90 mb-6">
                {i18n.t('experience_the_power_of_quickfix_with_a_free_trial_no_credit')}
              </p>
              <Link
                to="/login"
                className="bg-white text-orange-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors inline-block"
              >
                Try it free
              </Link>
            </div>

            <div className="bg-white/10 backdrop-blur-sm p-8 rounded-2xl">
              <h3 className="text-2xl font-bold mb-4">{i18n.t('see_rapid_impact_in_action')}</h3>
              <p className="text-white/90 mb-6">
                {i18n.t('let_our_product_experts_show_you_how_quickfix_can_solve_your')}
              </p>
              <button className="bg-white text-orange-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors">
                Book a demo
              </button>
            </div>

            <div className="bg-white/10 backdrop-blur-sm p-8 rounded-2xl">
              <h3 className="text-2xl font-bold mb-4">{i18n.t('learn_explore_get_inspired')}</h3>
              <p className="text-white/90 mb-6">
                {i18n.t('check_out_the_interactive_product_tour_to_explore_quickfix_s')}
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
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
                {i18n.t('ai_powered_complaint_management_system_that_revolutionizes_c')}
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
                    <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.174-.105-.949-.199-2.403.041-3.439.219-.937 1.404-5.958 1.404-5.958s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.889 2.741.099.12.112.225.085.345-.09.375-.293 1.199-.334 1.363-.053.225-.172.271-.402.165-1.495-.69-2.433-2.878-2.433-4.646 0-3.776 2.748-7.252 7.92-7.252 4.158 0 7.392 2.967 7.392 6.923 0 4.135-2.607 7.462-6.233 7.462-1.214 0-2.357-.629-2.746-1.378l-.749 2.848c-.269 1.045-1.004 2.352-1.498 3.146 1.123.345 2.306.535 3.55.535 6.624 0 11.99-5.367 11.99-11.987C24.007 5.367 18.641.001.012.001z"/>
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
              <h3 className="text-lg font-semibold mb-4">{i18n.t('products')}</h3>
              <ul className="space-y-3">
                <li><a href="#" className="text-gray-300 hover:text-orange-400 transition-colors">{i18n.t('quickfix_helpdesk')}</a></li>
                <li><a href="#" className="text-gray-300 hover:text-orange-400 transition-colors">{i18n.t('ai_chat_support')}</a></li>
                <li><a href="#" className="text-gray-300 hover:text-orange-400 transition-colors">{i18n.t('analytics_dashboard')}</a></li>
                <li><a href="#" className="text-gray-300 hover:text-orange-400 transition-colors">{i18n.t('mobile_app')}</a></li>
                <li><a href="#" className="text-gray-300 hover:text-orange-400 transition-colors">{i18n.t('api_integrations')}</a></li>
              </ul>
            </div>

            {/* Solutions */}
            <div>
              <h3 className="text-lg font-semibold mb-4">{i18n.t('solutions')}</h3>
              <ul className="space-y-3">
                <li><a href="#" className="text-gray-300 hover:text-orange-400 transition-colors">{i18n.t('customer_support')}</a></li>
                <li><a href="#" className="text-gray-300 hover:text-orange-400 transition-colors">{i18n.t('it_service_management')}</a></li>
                <li><a href="#" className="text-gray-300 hover:text-orange-400 transition-colors">{i18n.t('enterprise')}</a></li>
                <li><a href="#" className="text-gray-300 hover:text-orange-400 transition-colors">{i18n.t('small_business')}</a></li>
                <li><a href="#" className="text-gray-300 hover:text-orange-400 transition-colors">{i18n.t('e_commerce')}</a></li>
              </ul>
            </div>

            {/* Company */}
            <div>
              <h3 className="text-lg font-semibold mb-4">{i18n.t('company')}</h3>
              <ul className="space-y-3">
                <li><a href="#" className="text-gray-300 hover:text-orange-400 transition-colors">{i18n.t('about_us_1')}</a></li>
                <li><a href="#" className="text-gray-300 hover:text-orange-400 transition-colors">{i18n.t('careers')}</a></li>
                <li><a href="#" className="text-gray-300 hover:text-orange-400 transition-colors">{i18n.t('press_news')}</a></li>
                <li><a href="#" className="text-gray-300 hover:text-orange-400 transition-colors">{i18n.t('security')}</a></li>
                <li><a href="#" className="text-gray-300 hover:text-orange-400 transition-colors">{i18n.t('contact_us')}</a></li>
              </ul>
            </div>
          </div>

          {/* Bottom Section */}
          <div className="border-t border-gray-800 pt-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-center">
              {/* Legal Links */}
              <div className="flex flex-wrap gap-6">
                <a href="#" className="text-gray-400 hover:text-orange-400 transition-colors text-sm">{i18n.t('privacy_policy')}</a>
                <a href="#" className="text-gray-400 hover:text-orange-400 transition-colors text-sm">{i18n.t('terms_of_service')}</a>
                <a href="#" className="text-gray-400 hover:text-orange-400 transition-colors text-sm">{i18n.t('cookie_policy')}</a>
                <a href="#" className="text-gray-400 hover:text-orange-400 transition-colors text-sm">{i18n.t('accessibility')}</a>
              </div>

              {/* Copyright */}
              <div className="text-center">
                <p className="text-gray-400 text-sm">
                  {i18n.t('2025_quickfix_inc_all_rights_reserved')}
                </p>
              </div>

              {/* App Store Links - LARGER ICONS */}
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
    </div>
  );
}