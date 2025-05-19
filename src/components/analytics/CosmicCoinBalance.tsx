import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Plus, Coins } from 'lucide-react';

interface CosmicCoinBalanceProps {
  balance: number;
}

export const CosmicCoinBalance = ({ balance }: CosmicCoinBalanceProps) => {
  const [showDetails, setShowDetails] = useState(false);
  
  return (
    <div className="relative">
      <motion.div
        className="relative cursor-pointer"
        onClick={() => setShowDetails(!showDetails)}
        whileHover={{ scale: 1.05 }}
        transition={{ type: 'spring', stiffness: 400, damping: 10 }}
      >
        <div 
          className="px-4 py-3 rounded-xl flex items-center"
          style={{
            background: 'linear-gradient(135deg, rgba(255,215,0,0.2) 0%, rgba(255,165,0,0.3) 100%)',
            border: '1px solid rgba(255,215,0,0.3)',
            boxShadow: '0 0 15px rgba(255,215,0,0.2)'
          }}
        >
          {/* Animated coin icon */}
          <div className="relative mr-3">
            <motion.div
              animate={{ 
                rotateY: [0, 360],
              }}
              transition={{ 
                duration: 4,
                repeat: Infinity,
                ease: "linear"
              }}
            >
              <div className="relative w-8 h-8 bg-gradient-to-br from-yellow-400 to-amber-500 rounded-full flex items-center justify-center">
                <Coins className="h-5 w-5 text-white" />
              </div>
            </motion.div>
            
            {/* Sparkle effects */}
            <motion.div 
              className="absolute -top-1 -right-1"
              animate={{ 
                opacity: [0.4, 1, 0.4],
                scale: [0.8, 1.2, 0.8]
              }}
              transition={{ 
                duration: 2, 
                repeat: Infinity,
                ease: "easeInOut" 
              }}
            >
              <Sparkles className="h-3 w-3 text-yellow-300" />
            </motion.div>
          </div>
          
          {/* Balance text */}
          <div>
            <p className="text-white font-bold text-xl">
              {balance.toLocaleString()}
            </p>
            <p className="text-yellow-300 text-xs">CLIPT COINS</p>
          </div>
          
          {/* Add more button */}
          <motion.div 
            className="ml-3 w-6 h-6 rounded-full bg-white/10 flex items-center justify-center"
            whileHover={{ backgroundColor: 'rgba(255,255,255,0.2)' }}
          >
            <Plus className="h-4 w-4 text-yellow-300" />
          </motion.div>
        </div>
      </motion.div>
      
      {/* Expandable details panel */}
      <AnimatePresence>
        {showDetails && (
          <motion.div
            initial={{ opacity: 0, y: 10, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: 10, height: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute right-0 mt-2 w-64 z-20"
          >
            <div 
              className="rounded-xl p-4"
              style={{
                background: 'linear-gradient(135deg, rgba(25,25,35,0.95) 0%, rgba(40,40,60,0.95) 100%)',
                border: '1px solid rgba(255,215,0,0.3)',
                boxShadow: '0 5px 20px rgba(0,0,0,0.3)'
              }}
            >
              <h4 className="text-white font-semibold mb-3">Coin Details</h4>
              
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-yellow-100 text-sm">Available</span>
                  <span className="text-white font-medium">{balance.toLocaleString()}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-yellow-100 text-sm">Pending</span>
                  <span className="text-white font-medium">0</span>
                </div>
                
                <div className="pt-2 mt-1 border-t border-yellow-900/30">
                  <div className="flex justify-between items-center">
                    <span className="text-yellow-100 text-sm">Lifetime Earned</span>
                    <span className="text-white font-medium">{(balance + 2450).toLocaleString()}</span>
                  </div>
                </div>
                
                <button 
                  className="w-full mt-3 py-2 rounded-lg text-sm font-medium"
                  style={{
                    background: 'linear-gradient(to right, #FFD700, #FFA500)',
                    color: '#111'
                  }}
                >
                  Purchase Coins
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
