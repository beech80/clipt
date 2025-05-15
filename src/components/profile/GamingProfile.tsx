import React from 'react';
import { motion } from 'framer-motion';
import { Gamepad, Medal, Zap, Rocket, Trophy, Heart, Star, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import '../../styles/gaming/profile-gaming.css';

interface GamingProfileProps {
  profile: any;
  tokenBalance: number;
  achievements: any[];
  userPosts: any[];
  savedItems: any[];
  followersCount: number;
  followingCount: number;
  isOwnProfile: boolean;
  activeTab: string;
  onTabChange: (tab: string) => void;
  boostActive?: boolean;
}

const GamingProfile: React.FC<GamingProfileProps> = ({
  profile,
  tokenBalance,
  achievements,
  userPosts,
  savedItems,
  followersCount,
  followingCount,
  isOwnProfile,
  activeTab,
  onTabChange,
  boostActive = false
}) => {
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
            <div className="game-clips-grid">
              {userPosts.length > 0 ? (
                userPosts.map((post) => (
                  <motion.div 
                    key={post.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="clip-item"
                  >
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
          )}
          
          {activeTab === 'achievements' && (
            <div className="achievement-container">
              {achievements.length > 0 ? (
                achievements.map((achievement) => (
                  <motion.div 
                    key={achievement.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3 }}
                    className="achievement-item"
                  >
                    <div className="achievement-icon">
                      <Trophy />
                    </div>
                    <div className="achievement-content">
                      <div className="achievement-name">{achievement.name}</div>
                      <div className="achievement-desc">{achievement.description}</div>
                    </div>
                    <div className="achievement-points">+{achievement.points}xp</div>
                  </motion.div>
                ))
              ) : (
                <div className="text-center py-6 text-gray-400">
                  No achievements yet
                </div>
              )}
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
