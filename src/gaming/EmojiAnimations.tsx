import React, { useState, useEffect, useRef } from 'react';

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

export default EmojiAnimations;
