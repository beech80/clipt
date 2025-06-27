import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Trophy, Zap, VideoIcon, User, Heart, Bookmark, UserPlus, ArrowLeft, Gamepad, Award, Star, Shield, Music, Rocket, Crown, ThumbsUp, MessageSquare, Share2, Eye, Settings, Lock, Bell, Clock, Calendar, Users, CircleDollarSign as Coin, Check, X, Medal, ChevronRight, AlertCircle } from 'lucide-react';
import UserTitle from '../common/UserTitle';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import levelingService from '@/services/levelingService';
// ConnectStripeButton now only used on Stream Setup page
import TokenCounter from '../tokens/TokenCounter';
import '@/styles/profile-retro-arcade.css';
import '@/styles/cosmic-buttons.css';
import '@/styles/post-modal-fix.css'; // Fix for post modal action buttons
import '@/styles/post-action-buttons.css'; // Space-themed post action buttons
import '@/styles/profile-retro-arcade-smaller.css'; // Smaller profile CSS
import '@/styles/post-modal.css'; // Post modal styling
import '@/styles/cosmic-post-preview.css'; // Enhanced cosmic styling for post previews

// Removed ReactDOM since we're not using portals anymore

interface ProfileProps {
  profile?: any;
  posts?: any[];
  previousStreams?: any[];
  achievements?: any[];
  isOwnProfile?: boolean;
  savedItems?: any[];
  followersCount?: number;
  followingCount?: number;
  activeTab?: string;
  onTabChange?: (tab: string) => void;
  onBoostClick?: () => void;
  onSquadChatClick?: () => void;
}

