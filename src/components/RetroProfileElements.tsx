import React from 'react';
import { motion } from 'framer-motion';
import styled, { css, keyframes } from 'styled-components';
import { Trophy, Film, Image, MessageSquare, Bookmark, Settings, UserX } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Define keyframes for animations
const scanlineShift = keyframes`
  0% { background-position: 0 0; }
  100% { background-position: 0 100px; }
`;

const trackingLines = keyframes`
  0% { transform: skewY(-5deg) translateY(-150px); }
  30% { transform: skewY(-5deg) translateY(calc(100% + 150px)); }
  30.01% { transform: skewY(-5deg) translateY(-150px); }
  60% { transform: skewY(-5deg) translateY(calc(100% + 150px)); opacity: 0.08; }
  60.01% { transform: skewY(-5deg) translateY(-150px); opacity: 0; }
  63% { opacity: 0; }
  63.01% { opacity: 0.08; }
  100% { transform: skewY(-5deg) translateY(calc(100% + 150px)); }
`;

const glitchAnimation = keyframes`
  0% { transform: translateX(-2px); }
  25% { transform: translateX(2px); }
  50% { transform: translateX(-2px); }
  75% { transform: translateX(2px); }
  100% { transform: translateX(-2px); }
`;

const gradientBorder = keyframes`
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
`;

const holoShine = keyframes`
  0% { transform: translateX(-50%) translateY(-50%) rotate(30deg); }
  100% { transform: translateX(50%) translateY(50%) rotate(30deg); }
`;

const tabPulse = keyframes`
  0% { opacity: 0.7; box-shadow: 0 0 5px rgba(92, 225, 255, 0.7); }
  50% { opacity: 1; box-shadow: 0 0 15px rgba(92, 225, 255, 1); }
  100% { opacity: 0.7; box-shadow: 0 0 5px rgba(92, 225, 255, 0.7); }
`;

// Enhanced retro styling components for the Profile page
// These will add more pronounced retro effects and animations

// CRT screen wrapper with enhanced scanlines and flicker
export const CrtScreen = styled(motion.div)`
  position: relative;
  background-color: #121212;
  overflow: hidden;
  border-radius: 8px;
  box-shadow: 
    0 0 0 1px rgba(92, 225, 255, 0.3),
    0 0 20px rgba(92, 225, 255, 0.2),
    inset 0 0 20px rgba(0, 0, 0, 0.8);
  
  &::after {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: repeating-linear-gradient(
      0deg,
      rgba(0, 0, 0, 0.3) 0px,
      rgba(0, 0, 0, 0.3) 1px,
      transparent 1px,
      transparent 2px
    );
    pointer-events: none;
    z-index: 5;
    animation: ${css`${scanlineShift} 8s linear infinite`};
  }
  
  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: radial-gradient(
      ellipse at center,
      transparent 60%,
      rgba(0, 0, 0, 0.7) 100%
    );
    pointer-events: none;
    z-index: 3;
  }
`;

// VHS tracking lines effect
export const VhsEffect = styled.div`
  position: relative;
  overflow: hidden;
  
  &::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100px;
    background: rgba(255, 255, 255, 0.08);
    z-index: 4;
    transform: skewY(-5deg) translateY(-150px);
    animation: ${css`${trackingLines} 7s cubic-bezier(0.77, 0, 0.18, 1) infinite`};
  }
`;

// Glitch effect overlay for images
export const GlitchEffect = styled.div`
  position: relative;
  overflow: hidden;
  
  &:hover::before,
  &:hover::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    opacity: 0.8;
  }
  
  &:hover::before {
    background: rgba(0, 255, 255, 0.2);
    left: 2px;
    animation: ${css`${glitchAnimation} 0.3s infinite`};
    z-index: 1;
  }
  
  &:hover::after {
    background: rgba(255, 0, 255, 0.2);
    left: -2px;
    animation: ${css`${glitchAnimation} 0.3s 0.1s infinite reverse`};
    z-index: 1;
  }
`;

// Cyberpunk-style gradient border
export const CyberBorder = styled.div`
  position: relative;
  border: 3px solid transparent;
  border-radius: 8px;
  background-clip: padding-box;
  
  &::before {
    content: '';
    position: absolute;
    top: -3px; 
    right: -3px;
    bottom: -3px;
    left: -3px;
    z-index: -1;
    border-radius: 8px;
    background: linear-gradient(
      45deg, 
      #ff2f92, 
      #5ce1ff, 
      #a55cff, 
      #5ce1ff,
      #ff2f92
    );
    background-size: 400% 400%;
    animation: ${css`${gradientBorder} 6s ease infinite`};
  }
`;

// Holographic card effect
export const HolographicCard = styled(motion.div)`
  position: relative;
  overflow: hidden;
  background: linear-gradient(135deg, #222 0%, #333 100%);
  border-radius: 8px;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 200%;
    height: 200%;
    background: linear-gradient(
      135deg,
      rgba(255, 255, 255, 0) 0%,
      rgba(255, 255, 255, 0.05) 25%, 
      rgba(255, 255, 255, 0) 50%
    );
    transform: translateX(-50%) translateY(-50%) rotate(30deg);
    animation: ${css`${holoShine} 5s linear infinite`};
  }
`;

