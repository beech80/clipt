import React, { useState, useEffect } from 'react';
import { Trophy, Zap, VideoIcon, User, Heart, Bookmark, UserPlus, ArrowLeft, Gamepad, Award, Star, Shield, Music, Rocket, Crown, ThumbsUp, MessageSquare, Share2, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import '../../styles/profile-retro-arcade.css';

interface ProfileProps {
  profile?: any;
  posts?: any[];
  achievements?: any[];
  isOwnProfile?: boolean;
  savedItems?: any[];
}

const RetroArcadeProfile: React.FC<ProfileProps> = ({ 
  profile = {}, 
  posts = [], 
  achievements = [],
  isOwnProfile = false,
  savedItems = [] 
}) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'trophies' | 'clipts' | 'saved'>('trophies');
  const [loading, setLoading] = useState(false);

  // Sample data for the profile display
  const sampleAchievements = [
    { id: 1, name: 'FIRST VICTORY', description: 'Win your first game', icon: Trophy, points: 50, date: '05.12.2023' },
    { id: 2, name: 'CONTENT CREATOR', description: 'Post your first clip', icon: VideoIcon, points: 25, date: '06.18.2023' },
    { id: 3, name: 'POPULAR PLAYER', description: 'Reach 10 followers', icon: UserPlus, points: 100, date: '07.03.2023' },
    { id: 4, name: 'LIKE MACHINE', description: 'Get 50 likes on your content', icon: Heart, points: 75, date: '08.22.2023' },
    { id: 5, name: 'COLLECTOR', description: 'Save 20 clips from others', icon: Bookmark, points: 40, date: '09.15.2023' },
  ];
  
  // Empty rankings data (all set to zero as requested)
  const sampleRankings = [
    { rank: 1, points: 0, game: '' },
    { rank: 2, points: 0, game: '' },
    { rank: 3, points: 0, game: '' },
    { rank: 4, points: 0, game: '' },
    { rank: 5, points: 0, game: '' },
  ];

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
          
          {/* Glowing back button */}
          <motion.button 
            onClick={handleBack} 
            className="arcade-back-button"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <ArrowLeft className="h-5 w-5 mr-1" />
            <span>BACK</span>
          </motion.button>
          
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
                  <div className="player-bio">"{profile.bio || 'Level 99 arcade enthusiast. Collector of rare pixels and hunter of high scores. Currently on a quest to become the ultimate gaming legend.'}"</div>
                  
                  <div className="player-stats">
                    <div className="stat-item">
                      <Trophy className="stat-icon gold" />
                      <div className="stat-value">{profile.trophy_count || 42}</div>
                      <div className="stat-label">TROPHIES</div>
                    </div>
                    <div className="stat-item">
                      <User className="stat-icon cyan" />
                      <div className="stat-value">{profile.follower_count || 128}</div>
                      <div className="stat-label">FOLLOWERS</div>
                    </div>
                    <div className="stat-item">
                      <Crown className="stat-icon purple" />
                      <div className="stat-value">#{profile.rank || 5}</div>
                      <div className="stat-label">RANK</div>
                    </div>
                  </div>
                </div>
                
                {!isOwnProfile && (
                  <motion.button 
                    className="follow-button"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <UserPlus className="h-4 w-4" />
                    <span>FOLLOW</span>
                  </motion.button>
                )}
              </div>
            </div>
          </motion.div>
          
          {/* Enhanced arcade control panel tabs */}
          <div className="arcade-control-panel">
            <div className="control-panel-decoration left"></div>
            <div className="arcade-tabs">
              <motion.button 
                className={`arcade-tab ${activeTab === 'trophies' ? 'active' : ''}`}
                onClick={() => setActiveTab('trophies')}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Trophy className="tab-icon gold" />
                <span>TROPHIES</span>
                {activeTab === 'trophies' && <div className="tab-active-indicator"></div>}
              </motion.button>
              <motion.button 
                className={`arcade-tab ${activeTab === 'clipts' ? 'active' : ''}`}
                onClick={() => setActiveTab('clipts')}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <VideoIcon className="tab-icon cyan" />
                <span>CLIPTS</span>
                {activeTab === 'clipts' && <div className="tab-active-indicator"></div>}
              </motion.button>
              <motion.button 
                className={`arcade-tab ${activeTab === 'saved' ? 'active' : ''}`}
                onClick={() => setActiveTab('saved')}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Bookmark className="tab-icon green" />
                <span>SAVED</span>
                {activeTab === 'saved' && <div className="tab-active-indicator"></div>}
              </motion.button>
            </div>
            <div className="control-panel-decoration right"></div>
            <div className="control-panel-joystick"></div>
          </div>
          
          {/* Content area with game screen effect */}
          <div className="game-screen-container">
            <AnimatePresence mode="wait">
              {loading ? (
                <motion.div 
                  key="loading"
                  className="arcade-loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <div className="loading-scanline"></div>
                  <div className="loading-glitch"></div>
                  <div className="loading-text blink">LOADING GAME DATA...</div>
                  <div className="loading-progress">
                    <div className="progress-bar"></div>
                  </div>
                  <div className="loading-press-start">PRESS START</div>
                </motion.div>
              ) : activeTab === 'trophies' ? (
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
                      <Trophy className="section-icon gold" />
                      <h2 className="section-title glow-text">TROPHY CABINET</h2>
                    </div>
                    <div className="section-subtitle">ACHIEVEMENTS EARNED IN BATTLE</div>
                  </div>
                  <div className="trophy-display">
                    {sampleAchievements.map((achievement, index) => (
                      <motion.div 
                        key={achievement.id} 
                        className="trophy-item"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        whileHover={{ 
                          y: -5, 
                          boxShadow: '0 10px 25px rgba(0,0,0,0.6)', 
                          borderColor: 'var(--neon-blue)' 
                        }}
                      >
                        <achievement.icon 
                          className={`trophy-icon trophy-rank-${Math.min(index + 1, 4)}`} 
                          size={60} 
                        />
                        <div className="trophy-name">{achievement.name}</div>
                        <div className="trophy-desc">{achievement.description}</div>
                        <div className="trophy-date">UNLOCKED ON {achievement.date}</div>
                        <div className="trophy-points">
                          <span>{achievement.points}</span>
                          <Trophy className="points-icon" size={12} />
                        </div>
                      </motion.div>
                    ))}
                  </div>
                  
                  {/* Trophy rankings/leaderboard */}
                  <h3 className="arcade-title glow-text mt-10 mb-5">WAITING FOR VOTES</h3>
                  <div className="trophy-ranks">
                    {sampleRankings.map((item, index) => (
                      <motion.div 
                        key={index}
                        className={`rank-item rank-${Math.min(item.rank, 4)}`}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        whileHover={{ scale: 1.05 }}
                      >
                        <div className="rank-number">{item.rank}</div>
                        <Trophy className="rank-trophy" />
                        <div className="rank-info">
                          <div className="rank-game">Waiting for votes</div>
                          <div className="rank-points">
                            {item.points} <Trophy className="mini-trophy" size={12} />
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              ) : activeTab === 'clipts' ? (
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
                      <VideoIcon className="section-icon purple" />
                      <h2 className="section-title glow-text">CLIPTS</h2>
                    </div>
                    <div className="section-subtitle">YOUR GAMING MOMENTS</div>
                  </div>
                  
                  {posts && posts.length > 0 ? (
                    <div className="clips-grid">
                      {posts.slice(0, 6).map((post, index) => (
                        <motion.div 
                          key={post.id || index}
                          className="clip-card"
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.1 }}
                          whileHover={{ scale: 1.05, y: -5 }}
                        >
                          <div className="clip-thumbnail">
                            <img src={post.image_url || 'https://placehold.co/600x400/121212/4169E1?text=Game+Clip'} alt={post.title} />
                            <div className="clip-play-button">
                              <div className="play-icon"></div>
                            </div>
                            <div className="clip-duration">00:{Math.floor(Math.random() * 60) + 10}</div>
                          </div>
                          <div className="clip-info">
                            <h3 className="clip-title">{post.title}</h3>
                            <div className="clip-meta">
                              <div className="clip-views">
                                <Eye className="view-icon" />
                                <span>{Math.floor(Math.random() * 1000) + 100}</span>
                              </div>
                              <div className="clip-likes">
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
                      className="retro-empty-state"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.2 }}
                    >
                      <VideoIcon className="empty-state-icon" size={48} />
                      <h3 className="empty-title">NO GAME CLIPTS FOUND</h3>
                      <p className="empty-text">Capture and share your best plays!</p>
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
                      <h2 className="section-title glow-text">SAVED CLIPTS</h2>
                    </div>
                    <div className="section-subtitle">YOUR FAVORITE GAMING MOMENTS</div>
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
