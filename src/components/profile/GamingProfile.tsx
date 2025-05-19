import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Gamepad, Medal, Zap, Rocket, Trophy, Heart, Star, Users, MessageSquare, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import '../../styles/gaming/profile-gaming.css';

// Define achievement interface for type safety
interface Achievement {
  id: string;
  name: string;
  description: string;
  points: number;
  tokens: number; // Token rewards for completing achievements
  type: 'trophy' | 'follower' | 'streaming' | 'engagement' | 'sharing' | 'collab' | 'special' | 'general';
  progress?: number;
  date?: string;
  reward?: string;
  isNew?: boolean;
}

interface GamingProfileProps {
  profile: any;
  tokenBalance: number;
  achievements: Achievement[];
  userPosts: any[];
  savedItems: any[];
  followersCount: number;
  followingCount: number;
  isOwnProfile: boolean;
  activeTab: string;
  onTabChange: (tab: string) => void;
  boostActive?: boolean;
}

// Define sample achievement data based on the provided list
const sampleAchievements: Achievement[] = [
  // 🏆 Trophy & Weekly Top 10
  {
    id: 'first-taste-gold',
    name: 'First Taste of Gold',
    description: 'Earn 10 trophies on a post.',
    points: 50,
    tokens: 25,
    type: 'trophy',
    progress: 70,
    reward: '25 Tokens + Gold Trophy Badge'
  },
  {
    id: 'viral-sensation',
    name: 'Viral Sensation',
    description: 'Get 100 trophies on a single post.',
    points: 200,
    tokens: 100,
    type: 'trophy',
    progress: 32,
    reward: '100 Tokens + Viral Badge'
  },
  {
    id: 'breaking-in',
    name: 'Breaking In',
    description: 'Rank in the Top 10 of the weekly leaderboard once.',
    points: 150,
    tokens: 75,
    type: 'trophy',
    progress: 100,
    date: '2025-04-28',
    reward: '75 Tokens + Top 10 Badge',
    isNew: true
  },
  {
    id: 'hot-streak',
    name: 'Hot Streak',
    description: 'Stay in the Top 10 for 5 weeks in a row.',
    points: 500,
    tokens: 250,
    type: 'trophy',
    progress: 40,
    reward: '250 Tokens + Streak Badge'
  },
  
  // 📈 Follower Growth
  {
    id: 'rising-star',
    name: 'Rising Star',
    description: 'Reach 1,000 followers.',
    points: 100,
    tokens: 50,
    type: 'follower',
    progress: 65,
    reward: '50 Tokens + Rising Star Badge'
  },
  {
    id: 'influencer-status',
    name: 'Influencer Status',
    description: 'Gain 10,000 followers.',
    points: 500,
    tokens: 250,
    type: 'follower',
    progress: 20,
    reward: '250 Tokens + Influencer Badge'
  },
  
  // 🎥 Streaming Subscriber Milestones
  {
    id: 'first-supporter',
    name: 'First Supporter',
    description: 'Get your first streaming sub.',
    points: 50,
    tokens: 25,
    type: 'streaming',
    progress: 100,
    date: '2025-03-15',
    reward: '25 Tokens + Supporter Badge'
  },
  {
    id: 'streaming-star',
    name: 'Streaming Star',
    description: 'Reach 100 streaming subscribers.',
    points: 300,
    tokens: 150,
    type: 'streaming',
    progress: 35,
    reward: '150 Tokens + Streaming Star Banner'
  },
  
  // 🤝 Engagement Boosters
  {
    id: 'hype-squad',
    name: 'Hype Squad',
    description: 'Leave 50 comments on others\'s posts.',
    points: 75,
    tokens: 40,
    type: 'engagement',
    progress: 100,
    date: '2025-04-02',
    reward: '40 Tokens + Hype Badge'
  },
  {
    id: 'super-supporter',
    name: 'Super Supporter',
    description: 'Give out 100 trophies.',
    points: 125,
    tokens: 60,
    type: 'engagement',
    progress: 45,
    reward: '60 Tokens + Super Support Badge'
  },
  {
    id: 'conversation-starter',
    name: 'Conversation Starter',
    description: 'Receive 100 replies to your comments.',
    points: 100,
    tokens: 50,
    type: 'engagement',
    progress: 68,
    reward: '50 Tokens + Conversation Badge'
  },
  {
    id: 'community-builder',
    name: 'Community Builder',
    description: 'Start a post that gets 500+ comments.',
    points: 250,
    tokens: 125,
    type: 'engagement',
    progress: 12,
    reward: '125 Tokens + Community Builder Title'
  },
  
  // 📢 Sharing & Promotion
  {
    id: 'signal-booster',
    name: 'Signal Booster',
    description: 'Share 10 other creators\' posts.',
    points: 50,
    tokens: 25,
    type: 'sharing',
    progress: 100,
    date: '2025-04-12',
    reward: '25 Tokens + Signal Badge'
  },
  {
    id: 'clipt-evangelist',
    name: 'Clipt Evangelist',
    description: 'Invite 5 friends to join Clipt.',
    points: 150,
    tokens: 75,
    type: 'sharing',
    progress: 80,
    reward: '75 Tokens + Evangelist Title'
  },
  
  // 🎮 Collab & Creator Support
  {
    id: 'duo-dynamic',
    name: 'Duo Dynamic',
    description: 'Collab on a post that earns 50 trophies.',
    points: 150,
    tokens: 75,
    type: 'collab',
    progress: 0,
    reward: '75 Tokens + Duo Badge'
  },
  {
    id: 'mentor-mode',
    name: 'Mentor Mode',
    description: 'Help a small creator reach 1,000 followers.',
    points: 250,
    tokens: 125,
    type: 'collab',
    progress: 0,
    reward: '125 Tokens + Mentor Crown'
  },
  
  // 🎉 Special & Hidden
  {
    id: 'og-clipt-creator',
    name: 'OG Clipt Creator',
    description: 'Joined within 3 months of launch.',
    points: 100,
    tokens: 50,
    type: 'special',
    progress: 100,
    date: '2025-01-10',
    reward: '50 Tokens + OG Badge'
  },
  {
    id: 'day-one-grinder',
    name: 'Day One Grinder',
    description: 'Posted on Clipt\'s launch day.',
    points: 200,
    tokens: 100,
    type: 'special',
    progress: 100,
    date: '2025-01-01',
    reward: '100 Tokens + Day One Title'
  },
  {
    id: 'mystery-viral',
    name: 'Mystery Viral',
    description: 'An old post goes viral after 30 days.',
    points: 150,
    tokens: 75,
    type: 'special',
    progress: 0,
    reward: '75 Tokens + Mystery Badge'
  },
  {
    id: 'shadow-supporter',
    name: 'Shadow Supporter',
    description: 'Consistently like/comment on someone\'s posts for a month.',
    points: 100,
    tokens: 50,
    type: 'special',
    progress: 75,
    reward: '50 Tokens + Shadow Badge'
  }
];

