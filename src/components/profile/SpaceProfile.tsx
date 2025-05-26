import React, { useState, useEffect } from 'react';
import { Trophy, Zap, VideoIcon, User, Heart, Bookmark, UserPlus, ArrowLeft, Gamepad, Award, Star, Shield, Music, Rocket, Crown, ThumbsUp, MessageSquare, Share2, Eye, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import '@/styles/profile-enhanced.css';
import '@/styles/cosmic-effects.css';

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

const SpaceProfile: React.FC<ProfileProps> = ({ 
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
    <div className="cosmic-profile">
      {/* Space theme background effects */}
      <div className="cosmic-background">
        <div className="stars-layer"></div>
        <div className="nebula-layer"></div>
        <div className="cosmic-glow"></div>
      </div>
      
      {/* Main profile container */}
      <div className="cosmic-container">
        <motion.div 
          className="back-button"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          onClick={handleBack}
        >
          <ArrowLeft className="back-icon" />
        </motion.div>
        
        {/* Profile header */}
        <motion.div 
          className="profile-header"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <div className="boost-badge">
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.5, type: 'spring', bounce: 0.5 }}
            >
              <Zap className="boost-icon" />
            </motion.div>
            <span>Boosted</span>
          </div>
          
          <div className="profile-avatar-container">
            <motion.div 
              className="avatar-orbit"
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
            >
              <div className="orbit-particle"></div>
              <div className="orbit-particle delay-1"></div>
              <div className="orbit-particle delay-2"></div>
              <div className="orbit-particle delay-3"></div>
            </motion.div>
            
            <div className="avatar-wrapper">
              <img 
                src={profile.avatar_url || 'https://api.dicebear.com/7.x/bottts/svg?seed=cosmic'} 
                alt="Profile" 
                className="profile-avatar"
              />
            </div>
          </div>
          
          <h1 className="profile-name">
            {profile.display_name || 'Pro Gamer'}
          </h1>
          <div className="profile-username">@{profile.username || 'gamer_pro'}</div>
          
          <div className="profile-bio">
            {profile.bio || 'Gaming and streaming enthusiast'}
          </div>
          
          <div className="stats-grid">
            <div className="stat-item">
              <div className="stat-value">{posts.length || 3}</div>
              <div className="stat-label">Clips</div>
            </div>
            <div className="stat-item">
              <div className="stat-value">{followersCount || 125}</div>
              <div className="stat-label">Followers</div>
            </div>
            <div className="stat-item">
              <div className="stat-value">{followingCount || 84}</div>
              <div className="stat-label">Following</div>
            </div>
          </div>
          
          {isOwnProfile ? (
            <motion.div 
              className="action-buttons"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              <motion.button 
                className="edit-profile-button"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate('/edit-profile')}
              >
                <Settings className="button-icon" />
                Edit Profile
              </motion.button>
            </motion.div>
          ) : (
            <motion.div 
              className="action-buttons"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              <motion.button 
                className="follow-button"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <UserPlus className="button-icon" />
                Follow
              </motion.button>
              <motion.button 
                className="message-button"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate(`/messages/${profile.id}`)}
              >
                <MessageSquare className="button-icon" />
                Message
              </motion.button>
            </motion.div>
          )}
        </motion.div>
        
        {/* Content tabs */}
        <div className="content-tabs">
          <motion.div 
            className={`tab ${localActiveTab === 'clipts' ? 'active' : ''}`}
            whileHover={{ backgroundColor: 'rgba(255, 120, 60, 0.3)' }}
            onClick={() => handleTabChange('clipts')}
          >
            <VideoIcon className="tab-icon" />
            <span>Clips</span>
          </motion.div>
          <motion.div 
            className={`tab ${localActiveTab === 'trophies' ? 'active' : ''}`}
            whileHover={{ backgroundColor: 'rgba(255, 120, 60, 0.3)' }}
            onClick={() => handleTabChange('trophies')}
          >
            <Trophy className="tab-icon" />
            <span>Achievements</span>
          </motion.div>
          <motion.div 
            className={`tab ${localActiveTab === 'saved' ? 'active' : ''}`}
            whileHover={{ backgroundColor: 'rgba(255, 120, 60, 0.3)' }}
            onClick={() => handleTabChange('saved')}
          >
            <Bookmark className="tab-icon" />
            <span>Saved</span>
          </motion.div>
        </div>
        
        {/* Tab content */}
        <div className="tab-content">
          <AnimatePresence mode="wait">
            {localActiveTab === 'trophies' && (
              <motion.div 
                key="trophies"
                className="trophies-content"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <div className="achievements-grid">
                  {achievements.length > 0 ? achievements.map((achievement, index) => (
                    <motion.div 
                      key={`achievement-${index}`}
                      className="achievement-card"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.1 * index }}
                      whileHover={{ scale: 1.05, boxShadow: '0 0 20px rgba(255, 120, 60, 0.4)' }}
                    >
                      <div className="achievement-icon">
                        {achievement.type === 'trophy' ? (
                          <Trophy className="icon" />
                        ) : achievement.type === 'skill' ? (
                          <Zap className="icon" />
                        ) : achievement.type === 'rare' ? (
                          <Crown className="icon" />
                        ) : (
                          <Award className="icon" />
                        )}
                      </div>
                      <div className="achievement-details">
                        <h3 className="achievement-title">{achievement.name}</h3>
                        <p className="achievement-description">{achievement.description}</p>
                        <div className="achievement-progress">
                          <div className="progress-bar">
                            <div 
                              className="progress-fill" 
                              style={{ width: `${achievement.progress || 100}%` }}
                            ></div>
                          </div>
                          <span className="progress-text">{achievement.progress || 100}%</span>
                        </div>
                        <div className="achievement-reward">
                          <Star className="reward-icon" />
                          <span>{achievement.tokens || 50} tokens</span>
                        </div>
                      </div>
                    </motion.div>
                  )) : (
                    <motion.div 
                      className="empty-state"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.2 }}
                    >
                      <Trophy className="empty-icon" />
                      <h3 className="empty-title">No Achievements Yet</h3>
                      <p className="empty-text">Complete challenges to earn cosmic achievements!</p>
                    </motion.div>
                  )}
                </div>
              </motion.div>
            )}
            
            {localActiveTab === 'clipts' && (
              <motion.div 
                key="clipts"
                className="clipts-content"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                {posts.length > 0 ? (
                  <div className="clipts-grid">
                    {posts.map((post, index) => (
                      <motion.div 
                        key={`post-${index}`}
                        className="clipt-card"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 * index }}
                        whileHover={{ scale: 1.03, boxShadow: '0 0 15px rgba(255, 120, 60, 0.5)' }}
                      >
                        <div className="clipt-thumbnail">
                          <img src={post.thumbnail_url || 'https://placehold.co/600x400/123456/ff7800?text=Gaming+Highlight'} alt="Clipt thumbnail" />
                          <div className="clipt-duration">{post.duration || '0:45'}</div>
                          <div className="clipt-overlay">
                            <div className="clipt-play-icon">
                              <svg viewBox="0 0 24 24" width="48" height="48" stroke="currentColor" strokeWidth="2" fill="none">
                                <polygon points="5 3 19 12 5 21 5 3" fill="white" />
                              </svg>
                            </div>
                          </div>
                        </div>
                        <div className="clipt-details">
                          <h3 className="clipt-title">{post.title || 'Epic Gaming Moment'}</h3>
                          <div className="clipt-meta">
                            <div className="clipt-views">
                              <Eye className="view-icon" />
                              <span>{post.views_count || Math.floor(Math.random() * 1000) + 100}</span>
                            </div>
                            <div className="clipt-likes">
                              <Heart className="like-icon" />
                              <span>{post.likes_count || Math.floor(Math.random() * 100) + 10}</span>
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
                    <h3 className="empty-title">No Clips Yet</h3>
                    <p className="empty-text">Share your best gaming moments!</p>
                    {isOwnProfile && (
                      <motion.button 
                        className="create-button"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => navigate('/new-post')}
                      >
                        <span>Create First Clip</span>
                      </motion.button>
                    )}
                  </motion.div>
                )}
              </motion.div>
            )}
            
            {localActiveTab === 'saved' && (
              <motion.div 
                key="saved"
                className="saved-content"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                {savedItems.length > 0 ? (
                  <div className="clipts-grid">
                    {savedItems.map((item, index) => (
                      <motion.div 
                        key={`saved-${index}`}
                        className="saved-clipt-card"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 * index }}
                        whileHover={{ scale: 1.03, boxShadow: '0 0 15px rgba(255, 120, 60, 0.5)' }}
                      >
                        <div className="saved-clipt-thumbnail">
                          <img src={item.thumbnail_url || item.image_url || 'https://placehold.co/600x400/123456/ff7800?text=Saved+Clipt'} alt="Clipt thumbnail" />
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
                    <h3 className="empty-title">No Saved Clips</h3>
                    <p className="empty-text">Save clips from other players to view them here!</p>
                    <motion.button 
                      className="explore-button"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => navigate('/discovery')}
                    >
                      <span>Explore Content</span>
                    </motion.button>
                  </motion.div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default SpaceProfile;
