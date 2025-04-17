import React, { useState, useEffect } from 'react';
import { Trophy, Zap, ArrowLeft, Settings } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import '../styles/topClipts-retro.css';
import { motion } from 'framer-motion';

// Simple structure for leaderboard spots
interface LeaderboardSpot {
  id: string;
  username: string;
  clipTitle: string;
  points: number;
}

const TopClipts = () => {
  const [activeTab, setActiveTab] = useState('daily');
  const [leaderboard, setLeaderboard] = useState<LeaderboardSpot[]>([]);
  const [loading, setLoading] = useState(true);
  const [pixelLoading, setPixelLoading] = useState(true);

  // Initialize empty leaderboard spots with sample data
  const emptyLeaderboard = [
    { id: '1', username: 'arcade_master', clipTitle: '', points: 0 },
    { id: '2', username: 'retro_gamer', clipTitle: '', points: 0 },
    { id: '3', username: 'pixel_hunter', clipTitle: '', points: 0 },
    { id: '4', username: 'game_wizard', clipTitle: '', points: 0 },
    { id: '5', username: 'neon_player', clipTitle: '', points: 0 },
    { id: '6', username: '8bit_warrior', clipTitle: '', points: 0 },
    { id: '7', username: 'joystick_pro', clipTitle: '', points: 0 },
    { id: '8', username: 'high_scorer', clipTitle: '', points: 0 },
    { id: '9', username: 'level_master', clipTitle: '', points: 0 },
    { id: '10', username: 'console_king', clipTitle: '', points: 0 },
  ];

  useEffect(() => {
    // Initialize with empty leaderboard
    setLeaderboard(emptyLeaderboard);
    
    // Show pixel loading animation first
    setPixelLoading(true);
    const pixelTimer = setTimeout(() => {
      setPixelLoading(false);
      // Then fetch leaderboard data
      fetchLeaderboard();
    }, 1200);
    
    return () => clearTimeout(pixelTimer);
  }, [activeTab]); // Refetch when tab changes

  // Function to fetch leaderboard data
  const fetchLeaderboard = async () => {
    setLoading(true);
    try {
      // In a real app, this would fetch from Supabase
      // Different queries based on activeTab (daily, weekly, all-time)
      
      /*
      // Example of how you would fetch real data when ready to implement:
      let query = supabase
        .from('clipt_votes')
        .select('clipt_id, count(*)')
        .group('clipt_id')
        .order('count', { ascending: false })
        .limit(10);
      
      // Add time filter based on activeTab
      if (activeTab === 'daily') {
        const oneDayAgo = new Date();
        oneDayAgo.setDate(oneDayAgo.getDate() - 1);
        query = query.gte('created_at', oneDayAgo.toISOString());
      } else if (activeTab === 'weekly') {
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        query = query.gte('created_at', oneWeekAgo.toISOString());
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      // Transform the data to leaderboard format
      const formattedData = data.map((item, index) => ({
        id: (index + 1).toString(),
        points: item.count
      }));
      
      setLeaderboard(formattedData);
      */

      // For now, just show empty leaderboard after a short delay
      setTimeout(() => {
        setLeaderboard(emptyLeaderboard);
        setLoading(false);
      }, 800);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
      toast.error('Failed to load leaderboard');
      setLoading(false);
    }
  };

  // Function to get rank class based on position
  const getRankClass = (rank) => {
    switch(rank) {
      case 1: return 'rank rank-1';
      case 2: return 'rank rank-2';
      case 3: return 'rank rank-3';
      default: return 'rank rank-default';
    }
  };

  // Function to render the trophy icon with appropriate styling
  const renderTrophy = (rank) => {
    switch(rank) {
      case 1: return <Trophy className="trophy-icon h-5 w-5" style={{ color: '#FFD700' }} />;
      case 2: return <Trophy className="trophy-icon h-5 w-5" style={{ color: '#C0C0C0' }} />;
      case 3: return <Trophy className="trophy-icon h-5 w-5" style={{ color: '#CD7F32' }} />;
      default: return <Trophy className="trophy-icon h-5 w-5" style={{ color: '#FF5500' }} />;
    }
  };

  // Function to handle navigation back
  const handleBack = () => {
    window.history.back();
  };

  // Get tab title based on activeTab
  const getTabTitle = () => {
    switch(activeTab) {
      case 'daily': return 'TODAY\'S HIGH SCORES';
      case 'weekly': return 'WEEKLY HIGH SCORES';
      case 'all-time': return 'ALL-TIME HIGH SCORES';
      default: return 'HIGH SCORES';
    }
  };

  return (
    <div className="topClipts-container" style={{ 
      backgroundColor: '#121212', 
      minHeight: '100vh',
      color: 'white' 
    }}>
      {/* Modern Header with Dark Theme */}
      <div className="topClipts-header fixed top-0 left-0 right-0 z-10" style={{
        backgroundColor: '#121212',
        borderBottom: '1px solid rgba(255, 85, 0, 0.3)',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)'
      }}>
        <div className="container mx-auto px-4 py-4 flex items-center justify-center">
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
            <Trophy className="trophy-icon h-6 w-6" style={{ color: '#FF7700' }} />
            <span style={{ 
              fontWeight: 'bold', 
              fontSize: '1.5rem',
              background: 'linear-gradient(90deg, #FF5500, #FF7700)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)'
            }}>TOP CLIPTS</span>
          </div>
        </div>
      </div>

      {/* Main content with padding for fixed header */}
      <div className="pt-24 px-4 sm:px-6 md:px-8 max-w-lg mx-auto">
        {/* Modern Tabs with Dark Theme */}
        <div className="flex justify-center mb-8">
          <div className="w-full max-w-md" style={{ 
            backgroundColor: 'rgba(42, 26, 18, 0.8)', 
            borderRadius: '12px',
            overflow: 'hidden',
            padding: '4px',
            border: '1px solid rgba(255, 85, 0, 0.3)',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)'
          }}>
            <div className="flex justify-between">
              <div 
                className={`py-2 px-4 text-center cursor-pointer transition-all duration-200 flex-1`}
                onClick={() => setActiveTab('daily')}
                style={{
                  backgroundColor: activeTab === 'daily' ? 'rgba(255, 85, 0, 0.3)' : 'transparent',
                  borderBottom: activeTab === 'daily' ? '2px solid #FF5500' : 'none',
                  color: activeTab === 'daily' ? '#FFFFFF' : 'rgba(255, 255, 255, 0.7)',
                  fontWeight: activeTab === 'daily' ? 'bold' : 'normal',
                  borderRadius: activeTab === 'daily' ? '8px 8px 0 0' : '0'
                }}
              >
                TRENDING
              </div>
              <div 
                className={`py-2 px-4 text-center cursor-pointer transition-all duration-200 flex-1`}
                onClick={() => setActiveTab('weekly')}
                style={{
                  backgroundColor: activeTab === 'weekly' ? 'rgba(255, 85, 0, 0.3)' : 'transparent',
                  borderBottom: activeTab === 'weekly' ? '2px solid #FF5500' : 'none',
                  color: activeTab === 'weekly' ? '#FFFFFF' : 'rgba(255, 255, 255, 0.7)',
                  fontWeight: activeTab === 'weekly' ? 'bold' : 'normal',
                  borderRadius: activeTab === 'weekly' ? '8px 8px 0 0' : '0'
                }}
              >
                THIS WEEK
              </div>
              <div 
                className={`py-2 px-4 text-center cursor-pointer transition-all duration-200 flex-1`}
                onClick={() => setActiveTab('all-time')}
                style={{
                  backgroundColor: activeTab === 'all-time' ? 'rgba(255, 85, 0, 0.3)' : 'transparent',
                  borderBottom: activeTab === 'all-time' ? '2px solid #FF5500' : 'none',
                  color: activeTab === 'all-time' ? '#FFFFFF' : 'rgba(255, 255, 255, 0.7)',
                  fontWeight: activeTab === 'all-time' ? 'bold' : 'normal',
                  borderRadius: activeTab === 'all-time' ? '8px 8px 0 0' : '0'
                }}
              >
                ALL-TIME
              </div>
            </div>
          </div>
        </div>
        
        {/* Tab Content Container */}
        <div className="mt-8">
          {/* Leaderboard Section - visible for all tabs */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            backgroundColor: '#2A1A12',
            padding: '12px 16px',
            borderRadius: '12px 12px 0 0',
            border: '1px solid rgba(255, 85, 0, 0.3)',
            borderBottom: 'none',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)'
          }}>
            <Zap className="h-5 w-5" style={{ color: '#FF5500' }} />
            <h2 style={{
              margin: 0,
              color: 'white',
              fontWeight: 'bold',
              fontSize: '1.1rem',
              background: 'linear-gradient(90deg, #FFFFFF, #DDDDDD)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>{getTabTitle()}</h2>
          </div>
          
          {pixelLoading ? (
            // Modern Loading Animation
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '30px',
              backgroundColor: '#2A1A12',
              borderRadius: '0 0 12px 12px',
              border: '1px solid rgba(255, 85, 0, 0.3)',
              borderTop: 'none'
            }}>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
              >
                <div className="w-16 h-16 relative">
                  <div style={{
                    position: 'absolute',
                    width: '100%',
                    height: '100%',
                    borderRadius: '50%',
                    border: '3px solid rgba(255, 85, 0, 0.2)',
                    borderTop: '3px solid #FF5500',
                    animation: 'spin 1s linear infinite'
                  }}></div>
                </div>
              </motion.div>
              <div style={{ marginTop: '16px', color: '#FF7700', fontWeight: 'bold' }}>LOADING...</div>
            </div>
          ) : loading ? (
            // Loading skeletons with modern dark style
            <div style={{
              backgroundColor: '#2A1A12',
              borderRadius: '0 0 12px 12px',
              border: '1px solid rgba(255, 85, 0, 0.3)',
              borderTop: 'none',
              padding: '10px'
            }}>
              {[...Array(10)].map((_, i) => (
                <div key={i} style={{
                  height: '60px',
                  margin: '8px 0',
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  borderRadius: '8px',
                  animation: 'pulse 1.5s infinite ease-in-out',
                }}></div>
              ))}
            </div>
          ) : (
            // Modern Dark Theme Leaderboard
            <div style={{
              backgroundColor: '#2A1A12',
              borderRadius: '0 0 12px 12px',
              border: '1px solid rgba(255, 85, 0, 0.3)',
              borderTop: 'none',
              padding: '10px'
            }}>
              {leaderboard.map((spot, index) => (
                <div key={spot.id} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '12px 16px',
                  margin: '8px 0',
                  backgroundColor: 'rgba(30, 20, 15, 0.6)',
                  borderRadius: '8px',
                  border: '1px solid rgba(255, 85, 0, 0.1)',
                  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                  transition: 'all 0.2s ease',
                  overflow: 'hidden',
                  position: 'relative'
                }}>
                  {/* Rank bar on the side */}
                  <div style={{
                    position: 'absolute',
                    left: 0,
                    top: 0,
                    bottom: 0,
                    width: '3px',
                    backgroundColor: index < 3 ? '#FF5500' : 'rgba(255, 85, 0, 0.3)'
                  }}></div>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{
                      width: '32px',
                      height: '32px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: '50%',
                      backgroundColor: index < 3 ? 'rgba(255, 85, 0, 0.2)' : 'rgba(255, 255, 255, 0.1)',
                      color: index < 3 ? '#FFFFFF' : 'rgba(255, 255, 255, 0.8)',
                      fontWeight: 'bold',
                      fontSize: '14px'
                    }}>
                      {index + 1}
                    </div>
                    {renderTrophy(index + 1)}
                    <div style={{ marginLeft: '4px' }}>
                      <div style={{ fontWeight: 'bold', color: 'white' }}>{spot.username}</div>
                      {spot.clipTitle && (
                        <div style={{ fontSize: '0.8rem', color: 'rgba(255, 255, 255, 0.6)' }}>{spot.clipTitle}</div>
                      )}
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Trophy className="h-4 w-4" style={{ color: '#FF5500' }} />
                    <span style={{ 
                      fontWeight: 'bold', 
                      color: 'white',
                      fontSize: '0.9rem'
                    }}>
                      {spot.points.toLocaleString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
            
      </div>
    </div>
  );
};

export default TopClipts;
