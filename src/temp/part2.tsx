// CSS for cosmic animations and effects
const cosmicStyles = `
  @keyframes floatAnimation {
    0% { transform: translateY(0px); }
    50% { transform: translateY(-10px); }
    100% { transform: translateY(0px); }
  }
  
  @keyframes pulseGlow {
    0% { box-shadow: 0 0 5px rgba(138, 43, 226, 0.4); }
    50% { box-shadow: 0 0 15px rgba(138, 43, 226, 0.7); }
    100% { box-shadow: 0 0 5px rgba(138, 43, 226, 0.4); }
  }
  
  @keyframes starTwinkle {
    0% { opacity: 0.2; }
    50% { opacity: 0.8; }
    100% { opacity: 0.2; }
  }
  
  @keyframes cosmicPulse {
    0% { transform: scale(1); opacity: 0.7; }
    50% { transform: scale(1.05); opacity: 0.9; }
    100% { transform: scale(1); opacity: 0.7; }
  }
  
  @keyframes nebulaDrift {
    0% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
    100% { background-position: 0% 50%; }
  }
  
  @keyframes cometTrail {
    0% { transform: translateX(-100%) translateY(-100%) rotate(45deg); opacity: 0; }
    30% { opacity: 0.7; }
    70% { opacity: 0.5; }
    100% { transform: translateX(200%) translateY(200%) rotate(45deg); opacity: 0; }
  }
  
  .cosmic-float {
    animation: floatAnimation 6s infinite ease-in-out;
  }
  
  .cosmic-pulse {
    animation: pulseGlow 3s infinite ease-in-out;
  }
  
  .cosmic-star {
    position: absolute;
    background-color: white;
    border-radius: 50%;
    width: 2px;
    height: 2px;
    animation: starTwinkle var(--twinkle-duration, 4s) infinite ease-in-out;
    animation-delay: var(--twinkle-delay, 0s);
    opacity: var(--star-opacity, 0.7);
  }
  
  .cosmic-button {
    position: relative;
    overflow: hidden;
    transition: all 0.3s ease;
    background: linear-gradient(135deg, rgba(128, 0, 128, 0.8), rgba(75, 0, 130, 0.8));
  }
  
  .cosmic-button::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
    transition: all 0.6s ease;
  }
  
  .cosmic-button:hover::before {
    left: 100%;
  }
  
  .cosmic-comet {
    position: absolute;
    width: 50px;
    height: 1px;
    background: linear-gradient(90deg, transparent, #fff, #fff, transparent);
    opacity: 0;
    animation: cometTrail 6s infinite ease-out;
    animation-delay: var(--comet-delay, 0s);
    box-shadow: 0 0 10px 1px rgba(255, 255, 255, 0.5);
    pointer-events: none;
  }
  
  .nebula-bg {
    background: linear-gradient(135deg, rgba(25, 25, 50, 0), rgba(60, 10, 80, 0.2), rgba(15, 15, 35, 0));
    background-size: 400% 400%;
    animation: nebulaDrift 15s infinite ease-in-out;
    position: absolute;
    inset: 0;
    z-index: -1;
  }
`;
