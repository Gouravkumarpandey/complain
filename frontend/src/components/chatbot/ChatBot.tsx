import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Bot } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { useComplaints } from '../../contexts/ComplaintContext';
import { useAuth } from '../../hooks/useAuth';
import { useNotifications } from '../../contexts/NotificationContext';

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
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || loading) return;
    const userMessage = inputValue.trim();
    setInputValue('');
    setLoading(true);
    
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

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div>
      {/* Chat Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 bg-gradient-to-r from-blue-500 to-purple-600 text-white p-4 rounded-full shadow-lg hover:shadow-xl transform hover:scale-110 transition-all duration-300 z-50"
      >
        {isOpen ? <X size={24} /> : <MessageCircle size={24} />}
      </button>

      {isOpen && (
        <div className="fixed bottom-16 right-6 w-96 h-[500px] bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col z-50 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Bot className="w-5 h-5" />
              <h3 className="font-semibold">AI Assistant</h3>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
            {messages.map((message) => {
              // Prefer server-provided unique ids
              const serverId = message.id;
              // Stable fallback: use timestamp + sender + contentHash to avoid collisions
              const ts = message.timestamp?.getTime() || Date.now();
              const sender = message.sender || '';
              // compute a cheap stable fallback id (do not use Date.now() alone)
              const contentHash = (message.text || '').slice(0, 20).replace(/\s/g, '');
              const fallbackId = `${ts}-${sender}-${contentHash}`;
              const key = serverId || fallbackId || uuidv4();

              return (
                <div key={key} className={`flex items-start gap-3 ${message.sender === 'user' ? 'flex-row-reverse' : ''}`}>
                  <div className={`p-3 rounded-xl max-w-[80%] shadow-sm ${
                    message.sender === 'user' ? 'bg-blue-500 text-white' : 'bg-white'
                  }`}>
                    <p className="text-sm leading-relaxed whitespace-pre-line">{message.text}</p>
                    <p className="text-xs opacity-50 mt-1">
                      {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              );
            })}

            {loading && (
              <div className="flex items-start gap-3">
                <div className="bg-white border border-gray-200 text-blue-500 p-2 rounded-full">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="bg-white border border-gray-200 p-3 rounded-xl">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="border-t border-gray-200 p-4 bg-white">
            <div className="flex gap-2">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type your message..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                disabled={loading}
              />
              <button
                onClick={handleSendMessage}
                disabled={!inputValue.trim() || loading}
                className="bg-blue-500 text-white p-2 rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ChatBot;
