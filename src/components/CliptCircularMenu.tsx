import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, Camera, Home, Settings } from 'lucide-react';
import '../styles/rainbow-clipt-buttons.css';

const CliptCircularMenu: React.FC = () => {
  const navigate = useNavigate();
  
  return (
    <>
      {/* Central CLIPT logo with rainbow border */}
      <div className="fixed bottom-20 left-1/2 transform -translate-x-1/2 z-50">
        <button 
          className="clipt-button"
          style={{ 
            width: '70px', 
            height: '70px',
            background: 'rgba(20, 20, 40, 0.9)',
            fontSize: '14px',
            fontWeight: 'bold'
          }}
          onClick={() => navigate('/clipts')}
        >
          CLIPT
        </button>
      </div>
      
      {/* Menu button with rainbow border - Left */}
      <div className="fixed bottom-10 left-[calc(50%-80px)] z-50">
        <button 
          className="clipt-button"
          onClick={() => navigate('/menu')}
        >
          <Menu size={24} />
        </button>
      </div>
      
      {/* Camera button with rainbow border - Right */}
      <div className="fixed bottom-10 left-[calc(50%+20px)] z-50">
        <button 
          className="clipt-button"
          onClick={() => navigate('/camera')}
        >
          <Camera size={24} />
        </button>
      </div>
      
      {/* Optional additional buttons if needed */}
      {/* Home button */}
      <div className="fixed bottom-32 left-[calc(50%-30px)] z-50">
        <button 
          className="clipt-button"
          style={{
            width: '55px',
            height: '55px'
          }}
          onClick={() => navigate('/')}
        >
          <Home size={24} />
        </button>
      </div>
      
      {/* Settings button */}
      <div className="fixed bottom-32 left-[calc(50%+30px)] z-50">
        <button 
          className="clipt-button"
          style={{
            width: '55px',
            height: '55px'
          }}
          onClick={() => navigate('/settings')}
        >
          <Settings size={24} />
        </button>
      </div>
    </>
  );
};

export default CliptCircularMenu;
