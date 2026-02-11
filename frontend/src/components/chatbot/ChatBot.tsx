import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Bot, User, Volume2, VolumeX } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { useComplaints } from '../../contexts/ComplaintContext';
import { useAuth } from '../../hooks/useAuth';
import { useNotifications } from '../../contexts/NotificationContext';
import { useTranslation } from 'react-i18next';
import { VoiceInput } from '../complaints/agent/VoiceInput';

interface ChatMessage {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

export function ChatBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      text: "Hello! 👋 I'm your support assistant.\n\nI can help you register complaints for:\n• Technical Support issues\n• Billing & payment problems\n• General inquiries\n\nPlease describe your issue to get started.",
      sender: 'bot',
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [conversationState, setConversationState] = useState<{
    step?: 'initial' | 'category' | 'details' | 'confirmation';
    category?: 'Technical Support' | 'Billing' | 'General Inquiry';
    issueDescription?: string;
    additionalDetails?: Record<string, string>;
    detailsNeeded?: string[];
    currentDetailIndex?: number;
  }>({ step: 'initial' });
  const [messageIdCounter, setMessageIdCounter] = useState(2);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { createComplaint } = useComplaints();
  const { user } = useAuth();
  const { addNotification } = useNotifications();
  const { i18n } = useTranslation();

