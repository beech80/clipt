import React, { useState, useEffect } from 'react';
import { Trophy, Zap, ArrowLeft, Settings } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import '../styles/topClipts-retro.css';
import { motion, AnimatePresence } from 'framer-motion';

// Simple structure for leaderboard spots
interface LeaderboardSpot {
  id: string;
  username: string;
  clipTitle: string;
  points: number;
  videoUrl?: string;
  thumbnailUrl?: string;
  gameTitle?: string;
}

const TopClipts = () => {
  const [activeTab, setActiveTab] = useState('daily');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  
  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.dropdown-option') && dropdownOpen) {
        setDropdownOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [dropdownOpen]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardSpot[]>([]);
  const [loading, setLoading] = useState(true);
  const [pixelLoading, setPixelLoading] = useState(true);
  const [currentClipIndex, setCurrentClipIndex] = useState(0);
  const [direction, setDirection] = useState(0); // -1 for left, 1 for right, 0 for initial

  // Leaderboards for different time periods
  const [dailyLeaderboard, setDailyLeaderboard] = useState<LeaderboardSpot[]>([]);
  const [weeklyLeaderboard, setWeeklyLeaderboard] = useState<LeaderboardSpot[]>([]);
  const [allTimeLeaderboard, setAllTimeLeaderboard] = useState<LeaderboardSpot[]>([]);

  // Last reset timestamps
  const [lastWeeklyReset, setLastWeeklyReset] = useState<Date | null>(null);
  
  // Function to determine if we need to reset weekly leaderboard
  const checkWeeklyReset = () => {
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const hourOfDay = now.getHours();
    
    // Reset weekly leaderboard every Sunday at midnight
    if (dayOfWeek === 0 && hourOfDay === 0) {
      // Only reset if we haven't already reset this week
      if (!lastWeeklyReset || now.getTime() - lastWeeklyReset.getTime() > 6 * 24 * 60 * 60 * 1000) {
        console.log('Resetting weekly leaderboard...');
        setWeeklyLeaderboard([]);
        setLastWeeklyReset(now);
        
        // Save reset timestamp to localStorage
        localStorage.setItem('lastWeeklyReset', now.toISOString());
        toast.success('Weekly leaderboard has been reset', {
          position: 'bottom-center',
          duration: 3000,
        });
      }
    }
  };
  
  // Check for weekly reset on component mount and when activeTab changes
  useEffect(() => {
    // Get last reset from localStorage
    const storedReset = localStorage.getItem('lastWeeklyReset');
    if (storedReset) {
      setLastWeeklyReset(new Date(storedReset));
    }
    
    checkWeeklyReset();
    
    // Set up a timer to check for resets every hour
    const intervalId = setInterval(checkWeeklyReset, 60 * 60 * 1000);
    
    return () => clearInterval(intervalId);
  }, []);

  // Initialize sample leaderboard data with video URLs
  const sampleLeaderboard = [
    { 
      id: '1', 
      username: 'arcade_master', 
      clipTitle: 'Insane Last-Minute Victory!', 
      points: 52436,
      videoUrl: 'https://player.vimeo.com/video/824804225',
      thumbnailUrl: 'https://i.vimeo.com/video/824804225_640x360.jpg',
      gameTitle: 'Valorant'
    },
    { 
      id: '2', 
      username: 'retro_gamer', 
      clipTitle: 'Unbelievable Sniper Streak', 
      points: 42891,
      videoUrl: 'https://player.vimeo.com/video/824804192',
      thumbnailUrl: 'https://i.vimeo.com/video/824804192_640x360.jpg',
      gameTitle: 'Call of Duty: Warzone'
    },
    { 
      id: '3', 
      username: 'pixel_hunter', 
      clipTitle: 'Pro Rocket Jump Tutorial', 
      points: 38754,
      videoUrl: 'https://player.vimeo.com/video/824804169',
      thumbnailUrl: 'https://i.vimeo.com/video/824804169_640x360.jpg',
      gameTitle: 'Rocket League'
    },
    { 
      id: '4', 
      username: 'game_wizard', 
      clipTitle: 'Quad Kill With One Shot', 
      points: 31268,
      videoUrl: 'https://player.vimeo.com/video/824804158',
      thumbnailUrl: 'https://i.vimeo.com/video/824804158_640x360.jpg',
      gameTitle: 'Apex Legends'
    },
    { 
      id: '5', 
      username: 'neon_player', 
      clipTitle: 'How To Beat The Final Boss', 
      points: 28941,
      videoUrl: 'https://player.vimeo.com/video/824804148',
      thumbnailUrl: 'https://i.vimeo.com/video/824804148_640x360.jpg',
      gameTitle: 'Elden Ring'
    },
    { 
      id: '6', 
      username: '8bit_warrior', 
      clipTitle: 'Epic Base Defense - Must See!', 
      points: 23578,
      videoUrl: 'https://player.vimeo.com/video/824804137',
      thumbnailUrl: 'https://i.vimeo.com/video/824804137_640x360.jpg',
      gameTitle: 'Fortnite'
    },
    { 
      id: '7', 
      username: 'joystick_pro', 
      clipTitle: 'World Record Speedrun Attempt', 
      points: 19246,
      videoUrl: 'https://player.vimeo.com/video/824804128',
      thumbnailUrl: 'https://i.vimeo.com/video/824804128_640x360.jpg',
      gameTitle: 'Minecraft'
    },
    { 
      id: '8', 
      username: 'high_scorer', 
      clipTitle: 'Advanced PvP Techniques Showcase', 
      points: 17482,
      videoUrl: 'https://player.vimeo.com/video/824804115',
      thumbnailUrl: 'https://i.vimeo.com/video/824804115_640x360.jpg',
      gameTitle: 'League of Legends'
    },
    { 
      id: '9', 
      username: 'level_master', 
      clipTitle: 'Impossible Jump Challenge Completed', 
      points: 15973,
      videoUrl: 'https://player.vimeo.com/video/824804099',
      thumbnailUrl: 'https://i.vimeo.com/video/824804099_640x360.jpg',
      gameTitle: 'Super Mario Odyssey'
    },
    { 
      id: '10', 
      username: 'console_king', 
      clipTitle: 'Rare Easter Egg Location Found!', 
      points: 13825,
      videoUrl: 'https://player.vimeo.com/video/824804080',
      thumbnailUrl: 'https://i.vimeo.com/video/824804080_640x360.jpg',
      gameTitle: 'Cyberpunk 2077'
    },
  ];

  useEffect(() => {
    // Initialize with sample leaderboard data
    setLeaderboard(sampleLeaderboard);
    
    // Show pixel loading animation first
    setPixelLoading(true);
    const pixelTimer = setTimeout(() => {
      setPixelLoading(false);
      // Leaderboard data will be updated by the loadLeaderboards effect
    }, 1200);
    
    return () => clearTimeout(pixelTimer);
  }, [activeTab]); // Refetch when tab changes

  // Effect to load the proper leaderboard data on initialization
  useEffect(() => {
    const loadLeaderboards = async () => {
      // Simulate loading
      setLoading(true);
      setPixelLoading(true);

      try {
        // In a real application, we would fetch from Supabase here
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Initialize each leaderboard with slightly different data
        setDailyLeaderboard(sampleLeaderboard.map(item => ({
          ...item,
          points: Math.floor(item.points * 0.3) // Daily has lower points
        })));
        
        setWeeklyLeaderboard(sampleLeaderboard.map(item => ({
          ...item,
          points: Math.floor(item.points * 0.7) // Weekly has medium points
        })));
        
        setAllTimeLeaderboard(sampleLeaderboard);
        
        // Set the current leaderboard based on active tab
        switch(activeTab) {
          case 'daily':
            setLeaderboard(dailyLeaderboard);
            break;
          case 'weekly':
            setLeaderboard(weeklyLeaderboard);
            break;
          case 'all-time':
            setLeaderboard(allTimeLeaderboard);
            break;
          default:
            setLeaderboard(dailyLeaderboard);
        }
      } catch (error) {
        console.error('Error loading leaderboards:', error);
        toast.error('Failed to load leaderboard data. Please try again.');
      } finally {
        setLoading(false);
        // Add a slight delay for the pixel loading animation
        setTimeout(() => {
          setPixelLoading(false);
        }, 1000);
      }
    };

    loadLeaderboards();

    // For demo purposes, update points every 15 seconds to simulate activity
    const interval = setInterval(() => {
      // Update daily counts
      setDailyLeaderboard(prev => prev.map(spot => ({
        ...spot,
        points: spot.points + Math.floor(Math.random() * 15)
      })));
      
      // Update weekly counts (slower growth)
      setWeeklyLeaderboard(prev => prev.map(spot => ({
        ...spot,
        points: spot.points + Math.floor(Math.random() * 10)
      })));
      
      // Update all-time counts (slowest growth)
      setAllTimeLeaderboard(prev => prev.map(spot => ({
        ...spot,
        points: spot.points + Math.floor(Math.random() * 5)
      })));
      
      // Update current view
      switch(activeTab) {
        case 'daily':
          setLeaderboard(dailyLeaderboard);
          break;
        case 'weekly':
          setLeaderboard(weeklyLeaderboard);
          break;
        case 'all-time':
          setLeaderboard(allTimeLeaderboard);
          break;
      }
    }, 15000);

    return () => clearInterval(interval);
  }, []);
  
  // Effect to switch leaderboard when tab changes
  useEffect(() => {
    const switchLeaderboard = async () => {
      setLoading(true);
      
      try {
        // Add a short delay for visual feedback
        await new Promise(resolve => setTimeout(resolve, 300));
        
        // Switch the leaderboard based on active tab
        switch(activeTab) {
          case 'daily':
            setLeaderboard(dailyLeaderboard);
            break;
          case 'weekly':
            setLeaderboard(weeklyLeaderboard);
            break;
          case 'all-time':
            setLeaderboard(allTimeLeaderboard);
            break;
        }
      } catch (error) {
        console.error(`Error switching to ${activeTab} leaderboard:`, error);
        toast.error(`Failed to load ${activeTab} leaderboard data.`);
      } finally {
        setLoading(false);
      }
    };
    
    switchLeaderboard();
  }, [activeTab, dailyLeaderboard, weeklyLeaderboard, allTimeLeaderboard]);

  // Function to fetch updated leaderboard data (called when trophy icon is clicked)
  const fetchLeaderboard = async (tabType: string) => {
    setLoading(true);
    toast.info(`Refreshing ${tabType === 'daily' ? 'trending' : tabType === 'weekly' ? 'weekly' : 'all-time'} leaderboard...`);
    
    try {
      // In a real app, this would call the Supabase API to fetch fresh data
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Sort the current leaderboard by points in descending order
      const sortedLeaderboard = [...leaderboard].sort((a, b) => b.points - a.points);
      
      // Update the appropriate leaderboard
      switch(tabType) {
        case 'daily':
          setDailyLeaderboard(sortedLeaderboard);
          if (activeTab === 'daily') setLeaderboard(sortedLeaderboard);
          break;
        case 'weekly':
          setWeeklyLeaderboard(sortedLeaderboard);
          if (activeTab === 'weekly') setLeaderboard(sortedLeaderboard);
          break;
        case 'all-time':
          setAllTimeLeaderboard(sortedLeaderboard);
          if (activeTab === 'all-time') setLeaderboard(sortedLeaderboard);
          break;
      }
      
      toast.success(`${tabType === 'daily' ? 'Trending' : tabType === 'weekly' ? 'Weekly' : 'All-time'} leaderboard refreshed!`);
    } catch (error) {
      console.error(`Error refreshing ${tabType} leaderboard:`, error);
      toast.error(`Failed to refresh ${tabType} leaderboard.`);
    } finally {
      setLoading(false);
    }
  };

  // Function to get rank class based on position
  const getRankClass = (rank: number) => {
    switch(rank) {
      case 1: return 'rank rank-1';
      case 2: return 'rank rank-2';
      case 3: return 'rank rank-3';
      default: return 'rank rank-default';
    }
  };

  // Function to render the trophy icon with appropriate styling
  const renderTrophy = (rank: number) => {
    switch(rank) {
      case 1:
        return <Trophy className="h-5 w-5" style={{ color: '#FFD700' }} />;
      case 2:
        return <Trophy className="h-5 w-5" style={{ color: '#C0C0C0' }} />;
      case 3:
        return <Trophy className="h-5 w-5" style={{ color: '#CD7F32' }} />;
      default:
        return <Trophy className="h-5 w-5" style={{ color: 'rgba(255, 85, 0, 0.7)' }} />;
    }
  };

  // Function to handle navigation back
  const handleBack = () => {
    window.history.back();
  };

  // Get tab title based on activeTab
  const getTabTitle = () => {
    switch(activeTab) {
      case 'daily':
        return 'TODAY\'S TOP CLIPTS';
      case 'weekly':
        return 'THIS WEEK\'S FINEST';
      case 'all-time':
        return 'ALL-TIME GREATEST';
      default:
        return 'TOP CLIPTS';
    }
  };

  return (
    <div className="topClipts-container" style={{ 
      backgroundColor: '#121212', 
      minHeight: '100vh',
      height: '100vh',
      width: '100vw',
      overflow: 'hidden',
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      color: 'white' 
    }}>
      {/* Back Button - Positioned higher, no background */}
      <motion.div 
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        className="back-button absolute z-40"
        onClick={() => window.history.back()}
        style={{
          top: '12px',
          left: '15px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          background: 'none',
          border: 'none',
          padding: 0
        }}
      >
        <ArrowLeft size={28} color="#FF5500" strokeWidth={2.5} />
      </motion.div>

      {/* Minimal Header with Interactive Trophy Button - Now at the top */}
      <div className="topClipts-header absolute top-0 left-0 right-0 z-30" style={{
        backgroundColor: 'rgba(18, 18, 18, 0.85)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
        height: '55px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div className="topClipts-title flex items-center gap-3" style={{ position: 'relative' }}>
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
            style={{
              position: 'absolute',
              width: '100%',
              height: '100%',
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(255,85,0,0.2) 0%, rgba(255,119,0,0) 70%)',
              zIndex: -1
            }}
          />
          {/* Trophy icon now refreshes the current leaderboard when clicked */}
          <motion.div
            whileHover={{ scale: 1.2 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => fetchLeaderboard(activeTab)}
            style={{ cursor: 'pointer', position: 'relative' }}
          >
            <Trophy 
              className="trophy-icon h-6 w-6" 
              style={{ color: '#FF7700' }} 
            />
          </motion.div>
          <span style={{ 
            fontWeight: 'bold', 
            fontSize: '1.5rem',
            background: 'linear-gradient(90deg, #FF5500, #FF7700)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)'
          }}>
            TOP CLIPTS
          </span>
          
          {/* Weekly reset indicator (only shows for weekly leaderboard) */}
          {activeTab === 'weekly' && lastWeeklyReset && (
            <div style={{
              fontSize: '0.75rem',
              color: 'rgba(255, 255, 255, 0.5)',
              marginLeft: '8px',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}>
              <span style={{ fontSize: '0.7rem', opacity: 0.8 }}>•</span>
              <span>Resets every Sunday</span>
            </div>
          )}
        </div>
      </div>

      {/* Cosmic Dropdown Menu for Categories - Below header */}
      <div className="absolute top-16 right-0 z-20 flex justify-end" style={{
        paddingTop: '10px',
        paddingRight: '15px',
        height: '50px'
      }}>
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          style={{ 
            position: 'relative',
            zIndex: 30
          }}
        >
          {/* Custom Dropdown Selector with Space Theme */}
          <div
            onClick={() => setDropdownOpen(prev => !prev)}
            style={{
              position: 'relative',
              backgroundColor: 'rgba(26, 18, 30, 0.9)',
              color: '#FFFFFF',
              padding: '8px 16px',
              borderRadius: '12px',
              cursor: 'pointer',
              border: '1px solid rgba(255, 85, 0, 0.6)',
              boxShadow: '0 0 15px rgba(255, 85, 0, 0.3)',
              minWidth: '150px',
              textAlign: 'center',
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
              fontWeight: 'bold',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            <span style={{
              background: 'linear-gradient(90deg, #FF5500, #FF7700)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              fontWeight: 'bold',
            }}>
              {activeTab === 'daily' ? 'TRENDING' : 
               activeTab === 'weekly' ? 'THIS WEEK' : 'ALL-TIME'}
            </span>
            <motion.svg 
              xmlns="http://www.w3.org/2000/svg" 
              width="16" 
              height="16" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="#FF5500" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
              animate={{ rotate: dropdownOpen ? 180 : 0 }}
              transition={{ duration: 0.3 }}
            >
              <polyline points="6 9 12 15 18 9"></polyline>
            </motion.svg>
          </div>
          
          {/* Dropdown Options */}
          <AnimatePresence>
            {dropdownOpen && (
              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                style={{
                  position: 'absolute',
                  top: '110%',
                  left: 0,
                  right: 0,
                  backgroundColor: 'rgba(26, 18, 30, 0.95)',
                  borderRadius: '8px',
                  overflow: 'hidden',
                  boxShadow: '0 0 20px rgba(0, 0, 0, 0.5), 0 0 15px rgba(255, 85, 0, 0.3)',
                  backdropFilter: 'blur(10px)',
                  WebkitBackdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 85, 0, 0.3)',
                  zIndex: 50
                }}
              >
                <div 
                  className="dropdown-option"
                  onClick={() => {
                    setActiveTab('daily');
                    setDropdownOpen(false);
                  }}
                  style={{
                    padding: '10px 16px',
                    cursor: 'pointer',
                    color: activeTab === 'daily' ? '#FF5500' : '#FFFFFF',
                    backgroundColor: activeTab === 'daily' ? 'rgba(255, 85, 0, 0.2)' : 'transparent',
                    fontWeight: activeTab === 'daily' ? 'bold' : 'normal',
                    borderLeft: activeTab === 'daily' ? '3px solid #FF5500' : 'none',
                    transition: 'all 0.2s ease',
                  }}
                >
                  TRENDING
                </div>
                <div 
                  className="dropdown-option"
                  onClick={() => {
                    setActiveTab('weekly');
                    setDropdownOpen(false);
                  }}
                  style={{
                    padding: '10px 16px',
                    cursor: 'pointer',
                    color: activeTab === 'weekly' ? '#FF5500' : '#FFFFFF',
                    backgroundColor: activeTab === 'weekly' ? 'rgba(255, 85, 0, 0.2)' : 'transparent',
                    fontWeight: activeTab === 'weekly' ? 'bold' : 'normal',
                    borderLeft: activeTab === 'weekly' ? '3px solid #FF5500' : 'none',
                    transition: 'all 0.2s ease',
                  }}
                >
                  THIS WEEK
                </div>
                <div 
                  className="dropdown-option"
                  onClick={() => {
                    setActiveTab('all-time');
                    setDropdownOpen(false);
                  }}
                  style={{
                    padding: '10px 16px',
                    cursor: 'pointer',
                    color: activeTab === 'all-time' ? '#FF5500' : '#FFFFFF',
                    backgroundColor: activeTab === 'all-time' ? 'rgba(255, 85, 0, 0.2)' : 'transparent',
                    fontWeight: activeTab === 'all-time' ? 'bold' : 'normal',
                    borderLeft: activeTab === 'all-time' ? '3px solid #FF5500' : 'none',
                    transition: 'all 0.2s ease',
                  }}
                >
                  ALL-TIME
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      {/* Fullscreen Content Area */}
      <div className="absolute top-16 left-0 right-0 bottom-0 z-10 w-full h-full overflow-hidden" style={{marginTop: '60px'}}>
          
          {pixelLoading ? (
            // Modern Loading Animation
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              width: '100%',
              height: '100%',
              backgroundColor: 'rgba(18, 18, 18, 0.9)'
            }}>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
              >
                <div className="w-20 h-20 relative">
                  <div style={{
                    position: 'absolute',
                    width: '100%',
                    height: '100%',
                    borderRadius: '50%',
                    border: '4px solid rgba(255, 85, 0, 0.2)',
                    borderTop: '4px solid #FF5500',
                    animation: 'spin 1s linear infinite',
                    boxShadow: '0 0 30px rgba(255, 85, 0, 0.4)'
                  }}></div>
                </div>
              </motion.div>
              <div style={{ 
                marginTop: '16px', 
                color: '#FF7700', 
                fontWeight: 'bold',
                fontSize: '1.2rem',
                textShadow: '0 0 10px rgba(255, 119, 0, 0.7)'
              }}>LOADING TOP CLIPTS...</div>
            </div>
          ) : loading ? (
            // Loading skeletons with modern dark style
            <div style={{
              backgroundColor: 'rgba(18, 18, 18, 0.9)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              width: '100%',
              height: '100%',
              padding: '20px'
            }}>
              <div className="w-full max-w-md">
                {[...Array(5)].map((_, i) => (
                  <div key={i} style={{
                    height: i === 0 ? '200px' : '60px',
                    width: '100%',
                    margin: '12px 0',
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    borderRadius: '12px',
                    animation: 'pulse 1.5s infinite ease-in-out',
                    boxShadow: '0 0 20px rgba(0, 0, 0, 0.2)'
                  }}></div>
                ))}
              </div>
            </div>
          ) : (
            // Modern Full Screen Swipeable Carousel
            <div style={{
              width: '100%',
              height: '100%',
              position: 'relative',
              overflow: 'hidden',
              backgroundColor: 'rgba(18, 18, 18, 0.9)'
            }}>
              {/* Left/Right Navigation Controls */}
              {currentClipIndex > 0 && (
                <motion.div
                  className="nav-arrow left"
                  initial={{ opacity: 0.6, x: -10 }}
                  animate={{ opacity: 0.8, x: 0 }}
                  whileHover={{ opacity: 1, scale: 1.1 }}
                  onClick={() => {
                    setDirection(-1);
                    setCurrentClipIndex(prev => Math.max(0, prev - 1));
                  }}
                  style={{
                    position: 'absolute',
                    left: '15px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    zIndex: 20,
                    backgroundColor: 'rgba(0, 0, 0, 0.6)',
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    boxShadow: '0 0 15px rgba(0, 0, 0, 0.3)'
                  }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="15 18 9 12 15 6"></polyline>
                  </svg>
                </motion.div>
              )}
              
              {currentClipIndex < leaderboard.length - 1 && (
                <motion.div
                  className="nav-arrow right"
                  initial={{ opacity: 0.6, x: 10 }}
                  animate={{ opacity: 0.8, x: 0 }}
                  whileHover={{ opacity: 1, scale: 1.1 }}
                  onClick={() => {
                    setDirection(1);
                    setCurrentClipIndex(prev => Math.min(leaderboard.length - 1, prev + 1));
                  }}
                  style={{
                    position: 'absolute',
                    right: '15px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    zIndex: 20,
                    backgroundColor: 'rgba(0, 0, 0, 0.6)',
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    boxShadow: '0 0 15px rgba(0, 0, 0, 0.3)'
                  }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="9 18 15 12 9 6"></polyline>
                  </svg>
                </motion.div>
              )}
              
              {/* Swipeable Carousel */}
              <AnimatePresence initial={false} custom={direction}>
                <motion.div
                  key={currentClipIndex}
                  custom={direction}
                  initial={{ opacity: 0, x: direction * 500 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: direction * -500 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    backgroundColor: 'rgba(0, 0, 0, 0.95)',
                    overflow: 'hidden'
                  }}
                  drag="x"
                  dragConstraints={{ left: 0, right: 0 }}
                  dragElastic={0.9}
                  onDragEnd={(e, { offset, velocity }) => {
                    const swipe = Math.abs(offset.x) > 100 || Math.abs(velocity.x) > 500;
                    if (swipe) {
                      const direction = offset.x < 0 ? 1 : -1;
                      if (direction > 0 && currentClipIndex < leaderboard.length - 1) {
                        setDirection(1);
                        setCurrentClipIndex(prev => prev + 1);
                      } else if (direction < 0 && currentClipIndex > 0) {
                        setDirection(-1);
                        setCurrentClipIndex(prev => prev - 1);
                      }
                    }
                  }}
                >
                  {/* Current Clip Content */}
                  {leaderboard[currentClipIndex] && (
                    <>
                      {/* Rank and position indicator above video - Enhanced cosmic style */}
                      <div style={{ 
                        position: 'absolute',
                        top: '0',
                        left: '0',
                        right: '0',
                        padding: '10px 15px',
                        display: 'flex', 
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        background: 'linear-gradient(to bottom, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.5) 70%, rgba(0,0,0,0) 100%)',
                        backdropFilter: 'blur(10px)',
                        WebkitBackdropFilter: 'blur(10px)',
                        zIndex: 35,
                        marginTop: '10px'
                      }}>
                        <div style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: '10px'
                        }}>
                          <div style={{
                            width: '36px',
                            height: '36px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            borderRadius: '50%',
                            backgroundColor: currentClipIndex < 3 ? 
                              `rgba(${currentClipIndex === 0 ? '255, 215, 0' : currentClipIndex === 1 ? '192, 192, 192' : '205, 127, 50'}, 0.85)` : 
                              'rgba(0, 0, 0, 0.75)',
                            color: currentClipIndex < 3 ? '#000000' : '#FFFFFF',
                            fontWeight: 'bold',
                            fontSize: '18px',
                            border: currentClipIndex < 3 ? 
                              `2px solid ${currentClipIndex === 0 ? '#FFD700' : currentClipIndex === 1 ? '#C0C0C0' : '#CD7F32'}` : 
                              '2px solid rgba(255, 255, 255, 0.2)'
                          }}>
                            {currentClipIndex + 1}
                          </div>
                          <div style={{ 
                            fontSize: '1.2rem', 
                            fontWeight: 'bold',
                            color: 'white',
                            textShadow: '0 2px 4px rgba(0,0,0,0.5)'
                          }}>
                            {currentClipIndex < 3 ? 
                              (currentClipIndex === 0 ? 'TOP CLIPT' : 
                               currentClipIndex === 1 ? 'RUNNER UP CLIPT' : 'BRONZE CLIPT') : 
                              `CLIPT #${currentClipIndex + 1}`}
                          </div>
                        </div>
                        
                        <div style={{ 
                          fontSize: '0.9rem',
                          color: 'rgba(255,255,255,0.7)'
                        }}>
                          {currentClipIndex + 1} of {leaderboard.length}
                        </div>
                      </div>

                      {/* Video full screen */}
                      <div style={{ 
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        width: '100%',
                        height: '100%'
                      }}>
                        <iframe 
                          src={`${leaderboard[currentClipIndex].videoUrl}?autoplay=0&loop=0&title=0&byline=0&portrait=0`}
                          style={{ 
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: '100%'
                          }}
                          frameBorder="0" 
                          allow="autoplay; fullscreen" 
                          allowFullScreen
                        ></iframe>
                      </div>

                      {/* Info footer - Floating */}
                      <div style={{ 
                        position: 'absolute',
                        bottom: '50px',
                        left: '0',
                        right: '0',
                        padding: '15px 20px',
                        backgroundColor: 'rgba(0,0,0,0.6)',
                        backdropFilter: 'blur(8px)',
                        WebkitBackdropFilter: 'blur(8px)',
                        zIndex: 20
                      }}>
                        <div style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'flex-start'
                        }}>
                          <div>
                            <div style={{ 
                              fontWeight: 'bold', 
                              color: 'white', 
                              fontSize: '18px',
                              marginBottom: '5px'
                            }}>
                              {leaderboard[currentClipIndex].clipTitle}
                            </div>
                            
                            <div style={{ 
                              display: 'flex',
                              alignItems: 'center',
                              gap: '10px'
                            }}>
                              <div style={{ 
                                fontSize: '1rem',
                                color: 'rgba(255,255,255,0.8)'
                              }}>
                                {leaderboard[currentClipIndex].username}
                              </div>
                              
                              {leaderboard[currentClipIndex].gameTitle && (
                                <div style={{
                                  backgroundColor: 'rgba(255,85,0,0.3)',
                                  borderRadius: '4px',
                                  padding: '3px 8px',
                                  fontSize: '0.85rem',
                                  color: 'white'
                                }}>
                                  {leaderboard[currentClipIndex].gameTitle}
                                </div>
                              )}
                            </div>
                          </div>
                          
                          <div style={{ 
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            backgroundColor: 'rgba(255,85,0,0.2)',
                            padding: '8px 15px',
                            borderRadius: '20px',
                            boxShadow: '0 2px 10px rgba(0,0,0,0.2)',
                            border: '1px solid rgba(255,85,0,0.3)'
                          }}>
                            <Trophy className="h-5 w-5" style={{ color: '#FF7700' }} />
                            <span style={{ 
                              fontWeight: 'bold',
                              color: 'white',
                              fontSize: '1.1rem'
                            }}>
                              {leaderboard[currentClipIndex].points.toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </motion.div>
              </AnimatePresence>
              
              {/* Navigation dots - Improved for mobile */}
              <div style={{
                position: 'absolute',
                bottom: '25px',
                left: '0',
                right: '0',
                display: 'flex',
                justifyContent: 'center',
                gap: '10px',
                zIndex: 30,
                padding: '15px 0',
                backgroundImage: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0) 100%)'
              }}>
                {leaderboard.map((_, index) => (
                  <motion.div
                    key={`dot-${index}`}
                    onClick={() => {
                      setDirection(index > currentClipIndex ? 1 : -1);
                      setCurrentClipIndex(index);
                    }}
                    style={{
                      width: index === currentClipIndex ? '24px' : '12px',
                      height: '12px',
                      backgroundColor: index === currentClipIndex ? 
                        (index < 3 ? 
                          (index === 0 ? '#FFD700' : index === 1 ? '#C0C0C0' : '#CD7F32') : 
                          '#FF5500') : 
                        'rgba(255, 255, 255, 0.3)',
                      borderRadius: index === currentClipIndex ? '6px' : '50%',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      boxShadow: index === currentClipIndex ? '0 0 12px rgba(255,85,0,0.7)' : 'none'
                    }}
                    whileHover={{ scale: 1.2 }}
                    whileTap={{ scale: 0.9 }}
                  />
                ))}
              </div>
              
              {/* Mobile swipe indicator - Initial load only */}
              {leaderboard.length > 0 && (
                <motion.div
                  initial={{ opacity: 0.8 }}
                  animate={{ opacity: 0 }}
                  transition={{ duration: 3, delay: 1 }}
                  style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    zIndex: 40,
                    pointerEvents: 'none',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '200px',
                    height: '200px',
                    backgroundColor: 'rgba(0, 0, 0, 0.6)',
                    borderRadius: '20px',
                    boxShadow: '0 0 30px rgba(0, 0, 0, 0.5)',
                    backdropFilter: 'blur(10px)',
                    WebkitBackdropFilter: 'blur(10px)'
                  }}
                >
                  <motion.div
                    animate={{ x: [-20, 20, -20] }}
                    transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
                  >
                    <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="5" y1="12" x2="19" y2="12"></line>
                      <polyline points="12 5 19 12 12 19"></polyline>
                    </svg>
                  </motion.div>
                  <div style={{ 
                    marginTop: '15px',
                    color: 'white',
                    fontWeight: 'bold',
                    textAlign: 'center'
                  }}>
                    Swipe Left/Right<br />to View More Clips
                  </div>
                </motion.div>
              )}
            </div>
          )}
      </div>


      
      {/* Swipe Instructions */}
      <div className="absolute bottom-3 left-0 right-0 text-center z-50 text-xs text-gray-400 pointer-events-none">
        Swipe left or right to navigate between videos
      </div>
    </div>
  );
};

export default TopClipts;
