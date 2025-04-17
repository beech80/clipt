// Part 1: Imports and State Setup
import React, { useState, useEffect, useRef } from 'react';
import { Search, X, MessageCircle, DollarSign, UserPlus, Scissors, ChevronLeft, ChevronRight, Zap, Gamepad, Clock, Send } from 'lucide-react';
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
// Part 2: Sample Data and Handlers
  
  // Extended game library - sample popular games
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
  
  // Current streamer based on index
  const currentStreamer = streamers[currentIndex];

  // Navigation handlers
  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % streamers.length);
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + streamers.length) % streamers.length);
  };

  // Chat handlers
  const handleToggleChat = () => {
    setShowChat(!showChat);
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
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);
// Part 3: More Handlers and Effects

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
// Part 4: Main UI Rendering

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
          <div className="absolute top-6 right-16 bg-black/60 rounded-full px-2 py-0.5 text-xs font-bold text-purple-400 border border-purple-600">
            HD 1080p
          </div>
        </div>
      </div>

      {/* Search button in top right - no header */}
      <div className="absolute top-4 right-4 z-20">
        <button 
          onClick={() => setSearchOpen(true)}
          className="p-3 rounded-full bg-black bg-opacity-40 hover:bg-opacity-60 border border-purple-500 transition-all shadow-lg hover:shadow-purple-600/50 hover:scale-105"
        >
          <Search size={20} className="text-purple-400" />
        </button>
      </div>

      {/* Streamer info with STREAMING indicator */}
      <div className="absolute top-6 left-4 z-20 max-w-xs">
        <div 
          className="bg-black bg-opacity-40 backdrop-blur-sm rounded-lg p-3 border-l-4 border-purple-600 shadow-purple-600/20 shadow-lg group hover:scale-105 transition-transform overflow-hidden"
        >
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-purple-900/20 to-transparent opacity-50"></div>
          <div className="relative flex items-center gap-3">
            <div className="relative">
              <div className="absolute -top-1 -left-1 bg-red-600 text-[9px] font-bold px-1.5 py-0.5 rounded shadow-sm z-10 tracking-wide animate-pulse">
                STREAMING
              </div>
              <img 
                src={currentStreamer.avatar} 
                alt={currentStreamer.name}
                className="w-12 h-12 rounded-md border-2 border-purple-600 shadow-lg"
              />
              <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full overflow-hidden border-2 border-purple-600">
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
              <h3 className="font-bold text-xl text-purple-400">{currentStreamer.name}</h3>
              <div className="flex items-center text-xs text-purple-300 space-x-3 mt-0.5">
                <span className="font-medium">{currentStreamer.game}</span>
                <span className="flex items-center bg-black bg-opacity-30 px-1.5 py-0.5 rounded-full">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-red-500 mr-1 animate-pulse"></span>
                  <span className="font-medium">{currentStreamer.viewers.toLocaleString()}</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
// Part 5: Navigation and Controller UI

      {/* Navigation buttons */}
      <button 
        className="absolute top-1/2 left-4 transform -translate-y-1/2 z-20 p-2 rounded-full bg-gray-800 bg-opacity-60 hover:bg-opacity-80 transition-colors"
        onClick={handlePrev}
      >
        <ChevronLeft size={24} />
      </button>

      <button 
        className="absolute top-1/2 right-4 transform -translate-y-1/2 z-20 p-2 rounded-full bg-gray-800 bg-opacity-60 hover:bg-opacity-80 transition-colors"
        onClick={handleNext}
      >
        <ChevronRight size={24} />
      </button>

      {/* Controller at bottom - more compact and less intrusive */}
      <div className="absolute bottom-8 right-8 z-20">
        <div className="flex flex-col gap-4">
          <button 
            className={`w-12 h-12 rounded-full ${showChat ? 'bg-green-700' : 'bg-black bg-opacity-60'} flex items-center justify-center shadow-lg border ${showChat ? 'border-green-400' : 'border-[#107c10]'} hover:scale-110 transition-transform`}
            onClick={handleToggleChat}
          >
            <MessageCircle size={20} className={showChat ? 'text-white' : 'text-[#107c10]'} />
            <span className="absolute bottom-0 right-0 w-4 h-4 flex items-center justify-center bg-black bg-opacity-60 rounded-full text-[10px] font-bold">Y</span>
          </button>
          
          <button 
            className="w-12 h-12 rounded-full bg-black bg-opacity-60 flex items-center justify-center shadow-lg border border-[#f25022] hover:scale-110 transition-transform"
            onClick={() => setShowDonateForm(true)}
          >
            <DollarSign size={20} className="text-[#f25022]" />
            <span className="absolute bottom-0 right-0 w-4 h-4 flex items-center justify-center bg-black bg-opacity-60 rounded-full text-[10px] font-bold">B</span>
          </button>
          
          <button 
            className={`w-12 h-12 rounded-full bg-black bg-opacity-60 flex items-center justify-center shadow-lg border ${isFollowing ? 'border-blue-400' : 'border-[#00a4ef]'} hover:scale-110 transition-transform`}
            onClick={handleFollow}
          >
            <UserPlus size={20} className={isFollowing ? 'text-blue-400' : 'text-[#00a4ef]'} />
            <span className="absolute bottom-0 right-0 w-4 h-4 flex items-center justify-center bg-black bg-opacity-60 rounded-full text-[10px] font-bold">A</span>
          </button>
          
          <button 
            className={`w-12 h-12 rounded-full bg-black bg-opacity-60 flex items-center justify-center shadow-lg border ${isRecording ? 'border-red-500' : 'border-[#ffb900]'} hover:scale-110 transition-transform relative`}
            onClick={handleRecord}
          >
            {isRecording ? (
              <>
                <Clock size={20} className="text-red-500 animate-pulse" />
                <svg className="absolute inset-0 h-full w-full" viewBox="0 0 44 44">
                  <circle 
                    className="text-gray-800 opacity-25" 
                    cx="22" 
                    cy="22" 
                    r="20" 
                    strokeWidth="3" 
                    stroke="currentColor" 
                    fill="none"
                  />
                  <circle 
                    className="text-red-500" 
                    cx="22" 
                    cy="22" 
                    r="20" 
                    strokeWidth="3" 
                    stroke="currentColor" 
                    fill="none" 
                    strokeDasharray="125.6" 
                    strokeDashoffset={125.6 * (1 - recordingProgress/100)}
                    transform="rotate(-90 22 22)"
                  />
                </svg>
              </>
            ) : (
              <Scissors size={20} className="text-[#ffb900]" />
            )}
            <span className="absolute bottom-0 right-0 w-4 h-4 flex items-center justify-center bg-black bg-opacity-60 rounded-full text-[10px] font-bold">X</span>
          </button>
        </div>
      </div>
