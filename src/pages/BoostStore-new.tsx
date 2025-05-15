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
  Package
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
  const [conversation, setConversation] = useState<string[]>([
    "Welcome to the Cosmic Boost Marketplace! I'm your guide, NeoPixel.",
    "Boosts help your content get more visibility across the galaxy of viewers.",
    "Which cosmic power would you like to learn about today?"
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
      description: "Push your clip to ALL of your friends' Squads Page for 24 hours.",
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
      description: "Each like/comment/share spreads clip to 5 more users for 6h (stackable).",
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

  // Fetch user token balance
  useEffect(() => {
    const fetchTokenBalance = async () => {
      if (!user) return;
      
      try {
        const { data, error } = await supabase
          .from('user_tokens')
          .select('balance')
          .eq('user_id', user.id)
          .single();
          
        if (error) throw error;
        if (data) setTokenBalance(data.balance);
      } catch (err) {
        console.error('Error fetching token balance:', err);
      }
    };
    
    fetchTokenBalance();
  }, [user]);
  
  // Fetch active boosts
  useEffect(() => {
    const fetchActiveBoosts = async () => {
      if (!user) return;
      
      try {
        const { data, error } = await supabase
          .from('user_boosts')
          .select('*')
          .eq('user_id', user.id)
          .eq('is_active', true)
          .order('created_at', { ascending: false })
          .limit(1);
          
        if (error) throw error;
        if (data && data.length > 0) {
          setActiveBoost(data[0].boost_type);
        }
      } catch (err) {
        console.error('Error fetching active boosts:', err);
      }
    };
    
    fetchActiveBoosts();
  }, [user]);

  // Scroll to bottom of conversation
  useEffect(() => {
    if (conversationEndRef.current) {
      conversationEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [conversation]);

  // Handle boost selection for detailed view
  const handleSelectBoost = (boost: BoostType) => {
    setSelectedBoost(boost);
    setCharacterAnimState('pointing');
    
    // Add character dialog about the selected boost
    addCharacterMessage([
      `The ${boost.name} is one of my favorites!`,
      `It costs ${boost.tokenCost} tokens and lasts for ${boost.duration}.`,
      `It's perfect for creators who want to ${getBoostAdvice(boost.id)}.`
    ]);
  };

  // Get contextual advice based on boost type
  const getBoostAdvice = (boostId: string) => {
    switch (boostId) {
      case 'squad-blast':
        return 'push content directly to their friends';
      case 'chain-reaction':
        return 'spread content through engagement';
      case 'king-now':
        return 'rank highly in their game category';
      case 'stream-surge':
        return 'reach active viewers in their genre quickly';
      default:
        return 'enhance their visibility in the community';
    }
  };

  // Add character message with typing animation
  const addCharacterMessage = (messages: string[]) => {
    if (!messages.length) return;
    
    setIsTyping(true);
    
    // Add first message immediately
    setTimeout(() => {
      setConversation(conv => [...conv, messages[0]]);
      
      // Add remaining messages with delays
      messages.slice(1).forEach((message, idx) => {
        setTimeout(() => {
          setConversation(conv => [...conv, message]);
          
          // Mark typing as complete after last message
          if (idx === messages.length - 2) {
            setIsTyping(false);
            setCharacterAnimState('idle');
          }
        }, (idx + 1) * 2000);
      });
    }, 500);
  };

  // Purchase a boost
  const purchaseBoost = async (boost: BoostType) => {
    if (!user) {
      toast.error('You must be logged in to purchase boosts');
      return;
    }
    
    if (tokenBalance < boost.tokenCost) {
      toast.error(`Not enough tokens! You need ${boost.tokenCost - tokenBalance} more tokens.`);
      setCharacterAnimState('disappointed');
      addCharacterMessage([
        "Oh no! It looks like you don't have enough tokens for that boost.",
        "You can earn tokens by being active in the community or through subscriptions.",
        "Would you like to know more about earning tokens?"
      ]);
      return;
    }
    
    try {
      // Start optimistic UI update
      setTokenBalance(prev => prev - boost.tokenCost);
      setCharacterAnimState('excited');
      
      // Add a new boost record
      const { data, error } = await supabase
        .from('user_boosts')
        .insert([
          {
            user_id: user.id,
            boost_type: boost.id,
            duration_hours: boost.id === 'chain-reaction' ? 6 : 
                          boost.id === 'king-now' ? 2 : 
                          boost.id === 'stream-surge' ? 0.5 : 24,
            is_active: true,
            tokens_used: boost.tokenCost,
            created_at: new Date().toISOString()
          }
        ])
        .select()
        .single();
        
      if (error) throw error;
      
      // Update user token balance
      const { error: tokenError } = await supabase
        .from('user_tokens')
        .update({ balance: tokenBalance - boost.tokenCost })
        .eq('user_id', user.id);
        
      if (tokenError) throw tokenError;
      
      // Set as active boost
      setActiveBoost(boost.id);
      
      // Show success and character dialog
      toast.success(`${boost.name} activated successfully!`);
      addCharacterMessage([
        "Cosmic power activated! Your boost is now live!",
        `Your ${boost.name} will be active for ${boost.duration}.`,
        "Use it wisely, space traveler!"
      ]);
      
    } catch (err) {
      console.error('Error purchasing boost:', err);
      // Revert optimistic UI update
      setTokenBalance(prev => prev + boost.tokenCost);
      toast.error('Failed to purchase boost. Please try again.');
      
      setCharacterAnimState('confused');
      addCharacterMessage([
        "Hmm, there seems to be a glitch in the cosmic matrix!",
        "The boost purchase didn't go through. Let's try again later."
      ]);
    }
  };

  return (
    <div className="relative min-h-screen bg-gradient-to-b from-[#050B1F] to-[#0A1232] overflow-hidden pb-20">
      {/* Animated stars background */}
      <div className="absolute inset-0 z-0">
        {[...Array(150)].map((_, i) => {
          const size = Math.random() * 3 + 1;
          const top = Math.random() * 100;
          const left = Math.random() * 100;
          const animDuration = Math.random() * 3 + 2;
          const delay = Math.random() * 2;
          
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
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <motion.div
              initial={{ rotate: -10 }}
              animate={{ rotate: 10 }}
              transition={{ duration: 2, repeat: Infinity, repeatType: 'reverse' }}
            >
              <Rocket className="h-8 w-8 text-indigo-400" />
            </motion.div>
            <h1 className="text-2xl font-bold text-white tracking-wider">COSMIC BOOST</h1>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center px-3 py-1.5 rounded-full bg-indigo-900/30 border border-indigo-500/30">
              <span className="text-yellow-300 font-mono font-bold mr-1">{tokenBalance}</span>
              <Star className="h-4 w-4 text-yellow-300" />
            </div>
            
            <Button
              onClick={() => navigate('/profile')}
              className="text-xs bg-indigo-900/40 hover:bg-indigo-800/60 border border-indigo-500/50"
            >
              Back to Profile
            </Button>
          </div>
        </div>
      </header>
      
      <main className="relative z-10 max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-5 gap-6 px-4 py-6">
        {/* Boost marketplace (3 columns) */}
        <div className="lg:col-span-3 space-y-6">
          <div className="rounded-xl backdrop-blur-sm bg-[#0E1A3D]/40 border border-indigo-500/20 p-6">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center">
              <Package className="h-5 w-5 mr-2 text-indigo-400" />
              Cosmic Power Marketplace
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4">
              {boostTypes.map((boost) => (
                <motion.div
                  key={boost.id}
                  whileHover={{ scale: 1.03, y: -3 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleSelectBoost(boost)}
                  className={`cursor-pointer rounded-lg overflow-hidden bg-gradient-to-br ${boost.color} border border-${boost.glowColor}-400/40 shadow-lg relative`}
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
                      <div className="flex items-center bg-black/30 rounded-full px-2 py-0.5">
                        <span className="text-yellow-300 font-mono font-bold text-sm">{boost.tokenCost}</span>
                        <Star className="h-3 w-3 text-yellow-300 ml-1" />
                      </div>
                    </div>
                    
                    <p className="text-white/90 text-sm mb-2">{boost.description}</p>
                    
                    <div className="flex justify-between items-center text-xs text-white/70">
                      <div className="flex items-center">
                        <Timer className="h-3 w-3 mr-1" />
                        <span>{boost.duration}</span>
                      </div>
                      <div className="flex items-center">
                        <Flame className="h-3 w-3 mr-1" />
                        <span>{boost.effectStrength}</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
          
          {/* Selected boost details */}
          <AnimatePresence>
            {selectedBoost && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className={`rounded-xl backdrop-blur-sm bg-gradient-to-r from-[#0E1A3D]/60 to-[#1A0E3D]/60 border border-${selectedBoost.glowColor}-500/30 p-6`}
                style={{
                  boxShadow: `0 0 25px rgba(var(--${selectedBoost.glowColor}-rgb), 0.2)`,
                }}
              >
                <div className="flex flex-col md:flex-row gap-6">
                  <div className="md:w-1/3 flex justify-center items-center">
                    <div className={`w-32 h-32 flex items-center justify-center rounded-full bg-gradient-to-br ${selectedBoost.color} border-2 border-${selectedBoost.glowColor}-400/50`}>
                      <motion.div
                        animate={{ scale: [1, 1.1, 1], rotate: [0, 5, 0, -5, 0] }}
                        transition={{ duration: 5, repeat: Infinity }}
                      >
                        {React.cloneElement(selectedBoost.icon as React.ReactElement, { className: 'h-16 w-16 text-white' })}
                      </motion.div>
                    </div>
                  </div>
                  
                  <div className="md:w-2/3">
                    <h3 className="text-2xl font-bold text-white mb-2">{selectedBoost.name}</h3>
                    <p className="text-white/80 mb-4">{selectedBoost.description}</p>
                    
                    <div className="grid grid-cols-3 gap-4 mb-4">
                      <div className="bg-black/20 rounded-lg p-3 text-center">
                        <p className="text-xs text-white/70 mb-1">Cost</p>
                        <p className="text-lg font-bold text-yellow-300 flex items-center justify-center">
                          {selectedBoost.tokenCost} <Star className="h-4 w-4 ml-1" />
                        </p>
                      </div>
                      
                      <div className="bg-black/20 rounded-lg p-3 text-center">
                        <p className="text-xs text-white/70 mb-1">Duration</p>
                        <p className="text-lg font-bold text-white">{selectedBoost.duration}</p>
                      </div>
                      
                      <div className="bg-black/20 rounded-lg p-3 text-center">
                        <p className="text-xs text-white/70 mb-1">Strength</p>
                        <p className="text-lg font-bold text-white">{selectedBoost.effectStrength}</p>
                      </div>
                    </div>
                    
                    <div className="flex gap-3">
                      <Button
                        onClick={() => purchaseBoost(selectedBoost)}
                        disabled={activeBoost === selectedBoost.id}
                        className={`flex-1 ${
                          activeBoost === selectedBoost.id
                            ? 'bg-gray-700 cursor-not-allowed'
                            : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 hover:scale-105'
                        } transition-all text-white font-bold py-3 rounded-lg shadow-md`}
                      >
                        {activeBoost === selectedBoost.id ? 'Already Active' : 'Purchase Boost'}
                      </Button>
                      
                      <Button
                        onClick={() => setSelectedBoost(null)}
                        className="bg-black/30 hover:bg-black/50 text-white border border-white/10"
                      >
                        Close Details
                      </Button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        
        {/* 3D Character and guide (2 columns) */}
        <div className="lg:col-span-2 relative">
          <div className="rounded-xl backdrop-blur-sm bg-[#1A0E3D]/60 border border-purple-500/20 p-4 h-full flex flex-col">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center">
              <Zap className="h-5 w-5 mr-2 text-purple-400" />
              Your Cosmic Guide
            </h2>
            
            {/* Character */}
            <div className="h-60 md:h-80 relative">
              <div 
                ref={characterRef}
                className="absolute inset-0 flex items-center justify-center"
              >
                <motion.div
                  animate={characterAnimState}
                  variants={{
                    idle: { y: [0, -10, 0], rotate: 0 },
                    pointing: { y: 0, rotate: [0, 5, 0, 5, 0] },
                    excited: { y: [-5, 5, -5], scale: [1, 1.05, 1] },
                    disappointed: { y: 0, rotate: [0, -3, 0] },
                    confused: { rotate: [-5, 5, -5, 5, 0] }
                  }}
                  transition={{ 
                    duration: characterAnimState === 'idle' ? 4 : 1.5, 
                    repeat: Infinity,
                    repeatType: 'reverse'
                  }}
                  className="w-40 h-40 md:w-60 md:h-60 bg-[url('/assets/images/cosmic-guide.png')] bg-contain bg-center bg-no-repeat"
                  style={{ 
                    backgroundImage: "url('https://placehold.co/400x500/38037E/FFFFFF?text=NEOPIXEL')",
                    filter: "drop-shadow(0 0 15px rgba(148, 0, 255, 0.5))"
                  }}
                />
              </div>
            </div>
            
            {/* Chat/dialog area */}
            <div className="flex-1 overflow-hidden flex flex-col">
              <div className="flex-1 overflow-y-auto p-4 space-y-3 mb-4 bg-black/20 rounded-lg">
                {conversation.map((message, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="p-3 rounded-lg bg-indigo-900/40 border border-indigo-500/20"
                  >
                    <p className="text-white text-sm">{message}</p>
                  </motion.div>
                ))}
                {isTyping && (
                  <div className="p-3 rounded-lg bg-indigo-900/40 border border-indigo-500/20">
                    <div className="flex space-x-2">
                      <div className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce" 
                        style={{ animationDelay: '0ms' }} />
                      <div className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce" 
                        style={{ animationDelay: '150ms' }} />
                      <div className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce" 
                        style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                )}
                <div ref={conversationEndRef} />
              </div>
              
              {/* Character interaction buttons */}
              <div className="grid grid-cols-2 gap-2">
                <Button
                  onClick={() => {
                    setCharacterAnimState('pointing');
                    addCharacterMessage([
                      "Let me explain how boosts work!",
                      "Boosts are special powers that make your content more visible.",
                      "The stronger the boost, the more tokens it costs, but the greater the impact!"
                    ]);
                  }}
                  className="bg-purple-900/50 hover:bg-purple-800/70 border border-purple-500/50 text-white text-xs"
                >
                  How do boosts work?
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
                  className="bg-indigo-900/50 hover:bg-indigo-800/70 border border-indigo-500/50 text-white text-xs"
                >
                  How to earn tokens?
                </Button>
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