const RetroArcadeProfile: React.FC<ProfileProps> = ({ 
  profile = {}, 
  posts = [], 
  previousStreams = [], 
  achievements = [],
  isOwnProfile = false,
  savedItems = [],
  followersCount = 0,
  followingCount = 0,
  activeTab = 'trophies',
  onTabChange = () => {},
  onBoostClick = () => {},
  onSquadChatClick = () => {}
}): JSX.Element => {
  const navigate = useNavigate();
  const [localActiveTab, setLocalActiveTab] = useState<'trophies' | 'clipts' | 'streams'>(activeTab);
  const [selectedPost, setSelectedPost] = useState<any>(null);
  const [selectedStream, setSelectedStream] = useState<any>(null);
  const [isPostModalOpen, setIsPostModalOpen] = useState<boolean>(false);
  const [showStreamModal, setShowStreamModal] = useState<boolean>(false);
  const [likedPosts, setLikedPosts] = useState<string[]>([]);
  const [likedStreams, setLikedStreams] = useState<string[]>([]);
  const [showComments, setShowComments] = useState(false);
  const [showCommentInput, setShowCommentInput] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [isFollowing, setIsFollowing] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [userLevel, setUserLevel] = useState(0);
  const [userAchievements, setUserAchievements] = useState({
    streamsWatched: 0,
    gamesPlayed: 0,
    videosUploaded: 0,
    commentsPosted: 0,
    tokensEarned: 0
  });
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [showRankingSuccess, setShowRankingSuccess] = useState(false);
  const [xpProgress, setXpProgress] = useState({
    level: 0,
    progress: 0,
    totalXpForCurrentLevel: 0,
    xpToNextLevel: 100
  });

  // Mock data for previous streams
  const [mockPreviousStreams, setMockPreviousStreams] = useState([
    {
      id: 's1',
      title: 'Late Night Elden Ring',
      thumbnail_url: 'https://i.imgur.com/ZN5EvMj.jpg',
      duration: '2:45:30',
      viewers_count: 142,
      stream_date: '2025-05-25T22:00:00',
      game: 'Elden Ring',
      type: 'stream'
    },
    {
      id: 's2',
      title: 'Warzone 3 Tournament',
      thumbnail_url: 'https://i.imgur.com/MXb0Krm.jpg',
      duration: '3:22:15',
      viewers_count: 258,
      stream_date: '2025-05-20T19:30:00',
      game: 'Call of Duty: Warzone 3',
      type: 'stream'
    },
    {
      id: 's3',
      title: 'Speedrunning Metroid Prime 4',
      thumbnail_url: 'https://i.imgur.com/HZX9PcL.jpg',
      duration: '1:48:22',
      viewers_count: 87,
      stream_date: '2025-05-15T20:15:00',
      game: 'Metroid Prime 4',
      type: 'stream'
    },
    {
      id: 's4',
      title: 'Minecraft Hardcore Mode Day 100',
      thumbnail_url: 'https://i.imgur.com/t7Xr5ZP.jpg',
      duration: '4:12:45',
      viewers_count: 195,
      stream_date: '2025-05-10T18:00:00',
      game: 'Minecraft',
      type: 'stream'
    }
  ]);

  const [tokens, setTokens] = useState(2500); // Current token balance
  const [maxTokens, setMaxTokens] = useState(isSubscribed ? 800 : 200); // Token wallet cap based on subscription tier

  useEffect(() => {
    if (activeTab) {
      setLocalActiveTab(activeTab);
    }
  }, [activeTab]);
  
  // Update XP progress based on achievements whenever they change
  useEffect(() => {
    const updateXpProgress = () => {
      // Calculate total points from all achievements
      const totalPoints = 
        userAchievements.streamsWatched * 10 + 
        userAchievements.gamesPlayed * 15 + 
        userAchievements.videosUploaded * 20 + 
        userAchievements.commentsPosted * 5 + 
        userAchievements.tokensEarned * 0.5;
      
      // Get level info based on totalPoints
      const levelInfo = getLevelInfo(totalPoints);
      
      // Update XP progress state
      setXpProgress({
        level: levelInfo.level,
        progress: levelInfo.progress,
        totalXpForCurrentLevel: levelInfo.currentLevelXp,
        xpToNextLevel: levelInfo.xpForNextLevel
      });
    };
    
    updateXpProgress();
  }, [userAchievements]);

  const handleTabChange = (tab: 'trophies' | 'clipts' | 'streams') => {
    setLocalActiveTab(tab);
    if (onTabChange) {
      onTabChange(tab);
    }
  };

  const handleBack = () => {
    navigate(-1);
  };
  
  const handleViewPost = (post: any) => {
    setSelectedPost(post);
    setIsPostModalOpen(true);
  };
  
  const closePostModal = () => {
    setIsPostModalOpen(false);
    setShowCommentInput(false);
    setCommentText('');
    // Small delay to allow animation to complete
    setTimeout(() => {
      setSelectedPost(null);
    }, 300);
  };

  const closeStreamModal = () => {
    setShowStreamModal(false);
    setShowCommentInput(false);
    setCommentText('');
    // Small delay to allow animation to complete
    setTimeout(() => {
      setSelectedStream(null);
    }, 300);
  };
  
  const handleLikePost = (postId: string) => {
    // Check if post is already liked
    if (likedPosts.includes(postId)) {
      // Unlike post
      setLikedPosts(prev => prev.filter(id => id !== postId));
      // Update the post's like count in selectedPost state
      if (selectedPost && selectedPost.id === postId) {
        setSelectedPost(prev => ({
          ...prev,
          likes_count: (prev.likes_count || 0) - 1,
          isLiked: false
        }));
      }
    } else {
      // Like post
      setLikedPosts(prev => [...prev, postId]);
      // Track social interaction achievement when liking a post
      trackAchievement('socialInteraction', 2);
      // Update the post's like count in selectedPost state
      if (selectedPost && selectedPost.id === postId) {
        setSelectedPost(prev => ({
          ...prev,
          likes_count: (prev.likes_count || 0) + 1,
          isLiked: true
        }));
      }
    }
  };
  
  const handleCommentToggle = () => {
    // Always show comments when comment button is clicked
    setShowComments(true);
    // Toggle comment input
    setShowCommentInput(prev => !prev);
    if (!showCommentInput) {
      // Focus on comment input after it appears
      setTimeout(() => {
        const commentInput = document.getElementById('comment-input');
        if (commentInput) commentInput.focus();
      }, 100);
    }
  };
  
  const handleCommentSubmit = (postId: string) => {
    if (!commentText.trim()) return;
    
    // In a real app, you would send this to your backend
    console.log(`Commenting on post ${postId}: ${commentText}`);
    
    // Create a new comment object
    const newComment = {
      id: `temp-${Date.now()}`,
      content: commentText,
      created_at: new Date().toISOString(),
      user: {
        id: profile.id,
        display_name: profile.display_name || profile.username || (profile.name ? profile.name.toUpperCase() : 'You'),
        avatar_url: profile.avatar_url || 'https://api.dicebear.com/7.x/pixel-art/svg?seed=you'
      }
    };
    
    // Update the post's comment count in selectedPost state
    if (selectedPost && selectedPost.id === postId) {
      setSelectedPost(prev => ({
        ...prev,
        comments_count: (prev.comments_count || 0) + 1,
        // Add the new comment to the beginning of the comments array
        comments: [newComment, ...(prev.comments || [])]
      }));
    }
    
    // Reset comment input but keep comment section visible
    setCommentText('');
    // Keep comments visible after posting
    setShowComments(true);
    
    // Show success toast
    toast.success('Comment posted!');
  };
  
  const handleSharePost = (postId: string, title: string) => {
    // In a real app, you would implement social sharing
    // For this demo, we'll simulate a clipboard copy
    const shareUrl = `https://clipt.space/post/${postId}`;
    
    // Try to use clipboard API if available
    if (navigator.clipboard) {
      navigator.clipboard.writeText(`Check out this post: ${window.location.origin}/post/${postId}`)
        .then(() => {
          toast.success(`Link to "${title}" copied to clipboard!`);
        })
        .catch(() => {
          // Fallback for clipboard API failure
          prompt('Copy this link to share:', shareUrl);
        });
    } else {
      // Fallback for browsers without clipboard API
      prompt('Copy this link to share:', shareUrl);
    }
  };
  
  // Stream handling functions
  const openStreamModal = (stream: any) => {
    setSelectedStream(stream);
    setShowStreamModal(true);
    
    // Track achievement for watching a stream
    trackAchievement('streamsWatched', 1);
    
    // Random chance to earn tokens when watching a stream
    if (Math.random() > 0.7) {
      const tokensEarned = Math.floor(Math.random() * 20) + 5;
      trackAchievement('tokensEarned', tokensEarned);
      
      setTimeout(() => {
        toast.success(`You earned ${tokensEarned} tokens for watching this stream!`, {
          duration: 3000,
          icon: '🪙',
        });
      }, 2000);
    }
  };

  const handleLikeStream = (streamId: string) => {
    // Toggle like for the stream
    if (likedStreams.includes(streamId)) {
      setLikedStreams(likedStreams.filter(id => id !== streamId));
      toast.success('Stream unliked!');
    } else {
      setLikedStreams([...likedStreams, streamId]);
      toast.success('Stream liked!');
    }
  };

  const handleShareStream = (streamId: string, title: string = 'Stream') => {
    // Make sure we have valid parameters
    if (!streamId) {
      console.error('Cannot share stream: Invalid stream ID');
      return;
    }
    
    // In a real app, you would implement social sharing
    // For this demo, we'll simulate a clipboard copy
    const shareUrl = `https://clipt.space/stream/${streamId}`;
    const shareTitle = title || 'Stream'; // Ensure title has a fallback
    
    // Try to use clipboard API if available
    if (navigator.clipboard) {
      navigator.clipboard.writeText(`Check out this stream: ${window.location.origin}/stream/${streamId}`)
        .then(() => {
          toast.success(`Link to "${shareTitle}" copied to clipboard!`);
        })
        .catch(() => {
          // Fallback for clipboard API failure
          prompt('Copy this link to share:', shareUrl);
        });
    } else {
      // Fallback for browsers without clipboard API
      prompt('Copy this link to share:', shareUrl);
    }
  };

  const formatStreamTime = (dateString: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  // Function to toggle follow state
  const toggleFollow = () => {
    setIsFollowing(!isFollowing);
    
    toast(isFollowing ? 'Unfollowed user' : 'Following user', {
      position: 'bottom-center',
      duration: 2000,
    });

    if (!isFollowing) {
      trackAchievement('socialInteraction', 5);
    }
  };

  // Track achievements and update level accordingly
  const trackAchievement = (type: string, value: number) => {
    let updatedAchievements = {...userAchievements};
    
    switch(type) {
      case 'streamsWatched':
        updatedAchievements.streamsWatched += value;
        break;
      case 'gamesPlayed':
        updatedAchievements.gamesPlayed += value;
        break;
      case 'videosUploaded':
        updatedAchievements.videosUploaded += value;
        break;
      case 'commentsPosted':
        updatedAchievements.commentsPosted += value;
        break;
      case 'tokensEarned':
        updatedAchievements.tokensEarned += value;
        // Also update the actual token count, ensuring it doesn't exceed the max cap
        const newTokenCount = Math.min(tokens + value, maxTokens);
        setTokens(newTokenCount);
        
        // Show token earned notification if tokens were earned
        if (newTokenCount > tokens) {
          const actualTokensEarned = newTokenCount - tokens;
          if (actualTokensEarned > 0) {
            toast.success(`Earned ${actualTokensEarned} tokens!`, {
              description: `${maxTokens - newTokenCount} more until wallet cap`,
              icon: '🪙',
              duration: 3000
            });
          } else if (newTokenCount === maxTokens && tokens < maxTokens) {
            toast.info(`Token wallet full! (${maxTokens} tokens)`, {
              description: `Subscribe to increase your token wallet capacity`,
              icon: '🪙',
              duration: 3000
            });
          }
        }
        break;
      case 'socialInteraction':
        // Social interactions contribute to overall level progress
        break;
    }
    
    setUserAchievements(updatedAchievements);
    calculateLevel(updatedAchievements);
  };

  // Helper function to calculate level info based on XP points
  const getLevelInfo = (totalPoints: number) => {
    // Level calculation formula (more sophisticated than linear)
    // First 5 levels are easier to achieve, then it gets progressively harder
    const level = totalPoints < 500 ? 
      Math.floor(1 + totalPoints / 100) : 
      Math.floor(5 + Math.sqrt((totalPoints - 500) / 50));
    
    // Calculate XP required for current level
    const currentLevelXp = level <= 5 ? 
      (level - 1) * 100 : 
      500 + Math.pow(level - 5, 2) * 50;
    
    // Calculate XP required for next level
    const nextLevelXp = level <= 4 ? 
      level * 100 : 
      (level === 5 ? 500 + 50 : 500 + Math.pow(level - 4, 2) * 50);
    
    // XP needed to reach next level
    const xpForNextLevel = nextLevelXp - currentLevelXp;
    
    // Current progress within the level (0-100%)
    const progress = Math.min(((totalPoints - currentLevelXp) / xpForNextLevel) * 100, 100);
    
    return {
      level,
      progress,
      currentLevelXp,
      xpForNextLevel
    };
  };

  // Calculate user level based on achievements
  const calculateLevel = (achievementData: any) => {
    // Calculate total points from all achievements
    const totalPoints = 
      achievementData.streamsWatched * 10 + 
      achievementData.gamesPlayed * 15 + 
      achievementData.videosUploaded * 20 + 
      achievementData.commentsPosted * 5 + 
      achievementData.tokensEarned * 0.5;
    
    // Level calculation formula (more sophisticated than linear)
    // First 5 levels are easier to achieve, then it gets progressively harder
    const newLevel = totalPoints < 500 ? 
      Math.floor(1 + totalPoints / 100) : 
      Math.floor(5 + Math.sqrt((totalPoints - 500) / 50));
    
    // Check if level up occurred
    if (newLevel > userLevel) {
      setUserLevel(newLevel);
      showLevelUpNotification();
      
      // Special rewards for milestone levels
      if (newLevel % 5 === 0) {
        toast.success(`Reached Level ${newLevel}! You've earned special cosmic rewards!`, {
          duration: 5000,
          icon: '🏆',
        });
      }
    }
  };

  // Show level up notification
  const showLevelUpNotification = () => {
    setShowLevelUp(true);
    setTimeout(() => setShowLevelUp(false), 3000);
  };

  const formatStreamDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };
  
  const handleRankForTop10 = (postId: string) => {
    // Simulate ranking the post for Top 10
    setShowRankingSuccess(true);
    
    // Update the post with a ranked property
    if (selectedPost && selectedPost.id === postId) {
      setSelectedPost(prev => ({
        ...prev,
        ranked_for_top10: true
      }));
    }
    
    // Hide success message after a delay
    setTimeout(() => {
      setShowRankingSuccess(false);
    }, 3000);
  };


  // Subscription is now handled via the dedicated subscription page, no modal needed



  return (
    <div className="profile-retro-arcade">
      {/* No longer need the inline modal as we're using a dedicated page */}
      
      {/* Enhanced screen effects */}
      
      {/* Arcade cabinet frame */}
      <div className="arcade-cabinet-frame">
        <div className="arcade-cabinet-screen">
          
          {/* Arcade marquee header */}
          <div className="arcade-marquee">
            <h1 className="arcade-title glow-text">PLAYER PROFILE</h1>
          </div>
          
          {/* Player card with glowing effects */}
          <motion.div 
            className="player-card-container"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <div className="player-card">
              <div className="player-card-inner">
                <div className="player-avatar-section">
                  <div className="player-avatar-container">
                    <div className="avatar-frame">
                      <img 
                        src={profile.avatar_url || 'https://api.dicebear.com/7.x/pixel-art/svg?seed=default'} 
                        alt="Profile" 
                        className="player-avatar"
                      />
                    </div>
                  </div>
                  
                  <div className="player-level-container">
                    <div className="player-level">
                      <div className="level-display">
                        <span>LVL</span>
                        <span className="level-number">{userLevel}</span>
                      </div>
                      
                      {/* XP Progress Bar integrated in the level badge */}
                      <div className="xp-progress-container">
                        <div className="xp-progress-bar">
                          <div 
                            className="xp-progress-fill" 
                            style={{ width: `${xpProgress.progress}%` }}
                          ></div>
                        </div>
                        <div className="xp-progress-text">
                          <span>XP: {xpProgress.totalXpForCurrentLevel} / {xpProgress.totalXpForCurrentLevel + xpProgress.xpToNextLevel}</span>
                        </div>
                      </div>
                      
                      {showLevelUp && (
                        <div className="level-up-notification">
                          <Zap className="level-up-icon" />
                          <span>LEVEL UP!</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="player-info">
                  <div className="player-header">
                    <h2 className="player-name glow-text">
                      {profile.display_name || profile.username || (profile.name ? profile.name.toUpperCase() : 'PLAYER ONE')}
                      {profile.verified && <span className="verified-badge ml-1">✓</span>}
                    </h2>
                    
                    {profile?.selected_title && (
                      <div className="retro-arcade-user-title">
                        <UserTitle titleId={profile.selected_title} size="large" />
                      </div>
                    )}
                  </div>
                  
                  <div className="horizontal-stats">
                    <div className="player-stat">
                      <Trophy className="stat-icon trophy" />
                      <span className="stat-value">{achievements.length}</span>
                    </div>
                    <div className="player-stat">
                      <VideoIcon className="stat-icon clip" />
                      <span className="stat-value">{posts.length}</span>
                    </div>
                    <div className="player-stat">
                      <User className="stat-icon followers" />
                      <span className="stat-value">{followersCount}</span>
                    </div>
                    <div className="player-stat">
                      <Star className="stat-icon rank" />
                      <span className="stat-value">{profile.ranking || 0}</span>
                    </div>
                    <div className="player-stat tokens">
                      <Coin className="stat-icon token" />
                      <span className="stat-value">
                        <TokenCounter 
                          count={tokens} 
                          maxCount={maxTokens} 
                          showMax={true}
                          className="inline-flex items-center" 
                        />
                      </span>
                    </div>
                  </div>
                    
                  {!isOwnProfile && (
                    <div className="profile-buttons flex gap-2 flex-wrap">
                      <motion.button 
                        className="message-button"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => {
                          // Directly navigate to messages with userId in URL params
                          navigate(`/messages?userId=${profile.id}&username=${encodeURIComponent(profile.username || 'User')}&displayName=${encodeURIComponent(profile.display_name || profile.username || (profile.name ? profile.name : 'User'))}`);
                        }}
                      >
                        <MessageSquare className="h-4 w-4 mr-1" />
                        <span>MESSAGE</span>
                      </motion.button>
                      
                      <motion.button 
                        className="subscribe-button cosmic-button"
                        whileHover={{ scale: 1.05, boxShadow: '0 0 8px rgba(236, 72, 153, 0.6)' }}
                        whileTap={{ scale: 0.95 }}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          console.log('Subscribe button clicked - navigating to subscription page');
                          navigate(`/subscribe/${profile.username}`);
                        }}
                      >
                        <Star className={`h-4 w-4 mr-1 ${isSubscribed ? 'fill-current' : ''}`} />
                        <span>{isSubscribed ? 'SUBSCRIBED' : 'SUBSCRIBE'}</span>
                      </motion.button>
                    </div>
                  )}
                    
                  {isOwnProfile && (
                    <div className="profile-buttons flex gap-3 flex-wrap">
                      <motion.button 
                        className="edit-profile-button"
                        onClick={() => navigate('/edit-profile')}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <Settings className="h-4 w-4 mr-1" />
                        <span>EDIT PROFILE</span>
                      </motion.button>
                      
                      {/* Stripe Connect Button has been moved to the Stream Setup page */}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
          
          {/* Enhanced arcade control panel tabs */}
          <div className="arcade-control-panel">
            <div className="arcade-tabs">
              <motion.button 
                className={`arcade-tab ${localActiveTab === 'trophies' ? 'active' : ''}`}
                onClick={() => handleTabChange('trophies')}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Trophy className="tab-icon yellow" />
                <span>TROPHIES</span>
              </motion.button>
              
              <motion.button 
                className={`arcade-tab ${localActiveTab === 'clipts' ? 'active' : ''}`}
                onClick={() => handleTabChange('clipts')}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <VideoIcon className="tab-icon cyan" />
                <span>CLIPTS</span>
              </motion.button>
              
              <motion.button 
                className={`arcade-tab ${localActiveTab === 'streams' ? 'active' : ''}`}
                onClick={() => handleTabChange('streams')}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <VideoIcon className="tab-icon green" />
                <span>STREAMS</span>
              </motion.button>
              
              <motion.button 
                className="arcade-tab boost-tab"
                onClick={() => {
                  // Track analytics for boost button click
                  console.log('Boost button clicked');
                  // Call the parent component's onBoostClick handler
                  onBoostClick();
                }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                initial={{ scale: 0.9, opacity: 0.9 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ 
                  type: 'spring',
                  stiffness: 400,
                  damping: 17
                }}
              >
                <Rocket className="tab-icon orange" />
                <span>BOOSTS</span>
              </motion.button>
              
              {/* Squad Chat Button */}
              <motion.button 
                className="arcade-tab squad-chat-tab"
                onClick={() => {
                  // Allow access if it's the user's own profile OR if they're subscribed to this creator
                  if (isOwnProfile || profile.is_subscribed) {
                    console.log('Opening Squad Chat');
                    // Navigate to squad chat or open squad chat modal
                    navigate(`/squad-chat/${profile.id}`);
                  } else {
                    // Show subscription modal only for other users' squad chats
                    toast.info('Subscribe to unlock Squad Chat!', {
                      description: 'Join the squad for $4.99/month to access exclusive chat.',
                      action: {
                        label: 'Subscribe',
                        onClick: () => navigate(`/subscribe/${profile.id}`)
                      }
                    });
                  }
                }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                initial={{ scale: 0.9, opacity: 0.9 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ 
                  type: 'spring',
                  stiffness: 400,
                  damping: 17
                }}
              >
                <MessageSquare className="tab-icon purple" />
                <span>SQUAD CHAT</span>
                {!isOwnProfile && !profile.is_subscribed && (
                  <div className="locked-indicator">
                    <Star className="star-icon" size={12} />
                  </div>
                )}
              </motion.button>
            </div>
          </div>
          
          {/* Content area with dynamic content based on active tab */}
          <div className="arcade-content">
            <AnimatePresence mode="wait">
              {localActiveTab === 'trophies' ? (
                <motion.div
                  key="trophies"
                  className="content-section"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="section-header">
                    <div className="section-title-container">
                      <Trophy className="section-icon yellow" />
                      <h2 className="section-title glow-text">ACHIEVEMENTS</h2>
                    </div>
                  </div>
                  
                  <div className="achievements-grid">
                    {achievements.map((achievement, index) => (
                      <motion.div 
                        key={achievement.id}
                        className="achievement-card"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 * index }}
                        whileHover={{ scale: 1.05, boxShadow: '0 0 15px rgba(255, 215, 0, 0.6)' }}
                      >
                        <div className="achievement-icon">
                          {achievement.icon === 'Trophy' && <Trophy className="icon-trophy" />}
                          {achievement.icon === 'VideoIcon' && <VideoIcon className="icon-video" />}
                          {achievement.icon === 'UserPlus' && <UserPlus className="icon-user-plus" />}
                          {achievement.icon === 'Heart' && <Heart className="icon-heart" />}
                          {achievement.icon === 'Bookmark' && <Bookmark className="icon-bookmark" />}
                        </div>
                        <div className="achievement-details">
                          <h3 className="achievement-name">{achievement.name}</h3>
                          <p className="achievement-description">{achievement.description}</p>
                          <div className="achievement-points">
                            <Star className="points-icon" />
                            <span>{achievement.points} PTS</span>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              ) : localActiveTab === 'clipts' ? (
                <motion.div
                  key="clipts"
                  className="content-section"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="section-header">
                    <div className="section-title-container">
                      <VideoIcon className="section-icon cyan" />
                      <h2 className="section-title glow-text">GAME CLIPTS</h2>
                    </div>
                  </div>
                  
                  <div className="empty-state">
                    <VideoIcon size={60} className="empty-icon" />
                    <h3>Ready for Your Gaming Moments</h3>
                    <p>Upload your best gaming highlights and share them with the universe!</p>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="streams"
                  className="content-section"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="section-header">
                    <div className="section-title-container">
                      <VideoIcon className="section-icon green" />
                      <h2 className="section-title glow-text">PREVIOUS STREAMS</h2>
                    </div>
                  </div>
                  
                  <div className="empty-state">
                    <VideoIcon size={60} className="empty-icon" />
                    <h3>Your Cosmic Streams Await</h3>
                    <p>Start streaming your gameplay to the galaxy and grow your audience!</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
      
      {/* Post Modal */}
      <AnimatePresence>
        {isPostModalOpen && selectedPost && (
          <motion.div 
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closePostModal}
          >
            <motion.div 
              className="cosmic-modal bg-gradient-to-br from-indigo-950 to-purple-900 border-2 border-purple-500/50 rounded-xl p-6 max-w-md w-full mx-4 shadow-xl"
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20, opacity: 0 }}
              transition={{ type: 'spring', damping: 25 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-header">
                <h2 className="modal-title cosmic-title">{selectedPost.title || 'Clipt Post'}</h2>
                <button 
                  className="close-modal-button cosmic-close-button" 
                  onClick={closePostModal}
                >
                  <ArrowLeft size={24} />
                </button>
              </div>
              
              <div className="modal-content">
                <div className="post-content">
                  {/* Video content */}
                  {(selectedPost.video_url || selectedPost.type === 'video') && (
                    <div className="cosmic-video-container">
                      <video 
                        src={selectedPost.video_url} 
                        controls 
                        poster={selectedPost.thumbnail_url}
                        className="post-video"
                      />
                    </div>
                  )}
                  
                  {/* Image content */}
                  {selectedPost.image_url && !selectedPost.video_url && (
                    <div className="image-container">
                      <img 
                        src={selectedPost.image_url} 
                        alt={selectedPost.title || 'Post image'} 
                        className="post-image"
                      />
                    </div>
                  )}
                  
                  {/* Post text */}
                  <div className="post-text cosmic-caption">
                    <p className="caption-text">{selectedPost.content || 'No description provided.'}</p>
                  </div>
                  
                  {/* Upper stats & profile actions */}
                  <div className="arcade-stats">
                    <div className="arcade-stats-item">
                      <div className="stat-label"><Users size={14} className="stat-icon" /> Followers</div>
                      <div className="stat-value">{followersCount.toLocaleString()}</div>
                    </div>
                    <div className="arcade-stats-item">
                      <div className="stat-label"><User size={14} className="stat-icon" /> Following</div>
                      <div className="stat-value">{followingCount.toLocaleString()}</div>
                    </div>
                    <div className="arcade-stats-item">
                      <div className="stat-label"><Trophy size={14} className="stat-icon" /> Trophies</div>
                      <div className="stat-value">{(achievements || []).length}</div>
                    </div>
                    
                    {!isOwnProfile && (
                      <div className="profile-actions">
                        <button 
                          className="cosmic-button follow-button"
                          onClick={() => toggleFollow()}
                        >
                          {isFollowing ? (
                            <><Check className="button-icon" /> Following</>
                          ) : (
                            <><UserPlus className="button-icon" /> Follow</>
                          )}
                        </button>
                        <button 
                          className="cosmic-button boost-button"
                          onClick={() => onBoostClick()}
                        >
                          <Rocket className="button-icon" /> Boost
                        </button>
                        <button 
                          className="cosmic-button squad-chat-button"
                          onClick={() => onSquadChatClick()}
                        >
                          <MessageSquare className="button-icon" /> Squad Chat
                        </button>
                      </div>
                    )}
                  </div>
                  
                  {/* Post stats */}
                  <div className="post-stats">
                    <div className="stat">
                      <ThumbsUp className="stat-icon" />
                      <span>{selectedPost.likes_count || 0} Likes</span>
                    </div>
                    <div className="stat">
                      <MessageSquare className="stat-icon" />
                      <span>{selectedPost.comments_count || 0} Comments</span>
                    </div>
                    <div className="stat">
                      <Eye className="stat-icon" />
                      <span>{selectedPost.views_count || 0} Views</span>
                    </div>
                  </div>
                  
                  {/* Comments section */}
                  {showComments && (
                    <div className="comments-section">
                      <h3 className="comments-title">Comments</h3>
                      
                      {selectedPost.comments && selectedPost.comments.length > 0 ? (
                        selectedPost.comments.map((comment: any) => (
                          <motion.div 
                            key={comment.id}
                            className="comment-item"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                          >
                            <img 
                              src={comment.user.avatar_url || 'https://api.dicebear.com/7.x/pixel-art/svg?seed=default'} 
                              alt="User" 
                              className="comment-avatar"
                            />
                            <div className="comment-meta">
                              <span className="comment-username">{comment.user.display_name || comment.user.username || 'Gamer'}</span>
                              <span className="comment-time">
                                {new Date(comment.created_at).toLocaleDateString('en-US', { 
                                  month: 'short', 
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </span>
                              <p className="comment-content">{comment.content}</p>
                            </div>
                          </motion.div>
                        ))
                      ) : (
                        <div className="no-comments">
                          <p>No comments yet. Be the first to comment!</p>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* Comment input area */}
                  {showCommentInput && (
                    <div className="comment-input-container">
                      <textarea
                        id="comment-input"
                        className="comment-input"
                        placeholder="Add your comment..."
                        value={commentText}
                        onChange={(e) => setCommentText(e.target.value)}
                        rows={3}
                      />
                      <div className="comment-actions">
                        <button 
                          className="cancel-comment-button"
                          onClick={() => {
                            setShowCommentInput(false);
                            setCommentText('');
                          }}
                        >
                          Cancel
                        </button>
                        <button 
                          className="submit-comment-button"
                          onClick={() => handleCommentSubmit(selectedPost.id)}
                          disabled={!commentText.trim()}
                        >
                          Post Comment
                        </button>
                      </div>
                    </div>
                  )}
                  
                  <div className="post-actions cosmic-button-container" onClick={(e) => e.stopPropagation()}>
                    <button 
                      className={`cosmic-action-button like-button ${likedPosts.includes(selectedPost.id) ? 'active' : ''}`}
                      onClick={(e) => { 
                        e.stopPropagation(); 
                        e.preventDefault();
                        handleLikePost(selectedPost.id); 
                        toast.success('Post liked!'); 
                      }}
                      aria-label="Like post"
                    >
                      <ThumbsUp className="cosmic-action-icon" />
                      <span>Like</span>
                    </button>
                    <button 
                      className={`cosmic-action-button comment-button ${showCommentInput ? 'active' : ''}`}
                      onClick={(e) => { 
                        e.stopPropagation(); 
                        e.preventDefault();
                        handleCommentToggle(); 
                      }}
                      aria-label="Comment on post"
                    >
                      <MessageSquare className="cosmic-action-icon" />
                      <span>Comment</span>
                    </button>
                    <button 
                      className="cosmic-action-button share-button"
                      onClick={(e) => { 
                        e.stopPropagation(); 
                        e.preventDefault();
                        handleSharePost(selectedPost.id, selectedPost.title || 'Clipt Post'); 
                      }}
                      aria-label="Share post"
                    >
                      <Share2 className="cosmic-action-icon" />
                      <span>Share</span>
                    </button>
                    {(selectedPost.video_url || selectedPost.type === 'video') && !selectedPost.ranked_for_top10 && (
                      <button 
                        className="cosmic-action-button rank-button"
                        onClick={(e) => { 
                          e.stopPropagation(); 
                          e.preventDefault();
                          handleRankForTop10(selectedPost.id); 
                          toast.success('Post ranked for Top 10!'); 
                        }}
                        aria-label="Rank post for Top 10"
                      >
                        <Trophy className="cosmic-action-icon" />
                        <span>Rank</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* We're using the renderSubscriptionModal function instead of this duplicate */}
      
      {/* Stream modal section - properly restructured */}
      <AnimatePresence>
        {selectedStream && (
          <motion.div 
            className="stream-modal-backdrop cosmic-modal-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedStream(null)}
          >
            <motion.div 
              className="stream-modal-content cosmic-modal-content"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <button 
                className="close-modal-button cosmic-close-button" 
                onClick={() => setSelectedStream(null)}
              >
                <ArrowLeft size={24} />
                <span>Back</span>
              </button>
              
              <div className="stream-content-wrapper cosmic-stream-container">
                {/* Stream content section */}
                <div className="post-media stream-media cosmic-media-container">
                  {selectedStream.video_url ? (
                    <div className="video-container stream-video-container cosmic-video-container">
                      <video 
                        controls 
                        className="stream-video cosmic-video"
                        src={selectedStream.video_url}
                        poster={selectedStream.thumbnail_url || 'https://i.imgur.com/ZN5EvMj.jpg'}
                        autoPlay
                        controlsList="nodownload"
                        playsInline
                      >
                        <source src={selectedStream.video_url} type="video/mp4" />
                        Your browser does not support the video tag.
                      </video>
                      
                      {/* Token earning overlay */}
                      <div className="token-earning-overlay">
                        <div className="token-counter">
                          <Coin className="token-icon pulse-glow" />
                          <span className="earned-tokens">+45</span>
                        </div>
                      </div>
                    </div>
                  ) : selectedStream.thumbnail_url ? (
                    <img 
                      src={selectedStream.thumbnail_url} 
                      alt={selectedStream.title || 'Stream thumbnail'} 
                      className="stream-thumbnail cosmic-glow-image" 
                    />
                  ) : (
                    <div className="video-placeholder stream-placeholder cosmic-video-placeholder">
                      <VideoIcon size={64} className="cosmic-video-icon" />
                      <span>Loading Stream Preview...</span>
                    </div>
                  )}
                  
                  {/* Stream duration badge */}
                  <div className="stream-duration-badge">
                    <Clock className="duration-icon pulse-glow" />
                    <span>{selectedStream.duration || '2:45:30'}</span>
                  </div>
                </div>
                
                {/* Stream description */}
                <div className="post-text stream-description cosmic-description">
                  <p>{selectedStream?.description || 'Live stream gameplay of Elden Ring with cosmic commentary!'}</p>
                </div>
                
                {/* Stream stats */}
                <div className="stream-stats cosmic-stats">
                </div>
                

                
                {/* Comments section */}
                {showComments && (
                  <div className="comments-section cosmic-comments">
                    <h3 className="comments-title">Comments</h3>
                    
                    {selectedStream?.comments && selectedStream?.comments.length > 0 ? (
                      selectedStream?.comments?.map((comment: any) => (
                        <motion.div 
                          key={comment.id}
                          className="comment-item cosmic-comment"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                        >
                          <img 
                            src={comment.user.avatar_url || 'https://api.dicebear.com/7.x/pixel-art/svg?seed=default'} 
                            alt="User" 
                            className="comment-avatar"
                          />
                          <div className="comment-meta">
                            <span className="comment-username">{comment.user.display_name || comment.user.username || 'Gamer'}</span>
                            <span className="comment-time">
                              {new Date(comment.created_at).toLocaleDateString('en-US', { 
                                month: 'short', 
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                            <p className="comment-content">{comment.content}</p>
                          </div>
                        </motion.div>
                      ))
                    ) : (
                      <div className="no-comments">
                        <p>No comments yet. Be the first to comment on this stream!</p>
                      </div>
                    )}
                  </div>
                )}
                
                {/* Comment input area */}
                {showCommentInput && (
                  <div className="comment-input-container">
                    <textarea
                      id="comment-input"
                      className="comment-input"
                      placeholder="Add your comment to this stream..."
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      rows={3}
                    />
                    <div className="comment-actions">
                      <button 
                        className="cancel-comment-button"
                        onClick={() => {
                          setShowCommentInput(false);
                          setCommentText('');
                        }}
                      >
                        Cancel
                      </button>
                      <button 
                        className="submit-comment-button"
                        onClick={() => handleCommentSubmit(selectedStream.id)}
                        disabled={!commentText.trim()}
                      >
                        Post Comment
                      </button>
                    </div>
                  </div>
                )}
                
                <div className="post-actions cosmic-button-container">
                  <button 
                    className={`cosmic-action-button like-button ${likedStreams.includes(selectedStream.id) ? 'active' : ''}`}
                    onClick={(e) => { e.stopPropagation(); handleLikeStream(selectedStream.id); }}
                  >
                    <ThumbsUp className="cosmic-action-icon" />
                    <span>Like</span>
                  </button>
                  <button 
                    className={`cosmic-action-button comment-button ${showCommentInput ? 'active' : ''}`}
                    onClick={(e) => { e.stopPropagation(); handleCommentToggle(); }}
                  >
                    <MessageSquare className="cosmic-action-icon" />
                    <span>Comment</span>
                  </button>
                  <button
                    className="cosmic-action-button share-button"
                    onClick={(e) => { 
                      e.stopPropagation(); 
                      if (selectedStream && selectedStream.id) {
                        // Safely access the title property with optional chaining
                        const streamTitle = selectedStream?.title || 'Stream';
                        handleShareStream(selectedStream.id, streamTitle); 
                      }
                    }}
                  >
                    <Share2 className="cosmic-action-icon" />
                    <span>Share</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* We've removed the subscription modal since we now use a separate subscription page */}
    </div>
  );
};

export default RetroArcadeProfile;
