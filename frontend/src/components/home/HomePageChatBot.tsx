import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Bot, Mic, MicOff, Volume2, VolumeX } from 'lucide-react';
import { GoogleGenerativeAI } from '@google/generative-ai';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

// Initialize Gemini AI
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

interface QuickReply {
  text: string;
  response: string;
}

const quickReplies: QuickReply[] = [
  {
    text: "What is QuickFix?",
    response: "QuickFix is an enterprise-grade AI-powered complaint management system that leverages artificial intelligence to enhance customer support operations. We provide real-time complaint tracking, intelligent ticket assignment, automated responses, sentiment analysis, and multi-channel communication."
  },
  {
    text: "How does it work?",
    response: "It's simple! 1️⃣ Customers submit complaints through our platform. 2️⃣ Our AI analyzes, categorizes, and performs sentiment analysis. 3️⃣ Complaints are automatically assigned to available agents via AWS SNS/SQS. 4️⃣ Real-time tracking with Socket.IO keeps everyone informed. 5️⃣ Get insights with powerful analytics and reports!"
  },
  {
    text: "What are the pricing plans?",
    response: "We offer three plans:\n\n🎁 **Free Plan** - ₹0/month\n• Up to 5 complaints/month\n• Basic tracking\n• Email notifications\n\n⚡ **Pro Plan** - ₹499/month\n• Unlimited complaints\n• AI-powered diagnosis\n• Priority support (24h)\n• Analytics dashboard\n\n👑 **Premium Plan** - ₹999/month\n• Everything in Pro\n• Team management (10 users)\n• Advanced analytics\n• Custom branding\n• Dedicated account manager"
  },
  {
    text: "What features do you offer?",
    response: "Key features include:\n\n🤖 **AI Capabilities** - Automated classification, sentiment analysis, smart reply generation, text summarization\n\n📊 **Real-time Dashboard** - Monitor all complaints with WebSocket updates\n\n🔔 **Multi-Channel Notifications** - Email, SMS, WhatsApp, and in-app alerts\n\n👥 **Team Collaboration** - Intelligent ticket assignment and agent management\n\n📈 **Analytics & Reports** - Detailed insights and performance metrics\n\n🔒 **Enterprise Security** - JWT authentication, role-based access, encryption"
  },
  {
    text: "What technologies do you use?",
    response: "QuickFix is built with modern tech:\n\nFrontend: React 18, TypeScript, Material-UI, Tailwind CSS, Socket.IO\n\nBackend: Node.js, Express, MongoDB, Redis, AWS SNS/SQS\n\nAI Service: Python FastAPI, Transformers, PyTorch, Google Gemini\n\nIntegrations: Stripe payments, Twilio SMS, WhatsApp API, OAuth (Google/Facebook)"
  },
  {
    text: "How do I get started?",
    response: "Getting started is easy! Just click the **'Get Started Free'** button at the top of the page to create your account. You'll be up and running in less than 2 minutes. No credit card needed for the free plan. Once registered, you can immediately start submitting complaints and exploring all the features!"
  }
];