// Video cassette style for post cards
export const VideoCassette = styled(motion.div)`
  background: #222;
  border-radius: 8px;
  border: 1px solid #444;
  overflow: hidden;
  position: relative;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 8px;
    background: #111;
    border-bottom: 1px solid #333;
  }
  
  &::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    width: 100%;
    height: 20px;
    background: #111;
    border-top: 1px solid #333;
  }
`;

// Retro arcade button with enhanced effects
export const RetroGamingButton = styled(Button)`
  background: #000;
  color: #fff;
  border: none;
  padding: 10px 20px;
  font-family: 'Press Start 2P', monospace;
  font-size: 14px;
  position: relative;
  box-shadow: 
    inset -4px -4px 0 0 #222,
    inset 4px 4px 0 0 #555;
  text-transform: uppercase;
  transition: all 0.2s;
  
  &:hover {
    background: #222;
    box-shadow: 
      inset -4px -4px 0 0 #333,
      inset 4px 4px 0 0 #777;
  }
  
  &:active {
    box-shadow: 
      inset 4px 4px 0 0 #222,
      inset -4px -4px 0 0 #555;
    transform: translateY(2px);
  }
  
  &.active {
    position: relative;
    overflow: hidden;
    
    &::after {
      content: '';
      position: absolute;
      bottom: 0;
      left: 0;
      width: 100%;
      height: 3px;
      background: linear-gradient(90deg, #5ce1ff, #a55cff);
      animation: ${css`${tabPulse} 2s infinite`};
    }
  }
`;

// Custom components for profile elements
export const RetroProfileHeader = ({ profile, stats, isOwnProfile, user, handleFollowToggle }) => {
  return (
    <CyberBorder className="mb-6">
      <div className="profile-header-retro p-4">
        <div className="flex flex-col md:flex-row md:items-center">
          <div className="arcade-avatar glitch-effect mr-4 mb-4 md:mb-0">
            <img
              src={profile.avatar_url || 'https://placehold.co/100/333/FFF?text=User'}
              alt={profile.username || 'User'}
              className="w-20 h-20 rounded-full"
            />
          </div>
          
          <div className="flex-1">
            <h1 className="text-xl md:text-2xl font-bold neon-text">{profile.username || 'User'}</h1>
            <p className="text-gaming-400 mb-2">{profile.bio || 'No bio available'}</p>
            
            {isOwnProfile ? (
              <Button 
                onClick={() => navigate('/settings')} 
                className="retro-gaming-btn"
                size="sm"
              >
                <Settings size={16} className="mr-2" />
                Edit Profile
              </Button>
            ) : user ? (
              <Button
                onClick={handleFollowToggle}
                className="retro-gaming-btn"
                size="sm"
              >
                <UserPlus size={16} className="mr-2" />
                {profile.isFollowing ? 'Unfollow' : 'Follow'}
              </Button>
            ) : null}
          </div>
        </div>
        
        <div className="pixelated-stats flex flex-row justify-center space-x-6 mt-4 text-sm text-center">
          <div className="flex flex-col items-center">
            <span className="font-medium neon-text">Followers</span>
            <span className="text-gaming-300 digital-counter">{stats.followers}</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="font-medium neon-text">Following</span>
            <span className="text-gaming-300 digital-counter">{stats.following}</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="font-medium neon-text">Trophies</span>
            <span className="text-gaming-300 digital-counter">{stats.achievements}</span>
          </div>
        </div>
      </div>
    </CyberBorder>
  );
};

export const RetroTabs = ({ activeTab, setActiveTab }) => {
  return (
    <div className="arcade-header flex justify-center space-x-2 mt-6 mb-6">
      <RetroGamingButton 
        variant={activeTab === 'posts' ? "default" : "outline"}
        onClick={() => setActiveTab('posts')}
        className={activeTab === 'posts' ? 'active' : ''}
      >
        <MessageSquare size={16} className="mr-2" />
        Posts
      </RetroGamingButton>
      
      <RetroGamingButton 
        variant={activeTab === 'clips' ? "default" : "outline"}
        onClick={() => setActiveTab('clips')}
        className={activeTab === 'clips' ? 'active' : ''}
      >
        <Film size={16} className="mr-2" />
        Clips
      </RetroGamingButton>
      
      <RetroGamingButton 
        variant={activeTab === 'trophies' ? "default" : "outline"}
        onClick={() => setActiveTab('trophies')}
        className={activeTab === 'trophies' ? 'active' : ''}
      >
        <Trophy size={16} className="mr-2" />
        Trophies
      </RetroGamingButton>
      
      <RetroGamingButton 
        variant={activeTab === 'bookmarks' ? "default" : "outline"}
        onClick={() => setActiveTab('bookmarks')}
        className={activeTab === 'bookmarks' ? 'active' : ''}
      >
        <Bookmark size={16} className="mr-2" />
        Saved
      </RetroGamingButton>
    </div>
  );
};

