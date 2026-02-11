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
    response: "QuickFix is an AI-powered complaint management system that helps businesses efficiently manage and resolve customer complaints. We use artificial intelligence to automatically categorize, prioritize, and suggest solutions for incoming complaints, making the support process faster and more efficient."
  },
  {
    text: "How does it work?",
    response: "It's simple! 1️⃣ Customers submit complaints through our platform. 2️⃣ Our AI analyzes and categorizes each complaint. 3️⃣ Complaints are automatically assigned to the right team. 4️⃣ Real-time tracking keeps everyone informed. 5️⃣ Get insights with powerful analytics. Our intelligent system reduces response time by up to 70%!"
  },
  {
    text: "What are the pricing plans?",
    response: "We offer three plans:\n\n🎁 **Free Plan** - ₹0/month\n• Up to 5 complaints/month\n• Basic tracking\n• Email notifications\n\n⚡ **Pro Plan** - ₹499/month\n• Unlimited complaints\n• AI-powered diagnosis\n• Priority support (24h)\n• Analytics dashboard\n\n👑 **Premium Plan** - ₹999/month\n• Everything in Pro\n• Team management (10 users)\n• Advanced analytics\n• Custom branding\n• Dedicated account manager"
  },
  {
    text: "What features do you offer?",
    response: "Key features include:\n\n🤖 **AI-Powered Analysis** - Automatic complaint categorization and sentiment analysis\n\n📊 **Real-time Dashboard** - Monitor all complaints in one place\n\n🔔 **Smart Notifications** - Get instant alerts via email, SMS, or push notifications\n\n👥 **Team Collaboration** - Assign and track complaints across your team\n\n📈 **Analytics & Reports** - Gain insights with detailed analytics\n\n🔒 **Secure & Compliant** - Enterprise-grade security\n\n🌐 **Multi-language Support** - Serve customers in their language"
  },
  {
    text: "Is there a free trial?",
    response: "Yes! You can start with our **Free Plan** immediately - no credit card required. This gives you access to basic features and up to 5 complaints per month. When you're ready to unlock more power, you can upgrade to Pro or Premium at any time. We also offer a 14-day money-back guarantee on paid plans!"
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
      text: "👋 Hi! I'm the QuickFix Assistant. I'm here to help you learn about our AI-powered complaint management system. What would you like to know?",
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
  const [isSpeaking, setIsSpeaking] = useState(false);

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

    // Use Gemini AI for intelligent responses
    try {
      const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

      const systemContext = `You are a helpful AI assistant for QuickFix, an AI-powered complaint management system. 

ABOUT QUICKFIX:
QuickFix is a cutting-edge complaint management platform that uses artificial intelligence to help businesses efficiently manage and resolve customer complaints.

KEY FEATURES:
- AI-powered automatic complaint categorization and sentiment analysis
- Real-time dashboard for monitoring all complaints
- Smart notifications (email, SMS, push)
- Team collaboration and assignment system
- Advanced analytics and reporting
- Multi-language support
- Enterprise-grade security (GDPR compliant)
- API and integrations (Slack, Jira, Zendesk)
- Mobile-responsive design with upcoming native apps

PRICING PLANS:
1. Free Plan - ₹0/month
   - Up to 5 complaints/month
   - Basic tracking
   - Email notifications
   - Standard response time (48-72h)

2. Pro Plan - ₹499/month
   - Unlimited complaints
   - AI-powered diagnosis
   - Priority support (24h response)
   - Analytics dashboard
   - Live chat support

3. Premium Plan - ₹999/month
   - Everything in Pro
   - Team management (10 users)
   - Advanced analytics
   - Custom branding
   - Dedicated account manager
   - Video call support
   - API access

HOW IT WORKS:
1. Customers submit complaints through the platform
2. AI automatically categorizes and analyzes sentiment
3. System assigns to appropriate team members
4. Real-time tracking and updates
5. Detailed analytics for continuous improvement

SECURITY: Enterprise-grade encryption, GDPR compliant, regular security audits

GETTING STARTED: Sign up free at the website - no credit card required for Free plan

FORMATTING RULES:
- Do NOT use asterisks (*) for bold, italic, or any formatting
- Do NOT use markdown symbols like **, *, _, or ***
- Use plain text only with simple punctuation
- Use emojis sparingly for visual appeal
- Keep responses conversational and natural

Your role is to answer questions about QuickFix in a friendly, helpful manner. Keep responses concise but informative.`;

      const prompt = `${systemContext}\n\nUser Question: ${userMessage}\n\nProvide a helpful, concise response about QuickFix using plain text only (no asterisks or markdown formatting):`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      return text || "I'm here to help! Could you please rephrase your question about QuickFix?";
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

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

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
