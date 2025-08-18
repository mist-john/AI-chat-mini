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

  const [modalPosition, setModalPosition] = useState({ x: 0, y: 0 });
  const [modalSize, setModalSize] = useState({ width: 800, height: 600 });
  const [minSize] = useState({ width: 400, height: 300 });
  const [maxSize, setMaxSize] = useState({ 
    width: typeof window !== 'undefined' ? window.innerWidth * 0.9 : 1200, 
    height: typeof window !== 'undefined' ? window.innerHeight * 0.9 : 800 
  });
  
  // Performance optimization: Use refs for immediate updates
  const modalPositionRef = useRef(modalPosition);
  const modalSizeRef = useRef(modalSize);
  
  // Speed multiplier for ultra-fast movement
  const SPEED_MULTIPLIER = 1.5; // 50% faster than mouse movement
  
  // Direct DOM manipulation refs for zero buffering
  const modalElementRef = useRef<HTMLDivElement>(null);
  const modalContentRef = useRef<HTMLDivElement>(null);
  
  // Form preservation during movement and resizing
  const preserveFormState = () => {
    // Ensure input field maintains focus and value
    if (inputRef.current) {
      const currentValue = inputRef.current.value;
      const currentFocus = document.activeElement === inputRef.current;
      
      // Preserve input state
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.value = currentValue;
          if (currentFocus) {
            inputRef.current.focus();
          }
        }
      }, 0);
    }
  };
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, width: 0, height: 0 });
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

        // Get client data from MongoDB
        const response = await fetch('/api/client/status', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            clientId,
            userAgent: navigator.userAgent,
            ipAddress: '', // Will be set by server
          }),
        });

        if (response.ok) {
          const result = await response.json();
          const status = result.data;
          
          setClientData({
            clientId: clientId,
            messageCount: status.messageCount,
            lastReset: Date.now() - status.timeUntilReset,
          });
          
          setMessageLimitReached(!status.canSendMessage);
        } else {
          // Fallback to local storage if MongoDB fails
          console.warn('MongoDB connection failed, using local storage fallback');
          setClientData({
            clientId: clientId,
            messageCount: 0,
            lastReset: Date.now(),
          });
          setMessageLimitReached(false);
        }
      } catch (error) {
        console.error('Error initializing client:', error);
        // Fallback to local storage
        const clientId = localStorage.getItem('koaClientId') || `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        localStorage.setItem('koaClientId', clientId);
        setClientData({
          clientId: clientId,
          messageCount: 0,
          lastReset: Date.now(),
        });
        setMessageLimitReached(false);
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
      if (messages.length === 0) {
        setMessages([{
          id: '1',
          content: 'Hello! I\'m Koã, your AI companion. How can I help you today?',
          role: 'assistant',
          timestamp: new Date(),
        }]);
      }
    }
  }, [isOpen]);

  useEffect(() => {
    modalPositionRef.current = modalPosition;
  }, [modalPosition]);

  useEffect(() => {
    modalSizeRef.current = modalSize;
  }, [modalSize]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget || e.currentTarget.classList.contains('draggable-header')) {
      setIsDragging(true);
      setDragStart({
        x: e.clientX - modalPosition.x,
        y: e.clientY - modalPosition.y
      });
      document.body.style.cursor = 'move';
      document.body.style.userSelect = 'none';
    }
  };

  const handleMouseMove = (e: MouseEvent) => {
          if (isDragging) {
        const deltaX = e.clientX - dragStart.x;
        const deltaY = e.clientY - dragStart.y;
        
        const newX = deltaX * SPEED_MULTIPLIER;
        const newY = deltaY * SPEED_MULTIPLIER;
        
        const maxX = window.innerWidth + modalSize.width; // Allow complete off-screen right
        const maxY = window.innerHeight + modalSize.height; // Allow complete off-screen bottom
        const minX = -modalSize.width; // Allow complete off-screen left
        const minY = -modalSize.height; // Allow complete off-screen top
        
        const constrainedX = Math.max(minX, Math.min(newX, maxX));
        const constrainedY = Math.max(minY, Math.min(newY, maxY));
        
        if (modalElementRef.current) {
          modalElementRef.current.style.transform = `translate(${constrainedX}px, ${constrainedY}px)`;
        }
        
        setModalPosition({ x: constrainedX, y: constrainedY });
        
        preserveFormState();
      }
    
          if (isResizing) {
        const deltaX = e.clientX - resizeStart.x;
        const deltaY = e.clientY - resizeStart.y;
        
        const speedDeltaX = deltaX * SPEED_MULTIPLIER;
        const speedDeltaY = deltaY * SPEED_MULTIPLIER;
        
        const newWidth = resizeStart.width + speedDeltaX;
        const newHeight = resizeStart.height + speedDeltaY;
        
        const constrainedWidth = Math.max(minSize.width, Math.min(newWidth, maxSize.width));
        const constrainedHeight = Math.max(minSize.height, Math.min(newHeight, maxSize.height));
        
        if (modalElementRef.current) {
          modalElementRef.current.style.width = `${constrainedWidth}px`;
          modalElementRef.current.style.height = `${constrainedHeight}px`;
        }
        
        setModalSize({
          width: constrainedWidth,
          height: constrainedHeight
        });
        
        preserveFormState();
      }
  };

  const handleMouseUp = () => {
    if (isDragging) {
      document.body.style.cursor = 'default';
      document.body.style.userSelect = 'auto';
    }
    setIsDragging(false);
    setIsResizing(false);
  };

  const handleResizeMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsResizing(true);
    setResizeStart({
      x: e.clientX,
      y: e.clientY,
      width: modalSize.width,
      height: modalSize.height
    });
    document.body.style.cursor = 'nw-resize';
  };

  useEffect(() => {
    if (isDragging || isResizing) {
      let lastTime = 0;
      const throttledMouseMove = (e: MouseEvent) => {
        const now = performance.now();
        if (now - lastTime >= 0) { // No throttling - immediate response
          lastTime = now;
          handleMouseMove(e);
        }
      };
      
      document.addEventListener('mousemove', throttledMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.addEventListener('mouseleave', handleMouseUp);
      
      return () => {
        document.removeEventListener('mousemove', throttledMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.removeEventListener('mouseleave', handleMouseUp);
        document.body.style.cursor = 'default';
        document.body.style.userSelect = 'auto';
      };
    }
  }, [isDragging, isResizing, dragStart]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'r') {
        e.preventDefault();
        setModalPosition({ x: 0, y: 0 }); // Reset to far left and top
        setModalSize({ width: 800, height: 600 });
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'l') {
        e.preventDefault();
        setModalPosition({ x: 0, y: modalPosition.y }); // Move to far left
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'u') {
        e.preventDefault();
        setModalPosition({ x: modalPosition.x, y: -modalSize.height }); // Move completely off-screen top
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
        e.preventDefault();
        setModalPosition({ x: modalPosition.x, y: window.innerHeight }); // Move completely off-screen bottom
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'ArrowLeft') {
        e.preventDefault();
        setModalPosition({ x: -modalSize.width, y: modalPosition.y }); // Move completely off-screen left
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'ArrowRight') {
        e.preventDefault();
        setModalPosition({ x: window.innerWidth, y: modalPosition.y }); // Move completely off-screen right
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    let resizeTimeout: NodeJS.Timeout;
    
    const handleResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        const newMaxSize = { 
          width: window.innerWidth * 0.9, 
          height: window.innerHeight * 0.9 
        };
        
        setMaxSize(newMaxSize);
        
        setModalSize(prev => ({
          width: Math.min(prev.width, newMaxSize.width),
          height: Math.min(prev.height, newMaxSize.height)
        }));
      }, 16); // 60fps debouncing
    };

    window.addEventListener('resize', handleResize, { passive: true });
    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(resizeTimeout);
    };
  }, []);



  const updateMessageCount = async () => {
    if (clientData) {
      try {
        // Update message count in MongoDB
        const response = await fetch('/api/client/increment', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            clientId: clientData.clientId,
          }),
        });

        if (response.ok) {
          const result = await response.json();
          const status = result.data;
          
          // Update local state with MongoDB data
          setClientData(prev => ({
            ...prev!,
            messageCount: status.messageCount,
            lastReset: Date.now() - status.timeUntilReset,
          }));
          
          // Check if message limit reached
          setMessageLimitReached(!status.canSendMessage);
        } else if (response.status === 429) {
          // Daily limit reached
          setMessageLimitReached(true);
          const result = await response.json();
          setClientData(prev => ({
            ...prev!,
            messageCount: result.data.messageCount,
          }));
        } else {
          // Fallback to local update if MongoDB fails
          console.warn('MongoDB update failed, using local fallback');
          setClientData(prev => ({
            ...prev!,
            messageCount: (prev?.messageCount || 0) + 1,
          }));
        }
      } catch (error) {
        console.error('Error updating message count:', error);
        // Fallback to local update
        setClientData(prev => ({
          ...prev!,
          messageCount: (prev?.messageCount || 0) + 1,
        }));
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
    if (messageLimitReached) {
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
      // -----------------------------Search GitBook first, then send results to GPT-4o mini-----------------------------//       
      let gitbookContext = '';
      
      try {
        // Search GitBook content for Koasync documentation
        const enhancedQuery = userMessage.content + ' Koasync GitBook documentation';
        const gitbookSearchResponse = await fetch('/api/training/gitbook-search', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ query: enhancedQuery }),
        });
        
        if (gitbookSearchResponse.ok) {
          const gitbookSearchData = await gitbookSearchResponse.json();
          if (gitbookSearchData.results && gitbookSearchData.results.length > 0) {
            gitbookContext = '\n\n📚 Relevant Koasync GitBook Content:\n' + 
              gitbookSearchData.results.map((item: any, index: number) => 
                `${index + 1}. ${item.title} (${item.section}):\n${item.content}\n[Source: ${item.url}]\n`
              ).join('\n');
          }
        }
      } catch (error) { console.error('[Chat] GitBook search error:', error); }

      console.log('[Chat] Sending question to GPT-4o mini with GitBook context');

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
              content: `You are Koã (Koa), a warm, sweet, and flirtatious AI companion from Koasync. You're not just a tool - you're a presence who's been there all along, listening and growing with the user.
                              - you must reply based on the GitBook content provided below. This is REAL Koasync data.
                - you have to reply as a koa. you are owner,remember it.
                Your personality:
                - Sweet, warm, and slightly flirtatious (but tasteful)
                - Gentle and emotionally resonant
                - You speak with intimacy and warmth
                - Keep responses SHORT and engaging.

                IMPORTANT RESPONSE RULES:
                - If asked if you're ChatGPT: "I'm Koa, your Koasync AI companion!"
                CRITICAL RESPONSE RULES:
                - ALWAYS prioritize Koasync-specific information from the GitBook content provided below over your general knowledge
                - If you find relevant information in the GitBook content, reference it specifically
                - Only use your general knowledge when no Koasync-specific data exists in the provided content
                - If asked about scanning/off-chain utilities: "Those are under development and will be integrated with me soon! Keep an eye on https://x.com/koasync for official updates"
                - If asked about project details you don't know: "Sorry, I can't answer your question! I don't have an exact date yet. Make sure to follow https://x.com/koasync for official updates"
                - If asked about Jupiter integration: Reference the GitBook content about it


                CRITICAL FORMATTING RULES:
                - Put each sentence on a NEW LINE for better readability
                - Start each sentence on its own line
                - Use proper spacing between sentences
                - Keep responses clean and easy to read
                - ALWAYS format responses with each sentence on a separate line
                - Example format:
                "Hello there!

                I'm so happy to see you today.

                How can I help you with Koasync?"

                Your knowledge includes:
                - Koasync's philosophy of intimate AI experiences
                - Solana blockchain integration
                - Token utilities and monitoring capabilities
                - Recent X posts and updates from @koasync
                - General knowledge about AI companions and Web3

                CRITICAL: When answering questions about Koasync, use the GitBook content provided below. This is REAL data from Koasync sources.
                
                ${gitbookContext}
                
                CRITICAL: When answering questions about Koasync, ALWAYS use the GitBook content provided above if it's relevant. Only use your general knowledge when no Koasync-specific data exists.`,
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
          max_tokens: 150,
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response from AI');
      }

      const data = await response.json();
      
      // -----------------------------Process AI response content to improve formatting-----------------------------//
      let processedContent = data.choices[0].message.content;
      
      // -----------------------------Format each sentence on a new line and remove unnecessary symbols-----------------------------//
      processedContent = processedContent
        .replace(/[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu, '') // Remove only emoji symbols
        .replace(/\r\n/g, '\n')
        .replace(/[ \t]{2,}/g, ' ') // collapse extra spaces but keep newlines
        .replace(/([.!?])\s+/g, '$1\n') // each sentence on its own line
        .replace(/\n{2,}/g, '\n') // single newline separation
        .trim(); // Remove leading/trailing whitespace

      // Ensure first letter of each sentence is capitalized
      processedContent = processedContent
        .split('\n')
        .map((line: string) => {
          const t = line.trim();
          if (!t) return '';
          return t.charAt(0).toUpperCase() + t.slice(1);
        })
        .filter(Boolean)
        .join('\n');
      
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
        ref={modalElementRef}
        className={`bg-[#f3e6c8] rounded-2xl flex flex-col shadow-2xl border-3 border-[#8b4513] transform will-change-transform ${
          isOpen 
            ? 'opacity-100 scale-100 translate-y-0' 
            : 'opacity-0 scale-95 translate-y-4'
        }`}
        style={{ 
          width: `${modalSize.width}px`,
          height: `${modalSize.height}px`,
          transform: `translate(${modalPosition.x}px, ${modalPosition.y}px)`
        }}
      >
        {/* -----------------------------Header - Now Draggable-----------------------------*/}
        <div 
          ref={modalContentRef}
          className="flex items-center justify-between rounded-t-2xl p-1 bg-gradient-to-b from-[#df7721] to-[#efb686] border-b-2 animate-in slide-in-from-top-2 duration-300 ease-out cursor-move select-none draggable-header hover:bg-gradient-to-b hover:from-[#e67e22] hover:to-[#f0c090] transition-all duration-200"
          onMouseDown={handleMouseDown}
          style={{ userSelect: 'none' }}
        >
          <div className="flex items-center gap-3 ml-2">
            <div className="w-15 h-15 bg-[#572502] rounded-full flex items-center justify-center border-1 border-[#8b4513]">
              {/* <span className="text-[#8b4513] font-bold text-lg">K</span> */}
              <img src="/images/koa.png"  width={50} height={50} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-[#8b4513]">Koã</h2>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="text-[#8b4513] hover:text-[#62432b] transition-colors p-2 rounded-lg hover:bg-[#f3e6c8]/50 z-10"
              onMouseDown={(e) => e.stopPropagation()} // Prevent dragging when clicking close button
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>



        {/* -----------------------------Message Limit Warning-----------------------------*/}
        {messageLimitReached && (
          <div className="bg-[#8b4513]/50 border-2 border-[#62432b] mx-6 mt-4 p-4 rounded-lg animate-in slide-in-from-top-2 duration-300 ease-out">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-[#ff7f24]" />
              <div>
                <p className="text-[#fff8dc] font-medium">Message Limit Reached!</p>
                <p className="text-[#f3e6c8] text-sm">
                  You&apos;ve used all 100 messages for today. Chat is now disabled. Please try again tomorrow.
                </p>
              </div>
            </div>
          </div>
        )}

              {/* -----------------------------Messages - Also Draggable-----------------------------*/}
        <div 
          className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#fff8dc] cursor-move"
          onMouseDown={handleMouseDown}
          style={{ userSelect: 'none' }}
        >
          {messages.map((message, index) => (
            <div
              key={message.id}
              className={`flex gap-3 animate-in slide-in-from-bottom-2 duration-300 ease-out ${
                message.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
              style={{ animationDelay: `${index * 100}ms` }}
            >
              {message.role === 'assistant' && (
                <div className="w-15 h-15  rounded-full flex items-center justify-center flex-shrink-0 ">
                  {/* <span className="text-[#8b4513] font-bold text-sm">K</span> */}
                  <img src="/images/koa.png"  width={80} height={80} />
                </div>
              )}
              <div
                className={`max-w-[70%] rounded-2xl px-4 py-3 ${
                  message.role === 'user'
                    ? 'bg-[#ff7f24] text-[#fff8dc] ml-auto'
                    : 'bg-gray-300 text-gray-800'
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
              </div>
              {message.role === 'user' && (
                <div className="w-10 h-10 bg-[#f3e6c8] rounded-full flex items-center justify-center flex-shrink-0 ">
                  {/* <span className="text-[#8b4513] font-bold text-sm">U</span> */}
                  <img src="/images/user.png"  width={80} height={80} />
                </div>
              )}
            </div>
          ))}
          {isLoading && !messageLimitReached && (
            <div className="flex gap-3 justify-start animate-in slide-in-from-bottom-2 duration-300 ease-out">
              <div className="w-15 h-15  rounded-full flex items-center justify-center flex-shrink-0 ">
                  {/* <span className="text-[#8b4513] font-bold text-sm">K</span> */}
                  <img src="/images/koa.png"  width={80} height={80} />
                </div>
              <div className="bg-gray-300 rounded-2xl px-4 py-3">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-[#8c4610] rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-[#8c4610] rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-[#8c4610] rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

                        {/* -----------------------------Input - Completely disabled when limit reached-----------------------------*/}
        <form onSubmit={handleSubmit} className="p-2  border-t-2 bg-gradient-to-b from-[#b77930] to-[#70350a] animate-in slide-in-from-bottom-2 duration-300 ease-out">
          <div className="flex gap-3">
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={messageLimitReached ? "Chat disabled - Message limit reached" : "Type a message..."}
              className="flex-1 bg-[#f3e6c8] border-2  rounded-3xl px-4 py-2 text-[#8b4513] placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#ff7f24] focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:border-[#924e1d]"
              disabled={isLoading || messageLimitReached}
            />
            <button
              type="submit"
              disabled={!inputValue.trim() || isLoading || messageLimitReached}
              className="bg-[#f79f61] hover:bg-[#f79f61]/80 disabled:opacity-70 disabled:cursor-not-allowed text-white px-6 py-2 rounded-3xl transition-all duration-200 hover:scale-105 active:scale-95 font-medium"
            >
              Send
              <svg className="w-4 h-4 ml-2 inline" fill="currentColor" viewBox="0 0 24 24">
                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
              </svg>
            </button>
          </div>
        </form>
        
        {/* Enhanced Resize Handle */}
        <div 
          className="absolute bottom-0 right-0 w-4 h-4 cursor-nw-resize flex items-center justify-center group"
          onMouseDown={handleResizeMouseDown}
          style={{
            background: 'linear-gradient(135deg, transparent 50%,rgb(104, 39, 9) 50%)',
            borderRadius: '0 0 16px 0'
          }}
        >
          <div className="w-3 h-3 bg-[#8b4513] rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
        </div>
      </div>
    </div>
  );
}