// Part 6: Chat Panel and Donation UI
      
      {/* Chat panel - slides up from bottom */}
      <AnimatePresence>
        {showChat && (
          <motion.div
            className="fixed bottom-0 left-0 right-0 h-96 bg-black bg-opacity-90 z-20 backdrop-blur-sm border-t border-gray-800"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
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
// Part 7: Search Panel and Final Structure
      
      {/* Enhanced Search panel with game library */}
      <AnimatePresence>
        {searchOpen && (
          <motion.div 
            className="fixed inset-0 bg-black bg-opacity-90 z-50 flex flex-col"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="p-4 border-b border-gray-800 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-purple-400">Game Search</h2>
              <button 
                onClick={() => setSearchOpen(false)}
                className="p-2 rounded-full bg-gray-800 hover:bg-gray-700 transition-colors"
              >
                <X size={18} />
              </button>
            </div>
            
            <div className="p-4 border-b border-gray-800">
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search games..."
                  className="w-full bg-gray-900 rounded-lg border border-gray-700 py-3 px-4 pl-10 text-white focus:outline-none focus:border-purple-500"
                  autoFocus
                />
                <Search className="absolute left-3 top-3.5 text-gray-500" size={18} />
                {isLoading && (
                  <div className="absolute right-3 top-3">
                    <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-purple-500 border-r-2 border-b-2 border-gray-800"></div>
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex-1 p-6 overflow-auto">
              {searchQuery ? (
                <div>
                  <h3 className="font-bold mb-4 text-xl">Search Results</h3>
                  {searchResults.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 p-4">
                      {searchResults.map((game) => (
                        <div 
                          key={game.id} 
                          className="bg-black bg-opacity-60 rounded-lg overflow-hidden border border-gray-800 hover:border-purple-500 transition-all cursor-pointer"
                          onClick={() => {
                            setSelectedGame(game);
                            setSearchOpen(false);
                            toast.success(`Selected ${game.name}`);
                          }}
                        >
                          <div className="h-40 overflow-hidden">
                            <img 
                              src={game.cover || `https://picsum.photos/200/300?random=${game.id}`} 
                              alt={game.name}
                              className="w-full h-full object-cover transition-transform hover:scale-110"
                              onError={(e) => {
                                e.currentTarget.src = `https://picsum.photos/200/300?random=${game.id}`;
                              }}
                            />
                          </div>
                          <div className="p-3">
                            <p className="font-bold text-purple-400">{game.name}</p>
                            <div className="text-xs text-purple-300 mt-1 flex items-center">
                              <Gamepad size={12} className="mr-1" />
                              {game.platforms ? game.platforms.join(', ') : 'All Platforms'}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-10">
                      <p className="text-purple-400">No games found matching "{searchQuery}"</p>
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  <h3 className="font-bold mb-4 text-xl text-purple-400">Trending Games</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {gameLibrary.slice(0, 8).map((game) => (
                      <div
                        key={game.id} 
                        className="rounded-lg overflow-hidden bg-gray-900 hover:bg-gray-800 border border-gray-800 transform hover:scale-105 transition-all cursor-pointer shadow-lg hover:shadow-purple-500/20"
                        onClick={() => handleGameSelect(game)}
                      >
                        <div className="aspect-video bg-gray-800 relative overflow-hidden">
                          <img 
                            src={game.coverUrl} 
                            alt={game.name}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-gray-900 to-transparent opacity-80"></div>
                        </div>
                        <div className="p-3">
                          <p className="font-bold text-purple-400">{game.name}</p>
                          <p className="text-sm text-purple-400 flex items-center">
                            <span className="inline-block w-1.5 h-1.5 rounded-full bg-purple-500 mr-1"></span>
                            {game.viewerCount.toLocaleString()} viewers
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      <NavigationBar />
    </div>
  );
};

export default DiscoveryMinimal;
