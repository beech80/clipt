import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, ChevronLeft, Share2, MessageCircle, DollarSign, RefreshCw, Twitter, Facebook, Mail, Clipboard, Star, X, Send } from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import styled from 'styled-components';
import { Dialog, DialogContent } from "@/components/ui/dialog";

// Define the Streamer interface
interface Streamer {
  id: string;
  streamerName: string;
  gameName: string;
  viewerCount: number;
  genres: string[];
  thumbnailUrl: string;
  isLive: boolean;
  avatarSeed: string;
}

// Styled Components
const StreamContainer = styled.div`
  width: 100%;
  height: 100vh;
  background: linear-gradient(to bottom, #0C0C0C, #151515, #0C0C0C);
  position: relative;
  overflow: hidden;
  touch-action: pan-y;
`;

const StreamHeader = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  z-index: 10;
  background: linear-gradient(to bottom, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0) 100%);
`;

const StreamTitle = styled.h1`
  font-size: 2rem;
  color: #FFFFFF;
  font-weight: bold;
  text-shadow: 0 0 10px rgba(255, 85, 0, 0.7), 0 0 20px rgba(255, 85, 0, 0.5);
  margin: 0;
  position: relative;
  display: inline-block;
`;

const LiveBadge = styled.div`
  background-color: #FF3B30;
  color: white;
  padding: 3px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: bold;
  position: absolute;
  top: -10px;
  right: -20px;
  box-shadow: 0 0 10px rgba(255, 59, 48, 0.5);
  animation: pulse 1.5s infinite;
  
  @keyframes pulse {
    0% { opacity: 0.7; transform: scale(0.95); }
    50% { opacity: 1; transform: scale(1.05); }
    100% { opacity: 0.7; transform: scale(0.95); }
  }
`;

const ActionButtons = styled.div`
  position: absolute;
  bottom: 20px;
  left: 0;
  right: 0;
  display: flex;
  justify-content: space-around;
  padding: 0 20px;
  z-index: 10;
`;

const ActionButton = styled.button`
  background: rgba(0, 0, 0, 0.7);
  border: 2px solid rgba(255, 85, 0, 0.7);
  border-radius: 50%;
  width: 50px;
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #FF5500;
  transition: all 0.3s ease;
  box-shadow: 0 0 15px rgba(255, 85, 0, 0.3);
  
  &:hover {
    transform: scale(1.1);
    background: rgba(255, 85, 0, 0.2);
    box-shadow: 0 0 20px rgba(255, 85, 0, 0.5);
  }
