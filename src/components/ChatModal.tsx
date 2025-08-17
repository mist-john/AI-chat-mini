'use client';

import { useState, useRef, useEffect } from 'react';
import { X, Send, Bot, User, AlertCircle } from 'lucide-react';

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
}

interface ChatModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ClientData {
  clientId: string;
  messageCount: number;
  lastReset: number;
}

export default function ChatModal({ isOpen, onClose }: ChatModalProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: 'Hello! I\'m Koã, your AI companion. How can I help you today?',
      role: 'assistant',
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [clientData, setClientData] = useState<ClientData | null>(null);
  const [messageLimitReached, setMessageLimitReached] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Get API key from environment variable
  const API_KEY = process.env.NEXT_PUBLIC_OPENAI_API_KEY;

  // Initialize or get client data from MongoDB
  useEffect(() => {
    const initializeClient = async () => {
      try {
        // Generate or get existing client ID
        let clientId = localStorage.getItem('koaClientId');
        if (!clientId) {
          clientId = `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          localStorage.setItem('koaClientId', clientId);
        }

        // Get client status from MongoDB
        const response = await fetch('/api/client/status', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ clientId }),
        });

        if (response.ok) {
          const data = await response.json();
          setClientData({
            clientId: data.clientId,
            messageCount: data.messageCount,
            lastReset: new Date(data.lastReset).getTime(),
          });
          setMessageLimitReached(!data.canSendMessage);
        } else {
          console.error('Failed to get client status');
        }
      } catch (error) {
        console.error('Error initializing client:', error);
      }
    };

    if (isOpen) {
      initializeClient();
    }
  }, [isOpen]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const updateMessageCount = async () => {
    if (clientData) {
      try {
        // Increment message count in MongoDB
        const response = await fetch('/api/client/increment', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ clientId: clientData.clientId }),
        });

        if (response.ok) {
          const data = await response.json();
          setClientData({
            clientId: data.clientId,
            messageCount: data.messageCount,
            lastReset: new Date(data.lastReset).getTime(),
          });
          setMessageLimitReached(!data.canSendMessage);
        } else {
          console.error('Failed to increment message count');
        }
      } catch (error) {
        console.error('Error updating message count:', error);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading || messageLimitReached) return;

    // Check if API key is available
    if (!API_KEY) {
      const errorMessage: Message = {
        id: Date.now().toString(),
        content: 'Error: API key not configured. Please check your environment variables.',
        role: 'assistant',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
      return;
    }

    // Check message limit before proceeding
    if (clientData && clientData.messageCount >= 100) {
      setMessageLimitReached(true);
      return;
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputValue.trim(),
      role: 'user',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    // Increment message count for user message
    await updateMessageCount();

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${API_KEY}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: 'You are Koã, a friendly and helpful AI companion. Be conversational, supportive, and engaging in your responses.',
            },
            ...messages.map(msg => ({
              role: msg.role,
              content: msg.content,
            })),
            {
              role: 'user',
              content: userMessage.content,
            },
          ],
          max_tokens: 500,
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response from AI');
      }

      const data = await response.json();
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: data.choices[0].message.content,
        role: 'assistant',
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, aiMessage]);
      
      // Increment message count for AI response
      await updateMessageCount();
    } catch (error) {
      console.error('Error:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: 'Sorry, I encountered an error. Please try again.',
        role: 'assistant',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
      
      // Increment message count for error response
      await updateMessageCount();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div 
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-300 ease-in-out ${
        isOpen 
          ? 'opacity-100 pointer-events-auto' 
          : 'opacity-0 pointer-events-none'
      }`}
    >
      {/* Backdrop */}
      <div 
        className={`absolute inset-0 bg-black/80 backdrop-blur-sm transition-all duration-300 ease-in-out ${
          isOpen ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={onClose}
      />
      
      {/* Modal Content */}
      <div 
        className={`bg-gray-900 rounded-2xl w-full max-w-4xl h-[80vh] flex flex-col shadow-2xl border border-gray-700 transition-all duration-300 ease-in-out transform ${
          isOpen 
            ? 'opacity-100 scale-100 translate-y-0' 
            : 'opacity-0 scale-95 translate-y-4'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700 animate-in slide-in-from-top-2 duration-300 ease-out">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-red-500 to-orange-500 rounded-full flex items-center justify-center">
              <Bot className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Koã AI Chat</h2>
              {/* <p className="text-sm text-gray-400">Your AI companion </p>
              {clientData && (
                                 <p className="text-xs text-gray-500">
                   Messages used: {clientData.messageCount}/100
                 </p>
              )} */}
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Message Limit Warning */}
        {messageLimitReached && (
          <div className="bg-red-900/50 border border-red-700 mx-6 mt-4 p-4 rounded-lg animate-in slide-in-from-top-2 duration-300 ease-out">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-400" />
              <div>
                <p className="text-red-200 font-medium">Message Limit Reached!</p>
                                 <p className="text-red-300 text-sm">
                   You&apos;ve used all 100 messages for today. Chat is now disabled. Please try again tomorrow.
                 </p>
              </div>
            </div>
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.map((message, index) => (
            <div
              key={message.id}
              className={`flex gap-3 animate-in slide-in-from-bottom-2 duration-300 ease-out ${
                message.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
              style={{ animationDelay: `${index * 100}ms` }}
            >
              {message.role === 'assistant' && (
                <div className="w-8 h-8 bg-gradient-to-r from-red-500 to-orange-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <Bot className="w-5 h-5 text-white" />
                </div>
              )}
              <div
                className={`max-w-[70%] rounded-2xl px-4 py-3 ${
                  message.role === 'user'
                    ? 'bg-gradient-to-r from-red-600 to-orange-600 text-white'
                    : 'bg-gray-800 text-gray-100'
                }`}
              >
                <p className="text-sm leading-relaxed">{message.content}</p>
                <p className="text-xs opacity-70 mt-2">
                  {message.timestamp.toLocaleTimeString()}
                </p>
              </div>
              {message.role === 'user' && (
                <div className="w-8 h-8 bg-gradient-to-r from-red-500 to-orange-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <User className="w-5 h-5 text-white" />
                </div>
              )}
            </div>
          ))}
          {isLoading && !messageLimitReached && (
            <div className="flex gap-3 justify-start animate-in slide-in-from-bottom-2 duration-300 ease-out">
              <div className="w-8 h-8 bg-gradient-to-r from-red-500 to-orange-500 rounded-full flex items-center justify-center">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div className="bg-gray-800 rounded-2xl px-4 py-3">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input - Completely disabled when limit reached */}
        <form onSubmit={handleSubmit} className="p-6 border-t border-gray-700 animate-in slide-in-from-bottom-2 duration-300 ease-out">
          <div className="flex gap-3">
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={messageLimitReached ? "Chat disabled - Message limit reached" : "Type your message..."}
              className="flex-1 bg-gray-800 border border-gray-600 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:border-gray-500"
              disabled={isLoading || messageLimitReached}
            />
            <button
              type="submit"
              disabled={!inputValue.trim() || isLoading || messageLimitReached}
              className="bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 disabled:opacity-50 disabled:cursor-not-allowed text-white p-3 rounded-xl transition-all duration-200 hover:scale-105 active:scale-95"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
