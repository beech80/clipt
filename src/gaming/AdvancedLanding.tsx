import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import '../styles/landing-animations.css';
import '../styles/galaxy-animations.css';
import '../styles/advanced-landing.css';

const AdvancedLanding = () => {
  const navigate = useNavigate();
  const [startAnimation, setStartAnimation] = useState(false);
  const [showParticles, setShowParticles] = useState(false);
  const confettiCanvasRef = useRef<HTMLCanvasElement>(null);
  
  useEffect(() => {
    // Start the animation when the component mounts
    setTimeout(() => {
      setShowParticles(true);
    }, 1000);
    
    // Disable scrolling for immersive experience
    document.body.style.overflow = 'hidden';
    
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, []);

  const handleEnterApp = () => {
    setStartAnimation(true);
    
    // Wait for animation before navigating to Clipts page
    setTimeout(() => {
      navigate('/clipts');
    }, 2000);
  };

  return (
    <div className="h-screen w-full flex flex-col items-center justify-center overflow-hidden relative">
      {/* Galaxy background */}
      <div className="cosmic-bg"></div>
      <div className="cosmic-overlay"></div>
      <div className="stars-field"></div>
      <div className="aurora"></div>
      
      {/* Retro effects */}
      <div className="retro-scanline"></div>
      <div className="retro-vhs"></div>
      
      {/* Confetti canvas */}
      <canvas ref={confettiCanvasRef} className="fixed inset-0 w-full h-full pointer-events-none z-50"></canvas>

      <AnimatePresence>
        {!startAnimation && (
          <motion.div 
            className="text-center z-20 zoom-out-effect"
            initial={{ opacity: 0, scale: 0.1 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, y: -50, scale: 0.9 }}
            transition={{ duration: 1, ease: "easeOut" }}
          >
            <motion.div>
              <div className="text-9xl font-bold mega-retro-text mb-2 glow-text">
                CLIPT
              </div>
              
              <button 
                onClick={handleEnterApp}
                className="modern-button px-8 py-3 text-white font-bold text-xl uppercase tracking-wider rounded-sm mt-8">
                START GAME
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Exit animation overlay */}
      <AnimatePresence>
        {startAnimation && (
          <motion.div 
            className="fixed inset-0 z-40 bg-black flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              initial={{ scale: 1, opacity: 0 }}
              animate={{ 
                scale: [1, 20], 
                opacity: [0, 1, 0] 
              }}
              transition={{ duration: 2 }}
              className="z-20 relative"
            >
              <div className="flex flex-col items-center justify-center z-10 relative">            
                <div className="text-7xl font-bold mega-retro-text">CLIPT</div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdvancedLanding;
