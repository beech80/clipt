import React, { useState, useEffect } from 'react';
import { Trophy, Zap, VideoIcon, User, Heart, Bookmark, UserPlus, ArrowLeft, Gamepad, Award, Star, Shield, Music, Rocket, Crown, ThumbsUp, MessageSquare, Share2, Eye, Settings, Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import '@/styles/profile-retro-arcade.css';
import '@/styles/cosmic-buttons.css';
import '@/styles/post-modal-fix.css'; // Fix for post modal action buttons
import '@/styles/post-action-buttons.css'; // Space-themed post action buttons
import '@/styles/profile-retro-arcade-smaller.css'; // Smaller profile CSS
import '@/styles/post-modal.css'; // Post modal styling

interface ProfileProps {
  profile?: any;
  posts?: any[];
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
  achievements = [],
  isOwnProfile = false,
  savedItems = [],
  followersCount = 0,
  followingCount = 0,
  activeTab = 'trophies',
  onTabChange = () => {},
  onBoostClick = () => {}
}) => {
  const navigate = useNavigate();
  const [localActiveTab, setLocalActiveTab] = useState<'trophies' | 'clipts' | 'streams'>(activeTab as any || 'trophies');
  const [selectedPost, setSelectedPost] = useState<any>(null);
  const [showPostModal, setShowPostModal] = useState(false);
  const [likedPosts, setLikedPosts] = useState<string[]>([]);
  const [showCommentInput, setShowCommentInput] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [showRankingSuccess, setShowRankingSuccess] = useState(false);

  useEffect(() => {
    if (activeTab) {
      setLocalActiveTab(activeTab as any);
    }
  }, [activeTab]);

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
    setShowPostModal(true);
  };
  
  const closePostModal = () => {
    setShowPostModal(false);
    setShowCommentInput(false);
    setShowComments(false);
    setCommentText('');
    // Give time for animation to complete before clearing selected post
    setTimeout(() => setSelectedPost(null), 300);
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
        display_name: profile.display_name || 'You',
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
      navigator.clipboard.writeText(shareUrl)
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
    
    // Update share count in the UI
    if (selectedPost && selectedPost.id === postId) {
      setSelectedPost(prev => ({
        ...prev,
        shares_count: (prev.shares_count || 0) + 1
      }));
    }
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

  return (
    <div className="profile-retro-arcade">
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
                <div className="player-avatar-container">
                  <div className="avatar-frame">
                    <img 
                      src={profile.avatar_url || 'https://api.dicebear.com/7.x/pixel-art/svg?seed=default'} 
                      alt="Profile" 
                      className="player-avatar"
                    />
                  </div>
                  <div className="player-level">
                    <span>LVL</span>
                    <span className="level-number">{profile.level || 1}</span>
                  </div>
                </div>
                
                <div className="player-info">
                  <h2 className="player-name glow-text">{profile.display_name || 'PLAYER ONE'}</h2>
                  
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
                  </div>
                    
                  {!isOwnProfile && (
                    <motion.button 
                      className="message-button"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => {
                        // Directly navigate to messages with userId in URL params
                        navigate(`/messages?userId=${profile.id}&username=${encodeURIComponent(profile.username || 'User')}&displayName=${encodeURIComponent(profile.display_name || profile.username)}`);
                      }}
                    >
                      <MessageSquare className="h-4 w-4 mr-1" />
                      <span>MESSAGE</span>
                    </motion.button>
                  )}
                    
                  {isOwnProfile && (
                    <div className="profile-buttons flex gap-3">
                      <motion.button 
                        className="edit-profile-button"
                        onClick={() => navigate('/edit-profile')}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <Settings className="h-4 w-4 mr-1" />
                        <span>EDIT PROFILE</span>
                      </motion.button>
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
                  // Check if user is subscribed
                  const isSubscribed = profile.is_subscribed;
                  if (isSubscribed) {
                    console.log('Opening Squad Chat');
                    // Navigate to squad chat or open squad chat modal
                    navigate(`/squad-chat/${profile.id}`);
                  } else {
                    // Show subscription modal
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
                {!profile.is_subscribed && (
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
                  
                  {posts && posts.length > 0 ? (
                    <div className="clipts-grid">
                      {posts.map((post) => (
                        <motion.div 
                          key={post.id}
                          className="clipt-card"
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ duration: 0.3 }}
                          whileHover={{ scale: 1.03, boxShadow: '0 0 20px rgba(0, 255, 255, 0.4)' }}
                          onClick={() => handleViewPost(post)}
                        >
                          <div className="clipt-thumbnail">
                            {post.thumbnail_url ? (
                              <img src={post.thumbnail_url} alt={post.title || 'Video thumbnail'} />
                            ) : post.image_url ? (
                              <img src={post.image_url} alt={post.title || 'Post image'} />
                            ) : (
                              <div className="placeholder-thumbnail">
                                <VideoIcon size={40} />
                              </div>
                            )}
                            {(post.video_url || post.type === 'video') && (
                              <div className="video-indicator">
                                <VideoIcon size={20} />
                              </div>
                            )}
                          </div>
                          <div className="clipt-info">
                            <h3 className="clipt-title">{post.title || 'Untitled Clipt'}</h3>
                            <div className="clipt-meta">
                              <div className="clipt-stat">
                                <Eye className="meta-icon" size={14} />
                                <span>{post.views_count || 0}</span>
                              </div>
                              <div className="clipt-stat">
                                <ThumbsUp className="meta-icon" size={14} />
                                <span>{post.likes_count || 0}</span>
                              </div>
                              <div className="clipt-stat">
                                <MessageSquare className="meta-icon" size={14} />
                                <span>{post.comments_count || 0}</span>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <div className="empty-state">
                      <VideoIcon size={60} className="empty-icon" />
                      <h3>No Clipts Yet</h3>
                      <p>This player hasn't uploaded any game clipts yet.</p>
                    </div>
                  )}
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
                      <h2 className="section-title glow-text">LIVE STREAMS</h2>
                    </div>
                  </div>
                  
                  <div className="empty-state">
                    <VideoIcon size={60} className="empty-icon" />
                    <h3>No Live Streams</h3>
                    <p>This player isn't streaming right now.</p>
                    <button className="notify-button">
                      <Bell className="notify-icon" />
                      Get Notified
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
      
      {/* Post Modal with cosmic styling */}
      <AnimatePresence>
        {showPostModal && selectedPost && (
          <motion.div
            className="post-modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closePostModal}
          >
            <motion.div 
              className="post-modal cosmic-container"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: 'spring', damping: 25 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-header">
                <button className="close-button" onClick={closePostModal}>
                  <ArrowLeft />
                </button>
                <h2 className="modal-title">{selectedPost.title || 'Clipt Post'}</h2>
              </div>
              
              <div className="modal-content">
                <div className="post-content">
                  {/* Video content */}
                  {(selectedPost.video_url || selectedPost.type === 'video') && (
                    <div className="video-container">
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
                    <img 
                      src={selectedPost.image_url} 
                      alt={selectedPost.title || 'Post image'} 
                      className="post-image"
                    />
                  )}
                  
                  {/* Post text */}
                  <div className="post-text">
                    <p>{selectedPost.content || 'No description provided.'}</p>
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
                              <span className="comment-username">{comment.user.display_name}</span>
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
                  
                  <div className="post-actions cosmic-button-container">
                    <button 
                      className={`cosmic-action-button like-button ${likedPosts.includes(selectedPost.id) ? 'active' : ''}`}
                      onClick={(e) => { e.stopPropagation(); handleLikePost(selectedPost.id); }}
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
                      onClick={(e) => { e.stopPropagation(); handleSharePost(selectedPost.id, selectedPost.title || 'Clipt Post'); }}
                    >
                      <Share2 className="cosmic-action-icon" />
                      <span>Share</span>
                    </button>
                    {(selectedPost.video_url || selectedPost.type === 'video') && !selectedPost.ranked_for_top10 && (
                      <button 
                        className="cosmic-action-button rank-button"
                        onClick={(e) => { e.stopPropagation(); handleRankForTop10(selectedPost.id); }}
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
      
      {/* Ranking success toast */}
      <AnimatePresence>
        {showRankingSuccess && (
          <motion.div 
            className="ranking-success-toast"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            transition={{ type: 'spring', damping: 20 }}
          >
            <Trophy className="toast-icon" />
            <div className="toast-content">
              <h3>Ranked for Top 10!</h3>
              <p>Your vote has been counted. Thanks for participating!</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default RetroArcadeProfile;
