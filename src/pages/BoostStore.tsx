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
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [characterAnimState, setCharacterAnimState] = useState('idle');
  const conversationEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [lastTokenBalance, setLastTokenBalance] = useState(0);
  const [lastStreamDate, setLastStreamDate] = useState<Date | null>(null);
  
    // Token earning explanation function - comprehensive guide focused on Clipt only
  const explainTokenEarning = () => {
    addBotMessage(`${userStats.username}, here are all the ways to earn Clipt tokens based on your current account status:`);
    addBotMessage(`1️⃣ Daily Streaming: Earn 5-20 tokens per hour of streaming, with bonuses for consistent daily streams`, 800);
    addBotMessage(`2️⃣ Growth Milestones: You'll earn 50-500 tokens for reaching follower/subscriber milestones`, 1600);
    addBotMessage(`3️⃣ Engagement Rewards: Get 2 tokens per new comment and 1 token per like on your clips`, 2400);
    addBotMessage(`4️⃣ Challenges: Complete weekly challenges like "Stream 5 days in a row" for 100-300 tokens`, 3200);
    addBotMessage(`5️⃣ Community Building: Earn 25 tokens when your viewers use your creator code on purchases`, 4000);
    
    // Show personalized stats
    const potentialTokens = userStats.averageStreamDuration.split(':')[0] * 10;
    addBotMessage(`Based on your ${userStats.averageStreamDuration} average stream length, you could earn approximately ${potentialTokens} tokens per day just from streaming!`, 4800);
  };
  
  // Explain Clipt app functionality - focused solely on the app
  const explainCliptApp = () => {
    addBotMessage(`Clipt is a next-generation streaming platform designed to help creators like you grow rapidly. Here's how it works:`);
    addBotMessage(`🚀 Algorithmic Promotion: Your content gets automatically pushed to viewers most likely to enjoy it`, 800);
    addBotMessage(`💎 Boost System: Use tokens to activate special promotional effects that increase visibility`, 1600);
    addBotMessage(`📊 Smart Analytics: Get detailed insights about your viewers and content performance`, 2400);
    addBotMessage(`🔄 Cross-Promotion: Your best clips get featured across the platform in relevant categories`, 3200);
    
    // Personalized recommendation
    addBotMessage(`Based on your ${userStats.topCategory} content and ${userStats.growthRate} growth rate, I recommend focusing on consistent ${userStats.averageStreamDuration.split(':')[0]}-hour streams with ${boostTypes[0].name} boosts to maximize your growth!`, 4000);
  };
  
  // Fetch user data from account
  useEffect(() => {
    // In a real implementation, this would pull from the user's actual account
    // For now we'll simulate by randomly adjusting some metrics each time
    const fetchUserData = async () => {
      if (user) {
        try {
          // This would be a real API call in production
          const { data, error } = await supabase
            .from('user_analytics')
            .select('*')
            .eq('user_id', user.id)
            .single();
            
          if (data) {
            // Update user stats with real data
            userStats.username = data.username || userStats.username;
            userStats.averageViewers = data.average_viewers || userStats.averageViewers;
            userStats.topCategory = data.top_category || userStats.topCategory;
            userStats.totalViewers = data.total_viewers || userStats.totalViewers;
            // Other stats would be updated here
          }
          
          // Also fetch actual token balance
          const { data: tokenData } = await supabase
            .from('user_tokens')
            .select('balance')
            .eq('user_id', user.id)
            .single();
            
          if (tokenData) {
            setTokenBalance(tokenData.balance);
            setLastTokenBalance(tokenData.balance);
          }
          
          // Get last stream date
          const { data: streamData } = await supabase
            .from('streams')
            .select('created_at')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();
            
          if (streamData) {
            setLastStreamDate(new Date(streamData.created_at));
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
        }
      }
    };
    
    fetchUserData();
  }, [user]);
  
  // Define boost types with user-specified boosts first
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
    // Check if boosts were shown recently (in the last 15 messages)
    const recentMessages = messages.slice(-15);
    const hasRecentBoostCards = recentMessages.some(msg => msg.boostCard);
    const hasRecentBoostIntro = recentMessages.some(msg => 
      msg.content.includes("Here are our available streaming powerups") && 
      msg.sender === 'bot'
    );
    
    if (hasRecentBoostCards || hasRecentBoostIntro) {
      // If boosts were already shown recently, just prompt for selection without showing them again
      const alreadyAskedSelection = recentMessages.some(msg => 
        msg.content.includes("Which boost would you like to know more about?") && 
        msg.sender === 'bot'
      );
      
      // Only add this message if we haven't recently asked it
      if (!alreadyAskedSelection) {
        addBotMessage("Which boost would you like to know more about? Or simply click on a boost card to activate it.");
      }
      return;
    }
    
    // Otherwise show all boosts
    addBotMessage("Here are our available streaming powerups:");
    
    // Show each boost after a slight delay for visual appeal
    boostTypes.forEach((boost, index) => {
      setTimeout(() => {
        addBotMessage("", 0, boost);
      }, index * 400);
    });
    
    // Add a follow-up message after all boosts are shown
    setTimeout(() => {
      addBotMessage("Which one would you like to know more about? Or simply click on a boost card to activate it.");
    }, boostTypes.length * 400 + 500);
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
  
  // Show only welcome message and boosts on initial load - nothing else
  useEffect(() => {
    // Initialize with welcome message
    const initialMessages: ChatMessage[] = [
      {
        id: 'welcome',
        content: "Welcome to the Pro Streamer Boost Shop! I'm FragStorm, your AI assistant. Here are our available streaming powerups:",
        sender: 'bot',
        timestamp: new Date()
      }
    ];
    
    // Add all boosts immediately
    boostTypes.forEach((boost, index) => {
      initialMessages.push({
        id: `initial-boost-${index}`,
        content: "",
        sender: 'bot',
        timestamp: new Date(Date.now() + (index + 1) * 100),
        boostCard: boost
      });
    });
    
    // Set initial messages - just welcome + boosts
    setMessages(initialMessages);
  }, []);
  
  // Simulated user stats (in a real app, would be fetched from your backend)
  // This enhances the chatbot's ability to provide personalized advice
  const userStats = {
    username: user?.email?.split('@')[0] || 'Streamer',
    totalStreams: 24,
    totalViewers: 1892,
    averageViewers: 78,
    topCategory: 'Battle Royale',
    subscriptionTier: 'Pro',
    peakViewerCount: 327,
    growthRate: '18% this month',
    followersGained: 245,
    averageStreamDuration: '3.5 hours',
    mostActiveTime: '8pm - 11pm',
    lastStreamDate: new Date(Date.now() - 86400000 * 2), // 2 days ago
    recentMilestone: 'Reached 200 followers',
    recommendedGoal: 'Hit 100 concurrent viewers',
  };
  
  // Enhanced NLP to process user messages with CLIPT-FOCUSED knowledge only
  const processUserInput = (input: string) => {
    // Skip processing if input is empty
    if (!input.trim()) return;
    
    const normalizedInput = input.toLowerCase();
    
    // Prevent duplicate processing by checking recent messages
    const recentUserMessage = messages.slice(-3).find(msg => 
      msg.sender === 'user' && 
      msg.content.toLowerCase() === normalizedInput && 
      msg.id !== generateId() // Not the current message
    );
    
    if (recentUserMessage) {
      // If the user is repeating the same message within the last 3 messages,
      // just acknowledge without duplicate processing
      addBotMessage(`I understand you're interested in growing your Clipt presence, ${userStats.username}. Let me provide more specific strategies.`);
      return;
    }
    
    // DETECTION OF NON-CLIPT OR HARMFUL CONTENT
    // Check for off-topic or harmful content and redirect to Clipt growth
    const offTopicKeywords = ['politics', 'religion', 'gambling', 'betting', 'drugs', 'alcohol', 
      'adult', 'nsfw', 'hate', 'offensive', 'illegal', 'weapon', 'hack', 'cheat', 'exploit'];
    
    const containsOffTopicKeywords = offTopicKeywords.some(keyword => normalizedInput.includes(keyword));
    
    if (containsOffTopicKeywords) {
      // Redirect to Clipt-specific advice
      addBotMessage(`I'm your Clipt growth assistant focused on helping you succeed on the platform. Based on your ${userStats.averageViewers} average viewers, I recommend the following strategies to grow your channel:`);
      addBotMessage(`1️⃣ Use ${boostTypes[0].name} during your peak times (${userStats.mostActiveTime}) to maximize visibility`, 800);
      addBotMessage(`2️⃣ Your ${userStats.topCategory} content has the most growth potential - focus on that category`, 1600);
      return;
    }
    
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
    
    // TOKEN EARNING SPECIFIC QUERIES
    if (normalizedInput.includes('token') && 
        (normalizedInput.includes('earn') || normalizedInput.includes('get') || 
         normalizedInput.includes('how to') || normalizedInput.includes('more'))) {
      explainTokenEarning();
      return;
    }
    
    // Handle token balance inquiries
    if (normalizedInput.includes('token') && 
        (normalizedInput.includes('balance') || normalizedInput.includes('how many') || normalizedInput.includes('get more'))) {
      addBotMessage(`Your current token balance is ${tokenBalance}.`);
      addBotMessage(`You can earn more tokens by streaming consistently, completing daily challenges, engaging with other streams, and participating in community events!`, 800);
      return;
    }
    
    // Handle growth and audience building questions
    if ((normalizedInput.includes('grow') || normalizedInput.includes('build')) && 
        (normalizedInput.includes('audience') || normalizedInput.includes('viewers') || normalizedInput.includes('followers'))) {
      addBotMessage(`${userStats.username}, based on your stats of ${userStats.totalViewers} total views and ${userStats.averageViewers} average viewers, here's personalized growth advice:`);
      addBotMessage(`1️⃣ Consistency is key - I see your most active time is ${userStats.mostActiveTime}. Keep a regular schedule!`, 800);
      addBotMessage(`2️⃣ Your ${userStats.topCategory} content performs well. Try combining with Chain Reaction boost to maximize reach.`, 1600);
      addBotMessage(`3️⃣ Set your next milestone to ${userStats.recommendedGoal} - use our Stream Surge boost tactically to reach it faster!`, 2400);
      return;
    }
    
    // Handle best practices questions
    if (normalizedInput.includes('best') && 
        (normalizedInput.includes('practice') || normalizedInput.includes('way') || normalizedInput.includes('strategy'))) {
      addBotMessage(`For a ${userStats.subscriptionTier} streamer like you with ${userStats.averageStreamDuration} average streams, here are tailored best practices:`);
      addBotMessage(`🔹 Schedule your boosts during your peak time (${userStats.mostActiveTime})`, 800);
      addBotMessage(`🔹 For your ${userStats.topCategory} content, start with Squad Blast to build initial momentum, then add Chain Reaction when chat activity increases`, 1600);
      addBotMessage(`🔹 Save I'm the King Now for special events or when you're close to your ${userStats.recommendedGoal}`, 2400);
      addBotMessage(`🔹 Based on your ${userStats.growthRate} growth rate, strategically using boosts can potentially increase that to 25-30%`, 3200);
      return;
    }
    
    // Handle app functionality questions
    if (normalizedInput.includes('how') && 
        (normalizedInput.includes('app') || normalizedInput.includes('work') || normalizedInput.includes('clipt'))) {
      addBotMessage(`Clipt is an integrated streaming platform designed to maximize your reach and engagement.`);
      addBotMessage(`As a ${userStats.subscriptionTier} member, you have access to all boost types and analytics tools.`, 800);
      addBotMessage(`The platform integrates with your existing ${userStats.topCategory} content and helps you optimize for the ${userStats.mostActiveTime} timeframe when your viewers are most active.`, 1600);
      return;
    }
    
    // Handle milestone and progress questions
    if (normalizedInput.includes('milestone') || normalizedInput.includes('progress') || normalizedInput.includes('stats')) {
      addBotMessage(`Here's your current streaming progress, ${userStats.username}:`);
      addBotMessage(`✨ ${userStats.totalStreams} total streams with ${userStats.totalViewers} total views`, 800);
      addBotMessage(`✨ ${userStats.peakViewerCount} peak viewers during your ${userStats.topCategory} streams`, 1600);
      addBotMessage(`✨ ${userStats.followersGained} new followers with ${userStats.growthRate} growth`, 2400);
      addBotMessage(`Recent achievement: 🏆 ${userStats.recentMilestone}`, 3200);
      addBotMessage(`Based on your trajectory, I recommend using Squad Blast and Chain Reaction strategically to reach ${userStats.recommendedGoal} within 14 days!`, 4000);
      return;
    }
    
    // Handle boost comparison or recommendation
    if ((normalizedInput.includes('which') || normalizedInput.includes('best') || normalizedInput.includes('recommend')) && 
        (normalizedInput.includes('boost') || normalizedInput.includes('powerup'))) {
      addBotMessage(`Based on your ${userStats.averageViewers} average viewers and ${userStats.topCategory} content:`);
      addBotMessage(`For immediate growth: Squad Blast would push you to ~110 viewers quickly`, 800);
      addBotMessage(`For sustained growth: Chain Reaction is perfect for ${userStats.topCategory} content that already has good engagement`, 1600);
      addBotMessage(`For milestone events: I'm the King Now could get you featured in the ${userStats.topCategory} category`, 2400);
      addBotMessage(`For your next stream: I'd recommend Stream Surge since you haven't streamed since ${userStats.lastStreamDate.toLocaleDateString()} and need a comeback boost!`, 3200);
      return;
    }
    
    // Handle token usage efficiency questions
    if (normalizedInput.includes('token') && 
        (normalizedInput.includes('efficien') || normalizedInput.includes('best use') || normalizedInput.includes('worth'))) {
      addBotMessage(`For your ${tokenBalance} token balance, here's how to maximize value:`);
      addBotMessage(`🔸 Most efficient: Chain Reaction (60 tokens) gives the best long-term ROI for ${userStats.topCategory} content`, 800);
      addBotMessage(`🔸 Your viewers tend to be most active around ${userStats.mostActiveTime} - scheduling boosts during this window increases efficiency by ~40%`, 1600);
      addBotMessage(`🔸 With ${userStats.averageViewers} average viewers, each Chain Reaction activation potentially reaches ~720 new viewers, costing about 0.08 tokens per new viewer`, 2400);
      return;
    }
    
    // Handle specific streaming advice
    if (normalizedInput.includes('advice') || 
        (normalizedInput.includes('how') && normalizedInput.includes('better'))) {
      addBotMessage(`${userStats.username}, after analyzing your ${userStats.totalStreams} streams, here's personalized advice:`);
      addBotMessage(`⭐ Your ${userStats.topCategory} content performs 22% better than your other content`, 800);
      addBotMessage(`⭐ Streams during ${userStats.mostActiveTime} reach 35% more viewers than other times`, 1600);
      addBotMessage(`⭐ Increasing stream frequency from your current pattern could boost growth by ~15%`, 2400);
      addBotMessage(`⭐ Using Squad Blast followed by Chain Reaction created your highest peak of ${userStats.peakViewerCount} viewers - I recommend this combination for milestone streams!`, 3200);
      return;
    }
    
      // Check for app-specific queries
    if ((normalizedInput.includes('how') || normalizedInput.includes('what')) && 
        (normalizedInput.includes('app') || normalizedInput.includes('clipt') || 
         normalizedInput.includes('work') || normalizedInput.includes('use'))) {
      explainCliptApp();
      return;
    }
    
    // Default response - ALWAYS focused on Clipt growth with personalized stats
    addBotMessage(`${userStats.username}, I'm your dedicated Clipt growth assistant! Based on analyzing your account data, here's how you can grow beyond your current ${userStats.averageViewers} average viewers:`);
    addBotMessage(`📊 Your ${userStats.topCategory} streams perform ${Math.floor(Math.random() * 20) + 10}% better than your other content`, 800);
    addBotMessage(`🔍 Your peak viewer time is ${userStats.mostActiveTime} - schedule your most important streams and boosts then`, 1600);
    addBotMessage(`⚡ I recommend using ${boostTypes[Math.floor(Math.random() * boostTypes.length)].name} for your next stream to accelerate growth`, 2400);
    addBotMessage(`💬 Ask me about specific growth strategies, token earning, or boost recommendations personalized for your account!`, 3200);
  };
  
  // Handle inquiry about a specific boost
  const handleBoostInquiry = (boost: BoostType) => {
    setCharacterAnimState('pointing');
    
    // Check if this boost was already inquired about recently
    const recentMessages = messages.slice(-10);
    const alreadyInquiredAbout = recentMessages.some(msg => 
      msg.content.includes(`${boost.name} costs`) && 
      msg.sender === 'bot'
    );
    
    if (alreadyInquiredAbout) {
      // Just ask if they want to activate without repeating details
      addBotMessage(`Would you like to activate ${boost.name}?`, 0, boost);
      return;
    }
    
    // Otherwise show full details
    addBotMessage(`${boost.name} costs ${boost.tokenCost} tokens and lasts for ${boost.duration}.`);
    addBotMessage(`It ${boost.description}`, 1000);
    addBotMessage(`Would you like to activate ${boost.name}?`, 2000, boost);
  };
  
  // Show boosts when component mounts - only once on initial load
  useEffect(() => {
    // Set a flag in state to track if this is the first load
    const hasInitialized = sessionStorage.getItem('boostStoreInitialized');
    
    if (!hasInitialized) {
      // Slight delay to show initial messages
      setTimeout(() => {
        showAvailableBoosts();
        // Mark as initialized for this session
        sessionStorage.setItem('boostStoreInitialized', 'true');
      }, 1500);
    }
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
    // This function is now handled directly in the input's onKeyDown
    // to prevent duplicate message submissions
    const handleKeyDown = (e: KeyboardEvent) => {
      // Now handled by input's onKeyDown event handler
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [inputMessage]);

  return (
    <div className="min-h-screen bg-black py-10 px-4 flex flex-col">
      
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
              <AnimatePresence>
                <motion.div
                  key="character"
                  initial={{ y: 20, opacity: 0, rotate: 0 }}
                  animate={{ 
                    y: characterAnimState === 'idle' ? [0, -5, 0] : 0,
                    opacity: 1,
                    rotate: characterAnimState === 'pointing' ? [0, 5, 0, -5, 0] : 0,
                  }}
                  exit={{ y: 20, opacity: 0 }}
                  transition={{ 
                    y: { type: 'spring', stiffness: 50, damping: 20, repeat: characterAnimState === 'idle' ? Infinity : 0, repeatType: 'reverse', duration: 2 },
                    rotate: { duration: 0.5, repeat: characterAnimState === 'pointing' ? 2 : 0, repeatType: 'reverse' },
                    opacity: { duration: 0.3 }
                  }}
                  className="relative w-32 h-32 md:w-36 md:h-36"
                >
                  {/* Cosmic planet core */}
                  <motion.div 
                    className="absolute inset-0 rounded-full bg-gradient-to-br from-indigo-900 via-purple-800 to-purple-900"
                    style={{ 
                      boxShadow: '0 0 30px rgba(148, 0, 255, 0.6), inset 0 0 20px rgba(255, 255, 255, 0.2)'
                    }}
                    animate={{ 
                      scale: [1, 1.05, 1],
                    }}
                    transition={{ 
                      duration: 4,
                      repeat: Infinity,
                      repeatType: 'reverse',
                    }}
                  />
                  
                  {/* Glowing rings */}
                  <motion.div 
                    className="absolute inset-0 rounded-full border-4 border-transparent"
                    style={{ 
                      background: 'transparent',
                      boxShadow: 'inset 0 0 20px rgba(167, 139, 250, 0.6)',
                      transform: 'scale(1.2) rotate(30deg)'
                    }}
                    animate={{ 
                      rotate: 360,
                    }}
                    transition={{ 
                      duration: 20,
                      repeat: Infinity,
                      ease: 'linear'
                    }}
                  />
                  
                  {/* Smaller orbital ring */}
                  <motion.div 
                    className="absolute inset-0 rounded-full border-2 border-indigo-500"
                    style={{ 
                      borderStyle: 'dashed',
                      transform: 'scale(1.4) rotate(45deg)'
                    }}
                    animate={{ 
                      rotate: -360,
                    }}
                    transition={{ 
                      duration: 30,
                      repeat: Infinity,
                      ease: 'linear'
                    }}
                  />
                  
                  {/* Floating orbiting moon */}
                  <motion.div
                    className="absolute w-10 h-10 rounded-full bg-gradient-to-br from-cyan-400 to-blue-600"
                    style={{ 
                      boxShadow: '0 0 15px rgba(56, 182, 255, 0.6)',
                      top: '0%',
                      left: '50%',
                    }}
                    animate={{ 
                      rotate: 360,
                    }}
                    transition={{ 
                      duration: 8,
                      repeat: Infinity,
                      ease: 'linear',
                    }}
                  />
                  
                  {/* Small stars around the planet */}
                  {[...Array(6)].map((_, i) => (
                    <motion.div
                      key={`star-${i}`}
                      className="absolute w-2 h-2 rounded-full bg-white"
                      style={{ 
                        boxShadow: '0 0 10px rgba(255, 255, 255, 0.8), 0 0 20px rgba(147, 51, 234, 0.6)',
                        top: `${Math.random() * 100}%`,
                        left: `${Math.random() * 100}%`,
                      }}
                      animate={{ 
                        opacity: [0.2, 1, 0.2],
                        scale: [1, 1.2, 1],
                      }}
                      transition={{ 
                        duration: 2 + Math.random() * 3,
                        repeat: Infinity,
                        repeatType: 'reverse',
                        delay: Math.random() * 2,
                      }}
                    />
                  ))}
                  
                  {/* CLIPT Logo text at center */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-xl font-bold bg-gradient-to-r from-cyan-400 via-white to-purple-500 bg-clip-text text-transparent">
                      CLIPT
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>
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
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
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
