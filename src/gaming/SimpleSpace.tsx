import React, { useEffect } from 'react';
import { usePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import '../styles/cosmic-effects.css';
import '../styles/retro-effects.css';

const SimpleSpace: React.FC = () => {
  const [isPresent] = usePresence();
  // Stars generation removed to eliminate animation
  // const [stars, setStars] = React.useState<{ size: number; x: number; y: number; delay: number; duration: number }[]>([]);
  
  useEffect(() => {
    // Stars generation removed to eliminate animation
    /*
    const generatedStars = Array.from({ length: 200 }, () => ({
      size: Math.random() * 2 + 1,
      x: Math.random() * 100,
      y: Math.random() * 100,
      delay: Math.random() * 3,
      duration: Math.random() * 3 + 2
    }));
    
    setStars(generatedStars);
    */
    
    // Disable scrolling for immersive experience
    document.body.style.overflow = 'hidden';
    
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, []);
  
  return (
    {/* Remove space-theme class to prevent any CSS from affecting this component */}
    <div style={{
      height: '100vh',
      width: '100%',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
      position: 'relative',
      // Simple static background with no animations
      background: 'linear-gradient(to bottom, #020414 0%, #0a1a3d 100%)',
      // Disable all inherited animations
      animation: 'none',
      WebkitAnimation: 'none'
    }}>
      {/* All background elements with animations have been completely removed */}
      {/* Only using a single static dark overlay */}
      <div style={{
        position: 'absolute',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        zIndex: 5,
        // Ensure no animations are applied
        animation: 'none',
        WebkitAnimation: 'none'
      }}></div>
      
      {/* Main content - Just CLIPT and START GAME */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100,
        position: 'relative'
      }}>
        <motion.h1 
          // Fixed duplicate style prop issue
          style={{
            fontSize: '8rem',
            fontWeight: 'bold',
            color: '#ffffff',
            marginBottom: '2rem',
            textShadow: '0 0 15px rgba(0, 229, 255, 0.7)',
            textTransform: 'uppercase',
            position: 'relative',
            zIndex: 200
          }}
        >
          CLIPT
        </motion.h1>
        
        <Link to="/clipts" style={{ textDecoration: 'none' }}>
          <motion.button 
            style={{
              backgroundColor: 'rgba(0, 229, 255, 0.2)',
              border: '3px solid #00e5ff',
              color: '#ffffff',
              fontSize: '1.75rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              padding: '1rem 3rem',
              borderRadius: '0.5rem',
              cursor: 'pointer',
              position: 'relative',
              overflow: 'hidden',
              letterSpacing: '0.1em',
              boxShadow: '0 0 15px rgba(0, 229, 255, 0.6), 0 0 30px rgba(0, 229, 255, 0.4)',
              textShadow: '0 0 10px #00e5ff',
              zIndex: 200
            }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            // Removed animated box shadow
          >
            START GAME
          </motion.button>
        </Link>
      </div>
    </div>
  );
};

export default SimpleSpace;
