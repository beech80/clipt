import React from 'react';
import { motion } from 'framer-motion';
import { Users, Trophy, Heart } from 'lucide-react';

interface ProfileStatsProps {
  followers: number;
  following: number;
  achievements: number;
}

const ProfileStatsBar: React.FC<ProfileStatsProps> = ({
  followers,
  following,
  achievements
}) => {
  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: {
        when: "beforeChildren",
        staggerChildren: 0.1
      }
    }
  };
  
  const itemVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: { opacity: 1, scale: 1 }
  };
  
  const pulseVariants = {
    pulse: {
      scale: [1, 1.1, 1],
      filter: ["brightness(1)", "brightness(1.2)", "brightness(1)"],
      transition: { duration: 2, repeat: Infinity }
    }
  };

  return (
    <motion.div 
      className="profile-stats p-2 my-4"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <div className="grid grid-cols-3 gap-2 text-center">
        <motion.div 
          className="flex flex-col items-center p-2"
          variants={itemVariants}
          whileHover={{ scale: 1.05 }}
          animate={followers > 0 ? "pulse" : undefined}
          variants={pulseVariants}
        >
          <div className="flex items-center justify-center mb-1">
            <Users className="h-5 w-5 text-orange-400 mr-1" />
            <span className="text-sm font-medium">Followers</span>
          </div>
          <span className="text-lg font-bold text-white neon-text">{followers}</span>
        </motion.div>
        
        <motion.div 
          className="flex flex-col items-center p-2"
          variants={itemVariants}
          whileHover={{ scale: 1.05 }}
          animate={following > 0 ? "pulse" : undefined}
          variants={pulseVariants}
        >
          <div className="flex items-center justify-center mb-1">
            <Heart className="h-5 w-5 text-pink-400 mr-1" />
            <span className="text-sm font-medium">Following</span>
          </div>
          <span className="text-lg font-bold text-white neon-text">{following}</span>
        </motion.div>
        
        <motion.div 
          className="flex flex-col items-center p-2"
          variants={itemVariants}
          whileHover={{ scale: 1.05 }}
          animate={achievements > 0 ? "pulse" : undefined}
          variants={pulseVariants}
        >
          <div className="flex items-center justify-center mb-1">
            <Trophy className="h-5 w-5 text-yellow-400 mr-1" />
            <span className="text-sm font-medium">Trophies</span>
          </div>
          <span className="text-lg font-bold text-white neon-text">{achievements}</span>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default ProfileStatsBar;
