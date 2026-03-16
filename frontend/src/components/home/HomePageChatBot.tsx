import { useState, useRef, useEffect } from 'react';
import { X, Send, Bot, Mic, MicOff, Volume2, VolumeX, StopCircle } from 'lucide-react';
import api from '../../utils/api';

// Remove GoogleGenerativeAI initialization


interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}


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

  // TTS state — never auto-speaks, user taps 🔊 per message
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);

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

    // Use Anthropic Claude via backend — api instance already has baseURL = http://localhost:5001/api
    try {
      const response = await api.post('/ai/chat', {
        message: userMessage,
        sessionId: 'guest-user'
      });

      const data = response.data;

      if (data.success) {
        return data.response;
      } else {
        throw new Error(data.message || 'Failed to get response from AI');
      }

    } catch (error) {
      console.error('Chat API error:', error);

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
      return "I'm having trouble connecting to my brain right now. You can try asking me about QuickFix features, pricing, or how to get started!";
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

  // Speak a specific message on button click
  const speakMessage = (messageId: string, text: string, language: string = detectedLanguage) => {
    if (!('speechSynthesis' in window)) return;

    // If already speaking this message, stop it
    if (speakingMessageId === messageId) {
      window.speechSynthesis.cancel();
      setSpeakingMessageId(null);
      return;
    }

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = language;
    utterance.rate = 0.9;
    utterance.pitch = 1;
    utterance.volume = 1;

    setSpeakingMessageId(messageId);
    utterance.onend = () => setSpeakingMessageId(null);
    utterance.onerror = () => setSpeakingMessageId(null);

    window.speechSynthesis.speak(utterance);
  };

  // Stop all speech
  const stopSpeaking = () => {
    window.speechSynthesis.cancel();
    setSpeakingMessageId(null);
  };

  // Legacy speakText kept for compatibility but no longer called automatically
  const speakText = (_text: string, _language?: string) => { /* auto-speak disabled */ };

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
    // Auto-speak is disabled — user can tap 🔊 on any message to hear it
    void speakText; // suppress unused warning
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
          className="fixed bottom-6 right-6 w-16 h-16 bg-[#F47216] rounded-full shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 flex items-center justify-center z-50 group"
          aria-label="Open chat"
        >
          <svg className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
            <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z" />
          </svg>

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
                className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'} group`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-3 ${message.sender === 'user'
                    ? 'bg-orange-500 text-white rounded-br-none'
                    : 'bg-white text-gray-800 rounded-bl-none shadow-sm border border-gray-100'
                    }`}
                >
                  <p className="text-sm whitespace-pre-line leading-relaxed">{message.text}</p>
                  <div className={`flex items-center mt-1 gap-2 ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <span className={`text-xs ${message.sender === 'user' ? 'text-orange-100' : 'text-gray-400'}`}>
                      {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    {/* Read aloud button — only on bot messages */}
                    {message.sender === 'bot' && (
                      <button
                        onClick={() => speakMessage(message.id, message.text, detectedLanguage)}
                        className={`p-1 rounded-full transition-all ${speakingMessageId === message.id
                          ? 'text-orange-500 bg-orange-50'
                          : 'text-gray-300 hover:text-orange-500 hover:bg-orange-50 opacity-0 group-hover:opacity-100'
                          }`}
                        title={speakingMessageId === message.id ? 'Stop reading' : 'Read aloud'}
                      >
                        {speakingMessageId === message.id
                          ? <StopCircle className="w-3.5 h-3.5" />
                          : <Volume2 className="w-3.5 h-3.5" />}
                      </button>
                    )}
                  </div>
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

              {/* Stop Speaking Button — only visible when AI is speaking */}
              {speakingMessageId ? (
                <button
                  onClick={stopSpeaking}
                  className="p-2.5 rounded-xl bg-orange-100 text-orange-600 hover:bg-orange-200 transition-colors animate-pulse"
                  title="Stop reading"
                >
                  <StopCircle className="w-5 h-5" />
                </button>
              ) : (
                <button
                  disabled
                  className="p-2.5 rounded-xl bg-gray-50 text-gray-300 cursor-default"
                  title="Tap 🔊 on any message to hear it"
                >
                  <VolumeX className="w-5 h-5" />
                </button>
              )}

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
