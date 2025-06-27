import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Gamepad2, Video, Camera } from 'lucide-react';
import { motion } from 'framer-motion';

// EMERGENCY LANDING PAGE - STANDALONE WITH NO EXTERNAL STYLES
const EmergencyLanding = () => {
  const navigate = useNavigate();
  
  // Inline all styles to avoid global CSS issues
  const styles = {
    pageWrapper: {
      width: '100vw',
      height: '100vh',
      overflow: 'hidden',
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: '#190033',
      backgroundImage: 'none',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      color: 'white',
      fontFamily: 'sans-serif'
    },
    starsContainer: {
      position: 'absolute',
      inset: 0,
      zIndex: 0
    },
    star: (top, left, size, delay) => ({
      position: 'absolute',
      width: `${size}px`,
      height: `${size}px`,
      top: `${top}%`,
      left: `${left}%`,
      backgroundColor: 'white',
      borderRadius: '50%',
      opacity: Math.random() * 0.8 + 0.2,
      animation: `twinkle ${Math.random() * 3 + 2}s infinite ${delay}s`
    }),
    floatingElements: {
      position: 'absolute',
      inset: 0,
      zIndex: 0
    },
    satellite: {
      position: 'absolute',
      top: '10%',
      left: '15%',
      fontSize: '2rem',
      transform: 'rotate(15deg)'
    },
    rocket: {
      position: 'absolute',
      top: '20%',
      right: '20%',
      fontSize: '2rem',
      transform: 'rotate(-20deg)'
    },
    telescope: {
      position: 'absolute',
      bottom: '15%',
      left: '25%',
      fontSize: '2rem'
    },
    star2: {
      position: 'absolute',
      top: '30%',
      left: '80%',
      fontSize: '1.5rem'
    },
    satellite2: {
      position: 'absolute',
      bottom: '30%',
      right: '18%',
      fontSize: '1rem'
    },
    bluePlanet: {
      position: 'absolute',
      bottom: '70%',
      left: '10%',
      width: '4rem',
      height: '4rem',
      backgroundColor: '#3B82F6',
      borderRadius: '50%',
      opacity: 0.7
    },
    orangePlanet: {
      position: 'absolute',
      top: '15%',
      right: '10%',
      width: '2.5rem',
      height: '2.5rem',
      backgroundColor: '#F97316',
      borderRadius: '50%',
      opacity: 0.6
    },
    contentContainer: {
      position: 'relative',
      zIndex: 10,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '2rem'
    },
    logo: {
      fontSize: '8rem',
      fontWeight: 'bold',
      marginBottom: '2rem',
      background: 'linear-gradient(to right, #60A5FA, #22D3EE)',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      textShadow: '0 0 15px rgba(59,130,246,0.7)'
    },
    buttonsContainer: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '2rem'
    },
    menuButton: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      width: '6rem',
      height: '6rem',
      backgroundColor: 'rgba(0, 0, 0, 0.3)',
      border: '1px solid #4B5563',
      borderRadius: '0.375rem',
      color: 'white',
      transition: 'all 0.2s',
      cursor: 'pointer'
    },
    buttonIcon: {
      marginBottom: '0.5rem',
      width: '2rem',
      height: '2rem'
    },
    buttonText: {
      fontSize: '0.75rem',
      textTransform: 'uppercase',
      fontWeight: '500'
    },
    startGameButton: {
      marginTop: '2rem',
      padding: '0.75rem 1.5rem',
      background: 'linear-gradient(to right, #3B82F6, #7C3AED)',
      borderRadius: '0.375rem',
      color: 'white',
      fontWeight: '500',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      boxShadow: '0 10px 15px -3px rgba(59, 130, 246, 0.25)',
      cursor: 'pointer',
      border: 'none'
    },
    gamepadIcon: {
      marginLeft: '0.5rem',
      width: '1rem',
      height: '1rem'
    },
    selectMenuButton: {
      marginTop: '1rem',
      padding: '0.5rem 1.5rem',
      background: 'linear-gradient(to right, rgba(55, 65, 81, 0.8), rgba(17, 24, 39, 0.8))',
      border: '1px solid rgba(75, 85, 99, 0.3)',
      borderRadius: '0.375rem',
      color: 'white',
      fontWeight: '500',
      fontSize: '0.875rem',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      cursor: 'pointer'
    },
    '@keyframes twinkle': {
      '0%, 100%': { opacity: 0.2 },
      '50%': { opacity: 1 }
    }
  };

  // Generate stars
  const stars = Array.from({ length: 100 }).map((_, i) => ({
    id: i,
    top: Math.random() * 100,
    left: Math.random() * 100,
    size: Math.random() * 3 + 1,
    delay: Math.random() * 2
  }));

  return (
    <div style={styles.pageWrapper}>
      {/* Stars background */}
      <div style={styles.starsContainer}>
        {stars.map(star => (
          <div 
            key={star.id} 
            style={styles.star(star.top, star.left, star.size, star.delay)} 
          />
        ))}
      </div>

      {/* Floating elements */}
      <div style={styles.floatingElements}>
        {/* Satellites */}
        <motion.div 
          style={styles.satellite}
          initial={{ y: 0 }}
          animate={{ y: [-10, 0, -10] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        >
          🛰️
        </motion.div>
        <motion.div 
          style={styles.rocket}
          initial={{ y: 0 }}
          animate={{ y: [-10, 0, -10] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        >
          🚀
        </motion.div>
        <motion.div 
          style={styles.telescope}
          initial={{ y: 0 }}
          animate={{ y: [-10, 0, -10] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        >
          🔭
        </motion.div>
        <motion.div 
          style={styles.star2}
          initial={{ y: 0 }}
          animate={{ y: [-10, 0, -10] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        >
          🌠
        </motion.div>
        <motion.div 
          style={styles.satellite2}
          initial={{ y: 0 }}
          animate={{ y: [-10, 0, -10] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        >
          📡
        </motion.div>
        
        {/* Planets */}
        <motion.div 
          style={styles.bluePlanet}
          initial={{ y: 0 }}
          animate={{ y: [-10, 0, -10] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div 
          style={styles.orangePlanet}
          initial={{ y: 0 }}
          animate={{ y: [-10, 0, -10] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      {/* Main content */}
      <div style={styles.contentContainer}>
        {/* CLIPT Logo */}
        <motion.h1 
          style={styles.logo}
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
        >
          CLIPT
        </motion.h1>

        {/* Menu buttons */}
        <div style={styles.buttonsContainer}>
          <motion.button
            style={styles.menuButton}
            whileHover={{ scale: 1.05, y: -5 }}
            onClick={() => navigate('/all-streamers')}
          >
            <Video style={styles.buttonIcon} />
            <span style={styles.buttonText}>Streaming</span>
          </motion.button>

          <motion.button
            style={styles.menuButton}
            whileHover={{ scale: 1.05, y: -5 }}
            onClick={() => navigate('/posts')}
          >
            <Camera style={styles.buttonIcon} />
            <span style={styles.buttonText}>Posts</span>
          </motion.button>
        </div>

        {/* Start Game button */}
        <motion.button
          style={styles.startGameButton}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate('/clipts')}
        >
          START GAME <Gamepad2 style={styles.gamepadIcon} />
        </motion.button>
        
        {/* SELECT button for Game Menu */}
        <motion.button
          style={styles.selectMenuButton}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate('/game-menu')}
        >
          SELECT MENU
        </motion.button>
      </div>

      {/* CSS Keyframes for stars */}
      <style>
        {`
          @keyframes twinkle {
            0%, 100% { opacity: 0.2; }
            50% { opacity: 1; }
          }
        `}
      </style>
    </div>
  );
};

export default EmergencyLanding;
