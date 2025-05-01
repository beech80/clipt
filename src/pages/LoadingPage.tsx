import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera } from 'lucide-react';
import { motion } from 'framer-motion';

const LoadingPage: React.FC = () => {
  const navigate = useNavigate();
  const [progress, setProgress] = useState(0);
  
  useEffect(() => {
    // Simulate loading progress
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            navigate('/discover'); // Redirect to discovery page after loading
          }, 500);
          return 100;
        }
        return prev + 5;
      });
    }, 150);
    
    return () => clearInterval(interval);
  }, [navigate]);
  
  return (
    <div className="h-screen w-full flex flex-col items-center justify-center bg-[#121212]">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col items-center"
      >
        {/* Camera icon with pulsing effect */}
        <motion.div 
          className="mb-6"
          animate={{ 
            scale: [1, 1.1, 1],
            filter: [
              'drop-shadow(0 0 10px rgba(255, 85, 0, 0.7))',
              'drop-shadow(0 0 20px rgba(255, 85, 0, 0.9))',
              'drop-shadow(0 0 10px rgba(255, 85, 0, 0.7))'
            ]
          }}
          transition={{ 
            duration: 2, 
            repeat: Infinity,
            ease: "easeInOut" 
          }}
        >
          <Camera size={64} className="text-[#FF5500]" />
        </motion.div>
        
        {/* CLIPT Text */}
        <motion.h1 
          className="text-4xl font-bold mb-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.8 }}
          style={{
            background: 'linear-gradient(90deg, #FF5500, #FF8C00)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            textShadow: '0 0 10px rgba(255, 85, 0, 0.3)'
          }}
        >
          CLIPT
        </motion.h1>
        
        {/* Loading bar with rich brown background and orange fill */}
        <div className="w-64 h-2 bg-[#2A1A12] rounded-full overflow-hidden mb-4">
          <motion.div 
            className="h-full bg-[#FF5500]"
            initial={{ width: '0%' }}
            animate={{ width: `${progress}%` }}
            transition={{ ease: "easeInOut" }}
          />
        </div>
        
        <p className="text-white/70 text-sm">
          {progress === 100 ? 'Ready!' : 'Loading your gaming experience...'}
        </p>
      </motion.div>
    </div>
  );
};

export default LoadingPage;
