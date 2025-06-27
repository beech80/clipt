import React from 'react';
import { Diamond, Users } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

interface MaxedTierProgressProps {
  subscriptionCount: number;
  userTier: 'free' | 'pro' | 'maxed';
  onFindCreators?: () => void;
  compact?: boolean; // Whether to show a compact version for placement next to other buttons
  customClassName?: string; // Additional classes to apply
}

const MaxedTierProgress = ({ subscriptionCount, userTier, onFindCreators, compact = false, customClassName = '' }: MaxedTierProgressProps) => {
  const navigate = useNavigate();
  const progressPercentage = subscriptionCount >= 2 ? 100 : subscriptionCount * 50;
  
  // If compact mode is enabled, render a bar instead of a button
  if (compact) {
    return (
      <div 
        className={`maxed-tier-bar bg-black/40 backdrop-blur-sm rounded-lg border border-purple-500/20 px-3 py-2 w-full flex items-center gap-2 relative overflow-hidden cursor-pointer ${customClassName}`}
        onClick={() => navigate('/subscribe')}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-transparent pointer-events-none" />
        <Diamond className="h-4 w-4 text-purple-400 flex-shrink-0" />
        <div className="flex-1">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="font-medium text-white">{userTier === 'maxed' ? 'MAXED TIER ACTIVE' : 'MAXED TIER PROGRESS'}</span>
            <div className="bg-purple-500/20 px-2 py-0.5 rounded-full text-xs font-medium text-purple-300">
              {subscriptionCount}/2
            </div>
          </div>
          {/* Progress Bar */}
          <div className="h-2 bg-black/60 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-purple-600 to-purple-400" 
              style={{ width: `${progressPercentage}%` }}
            ></div>
          </div>
        </div>
      </div>
    );
  }
  
  // Full detailed version
  return (
    <motion.button 
      className={`bg-black/40 backdrop-blur-sm rounded-lg border border-purple-500/20 p-4 relative overflow-hidden ${customClassName}`}
      onClick={() => navigate('/subscribe')}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent pointer-events-none" />
      
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Diamond className="h-5 w-5 text-purple-400" />
          <h3 className="font-bold text-white">Maxed Tier Progress</h3>
        </div>
        <div className="bg-purple-500/20 px-2 py-1 rounded-full text-xs font-medium text-purple-300">
          {subscriptionCount}/2 Subs
        </div>
      </div>
      
      <div className="mb-4">
        <p className="text-sm text-gray-300 mb-3">
          Subscribe to creators you love and automatically unlock Maxed tier benefits!
        </p>
        
        <div className="flex items-center gap-1 text-xs mb-2">
          <span className="w-3 h-3 rounded-full bg-gray-700 flex-shrink-0"></span>
          <span className="text-gray-400">Free</span>
          
          <span className="mx-1 text-gray-500">→</span>
          
          <span className="w-3 h-3 rounded-full bg-purple-700/50 flex-shrink-0"></span>
          <span className="text-gray-400">Pro (1 Sub)</span>
          
          <span className="mx-1 text-gray-500">→</span>
          
          <span className="w-3 h-3 rounded-full bg-purple-500 flex-shrink-0"></span>
          <span className="text-purple-300">Maxed (2 Subs)</span>
        </div>
      </div>
      
      {/* Progress Bar */}
      <div className="h-3 bg-black/60 rounded-full overflow-hidden mb-2">
        <div 
          className="h-full bg-gradient-to-r from-purple-600 to-purple-400" 
          style={{ width: `${progressPercentage}%` }}
        ></div>
      </div>
      
      <div className="flex items-center justify-between text-xs mb-4">
        <span className="text-gray-400">
          {userTier === 'maxed' 
            ? 'Maxed Tier Unlocked!' 
            : subscriptionCount === 0 
              ? 'Subscribe to 2 creators to unlock Maxed'
              : 'Subscribe to 1 more creator to unlock Maxed'}
        </span>
        {userTier === 'maxed' && (
          <span className="text-purple-300 flex items-center gap-1">
            <Diamond className="h-3 w-3" /> Maxed Tier Active
          </span>
        )}
      </div>
      
      <div className="grid grid-cols-2 gap-4 mb-2">
        <div className="bg-black/30 rounded-lg border border-purple-500/20 p-3 text-xs">
          <h4 className="font-medium text-white mb-1">Option 1: Direct Maxed</h4>
          <div className="text-gray-400">Subscribe for $14.99/month</div>
        </div>
        
        <div className="bg-black/30 rounded-lg border border-purple-500/20 p-3 text-xs">
          <h4 className="font-medium text-white mb-1">Option 2: 2-Sub Maxed</h4>
          <div className="text-gray-400">Subscribe to 2 creators at $4.99 each</div>
        </div>
      </div>
      
      {userTier !== 'maxed' && (
        <button 
          onClick={(e) => {
            e.stopPropagation(); // Prevent parent button click
            if (onFindCreators) onFindCreators();
          }}
          className="w-full bg-gradient-to-r from-purple-500/50 to-purple-500/30 hover:from-purple-500/60 hover:to-purple-500/40 py-2 rounded-md text-sm font-medium border border-purple-500/40 transition-all flex items-center justify-center gap-2"
        >
          <Users className="h-4 w-4" />
          {subscriptionCount === 0 
            ? 'Find Creators to Subscribe' 
            : 'Find One More Creator'}
        </button>
      )}
    </motion.button>
  );
};

export default MaxedTierProgress;
