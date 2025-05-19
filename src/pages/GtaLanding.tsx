import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import '../GTA.css';

const GtaLanding: React.FC = () => {
  // Gaming console tips
  const gamingTips = [
    "Stream regularly to build your audience",
    "Interact with viewers to increase engagement",
    "Use hashtags to reach more viewers",
    "Collaborate with other streamers to grow faster",
    "Set a consistent streaming schedule",
    "Upgrade your gear for better video quality",
    "Don't forget to promote your streams on social media"
  ];
  
  const [currentTip, setCurrentTip] = useState(gamingTips[0]);
  
  // Rotate tips like gaming console loading screens
  useEffect(() => {
    const tipInterval = setInterval(() => {
      const nextIndex = (gamingTips.indexOf(currentTip) + 1) % gamingTips.length;
      setCurrentTip(gamingTips[nextIndex]);
    }, 3000);
    
    return () => clearInterval(tipInterval);
  }, [currentTip, gamingTips]);
  // Disable scrolling
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.width = '100%';
    document.body.style.height = '100%';
    
    return () => {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
      document.body.style.height = '';
    };
  }, []);

  return (
    <div className="fixed inset-0 bg-[#141414] text-white overflow-hidden" style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      width: '100vw',
      height: '100vh',
      backgroundColor: '#141414',
      color: '#ffffff',
      zIndex: 9999,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      overflow: 'hidden',
      fontFamily: '"Roboto", "Helvetica", sans-serif',
      letterSpacing: '0.05em',
      textTransform: 'uppercase'
    }}>
      {/* Gaming background with grid for depth */}
      <div className="gta-grid"></div>
      
      {/* Scanning line - gaming console style */}
      <div className="scanning-line"></div>
      
      {/* Gaming overlay with city nightscape silhouette */}
      <div className="absolute bottom-0 left-0 right-0 h-[30%] bg-gradient-to-t from-[#000000] to-transparent z-10">
        <div className="absolute bottom-0 left-0 right-0 h-12 w-full overflow-hidden">
          {/* Gaming cityscape silhouette */}
          <svg viewBox="0 0 1200 120" preserveAspectRatio="none" className="w-full h-full">
            <path d="M0,0 L50,0 L60,10 L70,0 L80,10 L90,0 L100,10 L110,0 L120,5 L130,0 L140,10 L150,0 L160,5 L170,0 L180,10 L190,0 L200,5 L210,0 L220,10 L230,0 L240,5 L250,0 L260,10 L270,0 L280,5 L290,0 L300,10 L310,0 L320,5 L330,0 L340,10 L350,0 L360,5 L370,0 L380,10 L390,0 L400,5 L410,0 L420,10 L430,0 L440,5 L450,0 L460,10 L470,0 L480,5 L490,0 L500,10 L510,0 L520,5 L530,0 L540,10 L550,0 L560,5 L570,0 L580,10 L590,0 L600,5 L610,0 L620,10 L630,0 L640,5 L650,0 L660,10 L670,0 L680,5 L690,0 L700,10 L710,0 L720,5 L730,0 L740,10 L750,0 L760,5 L770,0 L780,10 L790,0 L800,5 L810,0 L820,10 L830,0 L840,5 L850,0 L860,10 L870,0 L880,5 L890,0 L900,10 L910,0 L920,5 L930,0 L940,10 L950,0 L960,5 L970,0 L980,10 L990,0 L1000,5 L1010,0 L1020,10 L1030,0 L1040,5 L1050,0 L1060,10 L1070,0 L1080,5 L1090,0 L1100,10 L1110,0 L1120,5 L1130,0 L1140,10 L1150,0 L1160,5 L1170,0 L1180,10 L1190,0 L1200,0 L1200,120 L0,120 Z" fill="#000000"></path>
          </svg>
        </div>
      </div>
      
      {/* Gaming color palette overlay */}
      <motion.div 
        className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-[#222]/40 to-orange-900/20 z-0"
        animate={{ opacity: [0.3, 0.5, 0.3] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      />
      
      {/* Streaming notification animations */}
      {Array.from({ length: 5 }).map((_, i) => (
        <motion.div 
          key={`notification-${i}`}
          className="absolute rounded-md px-2 py-1 bg-orange-600/80 text-xs font-bold z-20"
          style={{ 
            right: '-100px',
            top: `${20 + i * 15}%`,
          }}
          animate={{ 
            right: ['100vw', '-100px'],
            opacity: [0, 1, 1, 0]
          }}
          transition={{ 
            duration: 8, 
            repeat: Infinity, 
            delay: i * 3,
            times: [0, 0.1, 0.9, 1],
            ease: "easeInOut" 
          }}
        >
          {['NEW SUBSCRIBER', 'FOLLOW', 'DONATION', 'MEMBER JOINED', 'RAID ALERT'][i]}
        </motion.div>
      ))}
      
      {/* GTA-style header */}
      <div className="absolute top-8 left-0 right-0 text-center z-20">
        <h1 className="text-4xl md:text-6xl font-bold tracking-wide gta-text-flicker" style={{
            color: '#ff6600',
            textShadow: '0 0 10px #ff6600, 0 0 20px #ff6600',
            fontWeight: 800,
            letterSpacing: '0.1em',
            textTransform: 'uppercase'
          }}>
          GTA GAMING
        </h1>
        <div className="mt-2 mx-auto flex justify-center space-x-2">
          <div className="h-1 w-16 bg-orange-500"></div>
          <div className="h-1 w-8 bg-orange-500"></div>
          <div className="h-1 w-4 bg-orange-500"></div>
        </div>
      </div>
      
      {/* Center content */}
      <div className="absolute inset-0 flex items-center justify-center z-20">
        <div className="max-w-lg w-full mx-auto px-6">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            style={{
              backgroundColor: 'rgba(0,0,0,0.8)',
              borderWidth: '2px',
              borderStyle: 'solid',
              borderColor: '#ff6600',
              padding: '1.5rem',
              boxShadow: '0 0 20px rgba(255, 102, 0, 0.5)'
            }}
          >
            <h2 className="text-2xl font-bold text-orange-400 uppercase tracking-wider mb-4">
              SELECT MODE
            </h2>
            
            <div className="space-y-4">
              <Link to="/video-upload">
                <motion.div 
                  className="border-2 border-orange-500 p-4 hover:bg-orange-900/30 transition-colors cursor-pointer"
                  whileHover={{ scale: 1.03, boxShadow: '0 0 15px rgba(255, 102, 0, 0.5)' }}
                  whileTap={{ scale: 0.98 }}
                >
                  <h3 className="text-xl font-bold text-orange-400 uppercase">STREAM UPLOAD</h3>
                  <p className="text-gray-400 mt-1">Upload your gameplay footage</p>
                </motion.div>
              </Link>
              
              <Link to="/post-form">
                <motion.div 
                  className="border-2 border-orange-500 p-4 hover:bg-orange-900/30 transition-colors cursor-pointer"
                  whileHover={{ scale: 1.03, boxShadow: '0 0 15px rgba(255, 102, 0, 0.5)' }}
                  whileTap={{ scale: 0.98 }}
                >
                  <h3 className="text-xl font-bold text-orange-400 uppercase">GAMING POST</h3>
                  <p className="text-gray-400 mt-1">Share your gaming highlights</p>
                </motion.div>
              </Link>
            </div>
            
            <div className="mt-6 gta-tip text-sm">
              <div className="gta-text-flicker text-orange-400">
                PRO TIP: {currentTip}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
      
      {/* GTA-style corners */}
      <div className="absolute top-4 right-4 border-2 border-orange-500 p-1 text-xs text-orange-500 z-20 font-bold tracking-wider opacity-80">
        LIVE
      </div>
      <div className="absolute bottom-4 left-4 border-2 border-orange-500 p-1 text-xs text-orange-500 z-20 font-bold tracking-wider opacity-80">
        GAMING MODE
      </div>
      
      {/* Loading bar */}
      <div className="absolute bottom-12 left-0 right-0 mx-auto w-3/4 max-w-screen-md z-20">
        <div className="console-loading"></div>
      </div>
      
      {/* Gaming controller buttons */}
      <div className="absolute bottom-4 right-4 flex space-x-2 z-20">
        <div className="w-6 h-6 rounded-full bg-orange-500 flex items-center justify-center text-xs font-bold">A</div>
        <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-xs font-bold">B</div>
        <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center text-xs font-bold">X</div>
        <div className="w-6 h-6 rounded-full bg-red-500 flex items-center justify-center text-xs font-bold">Y</div>
      </div>
    </div>
  );
};

export default GtaLanding;
