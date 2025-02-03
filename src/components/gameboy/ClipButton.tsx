import React from 'react';
import { Camera } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ClipButton = () => {
  const navigate = useNavigate();

  return (
    <button 
      onClick={() => navigate('/clipts/new')}
      className="clip-button active:scale-95 transition-transform"
      aria-label="Create Clipt"
      style={{ width: '80px', height: '60px' }}
    >
      <Camera className="clip-button-icon" />
      <span className="clip-button-text">Clipt</span>
    </button>
  );
};

export default ClipButton;