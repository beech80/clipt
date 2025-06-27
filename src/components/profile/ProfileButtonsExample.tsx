import React from 'react';
import { Settings } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import MaxedTierProgress from '@/components/MaxedTierProgress';

interface ProfileButtonsProps {
  isOwnProfile: boolean;
  userTier: 'free' | 'pro' | 'maxed';
  subscriptionCount: number;
}

const ProfileButtons: React.FC<ProfileButtonsProps> = ({ 
  isOwnProfile, 
  userTier, 
  subscriptionCount 
}) => {
  const navigate = useNavigate();
  
  return (
    <div className="profile-buttons flex gap-3 mt-4">
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
      
      {isOwnProfile && (
        <MaxedTierProgress 
          compact={true}
          userTier={userTier}
          subscriptionCount={subscriptionCount}
          onFindCreators={() => navigate('/discover')}
        />
      )}
    </div>
  );
};

export default ProfileButtons;
