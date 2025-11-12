import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Bot, Settings } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { aiService } from '../../services/aiService';
import { safeFetchJson } from '../../services/apiService';
import { useComplaints } from '../../contexts/ComplaintContext';
import { useAuth } from '../../hooks/useAuth';
import { useNotifications } from '../../contexts/NotificationContext';

interface EntityType {
  entity: string;
  value: string;
  confidence?: number;
}

interface IntentType {
  intent: string;
  confidence?: number;
}

interface ChatMessage {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  complaintDetected?: boolean;
  entities?: EntityType[];
  intents?: IntentType[];
  fallback?: boolean;
  troubleshootingStep?: number;
  offerComplaint?: boolean;
  sentiment?: string; // Positive, Neutral, Negative
  category?: string; // Billing, Technical, Service, Product, General
  priority?: string; // Low, Medium, High, Urgent
}

interface AIResponse {
  success: boolean;
  response?: string;
  complaintDetected?: boolean;
  shouldGenerateComplaint?: boolean;
  troubleshootingSteps?: string[];
  currentStep?: number;
  offerComplaint?: boolean;
  model?: string;
  fallback?: boolean;
}

export function ChatBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      text: "Hello! I'm your AI assistant powered byFreddy AI. I'm here to help solve your issues. Please describe your problem, and I'll guide you through some solutions before filing a complaint if needed. What seems to be the issue?",
      sender: 'bot',
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [troubleshootingMode, setTroubleshootingMode] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [troubleshootingSteps, setTroubleshootingSteps] = useState<string[]>([]);
  const [waitingForComplaintConfirmation, setWaitingForComplaintConfirmation] = useState(false);
  const [messageIdCounter, setMessageIdCounter] = useState(2); // Start from 2 since initial message is '1'
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { createComplaint } = useComplaints();
  const { user } = useAuth();
  const { addNotification } = useNotifications();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const addMessage = (text: string, sender: 'user' | 'bot', metadata?: Partial<ChatMessage>) => {
    const newCounter = messageIdCounter + 1;
    setMessageIdCounter(newCounter);
    const newMessage: ChatMessage = {
      id: `msg-${Date.now()}-${newCounter}`,
      text,
      sender,
      timestamp: new Date(),
      ...metadata,
    };
    setMessages((prev) => [...prev, newMessage]);
  };

  const callAIAssistant = async (message: string, conversationHistory: ChatMessage[] = []): Promise<AIResponse> => {
    try {
      if (!user) throw new Error('User not authenticated');

      const response = await fetch('/api/auth/chat-ai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          userId: user.id,
          message,
          conversationHistory: conversationHistory.map(msg => ({
            role: msg.sender === 'user' ? 'user' : 'assistant',
            content: msg.text
          }))
        }),
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('AI API call failed:', error);
      return {
        success: false,
        response: "I'm experiencing some technical difficulties. Let me try to help you anyway.",
        fallback: true,
      };
    }
  };

  const generateAIComplaint = async () => {
    if (!user) {
      console.error('Cannot generate complaint: User not authenticated');
      addMessage("Please log in to file a complaint.", 'bot');
      return;
    }

    try {
      console.log('Starting complaint generation...', {
        userId: user.id,
        messageCount: messages.length,
        troubleshootingSteps: troubleshootingSteps.length
      });

      const conversationHistory = messages
        .map((msg) => `${msg.sender === 'user' ? 'User' : 'Assistant'}: ${msg.text}`)
        .join('\n');

      // Prepare chatbot conversation for storage
      const chatbotConversation = messages.map(msg => ({
        sender: msg.sender,
        text: msg.text,
        timestamp: msg.timestamp,
        troubleshootingStep: msg.troubleshootingStep,
        metadata: {
          complaintDetected: msg.complaintDetected,
          offerComplaint: msg.offerComplaint
        }
      }));

      console.log('Sending complaint generation request to backend...');

      // Use safeFetchJson to handle errors gracefully
      const data = await safeFetchJson('/api/auth/generate-complaint-ai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          userId: user.id,
          conversationHistory,
          currentMessage: inputValue,
          chatbotConversation, // Include full conversation for ticket storage
          troubleshootingSteps: troubleshootingSteps.length > 0 ? troubleshootingSteps : undefined,
          troubleshootingAttempted: troubleshootingSteps.length > 0
        }),
      });

      if (!data || !data.success || !data.complaintData) {
        console.warn('AI service returned no result or error', data);
        throw new Error(data?.error || 'Failed to generate complaint');
      }

      // Add conversation history to the description
      let enhancedDescription = data.complaintData.description;
      
      if (troubleshootingSteps.length > 0) {
        enhancedDescription += `\n\n--- Troubleshooting Attempted ---\nThe user tried ${troubleshootingSteps.length} troubleshooting steps:\n`;
        troubleshootingSteps.forEach((step, idx) => {
          enhancedDescription += `${idx + 1}. ${step}\n`;
        });
        enhancedDescription += `\nAll troubleshooting steps were attempted but the issue persists.`;
      }

      const complaint = await createComplaint(
        data.complaintData.title,
        enhancedDescription,
        user.id
      );

      if (!complaint || !complaint.id) {
        console.warn('createComplaint failed or returned no id', complaint);
        throw new Error('Failed to create complaint record');
      }

      // Create detailed success message with ticket info
      const ticketMessage = `✅ **Complaint Ticket Created Successfully!**

**Ticket ID:** #${complaint.id || 'Generated'}

**Problem Description:**
${data.complaintData.description}

**Category:** ${data.complaintData.category || 'General'}
**Priority:** ${data.complaintData.priority || 'Medium'}
${troubleshootingSteps.length > 0 ? `\n**Troubleshooting Steps Attempted:** ${troubleshootingSteps.length} steps tried` : ''}

${data.response || 'Your issue has been properly categorized and our support team will review it shortly. You can track the progress of your ticket in your dashboard.'}

Our team will review the conversation history and troubleshooting steps you've tried to provide the best solution.`;

      addMessage(
        ticketMessage,
        'bot',
        { complaintDetected: true }
      );

      addNotification(
        'success',
        'Smart Complaint Filed',
        `AI created Ticket #${complaint.id} with ${data.complaintData.confidence || 0.9} confidence (${data.model || 'DeepSeek R1'}).`
      );

      // Reset troubleshooting state
      setTroubleshootingMode(false);
      setCurrentStepIndex(0);
      setTroubleshootingSteps([]);
      setWaitingForComplaintConfirmation(false);
    } catch (error) {
      console.error('AI complaint generation failed:', error);
      
      // More detailed error logging
      if (error instanceof Error) {
        console.error('Error details:', error.message);
        console.error('Error stack:', error.stack);
      }
      
      addMessage(
        "I'm having trouble connecting to our complaint system right now. Let me try a different approach. Please describe your issue again, and I'll make sure it gets properly recorded.",
        'bot'
      );
      
      // Set a flag to try manual complaint on next message
      setWaitingForComplaintConfirmation(true);
    }
  };

  const callBasicAI = async (message: string): Promise<string> => {
    try {
      const response = await aiService.generateResponse('general', message);
      return response || "I understand your concern. How can I help you file a complaint?";
    } catch (error) {
      console.error('Basic AI call failed:', error);
      return "I understand your concern. Could you provide more details so I can help you better?";
    }
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || loading) return;
    const userMessage = inputValue.trim();
    setInputValue('');
    
    // Analyze sentiment and classify the message
    let sentimentData = null;
    try {
      sentimentData = await aiService.classifyComplaint(userMessage);
      console.log('Message Analysis:', sentimentData);
    } catch (error) {
      console.error('Failed to analyze message:', error);
    }
    
    // Add user message with sentiment and classification
    addMessage(userMessage, 'user', {
      sentiment: sentimentData?.sentiment,
      category: sentimentData?.category,
      priority: sentimentData?.priority
    });
    
    setLoading(true);

    try {
      // Check if user wants to file a complaint
      if (waitingForComplaintConfirmation) {
        const confirmation = userMessage.toLowerCase();
        if (confirmation.includes('yes') || confirmation.includes('file') || confirmation.includes('create')) {
          setWaitingForComplaintConfirmation(false);
          addMessage("Perfect! I'm creating a complaint ticket for you based on our conversation...", 'bot');
          await generateAIComplaint();
          setLoading(false);
          return;
        } else if (confirmation.includes('no') || confirmation.includes('solved') || confirmation.includes('fixed')) {
          setWaitingForComplaintConfirmation(false);
          setTroubleshootingMode(false);
          setCurrentStepIndex(0);
          setTroubleshootingSteps([]);
          addMessage("Great! I'm glad I could help resolve your issue. If you need anything else, feel free to ask!", 'bot');
          setLoading(false);
          return;
        }
      }

      // Check if in troubleshooting mode
      if (troubleshootingMode && troubleshootingSteps.length > 0) {
        const response = userMessage.toLowerCase();
        
        // Check if issue is resolved
        if (response.includes('work') || response.includes('fixed') || response.includes('solved') || 
            response.includes('better') || response.includes('good')) {
          setTroubleshootingMode(false);
          setCurrentStepIndex(0);
          setTroubleshootingSteps([]);
          addMessage("Excellent! I'm happy to hear that resolved your issue. Is there anything else I can help you with?", 'bot');
          setLoading(false);
          return;
        }

        // Move to next troubleshooting step
        if (currentStepIndex < troubleshootingSteps.length - 1) {
          const nextIndex = currentStepIndex + 1;
          setCurrentStepIndex(nextIndex);
          addMessage(
            `Okay, let's try the next solution:\n\n**Step ${nextIndex + 1}/${troubleshootingSteps.length}:** ${troubleshootingSteps[nextIndex]}\n\nPlease try this and let me know if it helps!`,
            'bot',
            { troubleshootingStep: nextIndex + 1 }
          );
          setLoading(false);
          return;
        } else {
          // All steps exhausted
          setTroubleshootingMode(false);
          addMessage(
            "I've walked you through all the troubleshooting steps I have. Since the issue persists, I recommend filing a complaint so our technical team can investigate further.\n\n**Would you like me to file a complaint ticket for you?** (Yes/No)",
            'bot',
            { offerComplaint: true }
          );
          setWaitingForComplaintConfirmation(true);
          setLoading(false);
          return;
        }
      }

      // Get AI response with troubleshooting
      const aiResponse = await callAIAssistant(userMessage, messages.filter(m => m.sender !== 'bot' || !m.fallback));

      if (aiResponse.success) {
        // Add empathetic prefix based on sentiment
        let responsePrefix = '';
        if (sentimentData?.sentiment === 'Negative') {
          responsePrefix = "I understand your frustration and I'm here to help. ";
        } else if (sentimentData?.sentiment === 'Positive') {
          responsePrefix = "Thank you for reaching out! ";
        }
        
        // Check if AI provided troubleshooting steps
        if (aiResponse.troubleshootingSteps && aiResponse.troubleshootingSteps.length > 0) {
          setTroubleshootingMode(true);
          setTroubleshootingSteps(aiResponse.troubleshootingSteps);
          setCurrentStepIndex(0);
          
          const firstStep = aiResponse.troubleshootingSteps[0];
          const priorityNote = sentimentData?.priority === 'Urgent' || sentimentData?.priority === 'High' 
            ? ' I see this is urgent, so I\'ll do my best to help you quickly.' 
            : '';
          
          addMessage(
            `${responsePrefix}I understand you're experiencing: "${userMessage}"${priorityNote}\n\nLet me help you troubleshoot this issue. I have ${aiResponse.troubleshootingSteps.length} solutions for you to try.\n\n**Step 1/${aiResponse.troubleshootingSteps.length}:** ${firstStep}\n\nPlease try this and let me know if it works!`,
            'bot',
            { troubleshootingStep: 1 }
          );
        } else if (aiResponse.offerComplaint) {
          // AI suggests filing complaint immediately
          addMessage(
            responsePrefix + (aiResponse.response || "Would you like me to file a complaint for this issue?"), 
            'bot', 
            { offerComplaint: true }
          );
          setWaitingForComplaintConfirmation(true);
        } else {
          // Regular response
          addMessage(
            responsePrefix + (aiResponse.response || "I understand. How can I help you further?"), 
            'bot', 
            {
              complaintDetected: aiResponse.complaintDetected,
              fallback: aiResponse.fallback
            }
          );
        }
      } else {
        const basicResponse = await callBasicAI(userMessage);
        addMessage(basicResponse, 'bot', { fallback: true });
      }
    } catch (error) {
      console.error('Chat error:', error);
      addMessage("I'm sorry, I'm having trouble processing your message right now. Please try again.", 'bot');
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
              <h3 className="font-semibold">FreddyAI Assistant</h3>
            </div>
            <div className="flex items-center gap-3">
              <Settings className="cursor-pointer" />
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
                  <div className="bg-white p-3 rounded-xl max-w-[80%] shadow-sm">
                    <p className="text-sm leading-relaxed">{message.text}</p>
                    
                    {/* Sentiment and Classification Badges */}
                    {message.sender === 'user' && (message.sentiment || message.category || message.priority) && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {message.sentiment && (
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            message.sentiment === 'Positive' ? 'bg-green-100 text-green-700' :
                            message.sentiment === 'Negative' ? 'bg-red-100 text-red-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {message.sentiment === 'Positive' ? '😊' : message.sentiment === 'Negative' ? '😟' : '😐'} {message.sentiment}
                          </span>
                        )}
                        {message.category && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                            {message.category}
                          </span>
                        )}
                        {message.priority && (message.priority === 'High' || message.priority === 'Urgent') && (
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            message.priority === 'Urgent' ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'
                          }`}>
                            ⚠️ {message.priority}
                          </span>
                        )}
                      </div>
                    )}
                    
                    {message.entities && message.entities.length > 0 && (
                      <div className="mt-1 text-xs opacity-75">Entities: {message.entities.map((e) => e.entity).join(', ')}</div>
                    )}
                    {message.intents && message.intents.length > 0 && (
                      <div className="mt-1 text-xs opacity-75">Intent: {message.intents[0]?.intent}</div>
                    )}
                    <p className="text-xs opacity-50 mt-1">{message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
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
