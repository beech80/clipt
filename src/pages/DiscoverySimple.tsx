import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, MessageCircle, ChevronLeft, ChevronRight, Zap, X, Send, User, Heart, DollarSign, UserPlus, Scissors, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import '../styles/discovery-retro.css';
import '../styles/navigation-bar.css';
import '../styles/discovery-donations.css';
import '../styles/discovery-search.css';
import '../styles/discovery-fixes.css';
import '../styles/orange-accent.css';
import '../styles/clean-design.css';
import '../styles/gameboy-controller.css';
import '../styles/remove-rainbow-buttons.css';
import '../styles/trending-games.css';
import NavigationBar from '@/components/NavigationBar';

const DiscoverySimple: React.FC = () => {
  const navigate = useNavigate();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<{id: string, name: string, type: 'game' | 'user', image?: string}[]>([]);
  const [showChat, setShowChat] = useState(false);
  const [showCliptOptions, setShowCliptOptions] = useState(false);
  const [showDonateForm, setShowDonateForm] = useState(false);
  const [recordingTime, setRecordingTime] = useState(30); // Default 30 seconds
  const [donationAmount, setDonationAmount] = useState('');
  const [donationMessage, setDonationMessage] = useState('');
  const [showController, setShowController] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [messages, setMessages] = useState<{id: string, user: string, text: string, isCurrentUser: boolean}[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);
  
  // Sample streamers array with mock data to ensure content displays
  const sampleStreamers = [
    {
      id: '1',
      name: 'Ninja',
      game: 'Fortnite',
      avatar: 'https://static-cdn.jtvnw.net/jtv_user_pictures/ninja-profile_image-0c14b007ee33cc7c-300x300.png',
      videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-girl-playing-a-competitive-video-game-with-blue-lighting-4809-large.mp4',
      viewers: 45320
    },
    {
      id: '2',
      name: 'Pokimane',
      game: 'Valorant',
      avatar: 'https://static-cdn.jtvnw.net/jtv_user_pictures/pokimane-profile_image-5493acdce81e9c91-300x300.png',
      videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-games-console-loading-animation-1588-large.mp4',
      viewers: 32150
    },
    {
      id: '3',
      name: 'Tfue',
      game: 'Call of Duty',
      avatar: 'https://static-cdn.jtvnw.net/jtv_user_pictures/tfue-profile_image-1800e0c7efaf1e85-300x300.png',
      videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-professional-gamer-testing-video-games-4998-large.mp4',
      viewers: 28970
    }
  ];

  // Navigate to next video
  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % sampleStreamers.length);
    // Reset states when changing videos
    setShowChat(false);
    setShowCliptOptions(false);
    setShowDonateForm(false);
    setShowController(true);
  };

  // Navigate to previous video
  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + sampleStreamers.length) % sampleStreamers.length);
    // Reset states when changing videos
    setShowChat(false);
    setShowCliptOptions(false);
    setShowDonateForm(false);
    setShowController(true);
  };
  
  // Handle toggle chat and hide controller
  const handleToggleChat = () => {
    setShowChat(!showChat);
    setShowController(!showChat);
    setShowCliptOptions(false);
    setShowDonateForm(false);
  };
  
  // Handle donation submit
  const handleDonationSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success(`Donated $${donationAmount} to ${sampleStreamers[currentIndex].name}!`);
    if (donationMessage) {
      setMessages([...messages, {
        id: Date.now().toString(),
        user: 'You',
        text: `⭐ Donated $${donationAmount}: ${donationMessage}`,
        isCurrentUser: true
      }]);
    }
    setDonationAmount('');
    setDonationMessage('');
    setShowDonateForm(false);
    setShowController(true);
  };
  
  // Handle follow/unfollow
  const handleFollowToggle = () => {
    setIsFollowing(!isFollowing);
    toast.success(isFollowing ? 
      `Unfollowed ${sampleStreamers[currentIndex].name}` : 
      `Now following ${sampleStreamers[currentIndex].name}!`);
  };
  
  // Handle clipt recording and posting to chat
  const handleRecordClipt = () => {
    toast.success(`Clipped the last ${recordingTime} seconds!`);
    setMessages([...messages, {
      id: Date.now().toString(),
      user: 'You',
      text: `📹 Shared a ${recordingTime}-second clip`,
      isCurrentUser: true
    }]);
    setShowCliptOptions(false);
    setShowController(true);
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

  const currentStreamer = sampleStreamers[currentIndex];

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        handlePrev();
      } else if (e.key === 'ArrowRight') {
        handleNext();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (searchQuery.length >= 2) {
      // In a real implementation, this would call an API to search the full library
      // Expanded game library simulation
      const results = [
        // Games - larger library (up to 30)
        {id: 'g1', name: 'Fortnite', type: 'game' as const, image: ''},
        {id: 'g2', name: 'Call of Duty', type: 'game' as const, image: ''},
        {id: 'g3', name: 'Minecraft', type: 'game' as const, image: ''},
        {id: 'g4', name: 'Apex Legends', type: 'game' as const, image: ''},
        {id: 'g5', name: 'League of Legends', type: 'game' as const, image: ''},
        {id: 'g6', name: 'Valorant', type: 'game' as const, image: ''},
        {id: 'g7', name: 'Counter-Strike', type: 'game' as const, image: ''},
        {id: 'g8', name: 'Dota 2', type: 'game' as const, image: ''},
        {id: 'g9', name: 'Grand Theft Auto V', type: 'game' as const, image: ''},
        {id: 'g10', name: 'Rainbow Six Siege', type: 'game' as const, image: ''},
        {id: 'g11', name: 'Roblox', type: 'game' as const, image: ''},
        {id: 'g12', name: 'World of Warcraft', type: 'game' as const, image: ''},
        {id: 'g13', name: 'Overwatch', type: 'game' as const, image: ''},
        {id: 'g14', name: 'FIFA 23', type: 'game' as const, image: ''},
        {id: 'g15', name: 'NBA 2K23', type: 'game' as const, image: ''},
        {id: 'g16', name: 'Rocket League', type: 'game' as const, image: ''},
        {id: 'g17', name: 'The Witcher 3', type: 'game' as const, image: ''},
        {id: 'g18', name: 'Cyberpunk 2077', type: 'game' as const, image: ''},
        {id: 'g19', name: 'Elden Ring', type: 'game' as const, image: ''},
        {id: 'g20', name: 'God of War', type: 'game' as const, image: ''},
        {id: 'g21', name: 'Red Dead Redemption 2', type: 'game' as const, image: ''},
        {id: 'g22', name: 'Halo Infinite', type: 'game' as const, image: ''},
        {id: 'g23', name: 'Assassin\'s Creed Valhalla', type: 'game' as const, image: ''},
        {id: 'g24', name: 'Final Fantasy XIV', type: 'game' as const, image: ''},
        {id: 'g25', name: 'Destiny 2', type: 'game' as const, image: ''},
        {id: 'g26', name: 'Genshin Impact', type: 'game' as const, image: ''},
        {id: 'g27', name: 'Pokémon Legends: Arceus', type: 'game' as const, image: ''},
        {id: 'g28', name: 'Horizon Forbidden West', type: 'game' as const, image: ''},
        {id: 'g29', name: 'PUBG: Battlegrounds', type: 'game' as const, image: ''},
        {id: 'g30', name: 'Super Smash Bros. Ultimate', type: 'game' as const, image: ''},
        
        // Users - empty placeholders
        {id: 'u1', name: 'User1', type: 'user' as const, image: ''},
        {id: 'u2', name: 'User2', type: 'user' as const, image: ''},
        {id: 'u3', name: 'User3', type: 'user' as const, image: ''}
      ].filter(item => 
        item.name.toLowerCase().includes(searchQuery.toLowerCase())
      ).slice(0, 30); // Increased to 30 results for more comprehensive search
      
      setSearchResults(results);
    } else {
      setSearchResults([]);
    }
  }, [searchQuery]);

  return (
    <div className="discovery-container no-overflow">
      {/* Center header with glow effect */}
      <div className="discovery-header">
        <motion.h1 
          className="discovery-title"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Zap className="title-icon" />
          DISCOVERY
          <Zap className="title-icon" />
        </motion.h1>
      </div>
      
      {/* Trending Games Section */}
      <motion.div 
        className="trending-games-section"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <h2 className="trending-title">Trending Games</h2>
        <div className="trending-games-container">
          {/* Game 1 */}
          <motion.div 
            className="trending-game-cube"
            whileHover={{ scale: 1.05 }}
            onClick={() => navigate('/game/fortnite')}
          >
            <img 
              src="https://images.igdb.com/igdb/image/upload/t_cover_big/co2ekt.jpg" 
              alt="Fortnite" 
              className="game-cover" 
            />
            <div className="game-info">
              <h3>Fortnite</h3>
              <div className="game-stats">
                <span><Zap size={14} /> 1.2M Playing</span>
              </div>
            </div>
          </motion.div>
          
          {/* Game 2 */}
          <motion.div 
            className="trending-game-cube"
            whileHover={{ scale: 1.05 }}
            onClick={() => navigate('/game/valorant')}
          >
            <img 
              src="https://images.igdb.com/igdb/image/upload/t_cover_big/co1rcb.jpg" 
              alt="Valorant" 
              className="game-cover" 
            />
            <div className="game-info">
              <h3>Valorant</h3>
              <div className="game-stats">
                <span><Zap size={14} /> 980K Playing</span>
              </div>
            </div>
          </motion.div>
          
          {/* Game 3 */}
          <motion.div 
            className="trending-game-cube"
            whileHover={{ scale: 1.05 }}
            onClick={() => navigate('/game/minecraft')}
          >
            <img 
              src="https://images.igdb.com/igdb/image/upload/t_cover_big/co4n62.jpg" 
              alt="Minecraft" 
              className="game-cover" 
            />
            <div className="game-info">
              <h3>Minecraft</h3>
              <div className="game-stats">
                <span><Zap size={14} /> 875K Playing</span>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>
      
      {/* Empty streamer info - removed as requested */}
      
      {/* Video Content */}
      <div className="video-container">
        <video
          src={currentStreamer.videoUrl}
          autoPlay
          loop
          muted
          playsInline
          className="stream-video full-screen"
        />
        
        {/* Navigation Controls */}
        <button 
          className="back-button orange-accent"
          onClick={() => navigate(-1)}
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
                <span>CLIPT</span>
              </div>
            </div>
          </div>
          
          {/* Action buttons on the right - with the 4 requested functions */}
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
                  setShowCliptOptions(false);
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
              
              {/* Clipt button with recording options */}
              <button 
                className="action-btn clipt" 
                onClick={() => setShowCliptOptions(!showCliptOptions)}
              >
                <Scissors className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Clipt Recording Options Panel */}
      <AnimatePresence>
        {showCliptOptions && (
          <motion.div 
            className="clipt-options-panel"
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          >
            <div className="clipt-options-header">
              <h3>Record Last</h3>
              <button 
                className="close-clipt-options"
                onClick={() => setShowCliptOptions(false)}
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="clipt-timing-options">
              <button 
                className={`timing-option ${recordingTime === 15 ? 'selected' : ''}`}
                onClick={() => setRecordingTime(15)}
              >
                15s
              </button>
              <button 
                className={`timing-option ${recordingTime === 30 ? 'selected' : ''}`}
                onClick={() => setRecordingTime(30)}
              >
                30s
              </button>
              <button 
                className={`timing-option ${recordingTime === 45 ? 'selected' : ''}`}
                onClick={() => setRecordingTime(45)}
              >
                45s
              </button>
              <button 
                className={`timing-option ${recordingTime === 60 ? 'selected' : ''}`}
                onClick={() => setRecordingTime(60)}
              >
                60s
              </button>
            </div>
            
            <button 
              className="record-button"
              onClick={handleRecordClipt}
            >
              <Clock className="h-5 w-5 mr-2" /> Clip Last {recordingTime}s
            </button>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Top corner search button */}
      <button 
        className="top-corner-search-button orange-accent"
        onClick={() => setSearchOpen(true)}
        aria-label="Search"
      >
        <Search className="h-5 w-5" />
      </button>
      
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
                <h3>Search Games & Users</h3>
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
                  placeholder="Search for games or users..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              
              <div className="search-results">
                {searchResults.length > 0 ? (
                  <div className="results-list">
                    {searchResults.map(result => (
                      <div 
                        key={result.id} 
                        className={`result-item ${result.type}`}
                        onClick={() => {
                          if (result.type === 'game') {
                            // Navigate to game-specific page using the correct route
                            navigate(`/game/${result.id}/clipts`, { 
                              state: { gameName: result.name, gameImage: result.image } 
                            });
                          } else {
                            // Navigate to user profile
                            navigate(`/user/${result.id}`);
                          }
                          setSearchOpen(false);
                        }}
                      >
                        {result.image && (
                          <img 
                            src={result.image} 
                            alt={result.name} 
                            className="result-image"
                          />
                        )}
                        <div className="result-info">
                          <div className="result-name">{result.name}</div>
                          <div className="result-type">{result.type === 'game' ? 'Game' : 'User'}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : searchQuery ? (
                  <div className="no-results">No results found</div>
                ) : null}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Clipt Options Panel */}
      <AnimatePresence>
        {showCliptOptions && (
          <motion.div 
            className="clipt-options-panel"
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          >
            <div className="clipt-options-header">
              <h3>Record Last</h3>
              <button 
                className="close-clipt-options"
                onClick={() => setShowCliptOptions(false)}
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="clipt-timing-options">
              <button 
                className={`timing-option ${recordingTime === 15 ? 'selected' : ''}`}
                onClick={() => setRecordingTime(15)}
              >
                15s
              </button>
              <button 
                className={`timing-option ${recordingTime === 30 ? 'selected' : ''}`}
                onClick={() => setRecordingTime(30)}
              >
                30s
              </button>
              <button 
                className={`timing-option ${recordingTime === 60 ? 'selected' : ''}`}
                onClick={() => setRecordingTime(60)}
              >
                60s
              </button>
            </div>
            
            <button 
              className="record-button orange-accent"
              onClick={handleRecordClipt}
            >
              <Clock className="h-5 w-5 mr-2" /> Clip Last {recordingTime}s
            </button>
          </motion.div>
        )}
      </AnimatePresence>
      
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
              <h3>Live Chat</h3>
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
              {messages.map((msg) => (
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
              ))}
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
              <h3>Support {currentStreamer.name}</h3>
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
                src={currentStreamer.avatar} 
                alt={currentStreamer.name}
                className="donation-avatar"
              />
              <div>
                <h4>{currentStreamer.name}</h4>
                <p>Playing {currentStreamer.game}</p>
              </div>
            </div>
            
            <form onSubmit={handleDonationSubmit} className="donation-form">
              <div className="amount-options">
                <button 
                  type="button" 
                  className={`amount-option ${donationAmount === '5' ? 'selected' : ''}`}
                  onClick={() => setDonationAmount('5')}
                >
                  $5
                </button>
                <button 
                  type="button" 
                  className={`amount-option ${donationAmount === '10' ? 'selected' : ''}`}
                  onClick={() => setDonationAmount('10')}
                >
                  $10
                </button>
                <button 
                  type="button" 
                  className={`amount-option ${donationAmount === '20' ? 'selected' : ''}`}
                  onClick={() => setDonationAmount('20')}
                >
                  $20
                </button>
                <button 
                  type="button" 
                  className={`amount-option ${donationAmount === '50' ? 'selected' : ''}`}
                  onClick={() => setDonationAmount('50')}
                >
                  $50
                </button>
              </div>
              
              <div className="custom-amount">
                <label htmlFor="custom-amount">Custom Amount</label>
                <div className="custom-amount-input">
                  <span>$</span>
                  <input 
                    id="custom-amount"
                    type="number" 
                    placeholder="Enter amount"
                    value={donationAmount}
                    onChange={(e) => setDonationAmount(e.target.value)}
                    min="1"
                  />
                </div>
              </div>
              
              <div className="donation-message">
                <label htmlFor="donation-message">Message to Streamer (Optional)</label>
                <textarea 
                  id="donation-message"
                  placeholder="Say something nice..."
                  value={donationMessage}
                  onChange={(e) => setDonationMessage(e.target.value)}
                  rows={3}
                />
              </div>
              
              <button 
                type="submit" 
                className="donate-submit-button orange-accent"
                disabled={!donationAmount}
              >
                <DollarSign className="h-5 w-5 mr-2" /> Send Support
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add the consistent navigation bar */}
      <NavigationBar />
    </div>
  );
};

export default DiscoverySimple;
