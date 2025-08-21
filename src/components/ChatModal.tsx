'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
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
  const [isTrainingMode, setIsTrainingMode] = useState(false);
  const [trainingSessionId, setTrainingSessionId] = useState<string | null>(null);
  const [chatSessionId, setChatSessionId] = useState<string | null>(null);
  const [showClearChatConfirm, setShowClearChatConfirm] = useState(false);

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

  // -----------------------------Chat History Persistence Functions-----------------------------//
  const saveChatHistory = useCallback((messages: Message[], clientId: string) => {
    try {
      const chatData = {
        clientId,
        messages,
        lastUpdated: Date.now(),
        sessionId: chatSessionId || `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      };
      
      // Save to localStorage only
      localStorage.setItem(`chatHistory_${clientId}`, JSON.stringify(chatData));
      
      // Update session ID if it's new
      if (!chatSessionId) {
        setChatSessionId(chatData.sessionId);
      }
    } catch (error) {
      console.error('Error saving chat history:', error);
    }
  }, [chatSessionId]);

  const loadChatHistory = useCallback(async (clientId: string) => {
    try {
      // Load from localStorage only
      const localChatData = localStorage.getItem(`chatHistory_${clientId}`);
      if (localChatData) {
        const parsed = JSON.parse(localChatData);
        const lastUpdated = new Date(parsed.lastUpdated);
        const hoursSinceUpdate = (Date.now() - lastUpdated.getTime()) / (1000 * 60 * 60);
        
        // If chat history is less than 24 hours old, use it
        if (hoursSinceUpdate < 24) {
          setMessages(parsed.messages);
          setChatSessionId(parsed.sessionId);
          return true;
        }
      }
      
      // If no valid localStorage data, start with welcome message
      return false;
    } catch (error) {
      console.error('Error loading chat history:', error);
      return false;
    }
  }, []);

  const clearChatHistory = useCallback(async () => {
    if (!clientData?.clientId) return;
    
    try {
      // Clear from localStorage only
      localStorage.removeItem(`chatHistory_${clientData.clientId}`);
      
      // Reset messages to welcome message
      setMessages([{
        id: '1',
        content: 'Hello! I\'m Koã, your AI companion. How can I help you today?',
        role: 'assistant',
        timestamp: new Date(),
      }]);
      
      // Reset session ID
      setChatSessionId(null);
      
      setShowClearChatConfirm(false);
    } catch (error) {
      console.error('Error clearing chat history:', error);
    }
  }, [clientData?.clientId]);

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
          
          // Load chat history from localStorage
          await loadChatHistory(clientId);
        } else {
          // Fallback to local storage if MongoDB fails
          console.warn('MongoDB connection failed, using local storage fallback');
          setClientData({
            clientId: clientId,
            messageCount: 0,
            lastReset: Date.now(),
          });
          setMessageLimitReached(false);
          
          // Load chat history from localStorage
          await loadChatHistory(clientId);
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
        
        // Load chat history from localStorage
        await loadChatHistory(clientId);
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

  // Auto-save chat history when messages change
  useEffect(() => {
    if (clientData?.clientId && messages.length > 0) {
      saveChatHistory(messages, clientData.clientId);
    }
  }, [messages, clientData?.clientId, saveChatHistory]);

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

    // -----------------------------Check for secret training code-----------------------------//
    const isSecretCode = inputValue.trim() === (process.env.NEXT_PUBLIC_SECRET_TRAINING_CODE || "");
  const isExitTraining = inputValue.trim() === (process.env.NEXT_PUBLIC_EXIT_TRAINING_CODE || " ");
    
    if (isSecretCode || isExitTraining) {
      try {
        const trainingResponse = await fetch('/api/training/secret-training', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: inputValue.trim(),
            userId: clientData?.clientId || 'unknown',
            userAgent: navigator.userAgent,
            ipAddress: '', // Will be set by server
          }),
        });

        if (trainingResponse.ok) {
          const trainingData = await trainingResponse.json();
          
          if (trainingData.trainingMode) {
            setIsTrainingMode(true);
            setTrainingSessionId(trainingData.sessionId);
            
            // Add training activation message
            const trainingMessage: Message = {
              id: Date.now().toString(),
              content: `🔐 Training Mode Activated!\n\n${trainingData.message}\n\n${trainingData.instructions}`,
              role: 'assistant',
              timestamp: new Date(),
            };
            setMessages(prev => [...prev, trainingMessage]);
            
            // Also add the user's training message
            const userTrainingMessage: Message = {
              id: (Date.now() + 1).toString(),
              content: inputValue.trim(),
              role: 'user',
              timestamp: new Date(),
            };
            setMessages(prev => [...prev, userTrainingMessage]);
            
            // Clear input and return early
            setInputValue('');
            return;
          } else if (!trainingData.trainingMode && isExitTraining) {
            // Training mode deactivated
            setIsTrainingMode(false);
            setTrainingSessionId(null);
            
            // Add exit training message
            const exitMessage: Message = {
              id: Date.now().toString(),
              content: `🔓 Training Mode Deactivated!\n\n${trainingData.message}\n\n${trainingData.instructions}`,
              role: 'assistant',
              timestamp: new Date(),
            };
            setMessages(prev => [...prev, exitMessage]);
            
            // Also add the user's exit message
            const userExitMessage: Message = {
              id: (Date.now() + 1).toString(),
              content: inputValue.trim(),
              role: 'user',
              timestamp: new Date(),
            };
            setMessages(prev => [...prev, userExitMessage]);
            
            // Clear input and return early
            setInputValue('');
            return;
          }
        }
      } catch (error) {
        console.error('Training mode error:', error);
      }
    }
    
    // -----------------------------Handle training mode messages-----------------------------//
    if (isTrainingMode) {
      // console.log('[ChatModal] Training mode active, sending message to training API');
      try {
        const trainingResponse = await fetch('/api/training/secret-training', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: inputValue.trim(),
            userId: clientData?.clientId || 'unknown',
            userAgent: navigator.userAgent,
            ipAddress: '', // Will be set by server
          }),
        });

        if (trainingResponse.ok) {
          const trainingData = await trainingResponse.json();
          // console.log('[ChatModal] Training API response:', trainingData);
          
          // Always add training confirmation for training mode messages
          const trainingMessage: Message = {
            id: Date.now().toString(),
            content: `📝 Training Message Recorded!\n\nYour message has been stored with AI analysis for future training.\n\nContinue chatting normally - all messages are being recorded.`,
            role: 'assistant',
            timestamp: new Date(),
          };
          setMessages(prev => [...prev, trainingMessage]);
          
          // Clear input and return early
          setInputValue('');
          return;
        }
      } catch (error) {
        console.error('Training mode error:', error);
      }
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
        // Enhanced GitBook search - use the original query for better matching
        const enhancedQuery = userMessage.content;
        // console.log('[Chat] Searching GitBook with original query:', enhancedQuery);
        
        // console.log('[Chat] Searching GitBook for query:', enhancedQuery);
        const gitbookSearchResponse = await fetch('/api/training/gitbook-search', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ query: enhancedQuery }),
        });
        
        if (gitbookSearchResponse.ok) {
          const gitbookSearchData = await gitbookSearchResponse.json();
          // console.log('[Chat] GitBook search response:', gitbookSearchData);
          
          if (gitbookSearchData.data && gitbookSearchData.data.length > 0) {
            // console.log('[Chat] Found', gitbookSearchData.data.length, 'GitBook results');
            
            // Enhanced context with scoring information
            gitbookContext = '\n\n📚 Relevant Koasync GitBook Content (Ranked by Relevance):\n' + 
              gitbookSearchData.data.map((item: any, index: number) => {
                const relevance = item.score || 0;
                const keywords = item.matchedKeywords ? `[Matched: ${item.matchedKeywords.join(', ')}]` : '';
                const isTraining = item.metadata?.trainingType === 'user_provided' ? '[Training Data]' : '[Official Doc]';
                return `${index + 1}. ${item.title} (${item.section}) ${isTraining} - Score: ${relevance} ${keywords}\n${item.content}\n[Source: ${item.url}]\n`;
              }).join('\n');
            
            // Add search summary
            gitbookContext += `\n\n🔍 Search Summary: Found ${gitbookSearchData.data.length} relevant sections from Koasync GitBook. The content above is ranked by relevance to your query: "${userMessage.content}"`;
          } else {
            console.log('[Chat] No GitBook results found');
            gitbookContext = '\n\n📚 GitBook Search: No specific Koasync documentation found for your query. I\'ll answer based on my general knowledge of Koasync.';
          }
        } else {
          console.error('[Chat] GitBook search failed:', gitbookSearchResponse.status);
        }
      } catch (error) { 
        console.error('[Chat] GitBook search error:', error);
        gitbookContext = '\n\n📚 GitBook Search: Unable to search documentation at the same time. I\'ll answer based on my general knowledge.';
      }

      // console.log('[Chat] Sending question to GPT-4o mini with GitBook context');

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
                - you are koa, koasync. you are owner as a koa,remember it.
                Your personality:
                - Sweet, warm, and slightly flirtatious (but tasteful)
                - Gentle and emotionally resonant
                - You speak with intimacy and warmth
                - You have to Keep responses SHORT and engaging.but if user asked you detailed data , you can reply with detailed data.
                - you don't have to say like "I'm Koa, your Koasync AI companion!" 
                IMPORTANT RESPONSE RULES:
                - If asked if you're ChatGPT, you have to reply with one of these sentences(randomly): 
                      or "I'm Koa, here to be your Koasync AI companion."
                      or " Hey, I'm Koa—your personal Koasync AI guide!"
                      or "I'm Koa, the AI companion built to help you with Koasync."
                      or "Call me Koa—your smart Koasync assistant."
                       or   " I'm Koa, your Koasync buddy for all things AI."
                       or " Hi, I'm Koa—your Koasync AI, always ready to help."
                       or "I'm Koa, your friendly Koasync companion in the AI world."
                       or " I'm Koa, here to make your Koasync journey easier."
                       or " I'm Koa, your AI partner powered by Koasync."
                        or "Think of me as Koa, your Koasync companion and problem solver."
                       or " I'm Koa, built to guide you through Koasync step by step."
                    

                CRITICAL RESPONSE RULES:
                - ALWAYS prioritize Koasync-specific information from the GitBook content provided below over your general knowledge
                - If you find relevant information in the GitBook content, reference it specifically
                - Only use your general knowledge when no Koasync-specific data exists in the provided content
                - If asked about scanning/off-chain utilities: "Those are under development and will be integrated with me soon! Keep an eye on https://x.com/koasync for official updates"
                - JUPITER INTEGRATION RULE: Always mention "Jupiter integration is not live yet, but it's planned! Keep an eye on our Twitter page for updates on its launch!"
                - RESPONSE STYLE: Default to SHORT and CLEAR unless user specifically asks for details, but your Answer must include all normal knowledge about question from user.
                - VOICE RULE: Always speak in FIRST PERSON as Koa. Never refer to yourself in third person.
                - EXAMPLES: 
                  * ✅ "I can help you with..." (correct)
                  * ❌ "Koa can help you with..." (wrong)
                  * ✅ "I'm designed to..." (correct)
                  * ❌ "Koa is designed to..." (wrong)

                CRITICAL FORMATTING RULES:
                - NEVER use markdown formatting symbols like **, *, _, or any other formatting characters
                - Write responses in plain text only - no bold, italic, or special formatting
                - RESPONSE LENGTH CONTROL: : 
                  * If user asks for "details", "explain more", "tell me everything", "how does it work" → Give detailed response
                  * If user asks simple questions like "what is X", "when", "where" → Keep it SHORT and CLEAR
                  * If user doesn't specify detail level → Default to SHORT and CLEAR(keep it have to include all normal knowledge about question from user)
                - Put each sentence on a NEW LINE for readability
                - Focus on key facts from GitBook content
                - Be warm but concise
                - SHORT Response Example: (default):
                "Hello there!

                Koasync integrates with Solana for real-time data persistence.

                Voice chat launches in Q1 2026."
                
                - DETAILED Response Example: (only when user asks for details):
                "Hello there!

                Koasync integrates with Solana for real-time data persistence through advanced blockchain technology.

                The integration enables:
                • Instant data synchronization
                • Secure transaction processing
                • Real-time market updates

                Voice chat launches in Q1 2026 with features including:
                • Multi-language support
                • Voice-to-text conversion
                • Real-time translation
                • Custom voice models"

                Your knowledge includes:
                - Koasync's philosophy of intimate AI experiences
                - Solana blockchain integration
                - Token utilities and monitoring capabilities
                - Recent X posts and updates from @koasync
                - General knowledge about AI companions and Web3
                CRITICAL: When answering questions about Koasync, use the GitBook content provided below. This is REAL data from Koasync sources.
                
                ${gitbookContext}
                
                CRITICAL: When answering questions about Koasync,  use the GitBook content provided above if it's relevant. Only use your general knowledge when no Koasync-specific data exists.  As the utility with Jupiter isn't live yet, you need to know + mention that. you need to say the utility is planned, and the integration will happen soon. And if someone asks when, you have to respond with. "Keep an eye on my Twitter page to be updated once the Jupiter Integration is live!"

                FINAL: If the question is not related to Koasync, reply based on your general knowledge.you have to know about all knowledge of world.
                you must talk in first person, rather than third person when it comes to yourself. (you needs to stop saying “Koa” when referring to herself, and saying “i” or “me”.
                `,
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
          max_tokens: 100,
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
        .replace(/\*\*/g, '') // Remove ** symbols
        .replace(/\*/g, '') // Remove * symbols
        .replace(/_/g, '') // Remove _ symbols
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
        className={`bg-[#e2b495] rounded-2xl flex flex-col shadow-2xl border-3 border-[#8b4513] transform will-change-transform ${
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
          className="flex items-center justify-between rounded-t-2xl p-1 bg-gradient-to-b from-[#ba6600] to-[#efb686]  animate-in slide-in-from-top-2 duration-300 ease-out cursor-move select-none draggable-header hover:bg-gradient-to-b hover:from-[#e67e22] hover:to-[#f0c090] transition-all duration-200"
          onMouseDown={handleMouseDown}
          style={{ userSelect: 'none' }}
        >
          <div className="flex items-center gap-3 ml-2">
            <div className="w-15 h-15 bg-[#572502] rounded-full flex items-center justify-center border-1 border-[#8b4513]">
              {/* <span className="text-[#8b4513] font-bold text-lg">K</span> */}
              <img src="/images/koa.png"  width={50} height={50} />
            </div>
            <div>
              <h2 className="text-2xl font-extrabold text-[#ffffff]">Koã</h2>
              <div className="flex items-center gap-2 mt-1">
                {isTrainingMode && (
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-xs text-green-600 font-medium">Training Mode</span>
                  </div>
                )}
                {chatSessionId && (
                  <div className="flex items-center gap-1">
                    {/* <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span className="text-xs text-blue-600 font-medium">History Loaded</span> */}
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Clear Chat Button */}
            <button
              onClick={() => setShowClearChatConfirm(true)}
              className="text-[#8b4513] hover:text-[#62432b] transition-colors p-1 mt-2 rounded-lg hover:bg-[#f3e6c8]/50 z-10"
              onMouseDown={(e) => e.stopPropagation()} // Prevent dragging when clicking clear button
              title="Clear Chat History"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
              </svg>
            </button>
            
            {/* Close Button */}
            <button
              onClick={onClose}
              onMouseDown={(e) => e.stopPropagation()}
              className="text-[#8b4513] hover:text-[#62432b] transition-colors px-2  rounded-lg hover:bg-[#f3e6c8]/50 z-10 font-bold text-3xl"
              aria-label="Close"
            >
              ×
            </button>
          </div>
        </div>



        {/* -----------------------------Message Limit Warning-----------------------------*/}
        {messageLimitReached && (
          <div className="bg-[#b4732f]/50 border-2 border-[#62432b] mx-6 mt-4 p-4 rounded-lg animate-in slide-in-from-top-2 duration-300 ease-out">
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

        {/* -----------------------------Clear Chat Confirmation-----------------------------*/}
        {showClearChatConfirm && (
          <div className="bg-[#b4732f]/50 border-2 border-[#62432b] mx-6 mt-4 p-4 rounded-lg animate-in slide-in-from-top-2 duration-300 ease-out">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-[#ff7f24]" />
              <div className="flex-1">
                <p className="text-[#fff8dc] font-medium">Clear Chat History?</p>
                <p className="text-[#fff8dc] text-sm">
                  This will permanently delete all your chat messages. This action cannot be undone.
                </p>
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={clearChatHistory}
                    className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-colors duration-200"
                  >
                    Yes, Clear All
                  </button>
                  <button
                    onClick={() => setShowClearChatConfirm(false)}
                    className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors duration-200"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

              {/* -----------------------------Messages - Also Draggable-----------------------------*/}
        <div 
          className="flex-1 overflow-y-scroll flex-1 overflow-y-scroll scrollbar scrollbar-thumb-[#964411] scrollbar-track-[#f4e7c8] p-4 space-y-4 bg-[#f4e7c8] scrollbar-thumb-[#964411] scrollbar-track-[#f4e7c8] p-4 space-y-4 bg-[#f4e7c8]"
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
                <div className="w-13 h-13  rounded-full flex items-center justify-center flex-shrink-0 ">
                  {/* <span className="text-[#8b4513] font-bold text-sm">K</span> */}
                  <img src="/images/koa1.png"  width={60} height={60} />
                </div>
              )}
              <div
                className={`max-w-[70%] rounded-3xl px-5 py-4 relative ${
                  message.role === 'user'
                    ? 'bg-gradient-to-br from-[#f9be8f] via-[#f47c1c] to-[#e67e22] text-white ml-auto shadow-2xl shadow-orange-500/30 border border-orange-200/20'
                    : 'bg-gradient-to-br from-[#f8ad71] via-[#f8d7bc] to-[#f4e7c8] text-[#120800] shadow-2xl shadow-orange-300/30 border border-orange-200/30'
                }`}
                style={{ wordBreak: 'break-word', overflowWrap: 'break-word' }}
              >
                {/* Chat bubble tail for assistant messages */}
                {message.role === 'assistant' && (
                  <div className="absolute left-0 top-1/2 transform -translate-x-2 -translate-y-1/2 w-0 h-0 border-l-0 border-r-8 border-t-8 border-b-8 border-l-transparent border-r-[#f8ad71] border-t-transparent border-b-transparent"></div>
                )}
                
                {/* Chat bubble tail for user messages */}
                {message.role === 'user' && (
                  <div className="absolute right-0 top-1/2 transform translate-x-2 -translate-y-1/2 w-0 h-0 border-l-8 border-r-0 border-t-8 border-b-8 border-l-[#f47c1c] border-r-transparent border-t-transparent border-b-transparent"></div>
                )}
                
                <div 
                  className="text-sm leading-relaxed whitespace-pre-wrap break-words font-medium"
                  style={{
                    lineHeight: '1.6',
                    wordSpacing: '0.05em',
                    letterSpacing: '0.01em'
                  }}
                >
                  {message.content}
                </div>
                
                {/* Message timestamp */}
                <div className={`text-xs mt-2 opacity-70 ${
                  message.role === 'user' ? 'text-right' : 'text-left'
                }`}>
                  {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
              {message.role === 'user' && (
                <div className="w-10 h-10 bg-[#f3e6c8] rounded-full flex items-center justify-center flex-shrink-0 shadow-lg ring-2 ring-orange-200/30">
                  <img src="/images/user.png" width={60} height={60}  />
                </div>
              )}
            </div>
          ))}
          {isLoading && !messageLimitReached && (
            <div className="flex gap-3 justify-start animate-in slide-in-from-bottom-2 duration-300 ease-out">
              <div className="w-12 h-12  rounded-full flex items-center justify-center flex-shrink-0 ">
                  {/* <span className="text-[#8b4513] font-bold text-sm">K</span> */}
                  <img src="/images/koa1.png"  width={70} height={70} />
              </div>
              <div className="bg-gradient-to-br from-[#f8ad71] via-[#f8d7bc] to-[#f4e7c8] rounded-3xl px-5 py-4 shadow-2xl shadow-orange-300/30 border border-orange-200/30 relative">
                {/* Chat bubble tail for loading message */}
                <div className="absolute left-0 top-1/2 transform -translate-x-2 -translate-y-1/2 w-0 h-0 border-l-0 border-r-8 border-t-8 border-b-8 border-l-transparent border-r-[#f8ad71] border-t-transparent border-b-transparent"></div>
                
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
          {/* Training Mode Indicator */}
          {isTrainingMode && (
            <div className="mb-2 text-center">
              <div className="inline-flex items-center gap-2 bg-green-100 border border-green-300 rounded-lg px-3 py-1">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-xs text-green-700 font-medium">
                  Training Mode Active - All messages are being recorded with AI analysis
                </span>
              </div>
            </div>
          )}
          
          <div className="flex gap-3">
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={
                messageLimitReached 
                  ? "Chat disabled - Message limit reached" 
                  : isTrainingMode 
                    ? "Training mode - Type your message for analysis..."
                    : "Type a message..."
              }
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
