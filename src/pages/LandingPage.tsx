import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, useAnimation } from 'framer-motion';
import { Gamepad2, Sparkles, Zap, Video, Trophy, Share2, Flame, Music, Globe, Tv, Film, Send, Rocket, Camera } from 'lucide-react';
import confetti from 'canvas-confetti';
import '@/styles/landing-animations.css';
import '@/styles/galaxy-animations.css';

// Emoji Animation Component
const EmojiAnimations: React.FC = () => {
  const [emojis, setEmojis] = useState<React.ReactNode[]>([]);
  const [popEmojis, setPopEmojis] = useState<React.ReactNode[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Game & streaming themed emojis
  const gameEmojis = ['🎮', '🕹️', '👾', '🎯', '🏆', '💯', '🎲', '🔥', '⚡', '🚀'];
  const techEmojis = ['🎥', '📱', '💻', '🔊', '🎧', '📸', '🎬', '📹', '💿', '🎤'];
  const popEmojisSet = ['✨', '🌟', '⭐', '💫', '🔥', '❤️', '🔴', '🟣', '🔵'];
  
  // Create a floating emoji
  const createFloatingEmoji = () => {
    const containerWidth = containerRef.current?.clientWidth || window.innerWidth;
    const containerHeight = containerRef.current?.clientHeight || window.innerHeight;
    
    // Random emoji set selection
    const emojiSet = Math.random() > 0.5 ? gameEmojis : techEmojis;
    const emoji = emojiSet[Math.floor(Math.random() * emojiSet.length)];
    
    // Random position, timing and rotation
    const startX = Math.random() * containerWidth;
    const startY = containerHeight + 100;
    const endX = startX + (Math.random() * 500 - 250);
    const endY = -100;
    const scale = 0.5 + Math.random() * 1.5;
    const duration = 5 + Math.random() * 10;
    const delay = Math.random() * 2;
    const startRotate = Math.random() * 60 - 30;
    const endRotate = Math.random() * 60 - 30;
    
    return (
      <div 
        key={`emoji-${Date.now()}-${Math.random()}`}
        className="floating-emoji"
        style={{
          '--float-duration': `${duration}s`,
          '--float-delay': `${delay}s`,
          '--start-x': `${startX}px`,
          '--start-y': `${startY}px`,
          '--end-x': `${endX}px`,
          '--end-y': `${endY}px`,
          '--emoji-scale': `${scale}`,
          '--start-rotate': `${startRotate}deg`,
          '--end-rotate': `${endRotate}deg`,
          position: 'absolute',
          left: 0,
          top: 0,
        } as React.CSSProperties}
      >
        {emoji}
      </div>
    );
  };

  // Create a pop-in emoji
  const createPopEmoji = () => {
    const containerWidth = containerRef.current?.clientWidth || window.innerWidth;
    const containerHeight = containerRef.current?.clientHeight || window.innerHeight;
    
    const x = Math.random() * containerWidth;
    const y = Math.random() * containerHeight;
    const emoji = popEmojisSet[Math.floor(Math.random() * popEmojisSet.length)];
    const duration = 1 + Math.random() * 2;
    
    return (
      <div 
        key={`pop-${Date.now()}-${Math.random()}`}
        className="emoji-pop"
        style={{
          '--pop-duration': `${duration}s`,
          left: `${x}px`,
          top: `${y}px`,
        } as React.CSSProperties}
      >
        {emoji}
      </div>
    );
  };

  // Add new floating emojis periodically
  useEffect(() => {
    const floatingInterval = setInterval(() => {
      setEmojis(prev => [...prev, createFloatingEmoji()]);
      // Limit the number of simultaneous emojis to avoid performance issues
      if (emojis.length > 20) {
        setEmojis(prev => prev.slice(1));
      }
    }, 500); // More frequent emojis
    
    const popInterval = setInterval(() => {
      setPopEmojis(prev => [...prev, createPopEmoji()]);
      // Limit the number of pop emojis
      if (popEmojis.length > 12) {
        setPopEmojis(prev => prev.slice(1));
      }
    }, 400); // More frequent pop effects
    
    // Add event listeners to create emoji pops on mouse move and click
    const handleMouseMove = (e: MouseEvent) => {
      if (Math.random() > 0.92) { // Occasionally spawn on mouse move
        setPopEmojis(prev => [
          ...prev, 
          <div 
            key={`pop-mouse-${Date.now()}`}
            className="emoji-pop"
            style={{
              '--pop-duration': `1.5s`,
              left: `${e.clientX}px`,
              top: `${e.clientY}px`,
            } as React.CSSProperties}
          >
            {popEmojisSet[Math.floor(Math.random() * popEmojisSet.length)]}
          </div>
        ]);
      }
    };
    
    const handleClick = (e: MouseEvent) => {
      // Burst of emojis on click
      for (let i = 0; i < 5; i++) {
        setPopEmojis(prev => [
          ...prev, 
          <div 
            key={`pop-click-${Date.now()}-${i}`}
            className="emoji-pop"
            style={{
              '--pop-duration': `${1 + Math.random()}s`,
              left: `${e.clientX + (Math.random() * 100 - 50)}px`,
              top: `${e.clientY + (Math.random() * 100 - 50)}px`,
            } as React.CSSProperties}
          >
            {popEmojisSet[Math.floor(Math.random() * popEmojisSet.length)]}
          </div>
        ]);
      }
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('click', handleClick);
    
    return () => {
      clearInterval(floatingInterval);
      clearInterval(popInterval);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('click', handleClick);
    };
  }, [emojis.length, popEmojis.length]);

  return (
    <div ref={containerRef} className="emoji-container">
      {emojis}
      {popEmojis}
    </div>
  );
};

const LandingPage = () => {
  const navigate = useNavigate();
  const [startAnimation, setStartAnimation] = useState(false);
  const [showParticles, setShowParticles] = useState(false);
  const confettiCanvasRef = useRef<HTMLCanvasElement>(null);
  const controls = useAnimation();
  const [hover, setHover] = useState(false);

  useEffect(() => {
    // Start the animation when the component mounts
    setTimeout(() => {
      setShowParticles(true);
    }, 1000);

    // Pulse animation
    controls.start({
      scale: [1, 1.05, 1],
      transition: {
        duration: 2,
        repeat: Infinity,
        repeatType: "reverse"
      }
    });

    // Create meteor animations
    const meteors = document.querySelectorAll('.meteor');
    meteors.forEach(meteor => {
      const delay = Math.random() * 10;
      const top = Math.random() * 100;
      const left = Math.random() * 100;
      meteor.setAttribute('style', `--delay: ${delay}; --top: ${top}; --left: ${left}`);
    });

    // Create planet animations
    const planets = document.querySelectorAll('.planet');
    planets.forEach(planet => {
      const delay = Math.random() * 5;
      const top = 10 + Math.random() * 80;
      const left = 10 + Math.random() * 80;
      const size = 20 + Math.random() * 60;
      const float = 5 + Math.random() * 15;
      const rotation = Math.random() * 360;
      planet.setAttribute('style', `--delay: ${delay}; --top: ${top}; --left: ${left}; --size: ${size}; --float: ${float}; --rotation: ${rotation}; --color-light: ${getRandomColor(0.7)}; --color-dark: ${getRandomColor(0.3)}`);
    });
  }, [controls]);

  // Helper function to generate random colors for planets
  const getRandomColor = (opacity = 1) => {
    const colors = [
      `rgba(255, 100, 100, ${opacity})`,
      `rgba(100, 100, 255, ${opacity})`,
      `rgba(100, 255, 100, ${opacity})`,
      `rgba(255, 100, 255, ${opacity})`,
      `rgba(255, 180, 100, ${opacity})`,
      `rgba(100, 255, 255, ${opacity})`,
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  };

  // Create floating particles
  const createParticle = () => {
    const particle = document.createElement('div');
    particle.classList.add('particle');
    
    // Random size between 3-8px
    const size = Math.random() * 5 + 3;
    particle.style.width = `${size}px`;
    particle.style.height = `${size}px`;
    
    // Random position
    const posX = Math.random() * window.innerWidth;
    const posY = Math.random() * window.innerHeight;
    particle.style.left = `${posX}px`;
    particle.style.top = `${posY}px`;
    
    // Random color
    const colors = ['#8A2BE2', '#9400D3', '#9932CC', '#BA55D3', '#DA70D6'];
    particle.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
    
    document.body.appendChild(particle);
    
    // Animate and remove
    setTimeout(() => {
      particle.style.opacity = '0';
      setTimeout(() => {
        document.body.removeChild(particle);
      }, 1000);
    }, 2000);
  };

  // Add particles effect
  useEffect(() => {
    if (showParticles) {
      const interval = setInterval(() => {
        createParticle();
      }, 200);
      
      return () => clearInterval(interval);
    }
  }, [showParticles]);

  const handleEnterApp = () => {
    setStartAnimation(true);
    
    // Create mega confetti effect with emojis
    for (let i = 0; i < 3; i++) {
      setTimeout(() => {
        confetti({
          particleCount: 150,
          spread: 100,
          origin: { y: 0.6 },
          colors: ['#ff00ff', '#00ffff', '#ffff00', '#ff8800', '#ff0088']
        });
      }, i * 200); // Multiple bursts of confetti
    }

    // Create emoji explosion
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;
    const emojisToAdd = [];
    
    // Add 30 emojis bursting from center
    for (let i = 0; i < 30; i++) {
      const angle = Math.random() * Math.PI * 2;
      const distance = 100 + Math.random() * 200;
      const x = centerX + Math.cos(angle) * distance;
      const y = centerY + Math.sin(angle) * distance;
      const scale = 0.5 + Math.random() * 2;
      const duration = 1 + Math.random() * 1.5;
      
      // Mix of game and tech emojis for the explosion
      const allEmojis = ['🎮', '🕹️', '👾', '🎯', '🏆', '💯', '🞲', '🔥', '⚡', '🚀', '🎥', '📱', '💻', '🎧', '📸', '🎬'];
      const emoji = allEmojis[Math.floor(Math.random() * allEmojis.length)];
      
      emojisToAdd.push(
        <div 
          key={`exp-${Date.now()}-${i}`}
          className="emoji-pop"
          style={{
            '--pop-duration': `${duration}s`,
            left: `${x}px`,
            top: `${y}px`,
            fontSize: `${scale * 30}px`,
          } as React.CSSProperties}
        >
          {emoji}
        </div>
      );
    }

    // Add the emoji explosion to the page
    document.querySelector('.emoji-container')?.appendChild(
      Object.assign(document.createElement('div'), {
        id: 'emoji-explosion',
        style: 'position: absolute; inset: 0; z-index: 100;',
        innerHTML: emojisToAdd.map(e => e.props.children).join('')
      })
    );

    // Series of game sounds with increasing pitch
    const audioContext = new window.AudioContext();
    const playTone = (frequency, startTime, duration) => {
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      oscillator.type = 'square';
      oscillator.frequency.value = frequency;
      gainNode.gain.value = 0.1;
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      oscillator.start(startTime);
      oscillator.stop(startTime + duration);
    };

    // Play a more impressive sequence of notes
    const now = audioContext.currentTime;
    playTone(220, now, 0.1);
    playTone(330, now + 0.1, 0.1);
    playTone(440, now + 0.2, 0.1);
    playTone(660, now + 0.3, 0.1);
    playTone(880, now + 0.4, 0.2);
    playTone(1100, now + 0.6, 0.3);
    
    // Fire confetti for gaming celebration
    if (confettiCanvasRef.current) {
      confetti.create(confettiCanvasRef.current, {
        resize: true,
        useWorker: true
      })({
        particleCount: 200,
        spread: 160,
        origin: { y: 0.5 },
        colors: ['#ff00ff', '#00ffff', '#ff00aa', '#aa00ff', '#00aaff']
      });
    }
    
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
        <div className="animated-bg"></div>
        <EmojiAnimations />
        
      
      {/* Cosmic Effects - No grid needed */}
      
      {/* Retro effects */}
      <div className="retro-scanline"></div>
      <div className="retro-vhs"></div>
      <div className="crt-effect"></div>
      <div className="static-overlay"></div>

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
            <motion.div 
              animate={controls}
              className="crt-flicker"
            >
              <div className="text-9xl font-bold mega-retro-text mb-2 glow-text">
                CLIPT
              </div>
              <motion.div 
                className="text-2xl tracking-widest font-mono mb-6 text-cyan-400 flex justify-center items-center gap-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8, duration: 0.5 }}
              >
                <span className="bg-gradient-to-r from-purple-500 to-cyan-400 p-1 px-3 skew-x-[-15deg] inline-block">
                  MORE THAN GAMING
                </span>
              </motion.div>
              
              <div className="grid grid-cols-3 gap-6 mt-8 w-full max-w-3xl">
                <div className="glitch-hover bg-black/30 p-5 border border-purple-500/30 rounded-sm flex flex-col items-center text-center space-y-3">
                  <Gamepad2 size={30} className="text-purple-400" />
                  <div className="text-lg font-semibold text-white">GAMING</div>
                </div>
                <div className="glitch-hover bg-black/30 p-5 border border-purple-500/30 rounded-sm flex flex-col items-center text-center space-y-3">
                  <Video size={30} className="text-blue-400" />
                  <div className="text-lg font-semibold text-white">STREAMING</div>
                </div>
                <div className="glitch-hover bg-black/30 p-5 border border-purple-500/30 rounded-sm flex flex-col items-center text-center space-y-3">
                  <Camera size={30} className="text-red-400" />
                  <div className="text-lg font-semibold text-white">CAPTURE</div>
                </div>
              </div>

              <button 
                onClick={handleEnterApp}
                className="modern-button px-8 py-3 flex items-center gap-2 text-white font-bold text-xl uppercase tracking-wider rounded-sm mt-8">
                START GAME <Gamepad2 size={20} />
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Retro pixelated elements */}
      <div className="absolute w-full h-full pointer-events-none">
        {Array.from({ length: 50 }).map((_, index) => {
          const size = Math.random() * 8 + 2;
          return (
            <motion.div
              key={index}
              className="absolute bg-cyan-500"
              style={{
                width: `${size}px`,
                height: `${size}px`,
                filter: 'blur(0.5px)',
                opacity: Math.random() * 0.5 + 0.3
              }}
              initial={{ 
                x: Math.random() * window.innerWidth, 
                y: Math.random() * window.innerHeight,
                opacity: 0,
              }}
              animate={{ 
                y: [null, window.innerHeight + 100],
                opacity: [0, 1, 0],
                x: [null, Math.random() * 100 - 50]
              }}
              transition={{
                duration: Math.random() * 10 + 10,
                repeat: Infinity,
                delay: Math.random() * 5,
                ease: "linear"
              }}
            />
          );
        })}
        
        {/* Gaming elements - floating gamepad outlines */}
        {Array.from({ length: 8 }).map((_, index) => {
          const icons = ['🎮', '🎯', '🎬', '🎥', '📱', '💻', '🎧', '🕹️'];
          const colors = ['text-pink-500', 'text-cyan-500', 'text-purple-500', 'text-yellow-500'];
          return (
            <motion.div
              key={`game-icon-${index}`}
              className={`absolute text-4xl opacity-60 ${colors[index % colors.length]}`}
              style={{
                textShadow: '0 0 10px currentColor',
                transform: 'perspective(500px)',
              }}
              initial={{ 
                x: Math.random() * window.innerWidth, 
                y: Math.random() * window.innerHeight,
                opacity: 0,
                rotateY: 0,
                rotateX: 0,
                z: -100
              }}
              animate={{ 
                y: [null, Math.random() * window.innerHeight],
                x: [null, Math.random() * window.innerWidth],
                opacity: [0, 0.6, 0],
                rotateY: [0, 360],
                rotateX: [0, 360],
                z: [-100, 100, -100]
              }}
              transition={{
                duration: Math.random() * 15 + 20,
                repeat: Infinity,
                delay: Math.random() * 5,
                ease: "easeInOut"
              }}
            >
              {icons[index % icons.length]}
            </motion.div>
          );
        })}
        
        {/* 3D Grid lines */}
        {Array.from({ length: 8 }).map((_, index) => {
          const direction = index % 2 === 0 ? 'horizontal' : 'vertical';
          const position = -400 + index * 100;
          
          return (
            <motion.div
              key={`grid-line-${index}`}
              className="absolute bg-gradient-to-r from-transparent via-pink-500/30 to-transparent"
              style={{
                width: direction === 'horizontal' ? '150%' : '2px',
                height: direction === 'horizontal' ? '2px' : '150%',
                left: direction === 'horizontal' ? '-25%' : `${(index * 15) % 100}%`,
                top: direction === 'vertical' ? '-25%' : `${(index * 15) % 100}%`,
                opacity: 0.2
              }}
              initial={{
                z: -1000,
                opacity: 0
              }}
              animate={{
                z: 500,
                opacity: [0, 0.6, 0]
              }}
              transition={{
                duration: 8 + index,
                repeat: Infinity,
                delay: index * 0.5,
                ease: "linear"
              }}
            />
          );
        })}
      </div>

      {/* Exit animation overlay */}
      <AnimatePresence>
        {startAnimation && (
          <motion.div 
            className="fixed inset-0 z-40 bg-black flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="retro-grid absolute inset-0 opacity-70 z-0"></div>
            <div className="retro-scanline absolute inset-0 z-1"></div>
            <div className="crt-effect absolute inset-0 z-2"></div>
            
            <motion.div
              initial={{ scale: 1, opacity: 0 }}
              animate={{ 
                scale: [1, 20], 
                opacity: [0, 1, 0] 
              }}
              transition={{ duration: 2 }}
              className="z-20 relative"
            >
              <div className="flex flex-col items-center justify-center space-y-6 z-10 relative">            
                <div className="text-7xl font-bold mega-retro-text" data-text="CLIPT">CLIPT</div>
                <div className="modern-slogan">
                  MORE THAN GAMING
                </div>
                
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                  <motion.div
                    className="border-2 border-cyan-500 w-[200px] h-[200px] rounded-full"
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{
                      opacity: [0, 1, 0],
                      scale: [0, 1, 10],
                      borderWidth: [2, 0]
                    }}
                    transition={{ duration: 2, ease: "easeOut" }}
                  />
                </div>
              </div>
            </motion.div>
            
            {/* Stream start animation */}
            <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
              {/* Camera frame lines */}
              <motion.div
                className="absolute"
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 1, 0] }}
                transition={{ duration: 1.5, delay: 0.2 }}
              >
                {/* Recording indicators */}
                <motion.div 
                  className="absolute top-[20%] left-[20%] h-10 w-10 rounded-full flex items-center justify-center border-2 border-red-500"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: [0, 1, 0], scale: [0.8, 1.2, 0.8] }}
                  transition={{ duration: 1, repeat: 2, repeatType: "reverse" }}
                >
                  <div className="h-5 w-5 bg-red-500 rounded-full animate-pulse"></div>
                </motion.div>
                
                <motion.div
                  className="absolute top-[30%] right-[25%] flex flex-col items-start gap-1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: [0, 1, 0], x: [20, 0, -20] }}
                  transition={{ duration: 1.5 }}
                >
                  <div className="text-xs font-mono text-pink-500">REC</div>
                  <div className="text-xs font-mono text-cyan-500">LOADING GAME...</div>
                  <div className="h-1 w-24 bg-gray-800">
                    <motion.div 
                      className="h-full bg-cyan-500" 
                      initial={{ width: '0%' }}
                      animate={{ width: '100%' }}
                      transition={{ duration: 1.5 }}
                    />
                  </div>
                </motion.div>
              </motion.div>
              
              {/* Digital line effect */}
              {Array.from({ length: 30 }).map((_, i) => {
                const y = -400 + i * 30;
                const delay = i * 0.03;
                
                return (
                  <motion.div
                    key={i}
                    className="absolute bg-pink-500 h-[1px] w-screen left-0"
                    style={{
                      top: `${y}px`,
                      opacity: 0.7,
                      filter: 'blur(0.5px)'
                    }}
                    animate={{
                      scaleX: [0, 1.2],
                      x: ['-100%', '10%']
                    }}
                    transition={{
                      duration: 0.3,
                      delay: delay,
                      ease: "easeOut"
                    }}
                  />
                );
              })}
              
              {/* Vertical lines */}
              {Array.from({ length: 40 }).map((_, i) => {
                const x = -800 + i * 40;
                const delay = 0.8 + i * 0.01;
                
                return (
                  <motion.div
                    key={`v-${i}`}
                    className="absolute bg-cyan-500 w-[1px] h-screen top-0"
                    style={{
                      left: `${x}px`,
                      opacity: 0.4
                    }}
                    animate={{
                      scaleY: [0, 1.2],
                      y: ['-100%', '10%']
                    }}
                    transition={{
                      duration: 0.3,
                      delay: delay,
                      ease: "easeOut"
                    }}
                  />
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default LandingPage;