const GamingProfile: React.FC<GamingProfileProps> = ({
  profile,
  tokenBalance,
  achievements = sampleAchievements, // Use sample achievements if none provided
  userPosts,
  savedItems,
  followersCount,
  followingCount,
  isOwnProfile,
  activeTab,
  onTabChange,
  boostActive = false
}) => {
  // State for full-screen post viewing
  const [selectedPost, setSelectedPost] = useState<any | null>(null);
  const [currentPostIndex, setCurrentPostIndex] = useState<number>(0);
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right'>('right');
  
  // Handle post click to show full-screen view
  const handlePostClick = (post: any, index: number) => {
    setSelectedPost(post);
    setCurrentPostIndex(index);
    // Add body class to prevent scrolling when modal is open
    document.body.classList.add('overflow-hidden');
  };
  
  // Show next post in full-screen view
  const showNextPost = () => {
    if (currentPostIndex < userPosts.length - 1) {
      setSwipeDirection('left');
      setCurrentPostIndex(currentPostIndex + 1);
      setSelectedPost(userPosts[currentPostIndex + 1]);
    }
  };
  
  // Show previous post in full-screen view
  const showPreviousPost = () => {
    if (currentPostIndex > 0) {
      setSwipeDirection('right');
      setCurrentPostIndex(currentPostIndex - 1);
      setSelectedPost(userPosts[currentPostIndex - 1]);
    }
  };
  
  // Handle keyboard navigation for posts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!selectedPost) return;
      
      switch (e.key) {
        case 'ArrowRight':
          showNextPost();
          break;
        case 'ArrowLeft':
          showPreviousPost();
          break;
        case 'Escape':
          setSelectedPost(null);
          document.body.classList.remove('overflow-hidden');
          break;
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      // Make sure to remove the overflow-hidden class when unmounting
      document.body.classList.remove('overflow-hidden');
    };
  }, [selectedPost, currentPostIndex, userPosts]);
  
  const navigate = useNavigate();
  // Generate random stars for background
  const generateStars = (count: number) => {
    return Array.from({ length: count }).map((_, index) => {
      const size = Math.random() * 3 + 1;
      const top = Math.random() * 100;
      const left = Math.random() * 100;
      const delay = Math.random() * 5;
      const duration = Math.random() * 3 + 2;
      
      return (
        <div
          key={index}
          className="cosmic-star"
          style={{
            width: `${size}px`,
            height: `${size}px`,
            top: `${top}%`,
            left: `${left}%`,
            animationDelay: `${delay}s`,
            '--twinkle-duration': `${duration}s`
          } as React.CSSProperties}
        />
      );
    });
  };

  return (
    <div className="gaming-profile-container">
      {/* Cosmic stars background */}
      <div className="stars-container">
        {generateStars(150)}
      </div>
      
      {/* Main profile content */}
      <div className="gaming-profile-frame mx-auto max-w-lg px-4 py-6 mt-4">
        {/* Boost badge if active */}
        {boostActive && (
          <div className="boost-badge">
            <Zap className="boost-badge-icon" />
            Boosted
          </div>
        )}
        
        {/* Profile avatar */}
        <div className="cosmic-avatar-container flex justify-center mb-6">
          <div className="avatar-glow"></div>
          <div className="relative">
            {/* Orbiting elements */}
            <div className="orbiting-element orbiting-planet-1" style={{ top: '10%', left: '10%' }}></div>
            <div className="orbiting-element orbiting-planet-2" style={{ bottom: '10%', right: '10%' }}></div>
            
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="w-24 h-24 rounded-full overflow-hidden border-2 border-indigo-500/30"
            >
              <img 
                src={profile?.avatar_url || 'https://placehold.co/200x200/252944/FFFFFF?text=User'} 
                alt={profile?.username || 'User'} 
                className="w-full h-full object-cover"
              />
            </motion.div>
          </div>
        </div>
        
        {/* Profile name and token display */}
        <div className="flex justify-between items-center mb-4">
          <div className="text-center">
            <h1 className="text-xl font-bold text-white mb-1">
              {profile?.display_name || profile?.username || 'Gamer'}
            </h1>
            <p className="text-sm text-gray-400">@{profile?.username || 'username'}</p>
          </div>
          
          <div className="token-display">
            <span className="token-amount">{tokenBalance}</span>
            <Star className="token-icon w-4 h-4" />
          </div>
        </div>
        
        {/* Stats display */}
        <div className="stats-container">
          <div className="stat-item">
            <span className="stat-value">{userPosts.length}</span>
            <span className="stat-label">Clips</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">{followersCount}</span>
            <span className="stat-label">Followers</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">{followingCount}</span>
            <span className="stat-label">Following</span>
          </div>
        </div>
        
        {/* Bio section */}
        {profile?.bio && (
          <div className="mt-4 bg-slate-800/30 p-3 rounded-lg border border-indigo-500/20">
            <p className="text-sm text-gray-300">{profile.bio}</p>
          </div>
        )}
        
        {/* Action buttons */}
        <div className="flex gap-3 mt-4">
          {isOwnProfile ? (
            <>
              <Button 
                className="gaming-button glow-effect flex-1"
                onClick={() => navigate('/boost-store')}
              >
                <Zap className="w-4 h-4" />
                Get Boost
              </Button>
              <Button 
                className="gaming-button glow-effect flex-1"
                onClick={() => navigate('/edit-profile')}
              >
                <Gamepad className="w-4 h-4" />
                Edit Profile
              </Button>
            </>
          ) : (
            <>
              <Button 
                className="gaming-button glow-effect flex-1"
                onClick={() => {
                  // Follow user logic
                  toast.success(`Following ${profile?.username || 'user'}`);
                }}
              >
                <Users className="w-4 h-4" />
                Follow
              </Button>
              <Button 
                className="gaming-button glow-effect flex-1"
                onClick={() => navigate('/subscription')}
              >
                <Rocket className="w-4 h-4" />
                Subscribe
              </Button>
            </>
          )}
        </div>
        
        {/* Content tabs */}
        <div className="gaming-tabs mt-6">
          <button 
            className={`gaming-tab ${activeTab === 'clipts' ? 'active' : ''}`}
            onClick={() => onTabChange('clipts')}
          >
            Clips
          </button>
          <button 
            className={`gaming-tab ${activeTab === 'achievements' ? 'active' : ''}`}
            onClick={() => onTabChange('achievements')}
          >
            Achievements
          </button>
          <button 
            className={`gaming-tab ${activeTab === 'saved' ? 'active' : ''}`}
            onClick={() => onTabChange('saved')}
          >
            Saved
          </button>
        </div>
        
        {/* Tab content */}
        <div className="mt-4">
          {activeTab === 'clipts' && (
            <>
              {/* Modal for full-screen viewing */}
              {selectedPost && (
                <div className="fixed inset-0 bg-black/90 z-50 flex flex-col justify-center items-center">
                  {/* Close button */}
                  <button 
                    onClick={() => setSelectedPost(null)} 
                    className="absolute top-4 right-4 text-white hover:text-red-400 z-50"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18"></line>
                      <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                  </button>
                  
                  {/* Navigation arrows */}
                  <div className="absolute inset-y-0 left-4 flex items-center">
                    <button 
                      onClick={showPreviousPost} 
                      className="bg-black/50 hover:bg-black/70 text-white p-2 rounded-full"
                      disabled={currentPostIndex <= 0}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="15 18 9 12 15 6"></polyline>
                      </svg>
                    </button>
                  </div>
                  
                  <div className="absolute inset-y-0 right-4 flex items-center">
                    <button 
                      onClick={showNextPost} 
                      className="bg-black/50 hover:bg-black/70 text-white p-2 rounded-full"
                      disabled={currentPostIndex >= userPosts.length - 1}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="9 18 15 12 9 6"></polyline>
                      </svg>
                    </button>
                  </div>
                  
                  {/* Content container */}
                  <div className="max-w-6xl w-full max-h-[85vh] flex flex-col">
                    {/* Post content */}
                    <motion.div 
                      key={selectedPost.id}
                      initial={{ opacity: 0, x: swipeDirection === 'left' ? 50 : -50 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="w-full"
                    >
                      {/* Video content if available */}
                      {selectedPost.video_url ? (
                        <div className="relative w-full pt-[56.25%] bg-gray-900 rounded-lg overflow-hidden">
                          <video 
                            className="absolute inset-0 w-full h-full object-contain" 
                            src={selectedPost.video_url} 
                            controls 
                            autoPlay
                          />
                        </div>
                      ) : (
                        <img 
                          src={selectedPost.image_url || 'https://placehold.co/1200x800/252944/FFFFFF?text=Gaming+Highlight'} 
                          alt={selectedPost.title}
                          className="w-full max-h-[70vh] object-contain rounded-lg" 
                        />
                      )}
                      
                      {/* Post details */}
                      <div className="mt-4 text-white px-2">
                        <h2 className="text-xl font-bold">{selectedPost.title}</h2>
                        <p className="text-gray-300 mt-2">{selectedPost.content}</p>
                        
                        <div className="flex justify-between items-center mt-4">
                          <div className="flex items-center space-x-4">
                            <div className="flex items-center">
                              <Heart className="h-5 w-5 text-red-500 mr-1" />
                              <span>{selectedPost.likes_count || 0}</span>
                            </div>
                            <div className="flex items-center">
                              <MessageSquare className="h-5 w-5 text-blue-500 mr-1" />
                              <span>{selectedPost.comments_count || 0}</span>
                            </div>
                            <div className="flex items-center">
                              <Eye className="h-5 w-5 text-green-500 mr-1" />
                              <span>{selectedPost.views_count || 0}</span>
                            </div>
                          </div>
                          
                          <div className="text-sm text-gray-400">
                            Posted {new Date(selectedPost.created_at).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                    
                    {/* Swipe instructions */}
                    <div className="text-center text-gray-500 text-sm mt-4">
                      Swipe or use arrow keys to navigate between posts
                    </div>
                  </div>
                </div>
              )}
              
              {/* Clips grid */}
              <div className="game-clips-grid">
                {userPosts.length > 0 ? (
                  userPosts.map((post, index) => (
                    <motion.div 
                      key={post.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                      className="clip-item"
                      onClick={() => handlePostClick(post, index)}
                    >
                      {/* Video indicator if available */}
                      {post.video_url && (
                        <div className="video-indicator">
                          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="white" stroke="none">
                            <polygon points="5 3 19 12 5 21 5 3"></polygon>
                          </svg>
                        </div>
                      )}
                      
                      <img 
                        src={post.image_url || 'https://placehold.co/300x200/252944/FFFFFF?text=Gaming+Clip'} 
                        alt={post.title} 
                        className="clip-thumbnail"
                      />
                      <div className="clip-overlay">
                        <div className="clip-title">{post.title}</div>
                        <div className="clip-stats">
                          <span>{post.views_count || 0} views</span>
                          <span>{post.likes_count || 0} likes</span>
                        </div>
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <div className="text-center py-6 text-gray-400 col-span-full">
                    No clips found
                  </div>
                )}
              </div>
            </>
          )}
          
          {activeTab === 'achievements' && (
            <div className="achievements-section">
              <div className="achievements-header flex justify-between items-center mb-3">
                <h3 className="text-xl font-bold text-indigo-300">Player Achievements</h3>
                <div className="achievements-stats">
                  <span className="text-sm text-indigo-400">{achievements.length} Total</span>
                </div>
              </div>
              
              <div className="achievements-scrollable max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                {achievements.length > 0 ? (
                  <div className="achievements-grid">
                    {achievements.map((achievement) => (
                      <motion.div 
                        key={achievement.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                        className="achievement-card bg-gradient-to-br from-[#1A1A3A]/80 to-[#282860]/80 p-4 rounded-lg mb-3 border border-indigo-500/30 hover:border-indigo-400/50 transition-all"
                      >
                        <div className="flex items-start">
                          <div className="achievement-icon-container mr-3 bg-indigo-900/50 p-2 rounded-lg border border-indigo-600/30">
                            {/* Trophy & Weekly Top 10 */}
                            {achievement.type === 'trophy' && <Trophy className="text-yellow-400 h-6 w-6" />}
                            
                            {/* Follower Growth */}
                            {achievement.type === 'follower' && <Users className="text-green-400 h-6 w-6" />}
                            
                            {/* Streaming Milestones */}
                            {achievement.type === 'streaming' && <Rocket className="text-cyan-400 h-6 w-6" />}
                            
                            {/* Engagement */}
                            {achievement.type === 'engagement' && <Zap className="text-blue-400 h-6 w-6" />}
                            
                            {/* Sharing */}
                            {achievement.type === 'sharing' && <Zap className="text-pink-400 h-6 w-6" />}
                            
                            {/* Collab */}
                            {achievement.type === 'collab' && <Gamepad className="text-amber-400 h-6 w-6" />}
                            
                            {/* Special */}
                            {achievement.type === 'special' && <Star className="text-purple-400 h-6 w-6" />}
                            
                            {/* General/Others */}
                            {(!achievement.type || achievement.type === 'general') && <Medal className="text-indigo-400 h-6 w-6" />}
                          </div>
                          
                          <div className="achievement-content flex-1">
                            <div className="achievement-header flex justify-between">
                              <div className="achievement-name text-white font-bold mb-1">{achievement.name}</div>
                              {/* New achievement badge */}
                              {achievement.isNew && (
                                <span className="text-xs bg-gradient-to-r from-purple-500 to-indigo-500 text-white px-2 py-0.5 rounded-full ml-2 animate-pulse">NEW</span>
                              )}
                            </div>
                            <div className="achievement-desc text-gray-300 text-sm">{achievement.description}</div>
                            
                            {/* Token rewards displayed prominently */}
                            <div className="achievement-rewards flex items-center mt-1.5">
                              <div className="token-reward flex items-center bg-purple-900/40 text-purple-200 text-xs font-bold py-0.5 px-1.5 rounded-md border border-purple-600/30 mr-2">
                                <Star className="h-3 w-3 text-yellow-300 mr-1" />
                                <span>+{achievement.tokens} Tokens</span>
                              </div>
                              <div className="xp-reward flex items-center bg-indigo-900/40 text-indigo-200 text-xs font-bold py-0.5 px-1.5 rounded-md border border-indigo-600/30">
                                <Zap className="h-3 w-3 text-blue-300 mr-1" />
                                <span>+{achievement.points} XP</span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="achievement-points-container flex-shrink-0 ml-2 flex flex-col items-end">
                            {achievement.date && (
                              <div className="achievement-date text-gray-400 text-xs mb-1">
                                {new Date(achievement.date).toLocaleDateString()}
                              </div>
                            )}
                        </div>
                        </div>
                        
                        {/* Progress bar for achievements in progress */}
                        {achievement.progress !== undefined && (
                          <div className={`achievement-progress mt-3 ${achievement.isNew ? 'achievement-new' : ''}`}>
                            <div className="flex justify-between text-xs text-gray-400 mb-1">
                              <span>Progress</span>
                              <span className={achievement.progress >= 100 ? 'text-green-400' : 'text-blue-400'}>
                                {achievement.progress}%
                                {achievement.progress >= 100 && ' • Completed'}
                              </span>
                            </div>
                            <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                              <div 
                                className={`h-full ${achievement.progress >= 100 ? 'bg-gradient-to-r from-green-500 to-emerald-600' : 'bg-gradient-to-r from-blue-500 to-indigo-600'}`}
                                style={{ width: `${Math.min(achievement.progress, 100)}%` }}
                              ></div>
                            </div>
                          </div>
                        )}
                        
                        {/* Reward details */}
                        {achievement.reward && (
                          <div className="achievement-reward mt-2 text-xs bg-indigo-950/30 p-2 rounded-md border border-indigo-500/20">
                            <div className="flex items-center">
                              <Trophy className="h-3 w-3 text-yellow-400 mr-1.5" />
                              <span className="text-indigo-200 font-medium">Reward:</span>
                            </div>
                            <div className="mt-1 text-gray-300 pl-4.5">{achievement.reward}</div>
                          </div>
                        )}
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 bg-indigo-900/20 rounded-lg border border-indigo-500/20">
                    <Trophy className="mx-auto h-12 w-12 text-gray-600 mb-2" />
                    <div className="text-gray-400 mb-1">No achievements unlocked yet</div>
                    <div className="text-gray-500 text-sm">Keep streaming to earn your first achievement!</div>
                  </div>
                )}
              </div>
            </div>
          )}
          
          {activeTab === 'saved' && (
            <div className="game-clips-grid">
              {savedItems.length > 0 ? (
                savedItems.map((item) => (
                  <motion.div 
                    key={item.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="clip-item"
                  >
                    <img 
                      src={item.image_url || 'https://placehold.co/300x200/252944/FFFFFF?text=Saved+Item'} 
                      alt={item.title} 
                      className="clip-thumbnail"
                    />
                    <div className="clip-overlay">
                      <div className="clip-title">{item.title}</div>
                      <div className="clip-stats">
                        <span><Heart className="inline w-3 h-3" /> {item.likes_count || 0}</span>
                      </div>
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="text-center py-6 text-gray-400 col-span-full">
                  No saved items
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GamingProfile;
