import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

/**
 * A clean space-themed landing page without any overlays or animations
 * that could interfere with the buttons or content
 */
const CleanSpaceLanding: React.FC = () => {
  useEffect(() => {
    // Disable scrolling for immersive experience
    document.body.style.overflow = 'hidden';
    
    return () => {
      document.body.style.overflow = 'auto';
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
      background: '#020414'
    }}>
      {/* Simple stars as individual dots instead of background gradient */}
      {Array.from({ length: 100 }).map((_, i) => (
        <div 
          key={i}
          style={{
            position: 'absolute',
            width: `${Math.random() * 2 + 1}px`,
            height: `${Math.random() * 2 + 1}px`,
            backgroundColor: 'white',
            borderRadius: '50%',
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            opacity: Math.random() * 0.7 + 0.3,
            zIndex: 1
          }}
        />
      ))}
      
      {/* Content in a prominent dark container with glowing border */}
      <div style={{
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
              backgroundColor: '#ff6600',
              border: 'none',
              color: '#ffffff',
              fontSize: '1.5rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              padding: '0.75rem 2.5rem',
              borderRadius: '0.5rem',
              cursor: 'pointer',
              position: 'relative',
              overflow: 'hidden',
              letterSpacing: '0.1em',
              boxShadow: '0 4px 15px rgba(255, 102, 0, 0.4)',
              zIndex: 200
            }}
            whileHover={{ 
              scale: 1.05,
              backgroundColor: '#ff7700',
              boxShadow: '0 6px 20px rgba(255, 102, 0, 0.5)'
            }}
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
