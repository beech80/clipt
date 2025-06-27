import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Gamepad, Medal, Zap, Rocket, Trophy, Heart, Star, Users, MessageSquare, Eye, Award, ChevronLeft, ChevronRight, ThumbsUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import '../../styles/gaming/profile-gaming.css';

// Cosmic space-themed profile component
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
    activeTab,
    onTabChange,
    boostActive = false
  } = props;
  
  // State for follow and subscribe buttons
  const [isFollowing, setIsFollowing] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const navigate = useNavigate();
  
  // Handle follow button click
  const handleFollowClick = () => {
    setIsFollowing(!isFollowing);
    toast.success(isFollowing ? 'Unfollowed user' : 'Now following user');
    // In production: api.toggleFollowUser(profile.id)
  };
  
  // Handle subscribe button click
  const handleSubscribeClick = () => {
    setIsSubscribed(!isSubscribed);
    toast.success(isSubscribed ? 'Unsubscribed from user' : 'Subscribed to user!');
    // In production: api.toggleSubscribeUser(profile.id)
  };

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
      
      {/* Main profile content with cosmic styling */}
      <div className="gaming-profile-frame mx-auto max-w-4xl px-4 py-6 mt-4">
        <div className="profile-header bg-indigo-950/40 border border-indigo-500/30 rounded-xl p-4 mb-6">
          <h1 className="text-2xl font-bold text-white">
            {profile?.username || 'Cosmic Explorer'}'s Profile
          </h1>
          <p className="text-indigo-300">
            {tokenBalance} Cosmic Tokens • {followersCount} Followers • {followingCount} Following
          </p>
          
          {/* Profile buttons - Follow and Subscribe */}
          {!isOwnProfile && (
            <div className="profile-buttons flex gap-2 flex-wrap mt-4">
              <motion.button 
                className="cosmic-button bg-indigo-900/40 border border-purple-500 text-white py-2 px-4 rounded-lg flex items-center"
                whileHover={{ scale: 1.05, boxShadow: '0 0 10px rgba(139, 92, 246, 0.6)' }}
                whileTap={{ scale: 0.95 }}
                onClick={handleFollowClick}
                style={{
                  backgroundColor: isFollowing ? 'rgba(139, 92, 246, 0.3)' : 'rgba(139, 92, 246, 0.2)',
                  boxShadow: isFollowing ? '0 0 10px rgba(147, 51, 234, 0.5)' : 'none'
                }}
              >
                <Heart className={`h-4 w-4 mr-2 ${isFollowing ? 'fill-current' : ''}`} />
                <span>{isFollowing ? 'FOLLOWING' : 'FOLLOW'}</span>
              </motion.button>
              
              <motion.button 
                className="cosmic-button bg-indigo-900/40 border border-pink-500 text-white py-2 px-4 rounded-lg flex items-center"
                whileHover={{ scale: 1.05, boxShadow: '0 0 10px rgba(236, 72, 153, 0.6)' }}
                whileTap={{ scale: 0.95 }}
                onClick={handleSubscribeClick}
                style={{
                  backgroundColor: isSubscribed ? 'rgba(236, 72, 153, 0.3)' : 'rgba(236, 72, 153, 0.2)',
                  boxShadow: isSubscribed ? '0 0 10px rgba(236, 72, 153, 0.5)' : 'none'
                }}
              >
                <Star className={`h-4 w-4 mr-2 ${isSubscribed ? 'fill-current' : ''}`} />
                <span>{isSubscribed ? 'SUBSCRIBED' : 'SUBSCRIBE'}</span>
              </motion.button>
            </div>
          )}
        </div>
        
        {/* Tabs with cosmic styling */}
        <div className="cosmic-tabs bg-indigo-900/20 border border-indigo-600/20 rounded-lg p-1 mb-6">
          <div className="flex space-x-1">
            {['posts', 'achievements', 'saved'].map(tab => (
              <button
                key={tab}
                className={`flex-1 py-2 px-4 rounded-md ${
                  activeTab === tab
                    ? 'bg-indigo-700 text-white'
                    : 'text-indigo-300 hover:bg-indigo-800/40'
                } transition-colors`}
                onClick={() => onTabChange(tab)}
              >
                <span className="capitalize">{tab}</span>
              </button>
            ))}
          </div>
        </div>
        
        {/* Placeholder for tab content */}
        <div className="cosmic-content bg-indigo-950/40 border border-indigo-500/30 rounded-xl p-4">
          <h2 className="text-xl font-bold text-white mb-4">
            {activeTab === 'posts' && 'Your Cosmic Posts'}
            {activeTab === 'achievements' && 'Stellar Achievements'}
            {activeTab === 'saved' && 'Saved Celestial Content'}
          </h2>
          
          {/* Placeholder content */}
          <div className="text-indigo-300">
            This is a temporary placeholder for your cosmic space-themed profile.
            All your advanced features will be restored in the next version.
          </div>
        </div>
      </div>
    </div>
  );
}

export default GamingProfile;
