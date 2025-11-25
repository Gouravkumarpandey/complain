import React, { useState, useEffect, useRef } from 'react';
import { Bot, Send, X, Loader2 } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface AIAssistantProps {
  onClose: () => void;
}

const AIAssistant: React.FC<AIAssistantProps> = ({ onClose }) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: `I'm Freddy, your AI assistant powered by DeepSeek R1. I can help you with:\n\n• Technical support questions\n• Account inquiries\n• Product information\n• General assistance\n\nWhat can I help you with today?`,
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [conversationHistory, setConversationHistory] = useState<any[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [conversationState, setConversationState] = useState<any>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      // Send message to DeepSeek R1 via backend
      const result = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5001/api'}/auth/chat-ai`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          userId: user?.id,
          message: inputMessage,
          conversationHistory: conversationHistory,
          conversationState: conversationState
        })
      });

      const response = await result.json();

      if (response.success) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const aiResponse = response as any; // Backend returns response field
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: aiResponse.response || aiResponse.reply || 'I apologize, but I encountered an issue processing your request.',
          timestamp: new Date()
        };

        setMessages(prev => [...prev, assistantMessage]);

        // Update conversation history for context
        setConversationHistory(prev => [
          ...prev,
          { role: 'user', content: inputMessage },
          { role: 'assistant', content: aiResponse.response || aiResponse.reply }
        ]);

        // Update conversation state if provided
        if (aiResponse.conversationState) {
          setConversationState(aiResponse.conversationState);
        }
      } else {
        throw new Error(response.message || 'Failed to get response');
      }
    } catch (error: unknown) {
      console.error('AI Assistant error:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'I apologize, but I\'m having trouble connecting right now. Please try again in a moment or contact support if the issue persists.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl flex flex-col overflow-hidden max-w-2xl w-full" style={{ height: '85vh', maxHeight: '700px', boxShadow: '0 12px 48px rgba(0, 0, 0, 0.15), 0 0 1px rgba(0, 0, 0, 0.1)' }}>
        {/* Header */}
        <div className="bg-gradient-to-br from-slate-800 to-slate-700 text-white px-5 py-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm">
                <Bot className="w-5 h-5 text-slate-800" />
              </div>
              <div>
                <h3 className="font-semibold text-base">AI Assistant</h3>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="w-8 h-8 rounded-full hover:bg-white/20 flex items-center justify-center transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <p className="text-xs text-white/80 leading-relaxed">
            Hi {user?.name || 'there'}! 👋 How can I help you today?
          </p>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-[#f8f9fa]" style={{ scrollbarWidth: 'thin', scrollbarColor: '#cbd5e1 transparent' }}>
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex items-end gap-2.5 ${message.role === 'user' ? 'flex-row-reverse' : ''} animate-fadeIn`}
            >
              {/* Avatar */}
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm ${
                message.role === 'user' 
                  ? 'bg-slate-800' 
                  : 'bg-white border border-gray-100'
              }`}>
                <Bot className={`w-4 h-4 ${message.role === 'user' ? 'text-white' : 'text-slate-800'}`} />
              </div>
              
              <div className="flex flex-col max-w-[75%]">
                <div className={`px-4 py-2.5 rounded-2xl ${
                  message.role === 'user'
                    ? 'bg-slate-800 text-white rounded-br-md'
                    : 'bg-white text-gray-800 rounded-bl-md shadow-sm border border-gray-100'
                }`}>
                  {message.role === 'assistant' && (
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <span className="text-[11px] font-semibold text-gray-600">Freddy</span>
                    </div>
                  )}
                  <p className="text-[13px] leading-relaxed whitespace-pre-line">{message.content}</p>
                </div>
                <span className={`text-[11px] mt-1 px-1 ${
                  message.role === 'user' ? 'text-right text-gray-500' : 'text-left text-gray-500'
                }`}>
                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex items-end gap-2.5 animate-fadeIn">
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

        {/* Input Area */}
        <div className="border-t border-gray-200 px-4 py-3 bg-white">
          <div className="flex gap-2 items-end">
            <input
              ref={inputRef}
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type a message..."
              disabled={isLoading}
              className="flex-1 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-full focus:outline-none focus:bg-white focus:border-slate-800 focus:ring-2 focus:ring-slate-800/20 text-sm transition-all"
            />
            <button
              onClick={handleSendMessage}
              disabled={!inputMessage.trim() || isLoading}
              className="w-10 h-10 bg-slate-800 text-white rounded-full hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm flex items-center justify-center flex-shrink-0"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </button>
          </div>
          <p className="text-[10px] text-gray-400 text-center mt-2">
            Responses may not always be accurate
          </p>
        </div>
      </div>
    </div>
  );
};

export default AIAssistant;
