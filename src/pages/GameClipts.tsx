import React, { useState, useEffect, useRef } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { Search, MessageCircle, ChevronLeft, ChevronRight, Zap, X, Send, User, Heart, DollarSign, UserPlus, Scissors, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import NavigationBar from '@/components/NavigationBar';
import { toast } from 'sonner';
import '../styles/discovery-retro.css';
import '../styles/navigation-bar.css';
import '../styles/discovery-donations.css';
import '../styles/discovery-search.css';
import '../styles/discovery-fixes.css';
import '../styles/orange-accent.css';

interface GameCliptsProps {}

const GameClipts: React.FC<GameCliptsProps> = () => {
  const { gameId } = useParams<{ gameId: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<{id: string, name: string, type: 'game' | 'user', image?: string}[]>([]);
  const [showChat, setShowChat] = useState(false);
  const [showController, setShowController] = useState(true);
  const [showDonateForm, setShowDonateForm] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [messages, setMessages] = useState<{id: string, user: string, text: string, isCurrentUser: boolean}[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);
  
  // Get the game name and image from location state or create a fallback
  const { gameName = 'Game', gameImage = 'https://picsum.photos/200/200?random=20' } = 
    (location.state as { gameName?: string; gameImage?: string; } || {});
    
  // If no game ID is provided or no state is passed, use default data
  useEffect(() => {
    // If this was a direct navigation without passing state, we could fetch the game data here
    if (!location.state) {
      console.log('No game data provided, using default values');
      // In a real app, you would fetch game data based on gameId
      // For example: fetchGameData(gameId).then(data => setGameData(data))
    }
  }, [gameId, location.state]);
  
  // Empty data arrays - no example content as requested
  const mockClipts: any[] = [];
  
  // Single empty stream for the interface
  const mockStreams = [
    {
      id: 's1',
      title: '',
      thumbnail: '',
      user: {
        name: 'Streamer',
        avatar: ''
      },
      viewers: 0,
      isLive: true
    }
  ];
  
  // Helper functions for navigation and interaction
  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % mockStreams.length);
    setShowChat(false);
    setShowDonateForm(false);
    setShowController(true);
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + mockStreams.length) % mockStreams.length);
    setShowChat(false);
    setShowDonateForm(false);
    setShowController(true);
  };
  
  const handleToggleChat = () => {
    setShowChat(!showChat);
    setShowController(!showChat);
    setShowDonateForm(false);
  };
  
  const handleDonationSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success(`Donated to ${currentStream.user.name}!`);
    setShowDonateForm(false);
    setShowController(true);
  };
  
  const handleFollowToggle = () => {
    setIsFollowing(!isFollowing);
    toast.success(isFollowing ? `Unfollowed ${currentStream.user.name}` : `Following ${currentStream.user.name}!`);
  };
  
  const handleSendMessage = () => {
    if (newMessage.trim()) {
      setMessages([...messages, {
        id: Date.now().toString(),
        user: 'You',
        text: newMessage,
        isCurrentUser: true
      }]);
      setNewMessage('');
    }
  };
  
  // Scroll to bottom of chat when new messages arrive
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  // Ensure we always have a valid current stream
  const currentStreamIndex = Math.min(currentIndex, mockStreams.length - 1);
  const currentStream = mockStreams[currentStreamIndex] || mockStreams[0];

  return (
    <div className="discovery-container no-overflow">
      {/* Top header with game info - simplified */}
      <div className="discovery-header game-specific-header">
        <motion.div 
          className="game-title-container simplified"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="game-title">{gameName} <span className="clipts-label">Clipts</span></h1>
        </motion.div>
      </div>
      
      {/* Streamer info removed for consistency with Discovery page */}
      
      {/* Video Content */}
      <div className="video-container">
        <video
          src={`https://assets.mixkit.co/videos/preview/mixkit-person-playing-retro-arcade-game-1637-large.mp4`}
          autoPlay
          loop
          muted
          playsInline
          className="stream-video full-screen"
        />
        
        {/* Navigation Controls */}
        <button 
          className="nav-button prev"
          onClick={handlePrev}
        >
          <ChevronLeft className="h-8 w-8" />
        </button>
        
        <button 
          className="nav-button next"
          onClick={handleNext}
        >
          <ChevronRight className="h-8 w-8" />
        </button>
      </div>
      
      {/* Back button to return to search - orange themed */}
      <button 
        className="back-button orange-accent"
        onClick={() => navigate(-1)}
      >
        <ChevronLeft className="h-6 w-6" />
      </button>
      
      {/* Top corner search button - orange themed */}
      <button 
        className="top-corner-search-button orange-accent"
        onClick={() => setSearchOpen(true)}
        aria-label="Search"
      >
        <Search className="h-5 w-5" />
      </button>
      
      {/* GameBoy Controller - only shown when not in chat mode */}
      {showController && (
        <div className="gameboy-controller">
          {/* D-Pad/Joystick on the left - for navigation */}
          <div className="controller-left">
            <div className="dpad">
              <button className="dpad-button left" onClick={handlePrev}>
                <ChevronLeft className="h-6 w-6" />
              </button>
              <button className="dpad-button right" onClick={handleNext}>
                <ChevronRight className="h-6 w-6" />
              </button>
            </div>
          </div>
          
          {/* Center section with just CLIPT screen */}
          <div className="controller-center">
            <div className="clipt-screen">
              <div className="clipt-screen-inner">
                <span>{gameName}</span>
              </div>
            </div>
          </div>
          
          {/* Action buttons on the right */}
          <div className="controller-right">
            <div className="action-pad">
              {/* Comment button - shows chat from bottom, hides controller */}
              <button className="action-btn comment" onClick={handleToggleChat}>
                <MessageCircle className="h-4 w-4" />
              </button>
              
              {/* Donate button - opens donation form */}
              <button 
                className="action-btn donate" 
                onClick={() => {
                  setShowDonateForm(true);
                  setShowController(false);
                  setShowChat(false);
                }}
              >
                <DollarSign className="h-4 w-4" />
              </button>
              
              {/* Follow button - toggles following state */}
              <button 
                className={`action-btn follow ${isFollowing ? 'following' : ''}`} 
                onClick={handleFollowToggle}
              >
                <UserPlus className="h-4 w-4" />
              </button>
              
              {/* Clipt button - brought back as requested */}
              <button 
                className="action-btn clipt" 
                onClick={() => toast.success('Clip recorded!')}
              >
                <Scissors className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Chat Panel - slides up from bottom */}
      <AnimatePresence>
        {showChat && (
          <motion.div 
            className="chat-panel bottom-panel"
            initial={{ y: 500, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 500, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          >
            <div className="chat-header">
              <h3>Live Chat - {gameName}</h3>
              <button 
                className="close-chat"
                onClick={() => {
                  setShowChat(false);
                  setShowController(true);
                }}
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="chat-messages">
              {messages.length === 0 ? (
                <div className="empty-chat-message">Chat is quiet right now. Say hello!</div>
              ) : (
                messages.map((msg) => (
                  <div 
                    key={msg.id} 
                    className={`chat-message ${msg.isCurrentUser ? 'current-user' : ''}`}
                  >
                    <div className="message-avatar">
                      {msg.isCurrentUser ? 
                        <User className="h-6 w-6" /> : 
                        <div className="avatar-circle">{msg.user.charAt(0)}</div>
                      }
                    </div>
                    <div className="message-content">
                      <div className="message-user">{msg.user}</div>
                      <div className="message-text">{msg.text}</div>
                    </div>
                  </div>
                ))
              )}
              <div ref={chatEndRef} />
            </div>
            
            <div className="chat-input">
              <input 
                type="text" 
                placeholder="Type a message..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              />
              <button 
                onClick={handleSendMessage}
                disabled={!newMessage.trim()}
                className="send-button"
              >
                <Send className="h-5 w-5" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Donation Form Panel */}
      <AnimatePresence>
        {showDonateForm && (
          <motion.div 
            className="donation-panel"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          >
            <div className="donation-header">
              <h3>Support {currentStream.user.name}</h3>
              <button 
                className="close-donation"
                onClick={() => {
                  setShowDonateForm(false);
                  setShowController(true);
                }}
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="streamer-donation-info">
              <img 
                src={currentStream.user.avatar} 
                alt={currentStream.user.name}
                className="donation-avatar"
              />
              <div>
                <h4>{currentStream.user.name}</h4>
                <p>Playing {gameName}</p>
              </div>
            </div>
            
            <form onSubmit={handleDonationSubmit} className="donation-form">
              <div className="amount-options">
                <button type="button" className="amount-option">$5</button>
                <button type="button" className="amount-option">$10</button>
                <button type="button" className="amount-option">$20</button>
                <button type="button" className="amount-option">$50</button>
              </div>
              
              <div className="custom-amount">
                <label htmlFor="custom-amount">Custom Amount</label>
                <div className="custom-amount-input">
                  <span>$</span>
                  <input 
                    id="custom-amount"
                    type="number" 
                    placeholder="Enter amount"
                    min="1"
                  />
                </div>
              </div>
              
              <div className="donation-message">
                <label htmlFor="donation-message">Message to Streamer (Optional)</label>
                <textarea 
                  id="donation-message"
                  placeholder="Say something nice..."
                  rows={3}
                />
              </div>
              
              <button 
                type="submit" 
                className="donate-submit-button"
              >
                <DollarSign className="h-5 w-5 mr-2" /> Send Support
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Search overlay */}
      <AnimatePresence>
        {searchOpen && (
          <motion.div
            className="search-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="search-container">
              <div className="search-header">
                <h3>{gameName} Clipts</h3>
                <button 
                  className="close-search"
                  onClick={() => setSearchOpen(false)}
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              
              <div className="search-input-container">
                <Search className="search-icon" />
                <input
                  type="text"
                  className="search-input"
                  placeholder={`Search ${gameName} streamers and clips...`}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  autoFocus
                />
              </div>
              
              <div className="search-results">
                {searchQuery ? (
                  <div className="no-results">No results found for "{searchQuery}" in {gameName}</div>
                ) : null}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Add the consistent navigation bar */}
      <NavigationBar />
    </div>
  );
};

export default GameClipts;
