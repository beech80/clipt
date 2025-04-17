import React, { useState, useEffect, useRef } from 'react';
import { Search, X, MessageCircle, DollarSign, UserPlus, Scissors, ChevronLeft, ChevronRight, Zap, Gamepad, Clock, Send, Tv } from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import NavigationBar from '@/components/NavigationBar';

// CSS for styling
import './discovery-header.css';

// Full page Discovery component with search and controller
const DiscoveryMinimal: React.FC = () => {
  // Navigation
  const navigate = useNavigate();
  
  // Core state
  const [currentIndex, setCurrentIndex] = useState(0);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedGame, setSelectedGame] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // UI control visibility state
  const [controlsVisible, setControlsVisible] = useState(true);
  const controlsTimerRef = useRef<NodeJS.Timeout | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Chat state
  const [showChat, setShowChat] = useState(false);
  const [chatMessages, setChatMessages] = useState<{
    id: string;
    user: string;
    text: string;
    isCurrentUser: boolean;
  }[]>([
    { id: '1', user: 'GameFan123', text: 'Love your stream! You\'re amazing at this game!', isCurrentUser: false },
    { id: '2', user: 'EpicGamer', text: 'Do you have any tips for beginners?', isCurrentUser: false },
    { id: '3', user: 'StreamViewer', text: 'How long have you been playing this game?', isCurrentUser: false },
    { id: '4', user: 'You', text: 'Thanks for watching everyone!', isCurrentUser: true },
  ]);
  const [newMessage, setNewMessage] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);
  
  // Donation state
  const [showDonateForm, setShowDonateForm] = useState(false);
  const [donationAmount, setDonationAmount] = useState('5');
  const [donationMessage, setDonationMessage] = useState('');
  
  // Streamer interaction state
  const [isFollowing, setIsFollowing] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingProgress, setRecordingProgress] = useState(0);
  const recordingInterval = useRef<NodeJS.Timeout | null>(null);
  
  // Sample data - would come from API in production
  const gameLibrary = [
    { id: '1', name: 'Fortnite', coverUrl: 'https://m.media-amazon.com/images/I/81ZUXM0C+fL._AC_UF1000,1000_QL80_.jpg', viewerCount: 245300, cover: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co1tmu.jpg', background: 'https://images.igdb.com/igdb/image/upload/t_screenshot_huge/sc8drr.jpg' },
    { id: '2', name: 'Valorant', coverUrl: 'https://m.media-amazon.com/images/I/71inTnKHDrL._AC_UF1000,1000_QL80_.jpg', viewerCount: 183450, cover: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co49x5.jpg', background: 'https://images.igdb.com/igdb/image/upload/t_screenshot_huge/sc7hsx.jpg' },
    { id: '3', name: 'League of Legends', coverUrl: 'https://cdn1.epicgames.com/offer/24b9b5e323bc40eea252a10cdd3b2f10/LOL_2560x1440-98749e0d718e82d27a084941939bc9d3', viewerCount: 321500, cover: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co245r.jpg', background: 'https://images.igdb.com/igdb/image/upload/t_screenshot_huge/sc6o8u.jpg' },
    { id: '4', name: 'Call of Duty: Warzone', coverUrl: 'https://image.api.playstation.com/vulcan/ap/rnd/202211/0914/N9VGDkhFJi90QZZd2YYbJk9U.png', viewerCount: 156700, cover: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co1wr6.jpg', background: 'https://images.igdb.com/igdb/image/upload/t_screenshot_huge/sc6qky.jpg' },
    { id: '5', name: 'Minecraft', coverUrl: 'https://image.api.playstation.com/vulcan/img/rnd/202010/2621/FQLAGvB7yVKiY36MmdHrBVL8.png', viewerCount: 98400, cover: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co49x5.jpg', background: 'https://images.igdb.com/igdb/image/upload/t_screenshot_huge/sc7hsx.jpg' },
    { id: '6', name: 'Apex Legends', coverUrl: 'https://media.contentapi.ea.com/content/dam/apex-legends/images/2019/01/apex-featured-image-16x9.jpg.adapt.crop16x9.1023w.jpg', viewerCount: 142300, cover: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co2ekt.jpg', background: 'https://images.igdb.com/igdb/image/upload/t_screenshot_huge/sc6mfy.jpg' },
  ];

  // Sample streamers for demo
  const streamers = [
    {
      id: '1',
      name: 'Pro Gamer',
      game: 'Fortnite',
      viewers: 12453,
      avatar: 'https://randomuser.me/api/portraits/men/32.jpg',
      followers: 1200000,
      gameId: 'fort123',
      gameCover: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co1tmu.jpg',
      gameBanner: 'https://images.igdb.com/igdb/image/upload/t_screenshot_huge/sc8drr.jpg'
    },
    {
      id: '2',
      name: 'Epic Streamer',
      game: 'Minecraft',
      viewers: 8721,
      avatar: 'https://randomuser.me/api/portraits/women/44.jpg',
      followers: 980000,
      gameId: 'mine456',
      gameCover: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co49x5.jpg',
      gameBanner: 'https://images.igdb.com/igdb/image/upload/t_screenshot_huge/sc7hsx.jpg'
    },
    {
      id: '3',
      name: 'Gaming Legend',
      game: 'League of Legends',
      viewers: 15302,
      avatar: 'https://randomuser.me/api/portraits/men/22.jpg',
      followers: 1500000,
      gameId: 'lol789',
      gameCover: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co245r.jpg',
      gameBanner: 'https://images.igdb.com/igdb/image/upload/t_screenshot_huge/sc6o8u.jpg'
    },
    {
      id: '4',
      name: 'Awesome Player',
      game: 'Call of Duty',
      viewers: 7182,
      avatar: 'https://randomuser.me/api/portraits/women/29.jpg',
      followers: 850000,
      gameId: 'cod321',
      gameCover: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co1wr6.jpg',
      gameBanner: 'https://images.igdb.com/igdb/image/upload/t_screenshot_huge/sc6qky.jpg'
    },
    {
      id: '5',
      name: 'Game Master',
      game: 'Apex Legends',
      viewers: 9283,
      avatar: 'https://randomuser.me/api/portraits/men/42.jpg',
      followers: 1100000,
      gameId: 'apex654',
      gameCover: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co2ekt.jpg',
      gameBanner: 'https://images.igdb.com/igdb/image/upload/t_screenshot_huge/sc6mfy.jpg'
    }
  ];
  
  // Get current streamer
  const currentStreamer = streamers[currentIndex];

  // Navigation handlers
  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % streamers.length);
    showControls();
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + streamers.length) % streamers.length);
    showControls();
  };
  
  // Controls visibility handlers
  const showControls = () => {
    setControlsVisible(true);
    
    // Reset the timer whenever controls are shown
    if (controlsTimerRef.current) {
      clearTimeout(controlsTimerRef.current);
    }
    
    // Auto-hide controls after 10 seconds
    controlsTimerRef.current = setTimeout(() => {
      if (!searchOpen && !showChat && !showDonateForm) {
        setControlsVisible(false);
      }
    }, 10000);
  };
  
  // Handle screen tap to show controls
  const handleScreenTap = (e: React.MouseEvent) => {
    // Only handle screen taps that aren't on controllers or other UI elements
    if (e.target === e.currentTarget) {
      if (!controlsVisible) {
        showControls();
      } else {
        // If controls are already visible, toggle them off on tap
        setControlsVisible(false);
        if (controlsTimerRef.current) {
          clearTimeout(controlsTimerRef.current);
        }
      }
    }
  };

  // Chat handlers
  const handleToggleChat = () => {
    setShowChat(!showChat);
    showControls();
  };

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      const newMsg = {
        id: `msg-${Date.now()}`,
        user: 'You',
        text: newMessage,
        isCurrentUser: true
      };
      setChatMessages([...chatMessages, newMsg]);
      setNewMessage('');
    }
  };

  // Scroll to bottom of chat when new messages arrive
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages]);

  // Initialize control auto-hide and handle chat visibility
  useEffect(() => {
    // Initial auto-hide timer
    showControls();
    
    // Focus chat input when chat is opened and keep controls visible
    if (showChat || showDonateForm || searchOpen) {
      setControlsVisible(true);
      if (controlsTimerRef.current) {
        clearTimeout(controlsTimerRef.current);
      }
    } else {
      // When UI elements close, start the auto-hide timer
      showControls();
    }
    
    // Cleanup on unmount
    return () => {
      if (controlsTimerRef.current) {
        clearTimeout(controlsTimerRef.current);
      }
    };
  }, [showChat, showDonateForm, searchOpen]);

  // Follow/Unfollow handler
  const handleFollow = () => {
    setIsFollowing(!isFollowing);
    if (!isFollowing) {
      toast.success(`You are now following ${currentStreamer.name}!`);
    } else {
      toast.info(`You have unfollowed ${currentStreamer.name}.`);
    }
  };
  
  // Donation handlers
  const handleDonateSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const amount = parseFloat(donationAmount);
    if (amount > 0) {
      toast.success(`Thank you for your $${amount} donation to ${currentStreamer.name}!`);
      setShowDonateForm(false);
    }
  };

  // Handle clip recording
  const handleRecord = () => {
    if (!isRecording) {
      setIsRecording(true);
      setRecordingProgress(0);
      toast.info(`Started recording a clip...`);
      
      // Simulate progress
      recordingInterval.current = setInterval(() => {
        setRecordingProgress(prev => {
          if (prev >= 100) {
            if (recordingInterval.current) {
              clearInterval(recordingInterval.current);
            }
            setIsRecording(false);
            toast.success(`Clip saved successfully!`);
            return 0;
          }
          return prev + 5;
        });
      }, 500);
    } else {
      if (recordingInterval.current) {
        clearInterval(recordingInterval.current);
      }
      setIsRecording(false);
      setRecordingProgress(0);
      toast.success(`Clip saved successfully!`);
    }
  };
  
  // Clean up interval on unmount
  useEffect(() => {
    return () => {
      if (recordingInterval.current) {
        clearInterval(recordingInterval.current);
      }
    };
  }, []);
  
  // Handle game selection
  const handleGameSelect = (game: any) => {
    setSelectedGame(game);
    setSearchOpen(false);
    toast.success(`Selected ${game.name}`);
  };

  // Search for games when query changes
  useEffect(() => {
    if (searchQuery.trim()) {
      setIsLoading(true);
      // Simulate search delay
      const timer = setTimeout(() => {
        const results = gameLibrary.filter(game =>
          game.name.toLowerCase().includes(searchQuery.toLowerCase())
        );
        setSearchResults(results);
        setIsLoading(false);
      }, 500);
      
      return () => clearTimeout(timer);
    } else {
      setSearchResults([]);
    }
  }, [searchQuery, gameLibrary]);

  // UI Rendering
  return (
    <div className="fixed inset-0 bg-black text-white overflow-hidden flex flex-col">
      {/* Full-screen video/image background simulation */}
      <div className="fixed inset-0 bg-black">
        {/* Overlay with subtle gradient for depth */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/30 z-10"></div>
        
        {/* This would be an actual video player in production */}
        <div className="w-full h-full flex items-center justify-center overflow-hidden">
          <img 
            src={currentStreamer.gameBanner || `https://picsum.photos/1920/1080?random=${currentIndex}`} 
            alt="Stream content" 
            className="w-full h-full object-cover"
            onError={(e) => {
              e.currentTarget.src = `https://picsum.photos/1920/1080?random=${currentIndex}`;
            }}
          />
          
          {/* Stream quality indicator */}
          {/* Stream quality indicator removed */}
        </div>
      </div>

      {/* Search button in top right - no header */}
      <div className="absolute top-4 right-4 z-20 flex gap-3">
        <button 
          onClick={() => navigate('/streaming')}
          className="p-3 rounded-full bg-black bg-opacity-40 hover:bg-opacity-60 border border-purple-500 transition-all shadow-lg hover:shadow-purple-600/50 hover:scale-105"
        >
          <Tv size={20} className="text-purple-400" />
        </button>
        <button 
          onClick={() => setSearchOpen(true)}
          className="p-3 rounded-full bg-black bg-opacity-40 hover:bg-opacity-60 border border-purple-500 transition-all shadow-lg hover:shadow-purple-600/50 hover:scale-105"
        >
          <Search size={20} className="text-purple-400" />
        </button>
      </div>

      {/* Streamer info with STREAMING indicator */}
      <motion.div 
        className="absolute bottom-16 left-4 right-4 z-10 cursor-pointer"
        initial={{ opacity: 1 }}
        animate={{ 
          opacity: controlsVisible ? 1 : 0,
          y: controlsVisible ? 0 : 10
        }}
        transition={{ duration: 0.3 }}
        onClick={() => navigate(`/streaming/${currentStreamer?.id || ''}`)}
      >
        <div className="flex items-center mb-2 relative gap-3">
          <div className="w-10 h-10 rounded-full overflow-hidden mr-3">
            <img 
              src={currentStreamer?.avatar || `https://randomuser.me/api/portraits/men/${currentIndex + 1}.jpg`} 
              alt={currentStreamer?.name || "Streamer"}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-white font-bold truncate flex items-center gap-2 drop-shadow-lg">
              {currentStreamer?.name || "Username"}
              <span className="inline-flex items-center justify-center px-2 py-0.5 text-xs font-medium rounded-full bg-purple-800 text-purple-100">
                LIVE
              </span>
            </div>
            <div className="text-gray-300 text-sm truncate flex items-center drop-shadow">
              <Gamepad size={14} className="mr-1 text-purple-400" />
              {currentStreamer?.game || "Game Name"}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Navigation buttons */}
      <button 
        className="absolute top-1/2 left-4 transform -translate-y-1/2 z-20 text-white hover:text-purple-400 transition-colors"
        onClick={handlePrev}
      >
        <ChevronLeft size={32} />
      </button>

      <button 
        className="absolute top-1/2 right-4 transform -translate-y-1/2 z-20 text-white hover:text-purple-400 transition-colors"
        onClick={handleNext}
      >
        <ChevronRight size={32} />
      </button>

      {/* Controls with auto-hide animation */}
      <motion.div 
        className="absolute bottom-4 left-0 right-0 flex justify-center gap-3 px-4 z-10"  
        initial={{ opacity: 1, y: 0 }}
        animate={{ 
          opacity: controlsVisible ? 1 : 0,
          y: controlsVisible ? 0 : 20
        }}
        transition={{ duration: 0.3 }}
        style={{ pointerEvents: showChat ? 'none' : 'auto' }}
      >
        <motion.button
          whileTap={{ scale: 0.9 }}
          className="w-12 h-12 rounded-full bg-gray-900 bg-opacity-70 backdrop-blur-sm flex items-center justify-center text-white"
          onClick={handlePrev}
          style={{ boxShadow: '0 4px 8px rgba(0, 0, 0, 0.5)' }}
        >
          <ChevronLeft size={24} />
        </motion.button>
        
        <motion.button
          whileTap={{ scale: 0.9 }}
          className="w-12 h-12 rounded-full bg-purple-700 flex items-center justify-center text-white"
          onClick={handleToggleChat}
          style={{ boxShadow: '0 4px 12px rgba(138, 43, 226, 0.5)' }}
        >
          <MessageCircle size={20} />
        </motion.button>
        
        <motion.button
          whileTap={{ scale: 0.9 }}
          className="w-12 h-12 rounded-full bg-gray-900 bg-opacity-70 backdrop-blur-sm flex items-center justify-center text-white"
          onClick={() => {
            setShowDonateForm(true);
            showControls();
          }}
          style={{ boxShadow: '0 4px 8px rgba(0, 0, 0, 0.5)' }}
        >
          <DollarSign size={20} />
        </motion.button>
        
        <motion.button
          whileTap={{ scale: 0.9 }}
          className={`w-12 h-12 rounded-full ${isFollowing ? 'bg-green-600' : 'bg-gray-900 bg-opacity-70 backdrop-blur-sm'} flex items-center justify-center text-white`}
          onClick={handleFollow}
          style={{ boxShadow: isFollowing ? '0 4px 12px rgba(22, 163, 74, 0.5)' : '0 4px 8px rgba(0, 0, 0, 0.5)' }}
        >
          <UserPlus size={20} />
        </motion.button>
        
        <motion.button
          whileTap={{ scale: 0.9 }}
          className={`w-12 h-12 rounded-full ${isRecording ? 'bg-red-600 animate-pulse' : 'bg-gray-900 bg-opacity-70 backdrop-blur-sm'} flex items-center justify-center text-white transition-colors`}
          onClick={handleRecord}
          disabled={isRecording && recordingProgress < 100}
          style={{ boxShadow: isRecording ? '0 4px 12px rgba(220, 38, 38, 0.5)' : '0 4px 8px rgba(0, 0, 0, 0.5)' }}
        >
          <Scissors size={20} />
        </motion.button>
        
        <motion.button
          whileTap={{ scale: 0.9 }}
          className="w-12 h-12 rounded-full bg-gray-900 bg-opacity-70 backdrop-blur-sm flex items-center justify-center text-white"
          onClick={handleNext}
          style={{ boxShadow: '0 4px 8px rgba(0, 0, 0, 0.5)' }}
        >
          <ChevronRight size={24} />
        </motion.button>
      </motion.div>

      {/* Recording indicator - always visible when recording */}
      {isRecording && (
        <motion.div 
          className="absolute top-4 left-4 right-4 z-20"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="bg-red-900 bg-opacity-70 backdrop-blur-sm p-2 rounded-lg flex items-center border border-red-500/30">
            <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse mr-2"></div>
            <div className="text-white text-sm flex-1 font-medium">Recording clip... {recordingProgress}%</div>
          </div>
          <div className="h-1 bg-gray-800 rounded-full mt-1 overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-red-600 to-red-400 rounded-full" 
              style={{ width: `${recordingProgress}%` }}
            ></div>
          </div>
        </motion.div>
      )}

      {/* Split-screen layout: stream + chat */}
      <div className="flex flex-col h-full w-full">
        {/* Stream video area (animates when chat is open) */}
        <motion.div
          ref={containerRef}
          className="relative bg-black overflow-hidden flex-1"
          onClick={handleScreenTap}
          animate={{
            height: showChat ? '65%' : '100%',
            borderBottomLeftRadius: showChat ? 24 : 0,
            borderBottomRightRadius: showChat ? 24 : 0,
            boxShadow: showChat ? '0 8px 32px rgba(138,43,226,0.18)' : 'none'
          }}
          transition={{ type: 'spring', stiffness: 180, damping: 22 }}
          style={{ minHeight: 0 }}
        >
          <img 
            src={currentStreamer.gameBanner || `https://picsum.photos/1920/1080?random=${currentIndex}`} 
            alt="Stream content" 
            className="w-full h-full object-cover"
            onError={(e) => {
              e.currentTarget.src = `https://picsum.photos/1920/1080?random=${currentIndex}`;
            }}
          />
        </motion.div>

        {/* Chat panel - slides up from bottom, split screen style */}
        <AnimatePresence>
          {showChat && (
            <motion.div
              className="w-full bg-black bg-opacity-90 backdrop-blur-lg border-t border-purple-900 flex-shrink-0"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 190, damping: 24 }}
              style={{ height: '35vh', minHeight: 220, position: 'relative', zIndex: 30 }}
            >
              <div className="h-full flex flex-col p-4">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="font-bold text-lg text-purple-400">
                    Stream Chat
                  </h3>
                  <button
                    onClick={() => setShowChat(false)}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    <X size={18} />
                  </button>
                </div>
                
                <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-gray-900 mb-3">
                  {chatMessages.map((message) => (
                    <div 
                      key={message.id}
                      className={`mb-3 ${message.isCurrentUser ? 'flex justify-end' : ''}`}
                    >
                      <div 
                        className={`max-w-[80%] rounded-lg p-2 ${message.isCurrentUser 
                          ? 'bg-purple-600 text-white ml-auto' 
                          : 'bg-gray-800 text-white'}`}
                      >
                        {!message.isCurrentUser && (
                          <div className="font-bold text-xs mb-1 text-purple-300">{message.user}</div>
                        )}
                        <div>{message.text}</div>
                      </div>
                    </div>
                  ))}
                  <div ref={chatEndRef} />
                </div>
                
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1 bg-gray-900 border border-gray-700 rounded-full px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
                    onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                  />
                  <button
                    onClick={handleSendMessage}
                    className="p-2 rounded-full bg-purple-600 text-white disabled:opacity-50"
                    disabled={!newMessage.trim()}
                  >
                    <Send size={18} />
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Donation popup with improved styling */}
      <AnimatePresence>
        {showDonateForm && (
          <motion.div
            className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-30 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div 
              className="bg-gray-900 rounded-xl border border-gray-700 shadow-xl w-full max-w-md overflow-hidden"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            >
              <div className="p-4 border-b border-gray-700 flex justify-between items-center">
                <h3 className="font-bold text-xl text-purple-400">
                  Support {currentStreamer.name}
                </h3>
                <button
                  onClick={() => setShowDonateForm(false)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <X size={18} />
                </button>
              </div>
              
              <div className="p-4 flex items-center gap-3 border-b border-gray-700">
                <div className="relative">
                  <div className="absolute -top-2 -left-2 bg-red-600 text-[9px] font-bold px-1.5 py-0.5 rounded shadow-sm z-10 tracking-wide">
                    STREAMING
                  </div>
                  <img 
                    src={currentStreamer.avatar} 
                    alt={currentStreamer.name}
                    className="w-14 h-14 rounded-lg border-2 border-purple-600"
                  />
                  <div className="absolute -bottom-2 -right-2 w-7 h-7 rounded-full overflow-hidden border-2 border-purple-600">
                    <img 
                      src={currentStreamer.gameCover} 
                      alt={currentStreamer.game}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.src = `https://picsum.photos/50/50?random=${currentStreamer.id}`;
                      }}
                    />
                  </div>
                </div>
                <div>
                  <div className="font-bold text-lg text-purple-400">{currentStreamer.name}</div>
                  <div className="text-sm text-purple-300">{currentStreamer.followers.toLocaleString()} followers</div>
                </div>
              </div>
              
              <form onSubmit={handleDonateSubmit} className="p-4">
                <div className="grid grid-cols-4 gap-2 mb-4">
                  {['5', '10', '20', '50'].map((amount) => (
                    <button
                      key={amount}
                      type="button"
                      className={`p-2 rounded-lg border ${donationAmount === amount 
                        ? 'bg-purple-600 border-purple-500 text-white' 
                        : 'bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700'} transition-colors`}
                      onClick={() => setDonationAmount(amount)}
                    >
                      ${amount}
                    </button>
                  ))}
                </div>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-400 mb-1">Custom Amount</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">$</span>
                    <input
                      type="number"
                      value={donationAmount}
                      onChange={(e) => setDonationAmount(e.target.value)}
                      placeholder="Enter amount"
                      className="w-full pl-8 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-purple-500 text-white"
                      min="1"
                    />
                  </div>
                </div>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-400 mb-1">Message (Optional)</label>
                  <textarea
                    value={donationMessage}
                    onChange={(e) => setDonationMessage(e.target.value)}
                    placeholder="Add a message to your donation"
                    className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-purple-500 text-white"
                    rows={3}
                  ></textarea>
                </div>
                
                <button
                  type="submit"
                  className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 rounded-lg text-white font-bold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  disabled={!donationAmount}
                >
                  <DollarSign size={18} className="inline-block mr-2" />
                  Complete Donation
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Search panel - slides in from the right */}
      <AnimatePresence>
        {searchOpen && (
          <motion.div
            className="fixed top-0 right-0 h-full w-96 bg-black bg-opacity-90 z-20 backdrop-blur-sm border-l border-gray-800"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          >
            <div className="h-full flex flex-col p-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-lg text-purple-400">
                  Find Games & Streamers
                </h3>
                <button
                  onClick={() => setSearchOpen(false)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <X size={18} />
                </button>
              </div>
              
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search games or streamers..."
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-800 border border-gray-700 rounded-full focus:outline-none focus:border-purple-500 text-white"
                />
              </div>
              
              {searchResults.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-400 mb-2">Popular Games</h4>
                  <div className="space-y-2">
                    {searchResults.map((game) => (
                      <div 
                        key={game.id}
                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-800 cursor-pointer transition-colors"
                        onClick={() => handleGameSelect(game)}
                      >
                        <div className="w-12 h-12 rounded overflow-hidden bg-gray-700 flex-shrink-0">
                          <img 
                            src={game.cover || `https://picsum.photos/100/100?random=${game.id}`} 
                            alt={game.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.currentTarget.src = `https://picsum.photos/100/100?random=${game.id}`;
                            }}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-purple-300 truncate">{game.name}</div>
                          <div className="flex items-center text-xs text-gray-400">
                            <Gamepad size={12} className="mr-1" />
                            <span>{(game.viewerCount || 0).toLocaleString()} watching</span>
                          </div>
                        </div>
                        <ChevronRight size={16} className="text-gray-500" />
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              <div>
                <h4 className="text-sm font-medium text-gray-400 mb-2">Sample Game Library</h4>
                <div className="grid grid-cols-3 gap-2">
                  {gameLibrary.map((game) => (
                    <div 
                      key={game.id}
                      className="flex flex-col items-center cursor-pointer group"
                      onClick={() => handleGameSelect(game)}
                    >
                      <div className="w-full aspect-square rounded-lg overflow-hidden bg-gray-800 mb-1 group-hover:ring-2 ring-purple-500 transition-all">
                        <img 
                          src={game.cover || `https://picsum.photos/100/100?random=${game.id}`}
                          alt={game.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.src = `https://picsum.photos/100/100?random=${game.id}`;
                          }}
                        />
                      </div>
                      <div className="text-xs text-center text-gray-300 group-hover:text-purple-300 transition-colors truncate w-full">
                        {game.name}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default DiscoveryMinimal;
