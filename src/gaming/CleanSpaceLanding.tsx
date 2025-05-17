import React, { useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
// Import our CSS files at a high specificity to ensure styles apply in production
import '../styles/fix-animations.css';
import '../styles/cosmic-override.css';

/**
 * A clean space-themed landing page without any overlays or animations
 * that could interfere with the buttons or content
 */
const CleanSpaceLanding: React.FC = () => {
  useEffect(() => {
    // Disable scrolling for immersive experience
    document.body.style.overflow = 'hidden';
    
    // Force space theme on the entire app in production
    document.documentElement.style.setProperty('background-color', '#020414', 'important');
    document.body.style.setProperty('background-color', '#020414', 'important');
    document.body.style.setProperty('margin', '0', 'important');
    document.body.style.setProperty('padding', '0', 'important');
    
    // Remove any beige backgrounds that might be coming from another component
    const elements = document.querySelectorAll('div, main, section, body');
    elements.forEach(el => {
      if (window.getComputedStyle(el).backgroundColor === 'rgb(215, 190, 157)') { // beige color
        (el as HTMLElement).style.setProperty('background-color', '#020414', 'important');
      }
    });
    
    return () => {
      document.body.style.removeProperty('overflow');
      document.documentElement.style.removeProperty('background-color');
      document.body.style.removeProperty('background-color');
      document.body.style.removeProperty('margin');
      document.body.style.removeProperty('padding');
    };
  }, []);
  
  return (
    <div style={{
      height: '100vh',
      width: '100%',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
      position: 'relative',
      // Solid dark background with no gradients that could interact with other elements
      background: '#020414 !important',
      backgroundImage: 'none !important',
      backgroundColor: '#020414 !important'
    }}>
      {/* Simple stars as individual dots instead of background gradient - optimized with useMemo */}
      {useMemo(() => {
        // Generate stars only once when component mounts, not on every render
        const stars = [];
        for (let i = 0; i < 100; i++) {
          const width = Math.random() * 2 + 1;
          stars.push(
            <div 
              key={i}
              style={{
                position: 'absolute',
                width: `${width}px`,
                height: `${width * 1.5}px`,
                backgroundColor: 'white',
                borderRadius: '50%',
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                opacity: Math.random() * 0.7 + 0.3,
                zIndex: 1
              }}
            />
          );
        }
        return stars;
      }, [])}
      
      {/* Content in a prominent dark container with glowing border */}
      <div className="cosmic-content-container" style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100,
        position: 'relative',
        padding: '6rem 8rem',
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        border: '2px solid #00e5ff',
        boxShadow: '0 0 30px rgba(0, 229, 255, 0.4), inset 0 0 50px rgba(0, 0, 0, 0.9)',
        borderRadius: '10px'
      }}>
        <motion.h1 
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
        
                {/* Removed previous masking div - using container background instead */}

        <Link to="/clipts" style={{ textDecoration: 'none', position: 'relative', zIndex: 250 }}>
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
          >
            START GAME
          </motion.button>
        </Link>
      </div>
    </div>
  );
};

export default CleanSpaceLanding;