  // Text-to-speech states
  const [isSpeechEnabled, setIsSpeechEnabled] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [detectedLanguage, setDetectedLanguage] = useState(i18n.language || 'en-US');

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const addMessage = (text: string, sender: 'user' | 'bot') => {
    const newCounter = messageIdCounter + 1;
    setMessageIdCounter(newCounter);
    const newMessage: ChatMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}-${newCounter}`,
      text,
      sender,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, newMessage]);

    // Speak bot messages if speech is enabled
    if (sender === 'bot' && isSpeechEnabled) {
      speakText(text, detectedLanguage);
    }
  };

  // Detect language from user input
  const detectLanguage = (text: string): string => {
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

    return i18n.language || 'en-US';
  };

  // Text-to-speech function
  const speakText = (text: string, language: string = detectedLanguage) => {
    if (!isSpeechEnabled || !('speechSynthesis' in window)) return;

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

  const handleSendMessage = async () => {
    if (!inputValue.trim() || loading) return;
    const userMessage = inputValue.trim();
    setInputValue('');
    setLoading(true);

    // Detect and set language from user input
    const userLang = detectLanguage(userMessage);
    setDetectedLanguage(userLang);

    // Add user message immediately
    addMessage(userMessage, 'user');

    try {
      const messageLower = userMessage.toLowerCase();

      // Check if user is logged in first
      if (!user && conversationState.step !== 'initial') {
        addMessage("Please log in to register a complaint. I'll redirect you to the login page.", 'bot');
        setConversationState({ step: 'initial' });
        setLoading(false);
        setTimeout(() => {
          window.location.href = '/login';
        }, 2000);
        return;
      }

      // STEP 1: Initial - Ask for issue description
      if (conversationState.step === 'initial' || !conversationState.step) {
        addMessage(
          "Please describe your issue or problem. I'll help you register a complaint.",
          'bot'
        );
        setConversationState({
          step: 'category',
          issueDescription: userMessage
        });
        setLoading(false);
        return;
      }

      // STEP 2: Select Category
      if (conversationState.step === 'category') {
        addMessage(
          "Which category does this belong to?\n\n1️⃣ Technical Support (Device issues, connectivity, software problems)\n2️⃣ Billing (Payment, refund, invoice issues)\n3️⃣ General Inquiry (Other issues)\n\nPlease reply with 1, 2, or 3",
          'bot'
        );
        setConversationState({
          ...conversationState,
          step: 'details'
        });
        setLoading(false);
        return;
      }

      // STEP 3: Collect category and determine required details
      if (conversationState.step === 'details' && !conversationState.category) {
        let category: 'Technical Support' | 'Billing' | 'General Inquiry' = 'General Inquiry';
        let detailsNeeded: string[] = [];

        if (messageLower.includes('1') || messageLower.includes('tech')) {
          category = 'Technical Support';
          detailsNeeded = [
            'What device or service is affected?',
            'When did the issue start?',
            'Have you tried any troubleshooting steps?'
          ];
        } else if (messageLower.includes('2') || messageLower.includes('bill')) {
          category = 'Billing';
          detailsNeeded = [
            'What is your account number or customer ID?',
            'What is the transaction date or invoice number?',
            'What specific billing issue are you facing?'
          ];
        } else if (messageLower.includes('3') || messageLower.includes('general') || messageLower.includes('other')) {
          category = 'General Inquiry';
          detailsNeeded = [
            'Please provide more details about your inquiry',
            'Is there a specific department you need to reach?'
          ];
        } else {
          addMessage(
            "Please select a valid category (1, 2, or 3).",
            'bot'
          );
          setLoading(false);
          return;
        }

        addMessage(
          `Got it! Category: ${category}\n\nLet me collect some details to help resolve this quickly.\n\n${detailsNeeded[0]}`,
          'bot'
        );

        setConversationState({
          ...conversationState,
          category,
          detailsNeeded,
          currentDetailIndex: 0,
          additionalDetails: {}
        });
        setLoading(false);
        return;
      }

      // STEP 4: Collect additional details
      if (conversationState.step === 'details' && conversationState.detailsNeeded && conversationState.currentDetailIndex !== undefined) {
        const currentIndex = conversationState.currentDetailIndex;
        const details = conversationState.additionalDetails || {};
        details[conversationState.detailsNeeded[currentIndex]] = userMessage;

        const nextIndex = currentIndex + 1;

        if (nextIndex < conversationState.detailsNeeded.length) {
          // Ask next question
          addMessage(
            conversationState.detailsNeeded[nextIndex],
            'bot'
          );
          setConversationState({
            ...conversationState,
            additionalDetails: details,
            currentDetailIndex: nextIndex
          });
        } else {
          // All details collected, show confirmation
          const detailsSummary = Object.entries(details)
            .map(([question, answer]) => `• ${question.replace('?', '')}: ${answer}`)
            .join('\n');

          addMessage(
            `Perfect! Here's a summary of your complaint:\n\n📋 Issue: ${conversationState.issueDescription}\n📁 Category: ${conversationState.category}\n\n${detailsSummary}\n\nShall I register this complaint? (Reply Yes or No)`,
            'bot'
          );
          setConversationState({
            ...conversationState,
            additionalDetails: details,
            step: 'confirmation'
          });
        }
        setLoading(false);
        return;
      }

      // STEP 5: Final confirmation and registration
      if (conversationState.step === 'confirmation') {
        if (messageLower.includes('yes') || messageLower.includes('confirm') || messageLower.includes('register')) {
          addMessage("Registering your complaint...", 'bot');

          try {
            // Build detailed description
            const detailsText = Object.entries(conversationState.additionalDetails || {})
              .map(([q, a]) => `${q}\n${a}`)
              .join('\n\n');

            const fullDescription = `${conversationState.issueDescription}\n\n=== Additional Details ===\n${detailsText}`;

            const complaint = await createComplaint(
              conversationState.issueDescription || 'Complaint',
              fullDescription,
              user!.id
            );

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const ticketId = (complaint as any).complaintId || complaint.id || `#${Date.now()}`;

            addMessage(
              `✅ Complaint Registered Successfully!\n\nTicket ID: ${ticketId}\nCategory: ${conversationState.category}\nStatus: Open\n\nAn email confirmation has been sent to ${user!.email}`,
              'bot'
            );

            addNotification(
              'success',
              'Complaint Registered',
              `Ticket ${ticketId} created successfully.`
            );
          } catch (error) {
            console.error('Failed to create complaint:', error);
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            addMessage(
              `Sorry, there was an error creating your complaint: ${errorMessage}\n\nPlease try again or contact support.`,
              'bot'
            );
          }

          // Reset conversation
          setConversationState({ step: 'initial' });
        } else {
          addMessage(
            "No problem! Your complaint was not registered. You can start over anytime by describing your issue.",
            'bot'
          );
          setConversationState({ step: 'initial' });
        }
        setLoading(false);
        return;
      }

      // Fallback
      addMessage(
        "I'm here to help! Please describe your issue to get started.",
        'bot'
      );

    } catch (error) {
      console.error('Chat error:', error);
      addMessage("I'm sorry, I'm having trouble processing your message. Please try again.", 'bot');
    } finally {
      setLoading(false);
    }
  };

  const handleVoiceTranscript = (transcript: string) => {
    setInputValue(prev => {
      const base = prev.trim();
      return base ? `${base} ${transcript}` : transcript;
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div>
      {/* Freshdesk-style Chat Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-5 right-5 w-14 h-14 bg-slate-800 text-white rounded-full shadow-2xl hover:bg-slate-700 transition-all duration-300 z-50 flex items-center justify-center"
        style={{ boxShadow: '0 4px 12px rgba(30, 41, 59, 0.4)' }}
      >
        {isOpen ? <X size={24} /> : <MessageCircle size={24} />}
      </button>

      {isOpen && (
        <div
          className="fixed bottom-24 right-5 w-[380px] h-[600px] bg-white rounded-2xl flex flex-col z-50 overflow-hidden"
          style={{
            boxShadow: '0 12px 48px rgba(0, 0, 0, 0.15), 0 0 1px rgba(0, 0, 0, 0.1)'
          }}
        >
          {/* Freshdesk-style Header */}
          <div className="bg-gradient-to-br from-slate-800 to-slate-700 text-white px-5 py-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm">
                  <Bot className="w-5 h-5 text-slate-800" />
                </div>
                <div>
                  <h3 className="font-semibold text-base">Support Chat</h3>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                    <span className="text-xs text-white/90">We're online</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 rounded-full hover:bg-white/20 flex items-center justify-center transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-white/80 leading-relaxed">
              Hi there! 👋 How can we help you today?
            </p>
          </div>

          {/* Freshdesk-style Messages Area */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-[#f8f9fa]" style={{
            scrollbarWidth: 'thin',
            scrollbarColor: '#cbd5e1 transparent'
          }}>
            {messages.map((message) => {
              const serverId = message.id;
              const ts = message.timestamp?.getTime() || Date.now();
              const sender = message.sender || '';
              const contentHash = (message.text || '').slice(0, 20).replace(/\s/g, '');
              const fallbackId = `${ts}-${sender}-${contentHash}`;
              const key = serverId || fallbackId || uuidv4();

              return (
                <div key={key} className={`flex items-end gap-2.5 ${message.sender === 'user' ? 'flex-row-reverse' : ''}`}>
                  {/* Avatar */}
                  {message.sender === 'bot' && (
                    <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center flex-shrink-0 shadow-sm border border-gray-100">
                      <Bot className="w-4 h-4 text-slate-800" />
                    </div>
                  )}
                  {message.sender === 'user' && (
                    <div className="w-8 h-8 bg-slate-800 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm">
                      <User className="w-4 h-4 text-white" />
                    </div>
                  )}

                  <div className="flex flex-col max-w-[75%]">
                    <div className={`px-4 py-2.5 rounded-2xl ${message.sender === 'user'
                      ? 'bg-slate-800 text-white rounded-br-md'
                      : 'bg-white text-gray-800 rounded-bl-md shadow-sm border border-gray-100'
                      }`}>
                      <p className="text-[13px] leading-relaxed whitespace-pre-line">{message.text}</p>
                    </div>
                    <span className={`text-[11px] mt-1 px-1 ${message.sender === 'user' ? 'text-right text-gray-500' : 'text-left text-gray-500'}`}>
                      {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              );
            })}

            {loading && (
              <div className="flex items-end gap-2.5">
                <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-sm border border-gray-100">
                  <Bot className="w-4 h-4 text-slate-800" />
                </div>
                <div className="bg-white px-4 py-3 rounded-2xl rounded-bl-md shadow-sm border border-gray-100">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-slate-800 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-slate-800 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2 h-2 bg-slate-800 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          <div className="border-t border-gray-200 px-4 py-3 bg-white">
            <div className="flex gap-2 items-end">
              <div className="flex-1 relative flex items-center">
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Type or speak a message..."
                  className="w-full pl-4 pr-12 py-2.5 bg-gray-50 border border-gray-200 rounded-full focus:outline-none focus:bg-white focus:border-slate-800 focus:ring-2 focus:ring-slate-800/20 text-sm transition-all"
                  disabled={loading}
                />
                <VoiceInput
                  onTranscript={handleVoiceTranscript}
                  lang={detectedLanguage}
                  className="absolute right-2"
                />
              </div>

              {/* Speech Toggle Button */}
              <button
                onClick={() => setIsSpeechEnabled(!isSpeechEnabled)}
                className={`w-10 h-10 rounded-full transition-all shadow-sm flex items-center justify-center flex-shrink-0 ${isSpeechEnabled
                    ? 'bg-orange-100 text-orange-600 hover:bg-orange-200'
                    : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                  }`}
                title={isSpeechEnabled ? "Voice responses ON" : "Voice responses OFF"}
              >
                {isSpeechEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              </button>

              <button
                onClick={handleSendMessage}
                disabled={!inputValue.trim() || loading}
                className="w-10 h-10 bg-slate-800 text-white rounded-full hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm flex items-center justify-center flex-shrink-0"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
            <p className="text-[10px] text-gray-400 text-center mt-2">
              Powered by QuickFix AI • Speak in any language
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default ChatBot;