`;

const AllStreamers = () => {
  const navigate = useNavigate();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [streamers, setStreamers] = useState<Streamer[]>([]);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isDonateModalOpen, setIsDonateModalOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isSubscribeModalOpen, setIsSubscribeModalOpen] = useState(false);
  const [selectedTier, setSelectedTier] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<Array<{user: string; message: string; time: string}>>([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Sample fallback data to display
  const fallbackStreamers: Streamer[] = [
    {
      id: 'ninja_123',
      streamerName: 'Ninja',
      gameName: 'Stellar Odyssey',
      viewerCount: 45000,
      genres: ['Space', 'Adventure', 'RPG'],
      thumbnailUrl: 'https://picsum.photos/800/450?random=1',
      isLive: true,
      avatarSeed: 'ninja'
    },
    {
      id: 'pokimane_456',
      streamerName: 'Pokimane',
      gameName: 'Galactic Fleet Commander',
      viewerCount: 32000,
      genres: ['Strategy', 'Space', 'Simulation'],
      thumbnailUrl: 'https://picsum.photos/800/450?random=2',
      isLive: true,
      avatarSeed: 'pokimane'
    },
    {
      id: 'drdisrespect_789',
      streamerName: 'DrDisrespect',
      gameName: 'Event Horizon',
      viewerCount: 28000,
      genres: ['Horror', 'Space', 'Survival'],
      thumbnailUrl: 'https://picsum.photos/800/450?random=3',
      isLive: true,
      avatarSeed: 'drdisrespect'
    },
    {
      id: 'shroud_101',
      streamerName: 'Shroud',
      gameName: 'Cosmic Explorers',
      viewerCount: 35000,
      genres: ['Exploration', 'Space', 'Open World'],
      thumbnailUrl: 'https://picsum.photos/800/450?random=4',
      isLive: true,
      avatarSeed: 'shroud'
    },
    {
      id: 'tfue_202',
      streamerName: 'Tfue',
      gameName: 'Space Station Simulator',
      viewerCount: 25000,
      genres: ['Simulation', 'Building', 'Space'],
      thumbnailUrl: 'https://picsum.photos/800/450?random=5',
      isLive: true,
      avatarSeed: 'tfue'
    }
  ];

  // Navigation functions
  const handleNextStream = () => {
    if (currentIndex < streamers.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handlePrevStream = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  // Go back to discovery page
  const goBack = () => {
    navigate('/discovery');
  };

  // Action button handlers
  const handleChatToggle = () => {
    setIsChatOpen(!isChatOpen);
    if (!isChatOpen) {
      // Add some sample messages when opening chat
      if (chatMessages.length === 0) {
        setChatMessages([
          { user: 'CosmicViewer42', message: 'Awesome stream!', time: '2:30 PM' },
          { user: 'StarGazer99', message: 'How did you beat that boss?', time: '2:31 PM' },
          { user: 'NebulaNomad', message: 'What mods are you using?', time: '2:32 PM' },
          { user: 'GalacticGamer', message: 'Been following you since day one!', time: '2:33 PM' },
          { user: streamers[currentIndex]?.streamerName, message: 'Thanks for watching everyone! Don\'t forget to subscribe!', time: '2:34 PM' }
        ]);
      }
      
      // Scroll to bottom of chat when opening
      setTimeout(() => {
        if (chatContainerRef.current) {
          chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
      }, 100);
    }
  };
  
  const handleSubscribe = () => {
    if (isSubscribed) {
      setIsSubscribed(false);
      setSelectedTier(null);
      toast.success('Unsubscribed successfully');
    } else {
      setIsSubscribeModalOpen(true);
    }
  };
  
  const confirmSubscription = (tier: string) => {
    setIsSubscribed(true);
    setSelectedTier(tier);
    setIsSubscribeModalOpen(false);
    toast.success(`Subscribed to ${tier} tier successfully!`);
  };
  
  const sendChatMessage = () => {
    if (currentMessage.trim()) {
      const now = new Date();
      const timeString = `${now.getHours()}:${now.getMinutes().toString().padStart(2, '0')}`;
      setChatMessages([...chatMessages, { user: 'You', message: currentMessage, time: timeString }]);
      setCurrentMessage('');
      
      // Scroll to bottom
      setTimeout(() => {
        if (chatContainerRef.current) {
          chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
      }, 100);
    }
  };
  
  const handleDonate = () => {
    setIsDonateModalOpen(true);
  };
  
  const handleShareStream = () => {
    setIsShareModalOpen(true);
  };

  // Copy link to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Link copied to clipboard!');
  };

  // Fetch streamers or use fallback
  const fetchStreamers = () => {
    setIsLoading(true);
    setError(null);
    
    // Simulate API call
    setTimeout(() => {
      setStreamers(fallbackStreamers);
      setIsLoading(false);
    }, 1000);
  };

  // Handle swipe gestures
  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      const touchDownY = e.touches[0].clientY;
      const touchDownX = e.touches[0].clientX;
      document.body.setAttribute('data-touch-start-y', touchDownY.toString());
      document.body.setAttribute('data-touch-start-x', touchDownX.toString());
    };

    const handleTouchMove = (e: TouchEvent) => {
      const touchDownY = Number(document.body.getAttribute('data-touch-start-y'));
      const touchDownX = Number(document.body.getAttribute('data-touch-start-x'));
      
      if (touchDownY === 0 && touchDownX === 0) {
        return;
      }

      const currentTouchY = e.touches[0].clientY;
      const currentTouchX = e.touches[0].clientX;
      
      const diffY = touchDownY - currentTouchY;
      const diffX = touchDownX - currentTouchX;
      
      // Determine if the swipe is primarily horizontal or vertical
      if (Math.abs(diffX) > Math.abs(diffY)) {
        // Horizontal swipe
        if (diffX > 50) { // Swiped left
          handleNextStream();
          document.body.setAttribute('data-touch-start-x', '0');
          document.body.setAttribute('data-touch-start-y', '0');
        } else if (diffX < -50) { // Swiped right
          handlePrevStream();
          document.body.setAttribute('data-touch-start-x', '0');
          document.body.setAttribute('data-touch-start-y', '0');
        }
      } else {
        // Vertical swipe
        if (diffY > 50) { // Swiped up
          handleNextStream();
          document.body.setAttribute('data-touch-start-y', '0');
          document.body.setAttribute('data-touch-start-x', '0');
        } else if (diffY < -50) { // Swiped down
          handlePrevStream();
          document.body.setAttribute('data-touch-start-y', '0');
          document.body.setAttribute('data-touch-start-x', '0');
        }
      }
    };

    // Handle keyboard navigation for testing on desktop
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        handleNextStream();
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        handlePrevStream();
      }
    };

    document.addEventListener('touchstart', handleTouchStart);
    document.addEventListener('touchmove', handleTouchMove);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [currentIndex]);

  // Initial fetch
  useEffect(() => {
    fetchStreamers();
  }, []);

  return (
    <StreamContainer>
      {/* Back button */}
      <div className="absolute top-4 left-4 z-50">
        <ActionButton onClick={goBack} style={{ width: '40px', height: '40px' }}>
          <ChevronLeft size={24} />
        </ActionButton>
      </div>
      
      {/* Main content - Swipeable stream views */}
      <AnimatePresence>
        {!isLoading && !error && streamers.length > 0 && (
          <motion.div 
            key={currentIndex}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            style={{ 
              width: '100%', 
              height: '100vh', 
              position: 'relative',
              background: '#000000'
            }}
          >
            {/* Stream Header with Streamer Name */}
            <StreamHeader>
              <div style={{ flex: 1 }}></div>
              <StreamTitle>
                {streamers[currentIndex].streamerName}
                <LiveBadge>LIVE</LiveBadge>
              </StreamTitle>
              <div style={{ flex: 1 }}></div>
            </StreamHeader>
            
            {/* Stream content - would be a video in production */}
            <div 
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                zIndex: 1,
                backgroundImage: `url(${streamers[currentIndex].thumbnailUrl})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}
            >
              {/* Stream title overlay */}
              <div style={{
                position: 'absolute',
                bottom: '80px',
                left: '0',
                width: '100%',
                padding: '20px',
                background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0) 100%)',
                zIndex: 5
              }}>
                <h2 style={{
                  color: '#FFFFFF',
                  fontSize: '1.5rem',
                  fontWeight: 'bold',
                  margin: 0,
                  textShadow: '0 0 10px rgba(0,0,0,0.8)',
                  maxWidth: '80%'
                }}>
                  {streamers[currentIndex].gameName}
                </h2>
                <div style={{ display: 'flex', gap: '8px', marginTop: '8px', flexWrap: 'wrap' }}>
                  {streamers[currentIndex].genres.map(genre => (
                    <span key={genre} style={{
                      backgroundColor: 'rgba(255, 85, 0, 0.75)',
                      color: '#FFFFFF',
                      borderRadius: '9999px',
                      padding: '4px 10px',
                      fontSize: '12px',
                      fontWeight: 'bold',
                      border: '1px solid rgba(255, 85, 0, 0.4)'
                    }}>{genre}</span>
                  ))}
                </div>
              </div>
            </div>
            
            {/* Viewer count */}
            <div style={{ 
              position: 'absolute',
              top: '70px',
              right: '20px',
              backgroundColor: 'rgba(0,0,0,0.7)',
              padding: '6px 12px',
              borderRadius: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              zIndex: 10,
              boxShadow: '0 0 15px rgba(0,0,0,0.5)',
              border: '1px solid rgba(255,85,0,0.4)'
            }}>
              <Users size={16} color="#FF7700" />
              <span style={{ color: 'white', fontSize: '14px', fontWeight: '600' }}>
                {streamers[currentIndex].viewerCount.toLocaleString()}
              </span>
            </div>
            
            {/* Action Buttons */}
            <ActionButtons>
              <ActionButton onClick={handleChatToggle}>
                <MessageCircle size={24} />
              </ActionButton>
              <ActionButton onClick={handleDonate}>
                <DollarSign size={24} />
              </ActionButton>
              <ActionButton onClick={handleShareStream}>
                <Share2 size={24} />
              </ActionButton>
              <ActionButton onClick={handleSubscribe} style={{ 
                background: isSubscribed ? 'rgba(255, 85, 0, 0.4)' : 'rgba(0, 0, 0, 0.7)',
                borderColor: isSubscribed ? 'rgba(255, 85, 0, 0.9)' : 'rgba(255, 85, 0, 0.7)'
              }}>
                <Star size={24} fill={isSubscribed ? '#FF5500' : 'none'} />
              </ActionButton>
            </ActionButtons>
            
            {/* Swipe indicators */}
            <div style={{
              position: 'absolute',
              top: '50%',
              right: '10px',
              transform: 'translateY(-50%)',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
              zIndex: 10
            }}>
              {Array.from({ length: Math.min(5, streamers.length) }).map((_, index) => (
                <div 
                  key={index}
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    backgroundColor: currentIndex === index ? '#FF5500' : 'rgba(255,255,255,0.4)',
                    transition: 'all 0.3s ease',
                    boxShadow: currentIndex === index ? '0 0 10px rgba(255,85,0,0.8)' : 'none'
                  }}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Loading State */}
      {isLoading && (
        <div className="flex flex-col items-center justify-center min-h-screen px-4 py-10">
          <motion.div 
            animate={{ 
              rotate: 360 
            }} 
            transition={{ 
              duration: 2, 
              repeat: Infinity, 
              ease: "linear" 
            }}
            className="mb-4 text-orange-500"
          >
            <RefreshCw size={40} />
          </motion.div>
          <p className="text-lg text-gray-400 text-center max-w-sm">Loading streams from across the galaxy...</p>
        </div>
      )}
      
      {/* Error State */}
      {error && !isLoading && (
        <div className="flex flex-col items-center justify-center min-h-screen px-4 py-10 text-center">
          <div className="bg-red-500/10 p-4 rounded-lg border border-red-500/30 mb-4 max-w-md">
            <p className="text-red-300 mb-4">{error}</p>
            <button 
              onClick={fetchStreamers}
              className="px-4 py-2 bg-orange-500/20 hover:bg-orange-500/30 text-orange-400 rounded-md transition-colors border border-orange-500/40 flex items-center justify-center mx-auto"
            >
              <RefreshCw size={16} className="mr-2" /> Try Again
            </button>
          </div>
        </div>
      )}
      
      {/* Share Modal */}
      <Dialog open={isShareModalOpen} onOpenChange={setIsShareModalOpen}>
        <DialogContent className="bg-[#151515] border border-orange-500/30 rounded-lg shadow-[0_0_30px_rgba(255,85,0,0.2)] max-w-md">
          <div className="p-4">
            <h2 className="text-xl font-bold text-white mb-4 text-center">Share Stream</h2>
            
            <div className="grid grid-cols-4 gap-4 mb-6">
              <button className="flex flex-col items-center justify-center gap-2">
                <div className="w-12 h-12 rounded-full bg-[#1DA1F2]/20 flex items-center justify-center hover:bg-[#1DA1F2]/30 transition-colors border border-[#1DA1F2]/30">
                  <Twitter size={20} className="text-[#1DA1F2]" />
                </div>
                <span className="text-xs text-gray-400">Twitter</span>
              </button>
              
              <button className="flex flex-col items-center justify-center gap-2">
                <div className="w-12 h-12 rounded-full bg-[#4267B2]/20 flex items-center justify-center hover:bg-[#4267B2]/30 transition-colors border border-[#4267B2]/30">
                  <Facebook size={20} className="text-[#4267B2]" />
                </div>
                <span className="text-xs text-gray-400">Facebook</span>
              </button>
              
              <button className="flex flex-col items-center justify-center gap-2">
                <div className="w-12 h-12 rounded-full bg-[#5865F2]/20 flex items-center justify-center hover:bg-[#5865F2]/30 transition-colors border border-[#5865F2]/30">
                  <MessageCircle size={20} className="text-[#5865F2]" />
                </div>
                <span className="text-xs text-gray-400">Discord</span>
              </button>
              
              <button className="flex flex-col items-center justify-center gap-2" onClick={() => copyToClipboard(`https://clipt.tv/stream/${streamers[currentIndex].id}`)}>
                <div className="w-12 h-12 rounded-full bg-gray-700/30 flex items-center justify-center hover:bg-gray-700/50 transition-colors border border-gray-600/30">
                  <Clipboard size={20} className="text-gray-300" />
                </div>
                <span className="text-xs text-gray-400">Copy Link</span>
              </button>
            </div>
            
            <div className="space-y-3">
              <button 
                className="w-full py-2.5 bg-orange-500/20 hover:bg-orange-500/30 text-orange-400 rounded-md transition-colors border border-orange-500/40 flex items-center justify-center gap-2"
                onClick={() => copyToClipboard(`https://clipt.tv/stream/${streamers[currentIndex].id}`)}
              >
                <Clipboard size={16} /> Copy Stream Link
              </button>
              
              <button className="w-full py-2.5 bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 rounded-md transition-colors border border-purple-500/40 flex items-center justify-center gap-2">
                <Mail size={16} /> Share via Email
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Donate Modal */}
      <Dialog open={isDonateModalOpen} onOpenChange={setIsDonateModalOpen}>
        <DialogContent className="bg-[#151515] border border-orange-500/30 rounded-lg shadow-[0_0_30px_rgba(255,85,0,0.2)] max-w-md">
          <div className="p-4">
            <h2 className="text-xl font-bold text-white mb-4 text-center">Support the Streamer</h2>
            
            <div className="flex items-center gap-3 mb-6">
              <div className="w-16 h-16 rounded-full bg-[#2D2D2D] overflow-hidden border-2 border-orange-500/30">
                <img 
                  src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${streamers[currentIndex]?.avatarSeed || 'default'}`} 
                  alt="Streamer avatar" 
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">{streamers[currentIndex]?.streamerName}</h3>
                <p className="text-sm text-gray-400">Streaming {streamers[currentIndex]?.gameName}</p>
              </div>
            </div>
            
            <div className="space-y-3 mb-6">
              <button className="w-full py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-md transition-colors flex items-center justify-center gap-2 font-bold">
                <DollarSign size={18} /> Donate with PayPal
              </button>
              
              <button className="w-full py-3 bg-[#6F5AFA] hover:bg-[#7C69FF] text-white rounded-md transition-colors flex items-center justify-center gap-2 font-bold">
                <DollarSign size={18} /> Donate with Clipt Coins
              </button>
            </div>
            
            {/* Donation amounts */}
            <div className="grid grid-cols-3 gap-3 mb-4">
              {['$5.00', '$10.00', '$20.00', '$50.00', '$100.00', 'Custom'].map((amount) => (
                <button 
                  key={amount}
                  className="py-2 bg-black/40 hover:bg-orange-500/20 text-white border border-orange-500/30 rounded-md transition-colors"
                >
                  {amount}
                </button>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Subscribe Modal */}
      <Dialog open={isSubscribeModalOpen} onOpenChange={setIsSubscribeModalOpen}>
        <DialogContent className="bg-[#151515] border border-orange-500/30 rounded-lg shadow-[0_0_30px_rgba(255,85,0,0.2)] max-w-md">
          <div className="p-4">
            <h2 className="text-xl font-bold text-white mb-4 text-center">Subscribe to {streamers[currentIndex]?.streamerName}</h2>
            
            <div className="flex items-center gap-3 mb-6">
              <div className="w-16 h-16 rounded-full bg-[#2D2D2D] overflow-hidden border-2 border-orange-500/30">
                <img 
                  src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${streamers[currentIndex]?.avatarSeed || 'default'}`} 
                  alt="Streamer avatar" 
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">{streamers[currentIndex]?.streamerName}</h3>
                <p className="text-sm text-gray-400">Streaming {streamers[currentIndex]?.gameName}</p>
              </div>
            </div>
            
            <div className="space-y-6">
              {/* Basic Tier */}
              <div className={`relative p-5 rounded-lg border ${selectedTier === 'Cosmic Supporter' ? 'border-orange-500 bg-orange-500/10' : 'border-gray-700 bg-black/40'} hover:border-orange-500/70 hover:bg-black/60 transition-all cursor-pointer`}
                onClick={() => confirmSubscription('Cosmic Supporter')}
              >
                <div className="flex justify-between items-center mb-3">
                  <h3 className="font-bold text-white text-lg">Cosmic Supporter</h3>
                  <span className="text-orange-400 font-bold">$5.00/month</span>
                </div>
                <p className="text-gray-400 text-sm mb-3">Join the cosmic community with our entry-level subscription plan, perfect for casual viewers who want to support their favorite streamer.</p>
                <ul className="text-gray-300 text-sm space-y-2">
                  <li className="flex items-center gap-2">
                    <span className="text-green-400">✓</span> <strong>Ad-Free Experience:</strong> Enjoy uninterrupted streaming without any ads
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-green-400">✓</span> <strong>Subscriber Badge:</strong> Stand out in chat with a special supporter badge
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-green-400">✓</span> <strong>Custom Emotes:</strong> Access to 10 unique space-themed emotes
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-green-400">✓</span> <strong>Sub-Only Chat:</strong> Participate in subscriber-only chat sessions
                  </li>
                </ul>
              </div>
              
              {/* Premium Tier */}
              <div className={`relative p-5 rounded-lg border ${selectedTier === 'Galactic VIP' ? 'border-orange-500 bg-orange-500/10' : 'border-gradient-cosmos'} hover:border-orange-500/70 hover:bg-black/60 transition-all cursor-pointer`}
                onClick={() => confirmSubscription('Galactic VIP')}
                style={selectedTier !== 'Galactic VIP' ? {
                  background: 'linear-gradient(45deg, rgba(0,0,0,0.8), rgba(55,0,110,0.3))',
                  borderImage: 'linear-gradient(45deg, #FF5500, #9900FF) 1',
                  borderStyle: 'solid'
                } : {}}
              >
                <div className="absolute -right-2 -top-2 bg-gradient-to-r from-orange-500 to-purple-600 text-white text-xs font-bold py-1 px-3 rounded-full">PREMIUM</div>
                <div className="flex justify-between items-center mb-3">
                  <h3 className="font-bold text-white text-lg">Galactic VIP</h3>
                  <span className="text-orange-400 font-bold">$14.00/month</span>
                </div>
                <p className="text-gray-400 text-sm mb-3">For true cosmic enthusiasts! Get VIP treatment with exclusive perks and maximum support for your favorite streamer.</p>
                <ul className="text-gray-300 text-sm space-y-2">
                  <li className="flex items-center gap-2">
                    <span className="text-green-400">✓</span> <strong>Everything in Cosmic Supporter tier</strong>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-green-400">✓</span> <strong>Priority Chat Highlighting:</strong> Your messages stand out in chat with special colors
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-green-400">✓</span> <strong>Exclusive Monthly Streams:</strong> Access to VIP-only streams and cosmic events
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-green-400">✓</span> <strong>Enhanced Emote Package:</strong> Access to 25+ premium animated emotes
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-green-400">✓</span> <strong>Discord Integration:</strong> Exclusive access to private Discord channels
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-green-400">✓</span> <strong>Game Priority:</strong> First in line for subscriber games and events
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      {/* Chat Box Panel */}
      <AnimatePresence>
        {isChatOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: '50vh', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              background: 'rgba(0,0,0,0.9)',
              borderTopLeftRadius: '20px',
              borderTopRightRadius: '20px',
              boxShadow: '0 -5px 25px rgba(0,0,0,0.5)',
              border: '1px solid rgba(255,85,0,0.3)',
              borderBottom: 'none',
              display: 'flex',
              flexDirection: 'column',
              zIndex: 100,
              overflow: 'hidden'
            }}
          >
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '12px 20px',
              borderBottom: '1px solid rgba(255,85,0,0.2)'
            }}>
              <h3 style={{ color: 'white', margin: 0, fontSize: '16px' }}>Live Chat</h3>
              <button 
                onClick={handleChatToggle}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#999',
                  cursor: 'pointer',
                  padding: '5px'
                }}
              >
                <X size={20} />
              </button>
            </div>
            
            <div 
              ref={chatContainerRef}
              style={{
                flex: 1,
                overflowY: 'auto',
                padding: '10px 20px',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px'
              }}
            >
              {chatMessages.map((msg, i) => (
                <div key={i} style={{
                  display: 'flex',
                  flexDirection: 'column'
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}>
                    <span style={{
                      color: msg.user === streamers[currentIndex]?.streamerName ? '#FF5500' : '#6F5AFA',
                      fontWeight: 'bold',
                      fontSize: '14px'
                    }}>{msg.user}</span>
                    <span style={{ color: '#777', fontSize: '12px' }}>{msg.time}</span>
                  </div>
                  <p style={{ color: 'white', margin: '2px 0 0 0', fontSize: '15px' }}>{msg.message}</p>
                </div>
              ))}
            </div>
            
            <div style={{
              display: 'flex',
              padding: '12px 16px',
              borderTop: '1px solid rgba(255,85,0,0.2)',
              background: 'rgba(20,20,20,0.7)'
            }}>
              <input
                value={currentMessage}
                onChange={(e) => setCurrentMessage(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && sendChatMessage()}
                placeholder="Send a message..."
                style={{
                  flex: 1,
                  background: 'rgba(30,30,30,0.8)',
                  border: '1px solid rgba(255,85,0,0.3)',
                  borderRadius: '20px',
                  padding: '10px 16px',
                  color: 'white',
                  outline: 'none'
                }}
              />
              <button
                onClick={sendChatMessage}
                style={{
                  background: 'rgba(255,85,0,0.2)',
                  border: '1px solid rgba(255,85,0,0.5)',
                  borderRadius: '50%',
                  width: '40px',
                  height: '40px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginLeft: '10px',
                  color: '#FF5500',
                  cursor: 'pointer'
                }}
              >
                <Send size={18} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </StreamContainer>
  );
};

export default AllStreamers;
