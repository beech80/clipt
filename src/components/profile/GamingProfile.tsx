import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Gamepad, Medal, Zap, Rocket, Trophy, Heart, Star, Users, MessageSquare, Eye, Award, ChevronLeft, ChevronRight, ThumbsUp, Share2, Shield, Clock, User, Crown, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import '../../styles/gaming/profile-gaming.css';

// Cosmic space-themed profile component with full features
function GamingProfile(props) {
  const {
    profile,
    tokenBalance,
    achievements = [],
    userPosts = [],
    savedItems = [],
    followersCount,
    followingCount,
    isOwnProfile,
    activeTab = 'posts',
    onTabChange,
    boostActive = false
  } = props;

  const [localActiveTab, setLocalActiveTab] = useState(activeTab);
  const [showTokenDetails, setShowTokenDetails] = useState(false);
  const navigate = useNavigate();

  // Determine the active achievements by type for filtering
  const handleTabChange = (tab) => {
    setLocalActiveTab(tab);
    if (onTabChange) onTabChange(tab);
  };
  
  // Handle going back to previous page
  const handleBack = () => {
    navigate(-1);
  };

  // Group achievements by type for better organization
  const achievementsByType = {
    trophy: achievements.filter(a => a.type === 'trophy'),
    follower: achievements.filter(a => a.type === 'follower'),
    streaming: achievements.filter(a => a.type === 'streaming'),
    engagement: achievements.filter(a => a.type === 'engagement'),
    sharing: achievements.filter(a => a.type === 'sharing'),
    collab: achievements.filter(a => a.type === 'collab'),
    special: achievements.filter(a => a.type === 'special')
  };

  // Calculate total tokens earned from achievements
  const totalTokensEarned = achievements
    .filter(a => a.progress === 100)
    .reduce((sum, a) => sum + (a.tokens || 0), 0);

  // Return the cosmic space-themed UI
  return (
    <div className="gaming-profile-container">
      {/* Cosmic stars background */}
      <div className="stars-container">
        {Array.from({ length: 150 }).map((_, index) => {
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
              }}
            />
          );
        })}
      </div>
      
      {/* Header with back button */}
      <div className="cosmic-header px-4 py-3 flex items-center">
        <motion.button
          onClick={handleBack}
          className="cosmic-back-button mr-3"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <ChevronLeft className="h-5 w-5" />
        </motion.button>
        <h1 className="text-xl font-bold cosmic-text-glow">Profile</h1>
      </div>
      
      {/* Main profile content with cosmic styling */}
      <div className="cosmic-profile-content max-w-4xl mx-auto px-4 pb-20">
        {/* Profile card with cosmic styling */}
        <motion.div 
          className="profile-card cosmic-card mb-6"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex items-center">
            <div className="avatar-container mr-4">
              <div className="cosmic-avatar-border">
                <img 
                  src={profile?.avatar_url || 'https://placehold.co/200x200/252944/FFFFFF?text=Gamer'} 
                  alt="Profile" 
                  className="cosmic-avatar"
                />
              </div>
              {boostActive && (
                <div className="boost-indicator">
                  <Rocket className="h-4 w-4" />
                </div>
              )}
            </div>
            
            <div className="profile-info">
              <h2 className="username cosmic-text-glow">
                {profile?.display_name || 'Cosmic Gamer'}
              </h2>
              <p className="handle">@{profile?.username || 'cosmiclite'}</p>
              
              <div className="stats-row mt-2">
                <div className="stat">
                  <Users className="h-4 w-4 mr-1" />
                  <span>{followersCount} Followers</span>
                </div>
                <div className="stat">
                  <Trophy className="h-4 w-4 mr-1" />
                  <span>{achievements.length} Achievements</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Token balance card with animation */}
          <motion.div 
            className="token-card mt-4"
            whileHover={{ scale: 1.02 }}
            onClick={() => setShowTokenDetails(!showTokenDetails)}
          >
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <div className="token-icon">
                  <Star className="h-5 w-5" />
                </div>
                <div className="ml-3">
                  <h3 className="font-medium">Clipt Coins</h3>
                  <p className="text-lg font-bold cosmic-text-glow">{tokenBalance}</p>
                </div>
              </div>
              
              <div className="token-actions">
                {isOwnProfile && (
                  <Button 
                    variant="cosmic" 
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate('/tokens');
                    }}
                  >
                    <Zap className="h-4 w-4 mr-1" />
                    <span>Get More</span>
                  </Button>
                )}
              </div>
            </div>
            
            {/* Token details expandable section */}
            <AnimatePresence>
              {showTokenDetails && (
                <motion.div 
                  className="token-details mt-3 pt-3 border-t border-indigo-500/30"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                >
                  <div className="flex justify-between items-center mb-2">
                    <span>Earned from achievements</span>
                    <span className="font-medium">{totalTokensEarned}</span>
                  </div>
                  
                  <div className="boosts-section mt-3">
                    <h4 className="text-sm font-medium mb-2">Available Boosts</h4>
                    <div className="boosts-grid grid grid-cols-2 gap-2">
                      <div className="boost-item p-2 rounded border border-indigo-500/30">
                        <div className="flex items-center">
                          <Rocket className="h-4 w-4 mr-2 text-purple-400" />
                          <span>Squad Blast</span>
                        </div>
                        <div className="text-xs mt-1">40 Tokens</div>
                      </div>
                      <div className="boost-item p-2 rounded border border-indigo-500/30">
                        <div className="flex items-center">
                          <Zap className="h-4 w-4 mr-2 text-blue-400" />
                          <span>Chain Reaction</span>
                        </div>
                        <div className="text-xs mt-1">60 Tokens</div>
                      </div>
                      <div className="boost-item p-2 rounded border border-indigo-500/30">
                        <div className="flex items-center">
                          <Crown className="h-4 w-4 mr-2 text-yellow-400" />
                          <span>I'm the King</span>
                        </div>
                        <div className="text-xs mt-1">80 Tokens</div>
                      </div>
                      <div className="boost-item p-2 rounded border border-indigo-500/30">
                        <div className="flex items-center">
                          <Users className="h-4 w-4 mr-2 text-green-400" />
                          <span>Stream Surge</span>
                        </div>
                        <div className="text-xs mt-1">50 Tokens</div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
          
          {/* Bio section */}
          {profile?.bio && (
            <div className="bio-section mt-4 p-3 rounded-lg bg-indigo-900/20">
              <p>{profile.bio}</p>
            </div>
          )}
          
          {/* Action buttons for own profile */}
          {isOwnProfile && (
            <div className="profile-actions mt-4 flex space-x-2">
              <Button 
                variant="cosmic-outline" 
                size="sm"
                className="flex-1"
                onClick={() => navigate('/profile/edit')}
              >
                <Settings className="h-4 w-4 mr-1" />
                <span>Edit Profile</span>
              </Button>
              <Button 
                variant="cosmic-outline" 
                size="sm"
                className="flex-1"
                onClick={() => navigate('/dashboard')}
              >
                <Gamepad className="h-4 w-4 mr-1" />
                <span>Dashboard</span>
              </Button>
            </div>
          )}
        </motion.div>
        
        {/* Content tabs with cosmic styling */}
        <div className="cosmic-tabs bg-indigo-900/20 border border-indigo-500/30 rounded-lg p-1 mb-6">
          <div className="flex space-x-1">
            <button
              className={`flex-1 py-2 px-4 rounded-md ${
                localActiveTab === 'posts'
                  ? 'bg-indigo-700 text-white'
                  : 'text-indigo-300 hover:bg-indigo-800/40'
              } transition-colors`}
              onClick={() => handleTabChange('posts')}
            >
              <div className="flex items-center justify-center">
                <Gamepad className="h-4 w-4 mr-1" />
                <span>Posts</span>
              </div>
            </button>
            <button
              className={`flex-1 py-2 px-4 rounded-md ${
                localActiveTab === 'achievements'
                  ? 'bg-indigo-700 text-white'
                  : 'text-indigo-300 hover:bg-indigo-800/40'
              } transition-colors`}
              onClick={() => handleTabChange('achievements')}
            >
              <div className="flex items-center justify-center">
                <Trophy className="h-4 w-4 mr-1" />
                <span>Achievements</span>
              </div>
            </button>
            <button
              className={`flex-1 py-2 px-4 rounded-md ${
                localActiveTab === 'saved'
                  ? 'bg-indigo-700 text-white'
                  : 'text-indigo-300 hover:bg-indigo-800/40'
              } transition-colors`}
              onClick={() => handleTabChange('saved')}
            >
              <div className="flex items-center justify-center">
                <Star className="h-4 w-4 mr-1" />
                <span>Saved</span>
              </div>
            </button>
          </div>
        </div>
        
        {/* Tab content with cosmic styling */}
        <AnimatePresence mode="wait">
          <motion.div
            key={localActiveTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="tab-content"
          >
            {/* Posts Tab Content */}
            {localActiveTab === 'posts' && (
              <div className="posts-container">
                {userPosts.length > 0 ? (
                  <div className="posts-grid space-y-4">
                    {userPosts.map((post, index) => (
                      <motion.div
                        key={post.id || `post-${index}`}
                        className="post-card cosmic-card"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        whileHover={{ scale: 1.01 }}
                        onClick={() => navigate(`/post/${post.id}`)}
                      >
                        <div className="post-content">
                          <p className="post-text">{post.content}</p>
                          
                          {post.image_url && (
                            <div className="post-media mt-3 rounded-lg overflow-hidden">
                              <img 
                                src={post.image_url} 
                                alt="Post media" 
                                className="w-full h-auto"
                              />
                            </div>
                          )}
                          
                          {post.video_url && (
                            <div className="post-media mt-3 rounded-lg overflow-hidden relative">
                              <div className="aspect-w-16 aspect-h-9 bg-gray-900">
                                <div className="flex items-center justify-center h-full">
                                  <div className="play-button">
                                    <svg viewBox="0 0 24 24" width="48" height="48" stroke="currentColor" strokeWidth="2" fill="none">
                                      <polygon points="5 3 19 12 5 21 5 3" fill="white" />
                                    </svg>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                        
                        <div className="post-meta mt-3 pt-3 border-t border-indigo-500/20 flex justify-between">
                          <div className="post-date text-xs">
                            {new Date(post.created_at).toLocaleDateString()}
                          </div>
                          <div className="post-stats flex space-x-3">
                            <div className="stat flex items-center">
                              <Heart className="h-3.5 w-3.5 mr-1" />
                              <span>{post.likes_count || 0}</span>
                            </div>
                            <div className="stat flex items-center">
                              <MessageSquare className="h-3.5 w-3.5 mr-1" />
                              <span>{post.comments_count || 0}</span>
                            </div>
                            <div className="stat flex items-center">
                              <Eye className="h-3.5 w-3.5 mr-1" />
                              <span>{post.views_count || 0}</span>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="empty-state cosmic-card flex flex-col items-center justify-center py-8">
                    <Gamepad className="h-12 w-12 mb-4 text-indigo-400" />
                    <h3 className="text-lg font-medium mb-2">No Posts Yet</h3>
                    <p className="text-center text-sm mb-4">
                      Time to share your gaming moments with the universe!
                    </p>
                    {isOwnProfile && (
                      <Button
                        variant="cosmic"
                        onClick={() => navigate('/post/new')}
                      >
                        Create First Post
                      </Button>
                    )}
                  </div>
                )}
              </div>
            )}
            
            {/* Achievements Tab Content */}
            {localActiveTab === 'achievements' && (
              <div className="achievements-container">
                {achievements.length > 0 ? (
                  <div className="space-y-6">
                    {/* Trophy & Weekly Top achievements */}
                    {achievementsByType.trophy.length > 0 && (
                      <div className="achievement-category">
                        <h3 className="category-title flex items-center mb-3">
                          <Trophy className="h-5 w-5 mr-2 text-yellow-400" />
                          <span>Trophy & Weekly Top</span>
                        </h3>
                        <div className="achievement-grid">
                          {achievementsByType.trophy.map((achievement, index) => (
                            <motion.div
                              key={achievement.id || `trophy-${index}`}
                              className="achievement-card cosmic-card"
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: index * 0.05 }}
                            >
                              <div className="achievement-header">
                                <h4>{achievement.name}</h4>
                                {achievement.isNew && <div className="new-badge">NEW</div>}
                              </div>
                              <p className="description">{achievement.description}</p>
                              <div className="progress-bar">
                                <div 
                                  className="progress-fill" 
                                  style={{ width: `${achievement.progress}%` }}
                                ></div>
                              </div>
                              <div className="achievement-footer">
                                <div className="reward">
                                  <Star className="h-4 w-4 mr-1" />
                                  <span>{achievement.tokens} Tokens</span>
                                </div>
                                <div className="progress-text">{achievement.progress}%</div>
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Follower Growth achievements */}
                    {achievementsByType.follower.length > 0 && (
                      <div className="achievement-category">
                        <h3 className="category-title flex items-center mb-3">
                          <Users className="h-5 w-5 mr-2 text-blue-400" />
                          <span>Follower Growth</span>
                        </h3>
                        <div className="achievement-grid">
                          {achievementsByType.follower.map((achievement, index) => (
                            <motion.div
                              key={achievement.id || `follower-${index}`}
                              className="achievement-card cosmic-card"
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: index * 0.05 }}
                            >
                              <div className="achievement-header">
                                <h4>{achievement.name}</h4>
                                {achievement.isNew && <div className="new-badge">NEW</div>}
                              </div>
                              <p className="description">{achievement.description}</p>
                              <div className="progress-bar">
                                <div 
                                  className="progress-fill" 
                                  style={{ width: `${achievement.progress}%` }}
                                ></div>
                              </div>
                              <div className="achievement-footer">
                                <div className="reward">
                                  <Star className="h-4 w-4 mr-1" />
                                  <span>{achievement.tokens} Tokens</span>
                                </div>
                                <div className="progress-text">{achievement.progress}%</div>
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Additional achievement categories would be similarly structured */}
                    
                    {/* View All button if there are many achievements */}
                    {achievements.length > 10 && (
                      <div className="text-center mt-4">
                        <Button
                          variant="cosmic-outline"
                          onClick={() => navigate('/achievements')}
                        >
                          View All Achievements
                        </Button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="empty-state cosmic-card flex flex-col items-center justify-center py-8">
                    <Trophy className="h-12 w-12 mb-4 text-indigo-400" />
                    <h3 className="text-lg font-medium mb-2">No Achievements Yet</h3>
                    <p className="text-center text-sm mb-4">
                      Start interacting with the community to unlock achievements!
                    </p>
                  </div>
                )}
              </div>
            )}
            
            {/* Saved Tab Content */}
            {localActiveTab === 'saved' && (
              <div className="saved-container">
                {savedItems.length > 0 ? (
                  <div className="saved-grid space-y-4">
                    {savedItems.map((item, index) => (
                      <motion.div
                        key={item.id || `saved-${index}`}
                        className="saved-card cosmic-card"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        whileHover={{ scale: 1.01 }}
                        onClick={() => navigate(`/post/${item.id}`)}
                      >
                        <div className="flex">
                          <div className="saved-thumbnail mr-3">
                            <div className="aspect-square w-16 h-16 rounded-md overflow-hidden">
                              <img 
                                src={item.thumbnail_url || item.image_url || 'https://placehold.co/200x200/252944/FFFFFF?text=Saved'} 
                                alt="Saved item" 
                                className="w-full h-full object-cover"
                              />
                            </div>
                          </div>
                          <div className="saved-details flex-1">
                            <h4 className="text-sm font-medium truncate">{item.title || item.content}</h4>
                            <div className="saved-meta text-xs mt-1 flex items-center">
                              <div className="mr-3">{item.user_id?.username || 'user'}</div>
                              <div className="flex items-center">
                                <Eye className="h-3 w-3 mr-1" />
                                <span>{item.views_count || 0}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="empty-state cosmic-card flex flex-col items-center justify-center py-8">
                    <Star className="h-12 w-12 mb-4 text-indigo-400" />
                    <h3 className="text-lg font-medium mb-2">No Saved Items</h3>
                    <p className="text-center text-sm mb-4">
                      Save posts and clips to view them later!
                    </p>
                    <Button
                      variant="cosmic"
                      onClick={() => navigate('/discovery')}
                    >
                      Explore Content
                    </Button>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

export default GamingProfile;
