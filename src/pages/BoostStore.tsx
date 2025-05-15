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
  ChevronRight,
  ChevronLeft,
  Flame,
  Crown,
  Timer,
  Package,
  Check
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

const BoostStore = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [tokenBalance, setTokenBalance] = useState(2500);
  const [activeBoost, setActiveBoost] = useState<string | null>(null);
  const [selectedBoost, setSelectedBoost] = useState<BoostType | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [conversation, setConversation] = useState<string[]>([
    "Welcome to the Pro Streamer Boost Shop! I'm your guide, FragStorm.",
    "Boosts help your streams and content dominate the trending pages and reach more viewers.",
    "Which streaming powerup would you like to learn about today?"
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const [showCharacter, setShowCharacter] = useState(true);
  const conversationEndRef = useRef<HTMLDivElement>(null);
  const characterRef = useRef<HTMLDivElement>(null);
  const [characterAnimState, setCharacterAnimState] = useState('idle');
  
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
  
  // Add character message with typing animation
  const addCharacterMessage = (messages: string[]) => {
    if (messages.length === 0) return;
    
    setIsTyping(true);
    
    // Add first message after 500ms delay
    setTimeout(() => {
      setConversation(prev => [...prev, messages[0]]);
      setIsTyping(false);
      
      // Add subsequent messages with delays
      if (messages.length > 1) {
        messages.slice(1).forEach((message, idx) => {
          setTimeout(() => {
            setIsTyping(true);
            
            setTimeout(() => {
              setConversation(prev => [...prev, message]);
              setIsTyping(false);
            }, 1000);
            
          }, (idx + 1) * 2500); // Stagger additional messages
        });
      }
    }, 500);
  };

  // Activate a boost
  const activateBoost = async (boost: BoostType) => {
    if (!user) return;
    
    // Check if user has enough tokens
    if (tokenBalance < boost.tokenCost) {
      toast.error(`Not enough tokens. Need ${boost.tokenCost} tokens.`);
      setCharacterAnimState('pointing');
      addCharacterMessage([
        "Oops! Looks like you don't have enough tokens.",
        "You can earn more by streaming regularly, winning tournaments, or completing streamer challenges!"
      ]);
      return;
    }
    
    try {
      setIsProcessing(true);
      
      // Optimistic UI update
      setTokenBalance(prev => prev - boost.tokenCost);
      
      // Show character reaction
      setCharacterAnimState('excited');
      
      // Add a new boost record (would connect to your actual backend)
      // This is a mock implementation
      setTimeout(() => {
        // Set as active boost
        setActiveBoost(boost.id);
        
        // Show success and character dialog
        toast.success(`${boost.name} activated successfully!`);
        addCharacterMessage([
          "Streaming boost activated! Your powerup is now live!",
          `Your ${boost.name} will be active for ${boost.duration}.`,
          "Time to dominate the trending page and grow your audience!"
        ]);
        
        setIsProcessing(false);
      }, 1500);
      
    } catch (err) {
      console.error('Error purchasing boost:', err);
      // Revert optimistic UI update
      setTokenBalance(prev => prev + boost.tokenCost);
      toast.error('Failed to purchase boost. Please try again.');
      
      setCharacterAnimState('confused');
      addCharacterMessage([
        "Hmm, there seems to be a server lag issue!",
        "The boost purchase didn't go through. Let's try again in a moment."
      ]);
      setIsProcessing(false);
    }
  };

  // Select a boost to view details
  const handleSelectBoost = (boost: BoostType) => {
    setSelectedBoost(boost);
    setCharacterAnimState('pointing');
    
    // Add character message explaining the boost
    addCharacterMessage([
      `Let me tell you about ${boost.name}!`,
      boost.description,
      `It costs ${boost.tokenCost} tokens and lasts for ${boost.duration}.`,
      "Want me to activate it for you?"
    ]);
  };
  
  // Scroll to bottom of conversation
  useEffect(() => {
    if (conversationEndRef.current) {
      conversationEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [conversation]);
  
  // Handle character animation state
  useEffect(() => {
    if (!characterRef.current) return;
    
    // Reset to idle after a delay
    if (characterAnimState !== 'idle') {
      const timer = setTimeout(() => {
        setCharacterAnimState('idle');
      }, 6000);
      
      return () => clearTimeout(timer);
    }
  }, [characterAnimState]);

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
          <h1 className="text-3xl font-bold text-white tracking-wider text-center">STREAMER POWERUPS</h1>
        </div>
      </header>
      
      <main className="relative z-10 max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-5 gap-6 px-4 py-6">
        {/* Boost marketplace (3 columns) */}
        <div className="lg:col-span-3 space-y-6">
          <div className="rounded-xl backdrop-blur-sm bg-[#0E1A3D]/40 border border-indigo-500/20 p-6">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center">
              <Package className="h-5 w-5 mr-2 text-indigo-400" />
              Streamer Boost Marketplace
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4">
              {boostTypes.map((boost) => (
                <motion.div
                  key={boost.id}
                  whileHover={{ scale: 1.03, y: -3 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleSelectBoost(boost)}
                  className={`cursor-pointer rounded-lg overflow-hidden bg-gradient-to-br ${boost.color} border border-${getBoostBgColor(boost.glowColor)}-400/40 shadow-lg relative`}
                  style={{
                    boxShadow: activeBoost === boost.id ? `0 0 15px rgba(var(--${boost.glowColor}-rgb), 0.7)` : 'none',
                  }}
                >
                  {activeBoost === boost.id && (
                    <div className="absolute top-0 right-0 bg-green-500 text-white text-xs px-2 py-0.5 rounded-bl-md font-medium border-b border-l border-green-400/50">
                      ACTIVE
                    </div>
                  )}
                  
                  <div className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center">
                        {boost.icon}
                        <h3 className="text-white font-bold ml-2">{boost.name}</h3>
                      </div>
                      <div className="bg-black/30 px-2 py-0.5 rounded-full flex items-center">
                        <span className="text-yellow-300 font-mono font-bold text-sm mr-1">{boost.tokenCost}</span>
                        <Star className="h-3 w-3 text-yellow-300" />
                      </div>
                    </div>
                    
                    <p className="text-white/80 text-sm mb-3">{boost.description}</p>
                    
                    <div className="flex justify-between items-center text-xs text-white/70">
                      <div className="flex items-center">
                        <Timer className="h-3 w-3 mr-1" />
                        <span>{boost.duration}</span>
                      </div>
                      <div className="flex items-center">
                        <Trophy className="h-3 w-3 mr-1" />
                        <span>{boost.effectStrength}</span>
                      </div>
                    </div>
                    
                    <div className="mt-3">
                      {/* Apply button */}
                      <Button 
                        onClick={(e) => {
                          e.stopPropagation();
                          activateBoost(boost);
                        }}
                        className={`text-xs bg-${getBoostBgColor(boost.glowColor)}-900/60 hover:bg-${getBoostBgColor(boost.glowColor)}-700/70 border border-${getBoostBgColor(boost.glowColor)}-500/50 w-full`}
                        disabled={activeBoost === boost.id || isProcessing || !user}
                      >
                        {activeBoost === boost.id ? (
                          <Check className="h-4 w-4 mr-1" />
                        ) : null}
                        {activeBoost === boost.id ? 'Active' : `Get Boost (${boost.tokenCost})`}
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
        
        {/* 3D Character and guide (2 columns) */}
        <div className="lg:col-span-2 relative">
          <div className="rounded-xl backdrop-blur-sm bg-[#1A0E3D]/60 border border-purple-500/20 p-4 h-full flex flex-col">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center">
              <Zap className="h-5 w-5 mr-2 text-purple-400" />
              FragStorm AI Assistant
            </h2>
            
            {/* Character */}
            <div className="flex justify-center mb-4" ref={characterRef}>
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
                  className="w-40 h-40 md:w-60 md:h-60 bg-[url('/assets/images/cosmic-guide.png')] bg-contain bg-center bg-no-repeat"
                  style={{ 
                    backgroundImage: "url('https://placehold.co/400x500/38037E/FFFFFF?text=FRAGSTORM')",
                    filter: "drop-shadow(0 0 15px rgba(148, 0, 255, 0.5))"
                  }}
                />
              </div>
            </div>
            
            {/* Chat/dialog area - Enhanced chatbot style */}
            <div className="flex-1 overflow-hidden flex flex-col">
              <div className="flex-1 overflow-y-auto p-4 space-y-3 mb-4 bg-black/30 rounded-lg border border-purple-500/30">
                {/* AI Assistant header with typing indicator */}
                <div className="flex items-center mb-2">
                  <div className="h-2 w-2 rounded-full bg-green-500 mr-2 animate-pulse"></div>
                  <span className="text-green-400 text-xs font-mono">FragStorm AI is online</span>
                </div>
                
                {conversation.map((message, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className={`p-3 rounded-lg ${idx % 2 === 0 ? 'bg-indigo-900/40 border border-indigo-500/20 mr-12' : 'bg-purple-900/40 border border-purple-500/20 ml-12'}`}
                  >
                    <div className="flex items-start">
                      {idx % 2 === 0 && (
                        <div className="h-6 w-6 rounded-full bg-indigo-600 flex items-center justify-center mr-2 flex-shrink-0">
                          <Zap className="h-3 w-3 text-white" />
                        </div>
                      )}
                      <p className="text-white text-sm">{message}</p>
                      {idx % 2 !== 0 && (
                        <div className="h-6 w-6 rounded-full bg-purple-600 flex items-center justify-center ml-2 flex-shrink-0">
                          <Star className="h-3 w-3 text-white" />
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
                
                {isTyping && (
                  <div className="p-3 rounded-lg bg-indigo-900/40 border border-indigo-500/20 mr-12">
                    <div className="flex items-center">
                      <div className="h-6 w-6 rounded-full bg-indigo-600 flex items-center justify-center mr-2">
                        <Zap className="h-3 w-3 text-white" />
                      </div>
                      <div className="flex space-x-2">
                        <div className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce" 
                          style={{ animationDelay: '0ms' }} />
                        <div className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce" 
                          style={{ animationDelay: '150ms' }} />
                        <div className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce" 
                          style={{ animationDelay: '300ms' }} />
                      </div>
                    </div>
                  </div>
                )}
                <div ref={conversationEndRef} />
              </div>
              
              {/* Enhanced preset questions in a more chatbot-like interface */}
              <div className="space-y-2">
                <div className="text-xs text-purple-300 mb-1">Ask FragStorm:</div>
                <div className="grid grid-cols-1 gap-2">
                  <Button
                    onClick={() => {
                      setCharacterAnimState('pointing');
                      addCharacterMessage([
                        "Let me explain how these streaming boosts work!",
                        "Boosts are special powerups that make your streams and videos trend higher.",
                        "The stronger the boost, the more tokens it costs, but the bigger your audience will be!"
                      ]);
                    }}
                    className="bg-purple-900/50 hover:bg-purple-800/70 border border-purple-500/50 text-white text-xs rounded-full px-4 py-2 flex items-center"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    How do streaming boosts work?
                  </Button>
                  
                  <Button
                    onClick={() => {
                      setCharacterAnimState('excited');
                      addCharacterMessage([
                        "Great question! Here's how to earn more tokens:",
                        "1. Create regular quality content and engage with others",
                        "2. Complete daily and weekly challenges",
                        "3. Receive donations from viewers during streams",
                        "4. Subscribe to our premium plans for monthly token allocations"
                      ]);
                    }}
                    className="bg-indigo-900/50 hover:bg-indigo-800/70 border border-indigo-500/50 text-white text-xs rounded-full px-4 py-2 flex items-center"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    How do I earn more tokens?
                  </Button>
                  
                  <Button
                    onClick={() => {
                      setCharacterAnimState('pointing');
                      addCharacterMessage([
                        "Let me compare the different powerups for you:",
                        "🔹 Squad Blast (40 tokens): Best for immediate engagement boost",
                        "🔹 Chain Reaction (60 tokens): Best for viral growth over time",
                        "🔹 I'm the King Now (80 tokens): Best for maximizing visibility in a specific game",
                        "🔹 Stream Surge (50 tokens): Best for short intense viewer boosts",
                        "Which one matches your streaming goals?"
                      ]);
                    }}
                    className="bg-cyan-900/50 hover:bg-cyan-800/70 border border-cyan-500/50 text-white text-xs rounded-full px-4 py-2 flex items-center"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    Which boost is best for me?
                  </Button>
                  
                  <Button
                    onClick={() => {
                      setCharacterAnimState('excited');
                      addCharacterMessage([
                        "Pro streaming tip: Combine boosts strategically! 🚀",
                        "Start with Squad Blast to build initial audience, then use Chain Reaction when engagement peaks to multiply your reach.",
                        "For special events, add Stream Surge during peak hours, then crown it with I'm the King Now for category dominance.",
                        "This stacking strategy can amplify your viewership by up to 500%!"
                      ]);
                    }}
                    className="bg-red-900/50 hover:bg-red-800/70 border border-red-500/50 text-white text-xs rounded-full px-4 py-2 flex items-center"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    Give me pro streaming tips!
                  </Button>
                </div>
              </div>
            </div>
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
      `}</style>
    </div>
  );
};

export default BoostStore;