export const RetroPostCard = ({ post, onClick }) => {
  return (
    <VideoCassette 
      className="holographic-card"
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
    >
      <div className="post-cabinet-screen crt-flicker p-2">
        {post.video_url ? (
          <div className="relative w-full h-full">
            <div className="absolute inset-0 flex items-center justify-center">
              <Film className="w-10 h-10 text-white opacity-80" />
            </div>
          </div>
        ) : post.image_url ? (
          <GlitchEffect>
            <img 
              src={post.image_url} 
              alt={post.content || 'Post image'} 
              className="w-full h-full object-cover"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = 'https://placehold.co/400x400/121212/303030?text=Image';
              }}
            />
          </GlitchEffect>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center p-3">
            <MessageSquare className="w-8 h-8 mb-2 text-gaming-400" />
            <p className="text-xs text-center text-gaming-300 line-clamp-3">
              {post.title || post.content || 'Text post'}
            </p>
          </div>
        )}
        
        <div className="post-type-indicator">
          {post.video_url ? (
            <Film size={14} />
          ) : post.image_url ? (
            <Image size={14} />
          ) : (
            <MessageSquare size={14} />
          )}
        </div>
        
        <div className="post-title video-cassette-label neon-text-purple">
          {post.title || 'Untitled Post'}
        </div>
      </div>
    </VideoCassette>
  );
};

export const RetroEmptyStateEnhanced = ({ icon: Icon, title, description, actionButton, className = '' }) => {
  return (
    <VhsEffect className={`cyber-border p-8 flex flex-col items-center justify-center text-center h-60 ${className}`}>
      <Icon className="w-12 h-12 text-gaming-400 mb-4" />
      <h3 className="text-xl font-semibold text-gaming-200 mb-2 neon-text">{title}</h3>
      <p className="text-gaming-400">{description}</p>
      {actionButton}
    </VhsEffect>
  );
};

export const RetroNoiseOverlay = () => (
  <div className="video-noise fixed top-0 left-0 w-full h-full pointer-events-none z-[2] opacity-[0.08]"></div>
);

export const RetroFlickerEffect = ({ children }) => (
  <div className="crt-flicker relative">
    {children}
  </div>
);

// Animation keyframes to be added to the css file
export const retroAnimationKeyframes = `
@keyframes scanlineShift {
  0% { background-position: 0 0; }
  100% { background-position: 0 100px; }
}

@keyframes randomFlicker {
  0% { opacity: 0; }
  5% { opacity: 0.1; }
  6% { opacity: 0.05; }
  11% { opacity: 0; }
  50% { opacity: 0; }
  51% { opacity: 0.15; }
  52% { opacity: 0; }
  85% { opacity: 0; }
  86% { opacity: 0.1; }
  87% { opacity: 0; }
  100% { opacity: 0; }
}

@keyframes neonPulse {
  0% { text-shadow: 0 0 5px rgba(92, 225, 255, 0.7), 0 0 10px rgba(92, 225, 255, 0.5); }
  100% { text-shadow: 0 0 10px rgba(92, 225, 255, 0.9), 0 0 20px rgba(92, 225, 255, 0.7), 0 0 30px rgba(92, 225, 255, 0.5); }
}

@keyframes gradientBorder {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}

@keyframes glitchAnimation {
  0% { transform: translateX(-2px); }
  25% { transform: translateX(2px); }
  50% { transform: translateX(-2px); }
  75% { transform: translateX(2px); }
  100% { transform: translateX(-2px); }
}

@keyframes holoShine {
  0% { transform: translateX(-50%) translateY(-50%) rotate(30deg); }
  100% { transform: translateX(50%) translateY(50%) rotate(30deg); }
}

@keyframes trackingLines {
  0% { transform: skewY(-5deg) translateY(-150px); }
  30% { transform: skewY(-5deg) translateY(calc(100% + 150px)); }
  30.01% { transform: skewY(-5deg) translateY(-150px); }
  60% { transform: skewY(-5deg) translateY(calc(100% + 150px)); opacity: 0.08; }
  60.01% { transform: skewY(-5deg) translateY(-150px); opacity: 0; }
  63% { opacity: 0; }
  63.01% { opacity: 0.08; }
  100% { transform: skewY(-5deg) translateY(calc(100% + 150px)); }
}

@keyframes tabPulse {
  0% { opacity: 0.7; box-shadow: 0 0 5px rgba(92, 225, 255, 0.7); }
  50% { opacity: 1; box-shadow: 0 0 15px rgba(92, 225, 255, 1); }
  100% { opacity: 0.7; box-shadow: 0 0 5px rgba(92, 225, 255, 0.7); }
}

@keyframes rotateGradient {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
`;

export default {
  CrtScreen,
  VhsEffect,
  GlitchEffect,
  CyberBorder,
  HolographicCard,
  VideoCassette,
  RetroGamingButton,
  RetroProfileHeader,
  RetroTabs,
  RetroPostCard,
  RetroEmptyStateEnhanced,
  RetroNoiseOverlay,
  RetroFlickerEffect,
  retroAnimationKeyframes
};
