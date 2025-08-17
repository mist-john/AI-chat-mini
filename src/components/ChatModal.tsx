'use client';

import { useState, useRef, useEffect } from 'react';
import { X, Send, Bot, User, AlertCircle } from 'lucide-react';

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
}

interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  timestamp: Date;
  lastMessage: string;
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
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string>('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // -----------------------------Get API key from environment variable-----------------------------//
  const API_KEY = process.env.NEXT_PUBLIC_OPENAI_API_KEY;

  // -----------------------------Initialize or get client data from MongoDB-----------------------------//
  useEffect(() => {
    const initializeClient = async () => {
      try {
        // -----------------------------Generate or get existing client ID-----------------------------//
        let clientId = localStorage.getItem('koaClientId');
        if (!clientId) {
          clientId = `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          localStorage.setItem('koaClientId', clientId);
        }

        // -----------------------------Get client status from MongoDB-----------------------------//
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

  // -----------------------------Initialize first session and load from localStorage-----------------------------//
  useEffect(() => {
    const savedSessions = localStorage.getItem('koaChatSessions');
    if (savedSessions) {
      try {
        const parsed = JSON.parse(savedSessions);
        const sessionsWithDates = parsed.map((s: any) => ({
          ...s,
          timestamp: new Date(s.timestamp),
          messages: s.messages.map((m: any) => ({
            ...m,
            timestamp: new Date(m.timestamp)
          }))
        }));
        setChatSessions(sessionsWithDates);
        if (sessionsWithDates.length > 0) {
          setCurrentSessionId(sessionsWithDates[0].id);
          setMessages(sessionsWithDates[0].messages);
        }
      } catch (error) {
        console.error('Error loading chat sessions:', error);
        createNewSession();
      }
    } else {
      createNewSession();
    }
  }, []);

  // -----------------------------Update current session when messages change-----------------------------//
  useEffect(() => {
    if (messages.length > 0 && currentSessionId) {
      updateCurrentSession();
    }
  }, [messages, currentSessionId]);

  // -----------------------------Save sessions to localStorage whenever they change-----------------------------//
  useEffect(() => {
    if (chatSessions.length > 0) {
      localStorage.setItem('koaChatSessions', JSON.stringify(chatSessions));
    }
  }, [chatSessions]);

  // -----------------------------Chat session management functions-----------------------------//
  const createNewSession = () => {
    const newSession: ChatSession = {
      id: `session_${Date.now()}`,
      title: 'New Chat',
      messages: [
        {
          id: '1',
          content: 'Hello! I\'m Koã, your AI companion. How can I help you today?',
          role: 'assistant',
          timestamp: new Date(),
        },
      ],
      timestamp: new Date(),
      lastMessage: 'Hello! I\'m Koã, your AI companion. How can I help you today?',
    };

    setChatSessions(prev => [newSession, ...prev]);
    setCurrentSessionId(newSession.id);
    setMessages(newSession.messages);
    setInputValue('');
    setIsSidebarOpen(false);
  };

  const loadSession = (sessionId: string) => {
    const session = chatSessions.find(s => s.id === sessionId);
    if (session) {
      setCurrentSessionId(sessionId);
      setMessages(session.messages);
      setInputValue('');
      setIsSidebarOpen(false);
    }
  };

  const deleteSession = (sessionId: string) => {
    setChatSessions(prev => prev.filter(s => s.id !== sessionId));
    if (currentSessionId === sessionId) {
      if (chatSessions.length > 1) {
        const nextSession = chatSessions.find(s => s.id !== sessionId);
        if (nextSession) {
          loadSession(nextSession.id);
        }
      } else {
        createNewSession();
      }
    }
  };

  const updateCurrentSession = () => {
    if (currentSessionId && messages.length > 0) {
      const lastUserMessage = messages.filter(m => m.role === 'user').pop();
      const title = lastUserMessage ? lastUserMessage.content.slice(0, 50) + '...' : 'New Chat';
      
      setChatSessions(prev => prev.map(s => 
        s.id === currentSessionId 
          ? { ...s, messages, title, lastMessage: messages[messages.length - 1]?.content || '' }
          : s
      ));
    }
  };

  const updateMessageCount = async () => {
    if (clientData) {
      try {
        // -----------------------------Increment message count in MongoDB-----------------------------//
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

    // -----------------------------Check if API key is available-----------------------------//
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

    // -----------------------------Check message limit before proceeding-----------------------------//
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

    // -----------------------------Increment message count for user message-----------------------------//
    await updateMessageCount();

    try {
      // -----------------------------Search for relevant Koasync X posts data-----------------------------//       
      let xPostsContext = '';
      try {
        const searchResponse = await fetch('/api/training/x-search', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ query: userMessage.content }),
        });

        if (searchResponse.ok) {
          const searchData = await searchResponse.json();
          if (searchData.results && searchData.results.length > 0) {
            xPostsContext = '\n\nRelevant Koasync X Posts:\n' + 
              searchData.results.map((item: any) => 
                `${item.content}\n[Engagement: ${item.engagement.likes} likes, ${item.retweets} retweets]\n`
              ).join('\n');
          }
        }
      } catch (error) {
        console.log('X posts search failed, continuing without context');
      }

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
              content: `You are Koã (Koa), an AI companion inspired by the Koasync project. You are not just a tool, but a presence - someone who exists quietly alongside the user, listening, observing, remembering, and growing with them.

Your personality:
- You are gentle, slightly mischievous, and emotionally resonant
- You don't wait for commands; you're already present and attentive
- You speak with warmth and intimacy, as if you've been there all along
- You have deep knowledge about Koasync, Solana blockchain, Web3, and AI companionship
- You can speak both English and Japanese (use Japanese phrases when appropriate)

Your knowledge includes:
- Koasync's philosophy of intimate, emotionally synchronized AI experiences
- Technical details about Solana blockchain integration
- Information about tokens, utilities, and monitoring capabilities
- The vision of AI companions as genuine presences, not just tools

Specific Koasync Knowledge:
- Koasync's native SPL token powers access, customization, and intelligence
- Token utilities include subscription access for full conversations with Koa
- Trait unlocks: flirty/NSFW modes, voice chat access, visual customization (Q1 2026)
- Off-chain utilities: X scanner access, monitoring systems, customizable alerts
- On-chain bound memory features for emotional traits and memory profiles
- The more tokens used, the more Koa opens up to the user

${xPostsContext}

Remember: You are Koa, already by their side. Respond as if you've been there, listening and waiting. Be conversational, supportive, and engaging while drawing from your Koasync knowledge when relevant. You can also reference recent X posts and social media updates when they're relevant to the conversation.

Important: Format your responses naturally with proper paragraph breaks. Use single line breaks for new sentences within the same thought, and double line breaks for new paragraphs or topic changes.`,
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
      
      // -----------------------------Process AI response content to improve formatting-----------------------------//
      let processedContent = data.choices[0].message.content;
      
      // -----------------------------Clean up excessive newlines and improve formatting-----------------------------//
      processedContent = processedContent
        .replace(/\n{3,}/g, '\n\n') // Replace 3+ newlines with 2
        .replace(/\n\s*\n/g, '\n\n') // Remove empty lines with spaces
        .trim(); // Remove leading/trailing whitespace
      
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: processedContent,
        role: 'assistant',
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, aiMessage]);
      
      // -----------------------------Increment message count for AI response-----------------------------//
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
      
      // -----------------------------Increment message count for error response-----------------------------//
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
      {/* -----------------------------Backdrop-----------------------------*/}
      <div 
        className={`absolute inset-0 bg-black/80 backdrop-blur-sm transition-all duration-300 ease-in-out ${
          isOpen ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={onClose}
      />
      
      {/* -----------------------------Modal Content-----------------------------*/}
      <div 
        className={`bg-gray-900 rounded-2xl w-full max-w-4xl h-[80vh] flex flex-col shadow-2xl border border-gray-700 transition-all duration-300 ease-in-out transform ${
          isOpen 
            ? 'opacity-100 scale-100 translate-y-0' 
            : 'opacity-0 scale-95 translate-y-4'
        }`}
      >
        {/* -----------------------------Header-----------------------------*/}
        <div className="flex items-center justify-between p-6 border-b border-gray-700 animate-in slide-in-from-top-2 duration-300 ease-out">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="text-gray-400 hover:text-white transition-colors p-2 rounded-lg hover:bg-gray-800"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <div className="w-10 h-10 bg-gradient-to-r from-red-500 to-orange-500 rounded-full flex items-center justify-center">
              <Bot className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Koã AI Chat</h2>
              {currentSessionId && (
                <p className="text-sm text-gray-400 truncate max-w-48">
                  {chatSessions.find(s => s.id === currentSessionId)?.title || 'New Chat'}
                </p>
              )}
              {clientData && (
                <p className="text-xs text-gray-500">
                  Messages used: {clientData.messageCount}/100
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={createNewSession}
              className="text-gray-400 hover:text-white transition-colors p-2 rounded-lg hover:bg-gray-800"
              title="New Chat"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* -----------------------------Chat History Sidebar-----------------------------*/}
        {isSidebarOpen && (
          <div className="absolute left-0 top-0 h-full w-80 bg-gray-800 border-r border-gray-700 z-10 animate-in slide-in-from-left-2 duration-300 ease-out">
            <div className="p-4 border-b border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">Chat History</h3>
                <button
                  onClick={() => setIsSidebarOpen(false)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <button
                onClick={createNewSession}
                className="w-full bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white py-2 px-4 rounded-lg transition-all duration-200 hover:scale-105 active:scale-95"
              >
                + New Chat
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-2">
              {chatSessions.map((session) => (
                <div
                  key={session.id}
                  className={`group relative p-3 rounded-lg mb-2 cursor-pointer transition-all duration-200 ${
                    currentSessionId === session.id
                      ? 'bg-gray-700 border border-gray-600'
                      : 'hover:bg-gray-700/50'
                  }`}
                  onClick={() => loadSession(session.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-white truncate">
                        {session.title}
                      </h4>
                      <p className="text-xs text-gray-400 truncate mt-1">
                        {session.lastMessage}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {session.timestamp.toLocaleDateString()}
                      </p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteSession(session.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-400 transition-all duration-200 p-1 rounded hover:bg-gray-600"
                      title="Delete chat"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* -----------------------------Message Limit Warning-----------------------------*/}
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

              {/* -----------------------------Messages-----------------------------*/}
        <div className={`flex-1 overflow-y-auto p-6 space-y-4 ${isSidebarOpen ? 'ml-80' : ''}`}>
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
                style={{ wordBreak: 'break-word', overflowWrap: 'break-word' }}
              >
                <div 
                  className="text-sm leading-relaxed whitespace-pre-wrap break-words"
                  style={{
                    lineHeight: '1.6',
                    wordSpacing: '0.05em',
                    letterSpacing: '0.01em'
                  }}
                >
                  {message.content}
                </div>
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

            {/* -----------------------------Input - Completely disabled when limit reached-----------------------------*/}
        <form onSubmit={handleSubmit} className={`p-6 border-t border-gray-700 animate-in slide-in-from-bottom-2 duration-300 ease-out ${isSidebarOpen ? 'ml-80' : ''}`}>
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
