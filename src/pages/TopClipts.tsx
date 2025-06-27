import React, { useState, useEffect } from 'react';
import { ArrowLeft, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import '../styles/topClipts-retro.css';

// Simple structure for leaderboard spots (kept for type safety)
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
  const navigate = useNavigate();
  // Keep basic UI state for toggles
  const [activeTab, setActiveTab] = useState('daily');
  const [lastUpdate, setLastUpdate] = useState<string | null>(null);
  const [updateScheduled, setUpdateScheduled] = useState(false);
  const [updateLoading, setUpdateLoading] = useState(false);
  
  // Check for last update date and set up weekly update schedule
  useEffect(() => {
    // Get last update timestamp from localStorage
    const storedUpdate = localStorage.getItem('lastTopCliptsUpdate');
    if (storedUpdate) {
      setLastUpdate(storedUpdate);
    }
    
    // Check if we need to update today
    checkWeeklyUpdate();
    
    // Set up a timer to check for updates every day
    const intervalId = setInterval(checkWeeklyUpdate, 24 * 60 * 60 * 1000);
    
    return () => clearInterval(intervalId);
  }, []);

  // Function to check if it's time for the weekly update
  const checkWeeklyUpdate = () => {
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
    
    // Schedule update every Monday
    if (dayOfWeek === 1) {
      // Check if we've already updated this week
      if (!lastUpdate || isOlderThanDays(new Date(lastUpdate), 7)) {
        // Schedule update
        setUpdateScheduled(true);
      }
    }
  };
  
  // Helper function to check if a date is older than X days
  const isOlderThanDays = (date: Date, days: number): boolean => {
    const now = new Date();
    return now.getTime() - date.getTime() > days * 24 * 60 * 60 * 1000;
  };

  // Function to trigger manual update
  const triggerUpdate = () => {
    setUpdateLoading(true);
    
    // Simulate API call to update leaderboards
    setTimeout(() => {
      // Update complete
      const now = new Date();
      setLastUpdate(now.toISOString());
      localStorage.setItem('lastTopCliptsUpdate', now.toISOString());
      setUpdateScheduled(false);
      setUpdateLoading(false);
    }, 1500);
  };

  // Animation variants for the main message
  const textVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { 
        duration: 0.8, 
        ease: "easeOut" 
      }
    }
  };

  // Function to handle navigation back
  const handleBack = () => {
    navigate(-1);
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
      zIndex: 40,
    }}>
      {/* Cosmic background from the existing CSS */}
      <div className="cosmic-background">
        <div className="stars"></div>
        <div className="twinkling"></div>
        <div className="clouds"></div>
        <div className="planet jupiter"></div>
        <div className="planet saturn"></div>
        <div className="comet comet1"></div>
        <div className="comet comet2"></div>
        <div className="comet comet3"></div>
      </div>

      <div className="p-4 relative z-10 h-full">
        {/* Simple centered header at the top */}
        <div className="flex justify-center mb-8 pt-4">
          <h1 className="text-2xl md:text-4xl font-bold text-white tracking-tight text-center cosmic-gradient-text glow-text">
            Top Clipts
          </h1>
        </div>
        
        {/* Buttons removed as requested */}

        {/* The tabs container - keeping the UI structure */}
        <div className="mb-4 border-b border-gray-700 mt-12">
          <div className="flex justify-center space-x-4">
            {['daily', 'weekly', 'all-time'].map((tab) => (
              <div
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`cursor-pointer px-4 py-2 text-sm font-medium ${
                  activeTab === tab
                    ? 'text-purple-500 border-b-2 border-purple-500'
                    : 'text-gray-400 hover:text-gray-300'
                }`}
              >
                {tab === 'daily' 
                  ? 'Trending' 
                  : tab === 'weekly'
                    ? 'Weekly' 
                    : 'All-Time'}
              </div>
            ))}
          </div>
        </div>

        {/* Main content area - replacing leaderboard with message */}
        <div className="flex items-center justify-center h-[65vh]">
          <AnimatePresence mode="wait">
            <motion.div
              key="launch-message"
              initial="hidden"
              animate="visible"
              exit="hidden" 
              variants={textVariants}
              className="text-center"
            >
              <h2 className="text-4xl md:text-6xl font-bold text-white mb-6 cosmic-gradient-text glow-text">
                Top Clipts
              </h2>
              <p className="text-purple-300 text-xl md:text-2xl mb-8">
                Earn Your Spot
              </p>
              {updateScheduled && (
                <div className="mt-4 flex flex-col items-center">
                  <p className="text-yellow-400 mb-3 animate-pulse font-medium">
                    Weekly update available!
                  </p>
                  <button
                    onClick={triggerUpdate}
                    disabled={updateLoading}
                    className="px-6 py-3 rounded-full bg-gradient-to-r from-purple-600 to-blue-500 hover:from-purple-500 hover:to-blue-400 text-white font-bold shadow-glow transition-all"
                  >
                    {updateLoading ? (
                      <span className="flex items-center">
                        <RefreshCw size={18} className="animate-spin mr-2" />
                        Updating...
                      </span>
                    ) : (
                      'Update Leaderboards'
                    )}
                  </button>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default TopClipts;
