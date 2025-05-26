import React, { useState, useEffect } from 'react';
import { Trophy, Zap, VideoIcon, User, Heart, Bookmark, UserPlus, ArrowLeft, Gamepad, Award, Star, Shield, Music, Rocket, Crown, ThumbsUp, MessageSquare, Share2, Eye, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import '@/styles/profile-retro-arcade.css';

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
  onTabChange = () => {}
}) => {
  const navigate = useNavigate();
  const [localActiveTab, setLocalActiveTab] = useState<'trophies' | 'clipts' | 'saved'>(activeTab as any || 'trophies');

  useEffect(() => {
    if (activeTab) {
      setLocalActiveTab(activeTab as any);
    }
  }, [activeTab]);

  const handleTabChange = (tab: 'trophies' | 'clipts' | 'saved') => {
    setLocalActiveTab(tab);
    if (onTabChange) {
      onTabChange(tab);
    }
  };

  const handleBack = () => {
    navigate(-1);
  };

  return (
    <div className="profile-retro-arcade">
      {/* Enhanced screen effects */}
      <div className="retro-screen-overlay"></div>
      <div className="retro-scanlines"></div>
      <div className="retro-vignette"></div>
      <div className="retro-noise"></div>
      
      {/* Arcade cabinet frame */}
      <div className="arcade-cabinet-frame">
        <div className="arcade-cabinet-top"></div>
        <div className="arcade-cabinet-screen">
          
          {/* Arcade marquee header */}
          <div className="arcade-marquee">
            <div className="marquee-light"></div>
            <div className="marquee-light"></div>
            <div className="marquee-light"></div>
            <h1 className="arcade-title glow-text">PLAYER PROFILE</h1>
            <div className="marquee-light"></div>
            <div className="marquee-light"></div>
            <div className="marquee-light"></div>
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
                    <div className="avatar-glow"></div>
                    <img 
                      src={profile.avatar_url || 'https://api.dicebear.com/7.x/pixel-art/svg?seed=default'} 
                      alt="Profile" 
                      className="player-avatar"
                    />
                  </div>
                  <div className="player-level">
                    <span>LVL</span>
                    <div className="level-number">{profile.level || 99}</div>
                  </div>
                </div>
                
                <div className="player-info">
                  <h2 className="player-name glow-text">{profile.display_name || 'PLAYER ONE'}</h2>
                  <div className="player-username">@{profile.username || 'player1'}</div>
                  <div className="player-bio">{profile.bio || 'Gaming enthusiast and clip creator'}</div>
                  
                  <div className="horizontal-stats">
                    <div className="player-stat">
                      <Trophy className="stat-icon trophy" />
                      <div className="stat-value">{achievements.length}</div>
                      <div className="stat-label">TROPHIES</div>
                    </div>
                    <div className="player-stat">
                      <VideoIcon className="stat-icon clip" />
                      <div className="stat-value">{posts.length}</div>
                      <div className="stat-label">CLIPTS</div>
                    </div>
                    <div className="player-stat">
                      <User className="stat-icon followers" />
                      <div className="stat-value">{followersCount}</div>
                      <div className="stat-label">FOLLOWERS</div>
                    </div>
                    <div className="player-stat">
                      <Star className="stat-icon rank" />
                      <div className="stat-value">{followingCount}</div>
                      <div className="stat-label">FOLLOWING</div>
                    </div>
                  </div>
                  
                  <div className="profile-buttons">
                    {isOwnProfile && (
                      <motion.button 
                        className="edit-profile-button"
                        onClick={() => navigate('/edit-profile')}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <Settings className="h-4 w-4 mr-1" />
                        <span>EDIT PROFILE</span>
                      </motion.button>
                    )}
                    
                    {!isOwnProfile && (
                      <button className="follow-button">
                        <UserPlus className="h-4 w-4 mr-1" />
                        <span>FOLLOW</span>
                      </button>
                    )}
                    
                    {!isOwnProfile && (
                      <motion.button 
                        className="message-button"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => {
                          const chatId = `chat-direct-${Date.now()}`;
                          localStorage.setItem('directMessageUser', JSON.stringify({
                            id: profile.id,
                            username: profile.username || 'User',
                            avatar_url: profile.avatar_url,
                            display_name: profile.display_name || profile.username
                          }));
                          navigate('/messages');
                        }}
                      >
                        <MessageSquare className="h-4 w-4 mr-1" />
                        <span>MESSAGE</span>
                      </motion.button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
          
          {/* Enhanced arcade control panel tabs */}
          <div className="arcade-control-panel">
            <div className="control-panel-decoration left"></div>
            <div className="arcade-tabs">
              <motion.button 
                className={`arcade-tab ${localActiveTab === 'trophies' ? 'active' : ''}`}
                onClick={() => handleTabChange('trophies')}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Trophy className="tab-icon yellow" />
                <span>TROPHIES</span>
                {localActiveTab === 'trophies' && <div className="tab-active-indicator"></div>}
              </motion.button>
              
              <motion.button 
                className={`arcade-tab ${localActiveTab === 'clipts' ? 'active' : ''}`}
                onClick={() => handleTabChange('clipts')}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <VideoIcon className="tab-icon cyan" />
                <span>CLIPTS</span>
                {localActiveTab === 'clipts' && <div className="tab-active-indicator"></div>}
              </motion.button>
              
              <motion.button 
                className={`arcade-tab ${localActiveTab === 'saved' ? 'active' : ''}`}
                onClick={() => handleTabChange('saved')}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Bookmark className="tab-icon green" />
                <span>SAVED</span>
                {localActiveTab === 'saved' && <div className="tab-active-indicator"></div>}
              </motion.button>
            </div>
            <div className="control-panel-decoration right"></div>
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
                    <div className="section-subtitle">PLAYER TROPHIES AND BADGES</div>
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
                    <div className="section-subtitle">CAPTURED GAMING MOMENTS</div>
                  </div>
                  
                  {posts && posts.length > 0 ? (
                    <div className="clipts-grid">
                      {posts.map((post, index) => (
                        <motion.div 
                          key={post.id}
                          className="clipt-card"
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.1 * index }}
                          whileHover={{ scale: 1.03, boxShadow: '0 0 15px rgba(0, 195, 255, 0.6)' }}
                        >
                          <div className="clipt-thumbnail">
                            <img src={post.image_url || 'https://placehold.co/600x400/121212/00C3FF?text=Game+Clipt'} alt="Clipt thumbnail" />
                            <div className="clipt-overlay">
                              <div className="clipt-play-icon">
                                <svg viewBox="0 0 24 24" width="48" height="48" stroke="currentColor" strokeWidth="2" fill="none">
                                  <polygon points="5 3 19 12 5 21 5 3" fill="white" />
                                </svg>
                              </div>
                            </div>
                          </div>
                          <div className="clipt-details">
                            <h3 className="clipt-title">{post.title}</h3>
                            <div className="clipt-meta">
                              <div className="clipt-views">
                                <Eye className="view-icon" />
                                <span>{post.views_count || Math.floor(Math.random() * 1000) + 100}</span>
                              </div>
                              <div className="clipt-likes">
                                <ThumbsUp className="like-icon" />
                                <span>{post.likes_count || 0}</span>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <motion.div 
                      className="empty-state"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.2 }}
                    >
                      <VideoIcon className="empty-icon" />
                      <h3 className="empty-title">NO GAME CLIPTS FOUND</h3>
                      <p className="empty-text">Capture and share your best gaming moments!</p>
                      {isOwnProfile && (
                        <motion.button 
                          className="create-button"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <span>UPLOAD GAME CLIPT</span>
                        </motion.button>
                      )}
                    </motion.div>
                  )}
                </motion.div>
              ) : (
                <motion.div
                  key="saved"
                  className="content-section"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="section-header">
                    <div className="section-title-container">
                      <Bookmark className="section-icon green" />
                      <h2 className="section-title glow-text">COLLECTION</h2>
                    </div>
                    <div className="section-subtitle">YOUR SAVED TREASURES</div>
                  </div>
                  
                  {savedItems && savedItems.length > 0 ? (
                    <div className="clipts-grid">
                      {savedItems.map((item, index) => (
                        <motion.div 
                          key={`saved-${index}`}
                          className="saved-clipt-card"
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.1 * index }}
                          whileHover={{ scale: 1.03, boxShadow: '0 0 15px rgba(157, 0, 255, 0.6)' }}
                        >
                          <div className="saved-clipt-thumbnail">
                            <img src={item.thumbnail_url || item.image_url || 'https://placehold.co/600x600/121212/8A2BE2?text=Saved+Clipt'} alt="Clipt thumbnail" style={{ borderRadius: '0.75rem' }} />
                            <div className="clipt-overlay">
                              <div className="clipt-play-icon">
                                <svg viewBox="0 0 24 24" width="48" height="48" stroke="currentColor" strokeWidth="2" fill="none">
                                  <polygon points="5 3 19 12 5 21 5 3" fill="white" />
                                </svg>
                              </div>
                            </div>
                          </div>
                          <div className="saved-clipt-details">
                            <h3 className="saved-clipt-title">{item.title || 'Awesome Gaming Moment'}</h3>
                            <div className="saved-clipt-meta">
                              <div className="saved-clipt-views">
                                <Eye className="view-icon" />
                                <span>{item.views_count || Math.floor(Math.random() * 1000) + 100}</span>
                              </div>
                              <div className="saved-clipt-likes">
                                <Heart className="like-icon" />
                                <span>{item.likes_count || Math.floor(Math.random() * 100) + 10}</span>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <motion.div 
                      className="empty-state"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.2 }}
                    >
                      <Bookmark className="empty-icon" />
                      <h3 className="empty-title">YOUR COLLECTION IS EMPTY</h3>
                      <p className="empty-text">Save clipts from other players to view them here!</p>
                      <motion.button 
                        className="explore-button"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => navigate('/discovery')}
                      >
                        <span>EXPLORE CONTENT</span>
                      </motion.button>
                    </motion.div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
            
            {/* Game screen effects */}
            <div className="screen-glitch"></div>
            <div className="screen-glow"></div>
            <div className="screen-corners">
              <div className="corner top-left"></div>
              <div className="corner top-right"></div>
              <div className="corner bottom-left"></div>
              <div className="corner bottom-right"></div>
            </div>
          </div>
          
          {/* Arcade cabinet bottom */}
          <div className="arcade-cabinet-bottom">
            <div className="cabinet-controls"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RetroArcadeProfile;
