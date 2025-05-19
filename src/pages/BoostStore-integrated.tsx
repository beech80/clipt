import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import {
  Rocket,
  Zap,
  Star,
  Trophy,
  Flame,
  Crown,
  Timer,
  Package,
  Check,
  Send,
  PlusCircle
} from 'lucide-react';

// Define boost types interface for type safety
interface BoostType {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  tokenCost: number;
  duration: string;
  effectStrength: string;
  color: string;
  glowColor: string;
}

// Define message types for the chat interface
type MessageSender = 'bot' | 'user' | 'system';

interface ChatMessage {
  id: string;
  content: string;
  sender: MessageSender;
  timestamp: Date;
  boostCard?: BoostType; // Optional boost card embedded in message
  isTyping?: boolean;
}

const BoostStore = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [tokenBalance, setTokenBalance] = useState(2500);
  const [activeBoost, setActiveBoost] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      content: "Welcome to the Pro Streamer Boost Shop! I'm FragStorm, your AI assistant.",
      sender: 'bot',
      timestamp: new Date()
    },
    {
      id: '2',
      content: "I'll help you find the perfect streaming powerups to dominate the trending pages and reach more viewers.",
      sender: 'bot',
      timestamp: new Date(Date.now() + 100)
    },
    {
      id: '3',
      content: "Would you like to see our available streaming boosts?",
      sender: 'bot',
      timestamp: new Date(Date.now() + 200)
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [characterAnimState, setCharacterAnimState] = useState('idle');
  const conversationEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Define boost types with user-specified boosts
  const boostTypes: BoostType[] = [
    {
      id: 'squad-blast',
      name: "Squad Blast",
      description: "Push your clip to ALL of your friends' Squads Page for 24 hours. Increases viewer engagement by 40%.",
      icon: <Rocket className="h-7 w-7 text-cyan-400" />,
      tokenCost: 40,
      duration: '24 hours',
      effectStrength: 'Squad Push',
      color: 'from-cyan-500 to-blue-700',
      glowColor: 'cyan'
    },
    {
      id: 'chain-reaction',
      name: "Chain Reaction",
      description: "Each like/comment/share spreads clip to 5 more users for 6h (stackable). Multiplies engagement by 3x.",
      icon: <Star className="h-7 w-7 text-amber-400" />,
      tokenCost: 60,
      duration: '6 hours',
      effectStrength: 'Viral Spread',
      color: 'from-amber-500 to-orange-600',
      glowColor: 'amber'
    },
    {
      id: 'king-now',
      name: "I'm the King Now",
      description: "Places stream in Top 10 for the selected game category on the main live page for 2 hours + golden crown badge.",
      icon: <Crown className="h-7 w-7 text-purple-400" />,
      tokenCost: 80,
      duration: '2 hours',
      effectStrength: 'Top Game Ranking',
      color: 'from-purple-600 to-indigo-800',
      glowColor: 'purple'
    },
    {
      id: 'stream-surge',
      name: "Stream Surge",
      description: "Pushes stream to 200+ active viewers in its genre for 30 mins + trending badge.",
      icon: <Flame className="h-7 w-7 text-red-400" />,
      tokenCost: 50,
      duration: '30 minutes',
      effectStrength: 'Trending',
      color: 'from-red-500 to-pink-700',
      glowColor: 'red'
    }
  ];

  // Helper to get the proper color class based on glow color
  const getBoostBgColor = (color: string) => {
    switch (color) {
      case 'cyan': return 'cyan';
      case 'amber': return 'amber';
      case 'purple': return 'purple';
      case 'red': return 'red';
      default: return 'indigo';
    }
  };
  
  // Generate a unique ID for messages
  const generateId = () => Math.random().toString(36).substring(2, 9);
  
  // Add a bot message with typing animation
  const addBotMessage = (messageContent: string, delay = 800, boostCard?: BoostType) => {
    setIsTyping(true);
    setCharacterAnimState('pointing');
    
    setTimeout(() => {
      setIsTyping(false);
      setMessages(prev => [...prev, {
        id: generateId(),
        content: messageContent,
        sender: 'bot',
        timestamp: new Date(),
        boostCard
      }]);
      setCharacterAnimState('idle');
    }, delay);
  };
  
  // Add a user message
  const addUserMessage = (messageContent: string) => {
    setMessages(prev => [...prev, {
      id: generateId(),
      content: messageContent,
      sender: 'user',
      timestamp: new Date()
    }]);
  };
  
  // Add a system message (notifications, status updates)
  const addSystemMessage = (messageContent: string) => {
    setMessages(prev => [...prev, {
      id: generateId(),
      content: messageContent,
      sender: 'system',
      timestamp: new Date()
    }]);
  };
  
  // Show all available boosts in the chat
  const showAvailableBoosts = () => {
    addBotMessage("Here are the streaming powerups we have available:");
    
    // Introduce each boost with a slight delay between messages
    boostTypes.forEach((boost, index) => {
      setTimeout(() => {
        addBotMessage(
          `${boost.name} - ${boost.description}`,
          0,
          boost
        );
      }, (index + 1) * 800);
    });
    
    // Add follow-up message
    setTimeout(() => {
      addBotMessage("Which streaming boost would you like to know more about?", (boostTypes.length + 1) * 800);
    }, boostTypes.length * 800);
  };
  
  // Activate a boost
  const activateBoost = async (boost: BoostType) => {
    if (!user) {
      addBotMessage("You need to be logged in to activate boosts. Would you like to sign in?");
      return;
    }
    
    // Check if user has enough tokens
    if (tokenBalance < boost.tokenCost) {
      setCharacterAnimState('confused');
      addBotMessage(`You don't have enough tokens for ${boost.name}. You need ${boost.tokenCost} tokens.`);
      addBotMessage("You can earn more by streaming regularly, winning tournaments, or completing challenges!");
      return;
    }
    
    try {
      setIsProcessing(true);
      addSystemMessage(`Processing ${boost.name} activation...`);
      
      // Optimistic UI update
      setTokenBalance(prev => prev - boost.tokenCost);
      
      // Show character reaction
      setCharacterAnimState('excited');
      
      // Simulate processing (would connect to your actual backend)
      setTimeout(() => {
        // Set as active boost
        setActiveBoost(boost.id);
        
        // Show success message
        toast.success(`${boost.name} activated successfully!`);
        addSystemMessage(`✅ ${boost.name} activated successfully!`);
        
        addBotMessage(`Streaming boost activated! Your ${boost.name} is now live!`);
        addBotMessage(`It will be active for ${boost.duration}. Time to dominate the trending page!`);
        
        setIsProcessing(false);
      }, 1500);
      
    } catch (err) {
      console.error('Error purchasing boost:', err);
      // Revert optimistic UI update
      setTokenBalance(prev => prev + boost.tokenCost);
      toast.error('Failed to purchase boost. Please try again.');
      
      setCharacterAnimState('confused');
      addSystemMessage("❌ Error activating boost");
      addBotMessage("There seems to be a server lag issue! The boost purchase didn't go through. Let's try again in a moment.");
      setIsProcessing(false);
    }
  };
  
  // Handle user sending a message
  const handleSendMessage = () => {
    if (!inputMessage.trim()) return;
    
    // Add user message to chat
    addUserMessage(inputMessage);
    
    // Process user input
    processUserInput(inputMessage);
    
    // Clear input field
    setInputMessage('');
    
    // Focus back on input
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };
  
  // Simple NLP to process user messages
  const processUserInput = (input: string) => {
    const normalizedInput = input.toLowerCase();
    
    // Check for boost-related queries
    if (normalizedInput.includes('show') && (normalizedInput.includes('boost') || normalizedInput.includes('powerup'))) {
      showAvailableBoosts();
      return;
    }
    
    // Check for specific boost inquiries
    for (const boost of boostTypes) {
      if (normalizedInput.includes(boost.name.toLowerCase()) || 
          normalizedInput.includes(boost.id.toLowerCase())) {
        handleBoostInquiry(boost);
        return;
      }
    }
    
    // Handle token balance inquiries
    if (normalizedInput.includes('token') && (normalizedInput.includes('balance') || normalizedInput.includes('how many'))) {
      addBotMessage(`Your current token balance is ${tokenBalance}. Need more tokens?`);
      return;
    }
    
    // Default response for other queries
    addBotMessage("Would you like to see our streaming powerups? They can help boost your viewer count and engagement!");
  };
  
  // Handle inquiry about a specific boost
  const handleBoostInquiry = (boost: BoostType) => {
    setCharacterAnimState('pointing');
    addBotMessage(`${boost.name} costs ${boost.tokenCost} tokens and lasts for ${boost.duration}.`);
    addBotMessage(`It ${boost.description}`, 1000);
    addBotMessage(`Would you like to activate ${boost.name}?`, 2000, boost);
  };
  
  // Show boosts when component mounts
  useEffect(() => {
    // Slight delay to show initial messages
    setTimeout(() => {
      showAvailableBoosts();
    }, 1500);
  }, []);
  
  // Scroll to bottom of conversation when messages change
  useEffect(() => {
    if (conversationEndRef.current) {
      conversationEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isTyping]);
  
  // Handle character animation state
  useEffect(() => {
    if (characterAnimState !== 'idle') {
      const timer = setTimeout(() => {
        setCharacterAnimState('idle');
      }, 6000);
      
      return () => clearTimeout(timer);
    }
  }, [characterAnimState]);
  
  // Keyboard shortcut for sending messages
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        handleSendMessage();
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [inputMessage]);

  return (
    <div className="relative min-h-screen bg-gradient-to-b from-[#050B1F] to-[#0A1232] overflow-hidden pb-20">
      {/* Animated stars background */}
      <div className="absolute inset-0 z-0">
        {[...Array(150)].map((_, i) => {
          const size = Math.random() * 2 + 1;
          const top = Math.random() * 100;
          const left = Math.random() * 100;
          const animDuration = Math.random() * 3 + 2;
          const delay = Math.random() * 5;
          
          return (
            <div 
              key={i}
              className="absolute rounded-full bg-white"
              style={{ 
                width: `${size}px`,
                height: `${size}px`,
                top: `${top}%`,
                left: `${left}%`,
                opacity: Math.random() * 0.7 + 0.3,
                animation: `twinkle ${animDuration}s infinite ease-in-out ${delay}s`
              }}
            />
          );
        })}
      </div>
      
      {/* Header */}
      <header className="relative z-10 px-4 pt-6 pb-4 bg-gradient-to-r from-[#0E1A3D]/80 to-[#1A123E]/80 backdrop-blur-sm border-b border-indigo-500/20">
        <div className="max-w-7xl mx-auto flex flex-col items-center justify-center relative">
          {/* Token balance indicator, positioned on the right */}
          <div className="absolute right-0 top-0">
            <div className="flex items-center px-3 py-1.5 rounded-full bg-indigo-900/30 border border-indigo-500/30">
              <span className="text-yellow-300 font-mono font-bold mr-1">{tokenBalance}</span>
              <Star className="h-4 w-4 text-yellow-300" />
            </div>
          </div>
          
          {/* Centered title with rotating icon */}
          <motion.div 
            initial={{ rotate: 0 }}
            animate={{ rotate: 360 }}
            transition={{
              duration: 50,
              repeat: Infinity,
              ease: "linear"
            }}
            className="mb-2"
          >
            <Rocket className="h-10 w-10 text-indigo-400" />
          </motion.div>
          <h1 className="text-3xl font-bold text-white tracking-wider text-center">STREAMING MARKETPLACE</h1>
        </div>
      </header>
      
      {/* Integrated Chat & Marketplace Experience */}
      <main className="relative z-10 max-w-4xl mx-auto px-4 py-6">
        <div className="rounded-xl backdrop-blur-sm bg-[#0A0E20]/70 border border-indigo-500/20 p-4 md:p-6 min-h-[70vh] flex flex-col">
          {/* FragStorm character */}
          <div className="flex justify-center mb-6">
            <div className="relative">
              <motion.div
                initial={{ y: 0 }}
                animate={{ 
                  y: characterAnimState === 'idle' ? [0, -15, 0] : 
                     characterAnimState === 'excited' ? [0, -5, -10, -5, 0] :
                     characterAnimState === 'pointing' ? [0, 5, 0] :
                     characterAnimState === 'confused' ? [0, 3, -3, 3, 0] : 0
                }}
                transition={{ 
                  duration: characterAnimState === 'idle' ? 4 : 1.5, 
                  repeat: Infinity,
                  repeatType: 'reverse'
                }}
                className="w-24 h-24 md:w-28 md:h-28 bg-contain bg-center bg-no-repeat"
                style={{ 
                  backgroundImage: "url('https://placehold.co/400x500/38037E/FFFFFF?text=FRAGSTORM')",
                  filter: "drop-shadow(0 0 15px rgba(148, 0, 255, 0.5))"
                }}
              />
              <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 px-3 py-1 bg-indigo-900/80 rounded-full border border-indigo-500/40">
                <div className="flex items-center">
                  <div className="w-2 h-2 rounded-full bg-green-500 mr-2 animate-pulse"></div>
                  <span className="text-green-400 text-xs font-mono">FragStorm AI</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Chat conversation area */}
          <div className="flex-1 overflow-y-auto space-y-4 mb-6 chat-container">
            {messages.map((msg) => (
              <AnimatePresence key={msg.id} mode="wait">
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                  className={`flex ${msg.sender === 'user' ? 'justify-end' : msg.sender === 'system' ? 'justify-center' : 'justify-start'}`}
                >
                  {msg.sender === 'system' ? (
                    <div className="px-3 py-1.5 rounded-full bg-indigo-800/40 border border-indigo-500/20 text-center">
                      <p className="text-indigo-200 text-xs">{msg.content}</p>
                    </div>
                  ) : (
                    <div className={`max-w-[80%] ${msg.sender === 'user' 
                      ? 'bg-indigo-600/50 border border-indigo-400/30 rounded-t-xl rounded-bl-xl' 
                      : 'bg-[#1A0E3D]/70 border border-purple-500/30 rounded-t-xl rounded-br-xl'}`}
                    >
                      {/* Message with optional boost card */}
                      <div className="p-3">
                        <p className="text-white text-sm">{msg.content}</p>
                        
                        {/* Boost Card - only shown in bot messages with boostCard property */}
                        {msg.sender === 'bot' && msg.boostCard && (
                          <motion.div 
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.3, duration: 0.5 }}
                            className={`mt-3 p-3 rounded-lg bg-gradient-to-br ${msg.boostCard.color} border border-${getBoostBgColor(msg.boostCard.glowColor)}-400/40 shadow-lg`}
                            style={{
                              boxShadow: activeBoost === msg.boostCard.id ? `0 0 15px rgba(var(--${msg.boostCard.glowColor}-rgb), 0.7)` : 'none',
                            }}
                          >
                            <div className="flex justify-between items-start mb-2">
                              <div className="flex items-center">
                                {msg.boostCard.icon}
                                <h3 className="text-white font-bold ml-2">{msg.boostCard.name}</h3>
                              </div>
                              <div className="bg-black/30 px-2 py-0.5 rounded-full flex items-center">
                                <span className="text-yellow-300 font-mono font-bold text-sm mr-1">{msg.boostCard.tokenCost}</span>
                                <Star className="h-3 w-3 text-yellow-300" />
                              </div>
                            </div>
                            
                            <div className="flex justify-between items-center text-xs text-white/70 mb-2">
                              <div className="flex items-center">
                                <Timer className="h-3 w-3 mr-1" />
                                <span>{msg.boostCard.duration}</span>
                              </div>
                              <div className="flex items-center">
                                <Trophy className="h-3 w-3 mr-1" />
                                <span>{msg.boostCard.effectStrength}</span>
                              </div>
                            </div>
                            
                            {/* Apply button */}
                            <Button 
                              onClick={() => activateBoost(msg.boostCard!)}
                              className={`text-xs bg-${getBoostBgColor(msg.boostCard.glowColor)}-900/80 hover:bg-${getBoostBgColor(msg.boostCard.glowColor)}-700/90 border border-${getBoostBgColor(msg.boostCard.glowColor)}-500/50 w-full mt-1`}
                              disabled={activeBoost === msg.boostCard.id || isProcessing || !user}
                            >
                              {activeBoost === msg.boostCard.id ? (
                                <>
                                  <Check className="h-3 w-3 mr-1" />
                                  Active
                                </>
                              ) : (
                                <>
                                  <PlusCircle className="h-3 w-3 mr-1" />
                                  Get {msg.boostCard.name} ({msg.boostCard.tokenCost})
                                </>
                              )}
                            </Button>
                          </motion.div>
                        )}
                      </div>
                      
                      {/* Avatar and timestamp */}
                      <div className={`flex items-center px-3 pb-1.5 text-xs text-slate-400 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                        {msg.sender === 'bot' && (
                          <div className="h-4 w-4 rounded-full bg-purple-600 flex items-center justify-center mr-1.5">
                            <Zap className="h-2 w-2 text-white" />
                          </div>
                        )}
                        <span>
                          {msg.timestamp.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </span>
                        {msg.sender === 'user' && (
                          <div className="h-4 w-4 rounded-full bg-blue-600 flex items-center justify-center ml-1.5">
                            <span className="text-white text-[8px] font-bold">YOU</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            ))}
            
            {/* Typing indicator */}
            {isTyping && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex justify-start"
              >
                <div className="bg-[#1A0E3D]/70 border border-purple-500/30 rounded-t-xl rounded-br-xl p-3">
                  <div className="flex space-x-2">
                    <div className="w-2 h-2 rounded-full bg-purple-400 animate-bounce" 
                      style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 rounded-full bg-purple-400 animate-bounce" 
                      style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 rounded-full bg-purple-400 animate-bounce" 
                      style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </motion.div>
            )}
            
            {/* Anchor for auto-scroll */}
            <div ref={conversationEndRef} />
          </div>
          
          {/* Message input area */}
          <div className="flex items-center bg-indigo-900/30 border border-indigo-500/30 rounded-full p-1 pl-4">
            <input
              type="text"
              ref={inputRef}
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Ask about streaming boosts..."
              className="flex-1 bg-transparent border-none outline-none text-white placeholder-indigo-300"
            />
            <Button
              onClick={handleSendMessage}
              disabled={!inputMessage.trim() || isProcessing}
              className="rounded-full h-9 w-9 p-0 bg-indigo-600 hover:bg-indigo-500"
            >
              <Send className="h-4 w-4 text-white" />
            </Button>
          </div>
          
          {/* Quick actions */}
          <div className="mt-4 flex items-center justify-center space-x-2">
            <Button
              onClick={() => showAvailableBoosts()}
              className="bg-indigo-900/50 hover:bg-indigo-800/70 border border-indigo-500/50 text-white text-xs rounded-full px-4"
            >
              Show All Boosts
            </Button>
            
            <Button
              onClick={() => addUserMessage("How do I earn more tokens?")}
              className="bg-purple-900/50 hover:bg-purple-800/70 border border-purple-500/50 text-white text-xs rounded-full px-4"
            >
              Earn Tokens
            </Button>
            
            <Button
              onClick={() => addUserMessage("Give me pro streaming tips!")}
              className="bg-red-900/50 hover:bg-red-800/70 border border-red-500/50 text-white text-xs rounded-full px-4"
            >
              Pro Tips
            </Button>
          </div>
        </div>
      </main>

      {/* Add CSS for twinkling stars animation */}
      <style jsx>{`
        @keyframes twinkle {
          0% { opacity: 0.3; }
          50% { opacity: 1; }
          100% { opacity: 0.3; }
        }
        
        .chat-container::-webkit-scrollbar {
          width: 6px;
        }
        
        .chat-container::-webkit-scrollbar-track {
          background: rgba(10, 14, 32, 0.3);
          border-radius: 10px;
        }
        
        .chat-container::-webkit-scrollbar-thumb {
          background: rgba(99, 102, 241, 0.4);
          border-radius: 10px;
        }
        
        .chat-container::-webkit-scrollbar-thumb:hover {
          background: rgba(99, 102, 241, 0.6);
        }
      `}</style>
    </div>
  );
};

export default BoostStore;
