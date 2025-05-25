import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './cliptfinalprelaucnh.css';

const BackButton: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // List of paths where the back button should be hidden
  const hiddenPaths = [
    '/', // Home page
    '/login', // Login page
    '/loading', // Loading page
    '/signup' // Signup page
  ];
  
  // Check if current path is in the hidden paths list
  const shouldHideButton = hiddenPaths.includes(location.pathname);
  
  const handleBackClick = () => {
    navigate(-1); // Navigate back in history
  };

  // Don't render anything if we're on a path where the button should be hidden
  if (shouldHideButton) {
    return null;
  }
  
  return (
    <div className="back-button-container">
      <button 
        className="back-button" 
        onClick={handleBackClick}
        aria-label="Go back"
        style={{
          background: 'none',
          border: 'none',
          padding: 0,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          width="28" 
          height="28" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="#FFFFFF" 
          strokeWidth="2.5" 
          strokeLinecap="round" 
          strokeLinejoin="round"
        >
          <path d="M19 12H5" />
          <path d="M12 19l-7-7 7-7" />
        </svg>
      </button>
    </div>
  );
};

export default BackButton;
