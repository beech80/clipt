import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './GamingTheme.css';
import { motion } from 'framer-motion';
import './GamingTheme.css';

/**
 * GamingLanding - A professional gaming & streaming landing page
 * 
 * Features:
 * - Advanced animations and visual effects
 * - Gaming controller UI elements
 * - Responsive design for all devices
 */
const GamingLanding = () => {
  const [stars, setStars] = useState<{ size: number; x: number; y: number; delay: number; duration: number }[]>([]);
  
  // Generate stars on component mount
  useEffect(() => {
    const generatedStars = Array.from({ length: 200 }, () => ({
      size: Math.random() * 2 + 1,
      x: Math.random() * 100,
      y: Math.random() * 100,
      delay: Math.random() * 3,
      duration: Math.random() * 3 + 2
    }));
    
    setStars(generatedStars);
    
    // Disable scrolling for immersive experience
    document.body.style.overflow = 'hidden';
    
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, []);
  
  return (
    <div className="space-theme">
      {/* Background elements */}
      <div className="space-stars">
        {stars.map((star, index) => (
          <motion.div 
            key={`star-${index}`}
            className="space-star"
            style={{
              width: `${star.size}px`,
              height: `${star.size}px`,
              left: `${star.x}%`,
              top: `${star.y}%`
            }}
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{ 
              duration: star.duration,
              delay: star.delay,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
        ))}
      </div>
      
      <div className="space-nebula"></div>
      <div className="space-grid"></div>
      <div className="space-overlay"></div>
      <div className="space-planet"></div>
      <div className="space-scanline"></div>
      
      {/* Main content - Just CLIPT and START GAME */}
      <div className="space-container">
        <motion.h1 
          className="space-title"
          animate={{ textShadow: ['0 0 10px rgba(0, 229, 255, 0.6)', '0 0 20px rgba(0, 229, 255, 0.8)', '0 0 10px rgba(0, 229, 255, 0.6)'] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          CLIPT
        </motion.h1>
        
        <div className="start-game-container">
          <Link to="/clipts" className="start-game-link">
            <motion.button 
              className="start-game-button"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              animate={{
                boxShadow: ['0 0 10px rgba(0, 229, 255, 0.6)', '0 0 20px rgba(0, 229, 255, 0.8)', '0 0 10px rgba(0, 229, 255, 0.6)'],
              }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              START GAME
            </motion.button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default GamingLanding;
