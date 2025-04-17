import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Gamepad, ZapOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import '../styles/clipts-enhanced.css';

const Welcome: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gaming-950 text-white p-4 flex flex-col justify-between">
      <div className="flex justify-center items-center py-8 border-b border-gaming-800">
        <motion.h1 
          className="text-3xl font-bold text-center neon-text-purple"
          animate={{ 
            textShadow: [
              '0 0 7px #fff, 0 0 10px #fff, 0 0 21px #fff, 0 0 42px #bc13fe, 0 0 82px #bc13fe',
              '0 0 7px #fff, 0 0 10px #fff, 0 0 21px #fff, 0 0 42px #bc13fe, 0 0 72px #bc13fe',
              '0 0 7px #fff, 0 0 10px #fff, 0 0 21px #fff, 0 0 42px #bc13fe, 0 0 82px #bc13fe'
            ]
          }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <Sparkles className="inline mr-2" />
          Welcome to CLIPT
          <Sparkles className="inline ml-2" />
        </motion.h1>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center">
        <motion.div 
          className="arcade-frame p-8 mb-6 relative max-w-md w-full"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-2xl font-bold text-center mb-6 text-purple-400">Choose Your Destination</h2>
          
          <div className="grid grid-cols-1 gap-4">
            <motion.div
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="pixel-corners pixel-button"
            >
              <Button 
                className="w-full gameboy-button py-6 text-lg relative group"
                onClick={() => navigate('/clipts')}
              >
                <span className="relative z-10 flex items-center justify-center">
                  <Gamepad className="mr-2 h-6 w-6" />
                  <span>GO TO CLIPTS</span>
                </span>
                <span className="absolute inset-0 bg-gradient-to-r from-purple-600 to-blue-500 opacity-75 group-hover:opacity-100 transition-opacity rounded-md"></span>
              </Button>
            </motion.div>
            
            <motion.div
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="pixel-corners pixel-button"
            >
              <Button 
                className="w-full gameboy-button py-6 text-lg relative group"
                onClick={() => navigate('/discovery')}
              >
                <span className="relative z-10 flex items-center justify-center">
                  <Sparkles className="mr-2 h-6 w-6" />
                  <span>GO TO DISCOVERY</span>
                </span>
                <span className="absolute inset-0 bg-gradient-to-r from-blue-600 to-teal-500 opacity-75 group-hover:opacity-100 transition-opacity rounded-md"></span>
              </Button>
            </motion.div>
          </div>
          
          <motion.div 
            className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full"
            animate={{ 
              opacity: [0.5, 1, 0.5],
              scale: [0.8, 1.2, 0.8]
            }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
          
          <motion.div 
            className="absolute -bottom-1 -left-1 w-4 h-4 bg-green-500 rounded-full"
            animate={{ 
              opacity: [0.5, 1, 0.5],
              scale: [0.8, 1.2, 0.8]
            }}
            transition={{ duration: 1.5, repeat: Infinity, delay: 0.75 }}
          />
        </motion.div>
      </div>
      
      <div className="text-center text-purple-300 text-sm py-4">
        © 2025 CLIPT - The Ultimate Game Clip Platform
      </div>
    </div>
  );
};

export default Welcome;
