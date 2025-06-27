import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

const CosmicDemo = () => {
  const navigate = useNavigate();
  
  // State for cosmic objects
  const [stars, setStars] = useState([]);
  const [planets, setPlanets] = useState([]);
  
  // Generate cosmic background
  useEffect(() => {
    // Generate stars
    const newStars = Array.from({ length: 100 }, () => ({
      top: `${Math.random() * 100}%`,
      left: `${Math.random() * 100}%`,
      size: `${Math.random() * 3 + 1}px`,
      opacity: Math.random() * 0.8 + 0.2,
      animationDuration: `${Math.random() * 3 + 2}s`,
      animationDelay: `${Math.random() * 2}s`,
    }));
    
    // Generate planets
    const newPlanets = Array.from({ length: 5 }, () => ({
      top: `${Math.random() * 100}%`,
      left: `${Math.random() * 100}%`,
      size: `${Math.random() * 30 + 20}px`,
      hue: Math.floor(Math.random() * 360),
      animationDuration: `${Math.random() * 10 + 20}s`,
    }));
    
    setStars(newStars);
    setPlanets(newPlanets);
  }, []);
  
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      background: 'linear-gradient(to bottom, #0f0524 0%, #1a0f33 50%, #250a46 100%)',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      color: '#fff',
      fontFamily: "'Orbitron', sans-serif"
    }}>
      {/* Cosmic Background */}
      <div style={{ position: 'absolute', width: '100%', height: '100%', overflow: 'hidden' }}>
        {/* Stars */}
        {stars.map((star, i) => (
          <div
            key={`star-${i}`}
            style={{
              position: 'absolute',
              top: star.top,
              left: star.left,
              width: star.size,
              height: star.size,
              borderRadius: '50%',
              backgroundColor: '#fff',
              opacity: star.opacity,
              animation: `twinkle ${star.animationDuration} infinite ${star.animationDelay}`,
            }}
          />
        ))}
        
        {/* Planets */}
        {planets.map((planet, i) => (
          <div
            key={`planet-${i}`}
            style={{
              position: 'absolute',
              top: planet.top,
              left: planet.left,
              width: planet.size,
              height: planet.size,
              borderRadius: '50%',
              background: `radial-gradient(circle at 30% 30%, hsl(${planet.hue}, 70%, 60%), hsl(${planet.hue}, 90%, 20%))`,
              boxShadow: `0 0 20px rgba(${planet.hue / 360 * 255}, ${100 + planet.hue / 360 * 155}, 255, 0.6)`,
              animation: `float ${planet.animationDuration} infinite alternate ease-in-out`,
            }}
          />
        ))}
        
        {/* Comet */}
        <div style={{
          position: 'absolute',
          top: '20%',
          left: '-5%',
          width: '150px',
          height: '3px',
          background: 'linear-gradient(to right, rgba(255,255,255,0) 0%, rgba(255,255,255,1) 100%)',
          boxShadow: '0 0 20px rgba(255,255,255,0.8)',
          borderRadius: '50%',
          animation: 'cometMove 15s infinite linear',
          transform: 'rotate(15deg)'
        }} />
      </div>
      
      {/* Content */}
      <div style={{
        zIndex: 10,
        textAlign: 'center',
        padding: '2rem',
        backdropFilter: 'blur(5px)',
        backgroundColor: 'rgba(20, 10, 40, 0.7)',
        borderRadius: '20px',
        border: '2px solid rgba(255, 255, 255, 0.1)',
        boxShadow: '0 0 30px rgba(128, 0, 255, 0.3)',
        width: '80%',
        maxWidth: '600px'
      }}>
        <h1 style={{
          fontSize: '3rem',
          margin: '0 0 1rem 0',
          textTransform: 'uppercase',
          fontWeight: 'bold',
          textShadow: '0 0 10px rgba(255, 128, 255, 0.8), 0 0 20px rgba(128, 0, 255, 0.5)',
          background: 'linear-gradient(to right, #ff00cc, #3333ff)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          letterSpacing: '3px'
        }}>Cosmic Space</h1>
        
        <p style={{
          fontSize: '1.2rem',
          marginBottom: '2rem',
          color: '#b8a8ff',
          textShadow: '0 0 5px rgba(184, 168, 255, 0.5)'
        }}>Connect with your cosmic squad in deep space</p>
        
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
          <button
            onClick={() => navigate('/cosmic-squad-chat')}
            style={{
              padding: '0.8rem 1.5rem',
              fontSize: '1rem',
              borderRadius: '30px',
              background: 'linear-gradient(to right, #9c27b0, #673ab7)',
              color: 'white',
              border: 'none',
              boxShadow: '0 0 15px rgba(156, 39, 176, 0.7)',
              cursor: 'pointer',
              fontFamily: "'Orbitron', sans-serif",
              transition: 'all 0.3s ease',
              textTransform: 'uppercase',
              letterSpacing: '1px'
            }}
            onMouseOver={e => {
              e.target.style.boxShadow = '0 0 25px rgba(156, 39, 176, 0.9)';
              e.target.style.transform = 'translateY(-3px)';
            }}
            onMouseOut={e => {
              e.target.style.boxShadow = '0 0 15px rgba(156, 39, 176, 0.7)';
              e.target.style.transform = 'translateY(0)';
            }}
          >
            Enter Chat
          </button>
          
          <button
            onClick={() => {
              toast.success("Exploring the cosmic universe!");
              setTimeout(() => navigate('/'), 1000);
            }}
            style={{
              padding: '0.8rem 1.5rem',
              fontSize: '1rem',
              borderRadius: '30px',
              background: 'transparent',
              color: '#e0cfff',
              border: '2px solid #7e57c2',
              boxShadow: '0 0 10px rgba(126, 87, 194, 0.4)',
              cursor: 'pointer',
              fontFamily: "'Orbitron', sans-serif",
              transition: 'all 0.3s ease',
              textTransform: 'uppercase',
              letterSpacing: '1px'
            }}
            onMouseOver={e => {
              e.target.style.boxShadow = '0 0 20px rgba(126, 87, 194, 0.6)';
              e.target.style.transform = 'translateY(-3px)';
              e.target.style.borderColor = '#9575cd';
            }}
            onMouseOut={e => {
              e.target.style.boxShadow = '0 0 10px rgba(126, 87, 194, 0.4)';
              e.target.style.transform = 'translateY(0)';
              e.target.style.borderColor = '#7e57c2';
            }}
          >
            Explore Universe
          </button>
        </div>
      </div>
      
      {/* CSS Animations */}
      <style>
        {`
          @keyframes twinkle {
            0%, 100% { opacity: 0.2; }
            50% { opacity: 1; }
          }
          
          @keyframes float {
            0% { transform: translateY(0) rotate(0deg); }
            50% { transform: translateY(-20px) rotate(5deg); }
            100% { transform: translateY(0) rotate(0deg); }
          }
          
          @keyframes cometMove {
            0% { transform: translateX(0) rotate(15deg); }
            100% { transform: translateX(200vw) rotate(15deg); }
          }
          
          @font-face {
            font-family: 'Orbitron';
            src: url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700&display=swap');
          }
        `}
      </style>
    </div>
  );
};

export default CosmicDemo;
