import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUserPlus, faUserCheck } from '@fortawesome/free-solid-svg-icons';
import { toast } from "@/components/ui/use-toast";
import '../styles/cosmic-button-animations.css';

interface FollowButtonProps {
  streamer: any;
  isInitiallyFollowing?: boolean;
  buttonSize?: 'sm' | 'md' | 'lg';
  showText?: boolean;
}

const FollowButton: React.FC<FollowButtonProps> = ({ 
  streamer, 
  isInitiallyFollowing = false,
  buttonSize = 'md',
  showText = false
}) => {
  const [isFollowing, setIsFollowing] = useState(isInitiallyFollowing);
  
  // Calculate size based on buttonSize prop
  const getSizeStyles = () => {
    switch(buttonSize) {
      case 'sm': 
        return { width: '35px', height: '35px', fontSize: '8px' };
      case 'lg': 
        return { width: '55px', height: '55px', fontSize: '12px' };
      case 'md':
      default:
        return { width: '45px', height: '45px', fontSize: '10px' };
    }
  };
  
  const { width, height, fontSize } = getSizeStyles();
  
  const handleFollow = () => {
    setIsFollowing(!isFollowing);
    
    // Show toast notification
    toast({
      title: isFollowing ? "Unfollowed" : "Followed",
      description: isFollowing 
        ? `You have unfollowed ${streamer?.username || 'this streamer'}` 
        : `You are now following ${streamer?.username || 'this streamer'}`,
      duration: 2000,
    });
    
    // Here you would normally update the follow status in a database
    console.log(`${isFollowing ? 'Unfollowing' : 'Following'} streamer:`, streamer?.id);
  };
  
  return (
    <button
      className={`nav-button follow-button cosmic-pulse ${isFollowing ? 'active' : ''}`}
      onClick={handleFollow}
      style={{ 
        backgroundColor: 'rgba(255, 85, 0, 0.3)',
        border: '1px solid rgba(255, 85, 0, 0.4)',
        borderRadius: '50%',
        width,
        height,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: showText ? 'column' : 'row',
        gap: showText ? '3px' : '0',
        color: '#FF5500',
        transition: 'transform 0.2s, background-color 0.2s',
        position: 'relative'
      }}
      title={isFollowing ? "Unfollow this streamer" : "Follow this streamer"}
    >
      <FontAwesomeIcon 
        icon={isFollowing ? faUserCheck : faUserPlus}
        style={{ 
          color: '#FF5500',
          filter: 'drop-shadow(0 0 3px rgba(255, 85, 0, 0.8))'
        }}
        size="lg"
      />
      
      {showText && (
        <span style={{
          fontSize,
          color: '#FF8C00',
          fontWeight: 'bold',
          textShadow: '0 0 3px rgba(0, 0, 0, 0.7)',
          whiteSpace: 'nowrap',
          opacity: isFollowing ? 1 : 0.7,
          marginTop: '2px'
        }}>
          {isFollowing ? "Following" : "Follow"}
        </span>
      )}
    </button>
  );
};

export default FollowButton;
