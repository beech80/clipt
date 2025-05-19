import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import '../GTA.css';

/**
 * MainGamingPage - A GTA-style gaming and streaming interface
 * This component creates an immersive gaming experience similar to GTA
 * loading screens with modern streaming platform elements
 */
const MainGamingPage: React.FC = () => {
  // Gaming tips rotation
  const gamingTips = [
    "Stream regularly to build your gaming audience",
    "Interact with viewers to increase engagement",
    "Use hashtags to reach more gaming viewers",
    "Collaborate with other streamers to grow faster",
    "Set a consistent streaming schedule",
    "Upgrade your gaming gear for better quality"
  ];
  
  const [currentTip, setCurrentTip] = useState(gamingTips[0]);
  
  // Prevent scrolling
  useEffect(() => {
    // Apply scroll prevention directly
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.width = '100%';
    document.body.style.height = '100%';
    
    // Add targeted CSS to ensure the component is visible
    const styleElement = document.createElement('style');
    styleElement.innerHTML = `
      body, html {
        overflow: hidden !important;
        position: fixed !important;
        width: 100% !important;
        height: 100% !important;
        margin: 0 !important;
        padding: 0 !important;
      }
      
      #root {
        background-color: #141414 !important;
        overflow: hidden !important;
      }
      
      .gaming-page {
        position: fixed !important;
        top: 0 !important;
        left: 0 !important;
        right: 0 !important;
        bottom: 0 !important;
        z-index: 9999 !important;
        width: 100vw !important;
        height: 100vh !important;
        background-color: #141414 !important;
        display: flex !important;
        flex-direction: column !important;
        justify-content: center !important;
        align-items: center !important;
      }
    `;
    document.head.appendChild(styleElement);
    
    // Rotate gaming tips
    const tipInterval = setInterval(() => {
      const nextIndex = (gamingTips.indexOf(currentTip) + 1) % gamingTips.length;
      setCurrentTip(gamingTips[nextIndex]);
    }, 3000);
    
    return () => {
      // Clean up
      clearInterval(tipInterval);
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
      document.body.style.height = '';
      styleElement.remove();
    };
  }, [currentTip, gamingTips]);

  return (
    <div className="gaming-page" style={{
      backgroundColor: '#141414',
      color: 'white',
      fontFamily: '"Roboto", "Helvetica", sans-serif'
    }}>
      {/* Gaming perspective grid */}
      <div style={{
        position: 'absolute',
        inset: 0,
        backgroundImage: `
          linear-gradient(rgba(255, 102, 0, 0.3) 1px, transparent 1px),
          linear-gradient(90deg, rgba(255, 102, 0, 0.3) 1px, transparent 1px)
        `,
        backgroundSize: '20px 20px',
        backgroundPosition: 'center center',
        transform: 'perspective(500px) rotateX(60deg)',
        opacity: 0.3,
        zIndex: 1
      }}/>
      
      {/* Gaming animation line */}
      <motion.div
        style={{
          position: 'absolute',
          height: '2px',
          width: '100%',
          background: 'linear-gradient(to right, transparent, #ff6600, transparent)',
          zIndex: 5
        }}
        animate={{
          top: ['-10%', '110%']
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "linear"
        }}
      />
      
      {/* Gaming cityscape */}
      <div style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: '30%',
        background: 'linear-gradient(to top, #000000, transparent)',
        zIndex: 10
      }}>
        <div style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: '40px',
          overflow: 'hidden'
        }}>
          <svg viewBox="0 0 1200 120" preserveAspectRatio="none" style={{width: '100%', height: '100%'}}>
            <path d="M0,0 L50,0 L60,20 L70,0 L80,15 L90,0 L100,25 L120,5 L140,15 L160,0 L180,20 L200,0 L220,10 L240,0 L260,20 L280,0 L300,15 L320,0 L340,25 L360,0 L380,15 L400,0 L420,20 L440,0 L460,10 L480,0 L500,20 L520,0 L540,15 L560,0 L580,25 L600,0 L620,15 L640,0 L660,20 L680,0 L700,10 L720,0 L740,20 L760,0 L780,15 L800,0 L820,25 L840,0 L860,15 L880,0 L900,20 L920,0 L940,10 L960,0 L980,20 L1000,0 L1020,15 L1040,0 L1060,25 L1080,0 L1100,15 L1120,0 L1140,20 L1160,0 L1180,10 L1200,0 L1200,120 L0,120 Z" fill="#000000"/>
          </svg>
        </div>
      </div>
      
      {/* Page header */}
      <div style={{
        position: 'absolute',
        top: '8%',
        left: 0,
        right: 0,
        textAlign: 'center',
        zIndex: 20
      }}>
        <motion.h1
          style={{
            fontSize: '3.5rem',
            fontWeight: 800,
            color: '#ff6600',
            textShadow: '0 0 10px #ff6600, 0 0 20px #ff6600',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            margin: 0
          }}
          animate={{
            opacity: [1, 0.8, 1, 0.7, 1]
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            repeatType: 'loop'
          }}
        >
          GTA GAMING
        </motion.h1>
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '8px',
          marginTop: '8px'
        }}>
          <div style={{height: '4px', width: '64px', backgroundColor: '#ff6600'}}/>
          <div style={{height: '4px', width: '32px', backgroundColor: '#ff6600'}}/>
          <div style={{height: '4px', width: '16px', backgroundColor: '#ff6600'}}/>
        </div>
      </div>
      
      {/* Main menu */}
      <div style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 20
      }}>
        <motion.div
          style={{
            maxWidth: '500px',
            width: '90%',
            backgroundColor: 'rgba(0,0,0,0.8)',
            border: '2px solid #ff6600',
            padding: '24px',
            boxShadow: '0 0 20px rgba(255, 102, 0, 0.5)'
          }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h2 style={{
            fontSize: '1.5rem',
            fontWeight: 'bold',
            color: '#ff9933',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            marginBottom: '16px'
          }}>
            SELECT MODE
          </h2>
          
          <div style={{display: 'flex', flexDirection: 'column', gap: '16px'}}>
            <Link to="/video-upload" style={{textDecoration: 'none'}}>
              <motion.div 
                style={{
                  border: '2px solid #ff6600',
                  padding: '16px',
                  cursor: 'pointer'
                }}
                whileHover={{
                  backgroundColor: 'rgba(255, 102, 0, 0.2)',
                  boxShadow: '0 0 15px rgba(255, 102, 0, 0.5)'
                }}
                whileTap={{ scale: 0.98 }}
              >
                <h3 style={{
                  fontSize: '1.25rem',
                  fontWeight: 'bold',
                  color: '#ff9933',
                  textTransform: 'uppercase',
                  margin: 0
                }}>
                  STREAM UPLOAD
                </h3>
                <p style={{color: '#999999', marginTop: '4px', fontSize: '0.875rem'}}>
                  Upload your gameplay footage
                </p>
              </motion.div>
            </Link>
            
            <Link to="/post-form" style={{textDecoration: 'none'}}>
              <motion.div 
                style={{
                  border: '2px solid #ff6600',
                  padding: '16px',
                  cursor: 'pointer'
                }}
                whileHover={{
                  backgroundColor: 'rgba(255, 102, 0, 0.2)',
                  boxShadow: '0 0 15px rgba(255, 102, 0, 0.5)'
                }}
                whileTap={{ scale: 0.98 }}
              >
                <h3 style={{
                  fontSize: '1.25rem',
                  fontWeight: 'bold',
                  color: '#ff9933',
                  textTransform: 'uppercase',
                  margin: 0
                }}>
                  GAMING POST
                </h3>
                <p style={{color: '#999999', marginTop: '4px', fontSize: '0.875rem'}}>
                  Share your gaming highlights
                </p>
              </motion.div>
            </Link>
          </div>
          
          <div style={{
            marginTop: '24px',
            borderLeft: '4px solid #ff6600',
            padding: '8px 12px',
            backgroundColor: 'rgba(0, 0, 0, 0.5)'
          }}>
            <motion.div
              style={{
                color: '#ff9933',
                fontSize: '0.875rem',
                fontFamily: 'monospace'
              }}
              animate={{
                opacity: [1, 0.7, 1]
              }}
              transition={{
                duration: 2,
                repeat: Infinity
              }}
            >
              PRO TIP: {currentTip}
            </motion.div>
          </div>
        </motion.div>
      </div>
      
      {/* Game status indicators */}
      <div style={{
        position: 'absolute',
        top: '16px',
        right: '16px',
        border: '2px solid #ff6600',
        padding: '4px 8px',
        color: '#ff6600',
        fontSize: '0.75rem',
        fontWeight: 'bold',
        letterSpacing: '0.05em',
        opacity: 0.8,
        zIndex: 20
      }}>
        LIVE
      </div>
      
      <div style={{
        position: 'absolute',
        bottom: '16px',
        left: '16px',
        border: '2px solid #ff6600',
        padding: '4px 8px',
        color: '#ff6600',
        fontSize: '0.75rem',
        fontWeight: 'bold',
        letterSpacing: '0.05em',
        opacity: 0.8,
        zIndex: 20
      }}>
        GAMING MODE
      </div>
      
      {/* Loading bar */}
      <div style={{
        position: 'absolute',
        bottom: '48px',
        left: '12.5%',
        width: '75%',
        maxWidth: '800px',
        zIndex: 20
      }}>
        <motion.div
          style={{
            height: '6px',
            background: 'linear-gradient(to right, #ff6600, #ff3300)',
            boxShadow: '0 0 10px #ff6600'
          }}
          animate={{
            width: ['0%', '100%']
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'linear'
          }}
        />
      </div>
      
      {/* Gaming controller buttons */}
      <div style={{
        position: 'absolute',
        bottom: '16px',
        right: '16px',
        display: 'flex',
        gap: '8px',
        zIndex: 20
      }}>
        {[
          {label: 'A', color: '#ff6600'},
          {label: 'B', color: '#3b82f6'},
          {label: 'X', color: '#22c55e'},
          {label: 'Y', color: '#ef4444'}
        ].map((button, i) => (
          <div key={i} style={{
            width: '24px',
            height: '24px',
            borderRadius: '50%',
            backgroundColor: button.color,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '0.75rem',
            fontWeight: 'bold',
            color: 'white'
          }}>
            {button.label}
          </div>
        ))}
      </div>
      
      {/* Game notifications */}
      {[0, 1, 2, 3, 4].map((i) => (
        <motion.div
          key={i}
          style={{
            position: 'absolute',
            right: '-100px',
            top: `${20 + i * 8}%`,
            backgroundColor: 'rgba(255, 102, 0, 0.8)',
            color: 'white',
            fontSize: '0.75rem',
            fontWeight: 'bold',
            padding: '4px 8px',
            borderRadius: '4px',
            zIndex: 20
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
    </div>
  );
};

export default MainGamingPage;