export function HomePageChatBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: "👋 Hi! I'm the QuickFix Assistant. I can answer questions about our AI-powered complaint management system and search the web for any additional information you need. What would you like to know?",
      sender: 'bot',
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [showQuickReplies, setShowQuickReplies] = useState(true);

  // Voice input states
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);
  const [detectedLanguage, setDetectedLanguage] = useState('en-US');

  // Text-to-speech states
  const [isSpeechEnabled, setIsSpeechEnabled] = useState(true);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const getBotResponse = async (userMessage: string): Promise<string> => {
    const lowerMessage = userMessage.toLowerCase();

    // Check for exact quick reply match first
    const quickReply = quickReplies.find(qr =>
      qr.text.toLowerCase() === lowerMessage
    );
    if (quickReply) return quickReply.response;

    // Use Gemini AI with Google Search grounding for intelligent responses
    try {
      const model = genAI.getGenerativeModel({
        model: 'gemini-2.0-flash-exp',
        tools: [{ googleSearch: {} }] // Enable Google Search grounding
      });

      const systemContext = `You are a helpful AI assistant for QuickFix, an enterprise-grade AI-powered complaint management system.

COMPREHENSIVE PROJECT INFORMATION:

🎯 OVERVIEW:
QuickFix is an enterprise-grade complaint management system that leverages artificial intelligence to enhance customer support operations. The platform provides real-time complaint tracking, intelligent ticket assignment, automated responses, sentiment analysis, and multi-channel communication. It is designed for scalability, security, and operational efficiency.

🏗️ SYSTEM ARCHITECTURE:
- Microservices architecture with event-driven design
- Frontend: React 18.3.1 + TypeScript + Vite + Material-UI + Tailwind CSS
- Backend API: Node.js 18+ + Express.js 4.18.2 + Socket.IO 4.8.1
- Database: MongoDB (Mongoose 7.5.0) + Redis 5.10.0 (caching)
- AI Service: Python FastAPI + Transformers + PyTorch + Sentence Transformers
- Event Processing: AWS SNS/SQS for asynchronous ticket assignment
- Authentication: JWT 9.0.2 + Passport.js 0.7.0 (OAuth - Google/Facebook)
- Payments: Stripe 17.5.0 integration
- Notifications: Nodemailer 7.0.12, Twilio SMS, WhatsApp Business API
- Real-time: Socket.IO for bidirectional WebSocket communication

✨ KEY FEATURES:

For Users:
- Submit complaints through user-friendly interface
- Real-time complaint status tracking
- Live chat support via integrated chatbot
- Multi-channel notifications (email, SMS, WhatsApp, in-app)
- Feedback system with ratings
- Personal dashboard with complaint history

For Agents:
- Manage and resolve assigned complaints
- AI-generated reply suggestions
- Performance metrics and analytics
- Real-time communication with users
- Automatic ticket assignment based on availability
- Comprehensive analytics dashboard

For Administrators:
- User, agent, and role management
- System analytics and performance monitoring
- Configuration and settings management
- Detailed report generation
- Subscription and billing management (Stripe)

🤖 AI CAPABILITIES:
- Automated complaint classification (product, billing, technical, etc.)
- Sentiment analysis for urgency detection (angry, neutral, happy)
- AI-powered response suggestions using Google Gemini and DeepSeek
- Text summarization for complaint summaries
- Semantic search and similarity matching with embeddings
- Dialogflow and Rasa chatbot integration
- Multi-language support with automatic detection

💰 PRICING PLANS:

1. Free Plan - ₹0/month
   - Up to 5 complaints/month
   - Basic tracking
   - Email notifications
   - Standard response time (48-72h)

2. Pro Plan - ₹499/month
   - Unlimited complaints
   - AI-powered diagnosis and classification
   - Priority support (24h response)
   - Analytics dashboard
   - Live chat support
   - SMS notifications

3. Premium Plan - ₹999/month
   - Everything in Pro
   - Team management (up to 10 users)
   - Advanced analytics and custom reports
   - Custom branding
   - Dedicated account manager
   - Video call support
   - Full API access
   - WhatsApp integration

🔄 EVENT-DRIVEN WORKFLOW:

Ticket Creation Flow:
1. User submits complaint via frontend
2. Backend API saves to MongoDB
3. Publishes "ticket.created" event to AWS SNS
4. SNS forwards to SQS Queue
5. Worker polls SQS and finds available agent
6. Assigns ticket and marks agent as BUSY
7. Sends real-time notification via Socket.IO

Ticket Resolution Flow:
1. Agent marks complaint as resolved
2. API updates MongoDB
3. Publishes "ticket.resolved" event to SNS
4. Worker marks agent as FREE
5. Auto-assigns next pending ticket if available
6. Sends notifications to user and agent

🔒 SECURITY FEATURES:
- JWT-based authentication with token expiration
- Role-based access control (User, Agent, Admin)
- Bcrypt password hashing with salt
- API rate limiting to prevent abuse
- Helmet.js for security headers (CSP, XSS protection)
- CORS configuration
- Input validation with Joi schemas
- MongoDB injection prevention via Mongoose ORM
- GDPR compliant data handling
- Regular security audits

🛠️ TECHNOLOGY STACK:

Frontend:
- React 18.3.1, TypeScript, Vite
- Material-UI 7.3.4, Tailwind CSS
- React Router 7.9.1, Axios 1.12.2
- Socket.IO Client 4.8.1
- Recharts 3.4.1 (data visualization)
- Lucide React 0.344.0 (icons)

Backend:
- Node.js 18+, Express.js 4.18.2
- MongoDB, Mongoose 7.5.0
- Redis 5.10.0, Socket.IO 4.8.1
- JWT 9.0.2, Passport.js 0.7.0
- Stripe 17.5.0, Nodemailer 7.0.12
- AWS SDK 3.971.0 (SNS/SQS)

AI/ML:
- FastAPI 0.68.0+, Uvicorn 0.15.0+
- Transformers 4.30.0+, PyTorch 2.0.0+
- Sentence Transformers 2.2.2+
- Google Generative AI (Gemini)
- DeepSeek LLM integration

DevOps:
- Docker, Docker Compose
- AWS SNS/SQS
- Vercel (frontend deployment)
- GitHub (version control)

📊 ANALYTICS & REPORTING:
- Real-time performance metrics
- Complaint resolution time tracking
- Agent performance statistics
- Customer satisfaction ratings
- Sentiment analysis trends
- Category-wise complaint distribution
- Custom report generation

🌐 INTEGRATIONS:
- OAuth: Google, Facebook login
- Payment: Stripe for subscriptions
- Communication: Twilio SMS, WhatsApp Business API
- Email: Nodemailer with SMTP
- Future: Slack, Jira, Zendesk integrations

🚀 GETTING STARTED:
1. Click "Get Started Free" button
2. Register with email or OAuth (Google/Facebook)
3. Email verification with OTP
4. Access dashboard immediately
5. Start submitting complaints
6. No credit card required for Free plan
7. 14-day money-back guarantee on paid plans

IMPORTANT INSTRUCTIONS:
- Answer questions about QuickFix comprehensively using the above information
- If the user asks about something not covered in QuickFix details, use Google Search to find accurate information
- For technical questions, architecture details, or specific features, refer to the detailed information above
- Keep responses conversational, friendly, and helpful
- Use plain text formatting (no asterisks or markdown)
- Use emojis sparingly for visual appeal
- If you use Google Search, clearly indicate that you're providing web search results

Your role is to be an expert assistant on QuickFix and help users with any questions they have, using Google Search when needed for topics beyond QuickFix.`;

      const prompt = `${systemContext}\n\nUser Question: ${userMessage}\n\nProvide a helpful, comprehensive response. If the question is about QuickFix, use the detailed information provided above. If it's about something else or requires current information, use Google Search to provide accurate results. Use plain text only (no asterisks or markdown formatting):`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      return text || "I'm here to help! Could you please rephrase your question?";
    } catch (error) {
      console.error('Gemini API error:', error);

      // Fallback to pattern matching if API fails
      if (lowerMessage.includes('what is') || lowerMessage.includes('about quickfix')) {
        return quickReplies[0].response;
      }

      if (lowerMessage.includes('how') && (lowerMessage.includes('work') || lowerMessage.includes('use'))) {
        return quickReplies[1].response;
      }

      if (lowerMessage.includes('price') || lowerMessage.includes('cost') || lowerMessage.includes('plan')) {
        return quickReplies[2].response;
      }

      if (lowerMessage.includes('feature')) {
        return quickReplies[3].response;
      }

      if (lowerMessage.includes('trial') || lowerMessage.includes('free')) {
        return quickReplies[4].response;
      }

      if (lowerMessage.includes('start') || lowerMessage.includes('sign up') || lowerMessage.includes('register')) {
        return quickReplies[5].response;
      }

      // Default fallback response
      return "I'm here to help you learn about QuickFix! You can ask me about our features, pricing, how it works, or anything else. What would you like to know?";
    }
  };

  // Initialize speech recognition
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = detectedLanguage;

      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInputValue(prev => prev ? `${prev} ${transcript}` : transcript);
        setIsListening(false);
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [detectedLanguage]);

  // Text-to-speech function
  const speakText = (text: string, language: string = detectedLanguage) => {
    if (!isSpeechEnabled || !('speechSynthesis' in window)) return;

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = language;
    utterance.rate = 0.9;
    utterance.pitch = 1;
    utterance.volume = 1;

    window.speechSynthesis.speak(utterance);
  };

  // Toggle voice input
  const toggleVoiceInput = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.start();
          setIsListening(true);
        } catch (e) {
          console.error('Start recognition error:', e);
        }
      } else {
        alert('Speech recognition is not supported in this browser.');
      }
    }
  };

  // Detect language from user input
  const detectLanguage = (text: string): string => {
    // Simple language detection based on character sets
    const hasHindi = /[\u0900-\u097F]/.test(text);
    const hasArabic = /[\u0600-\u06FF]/.test(text);
    const hasChinese = /[\u4E00-\u9FFF]/.test(text);
    const hasJapanese = /[\u3040-\u309F\u30A0-\u30FF]/.test(text);
    const hasKorean = /[\uAC00-\uD7AF]/.test(text);
    const hasSpanish = /[áéíóúñ¿¡]/i.test(text);
    const hasFrench = /[àâäçèéêëîïôùûü]/i.test(text);
    const hasGerman = /[äöüß]/i.test(text);

    if (hasHindi) return 'hi-IN';
    if (hasArabic) return 'ar-SA';
    if (hasChinese) return 'zh-CN';
    if (hasJapanese) return 'ja-JP';
    if (hasKorean) return 'ko-KR';
    if (hasSpanish) return 'es-ES';
    if (hasFrench) return 'fr-FR';
    if (hasGerman) return 'de-DE';

    return 'en-US'; // Default to English
  };

  const handleSendMessage = async (text?: string) => {
    const messageText = text || inputValue.trim();
    if (!messageText) return;

    // Detect and set language from user input
    const userLang = detectLanguage(messageText);
    setDetectedLanguage(userLang);

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      text: messageText,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setShowQuickReplies(false);
    setIsTyping(true);

    // Simulate bot typing delay
    await new Promise(resolve => setTimeout(resolve, 500));

    // Add bot response using AI
    const botResponse = await getBotResponse(messageText);
    const botMessage: Message = {
      id: (Date.now() + 1).toString(),
      text: botResponse,
      sender: 'bot',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, botMessage]);
    setIsTyping(false);

    // Speak the bot response in the detected language
    speakText(botResponse, userLang);
  };

  const handleQuickReply = (reply: QuickReply) => {
    handleSendMessage(reply.text);
  };

  return (
    <>
      {/* Chat Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 w-16 h-16 bg-gradient-to-r from-orange-500 to-orange-600 rounded-full shadow-2xl hover:shadow-orange-300 hover:scale-110 transition-all duration-300 flex items-center justify-center z-50 group"
          aria-label="Open chat"
        >
          <MessageCircle className="w-7 h-7 text-white" />

          {/* Tooltip */}
          <div className="absolute bottom-full right-0 mb-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-xl">
            Have questions? Chat with us!
            <div className="absolute top-full right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
          </div>
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 w-96 h-[600px] bg-white rounded-2xl shadow-2xl flex flex-col z-50 overflow-hidden border border-gray-200">
          {/* Header */}
          <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
                <Bot className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <h3 className="text-white font-semibold">QuickFix Assistant</h3>
                <p className="text-orange-100 text-xs">Ask me anything about QuickFix</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-white hover:bg-white/20 p-2 rounded-lg transition-colors"
              aria-label="Close chat"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-3 ${message.sender === 'user'
                    ? 'bg-orange-500 text-white rounded-br-none'
                    : 'bg-white text-gray-800 rounded-bl-none shadow-sm border border-gray-100'
                    }`}
                >
                  <p className="text-sm whitespace-pre-line leading-relaxed">{message.text}</p>
                  <p className={`text-xs mt-1 ${message.sender === 'user' ? 'text-orange-100' : 'text-gray-400'
                    }`}>
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))}

            {/* Typing Indicator */}
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-white rounded-2xl rounded-bl-none px-4 py-3 shadow-sm border border-gray-100">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            )}

            {/* Quick Replies */}
            {showQuickReplies && !isTyping && (
              <div className="space-y-2 pt-2">
                <p className="text-xs text-gray-500 font-medium px-1">Quick questions:</p>
                {quickReplies.map((reply, index) => (
                  <button
                    key={index}
                    onClick={() => handleQuickReply(reply)}
                    className="w-full text-left px-4 py-2.5 bg-white border border-orange-200 hover:border-orange-400 hover:bg-orange-50 rounded-xl text-sm text-gray-700 transition-all"
                  >
                    {reply.text}
                  </button>
                ))}
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 bg-white border-t border-gray-200">
            <div className="flex gap-2 items-center">
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Type or speak your question..."
                  className="w-full pl-4 pr-12 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
                {/* Voice Input Button */}
                <button
                  onClick={toggleVoiceInput}
                  className={`absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full transition-all ${isListening
                    ? 'text-red-500 bg-red-50 animate-pulse'
                    : 'text-gray-400 hover:text-orange-500 hover:bg-orange-50'
                    }`}
                  title={isListening ? "Stop listening" : "Voice input"}
                >
                  {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                </button>
              </div>

              {/* Speech Toggle Button */}
              <button
                onClick={() => setIsSpeechEnabled(!isSpeechEnabled)}
                className={`p-2.5 rounded-xl transition-colors ${isSpeechEnabled
                  ? 'bg-orange-100 text-orange-600 hover:bg-orange-200'
                  : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                  }`}
                title={isSpeechEnabled ? "Voice responses ON" : "Voice responses OFF"}
              >
                {isSpeechEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
              </button>

              {/* Send Button */}
              <button
                onClick={() => handleSendMessage()}
                disabled={!inputValue.trim()}
                className="bg-orange-500 text-white p-2.5 rounded-xl hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Send message"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-2 text-center">
              Powered by QuickFix AI • Speak in any language
            </p>
          </div>
        </div>
      )}
    </>
  );
}

export default HomePageChatBot;
