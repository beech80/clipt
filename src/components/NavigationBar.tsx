import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import '../styles/navigation-bar.css';

const NavigationBar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const getCurrentPage = () => {
    const path = location.pathname;
    if (path.includes('/clipts')) return 'clipts';
    if (path.includes('/squads-clipts')) return 'squads';
    if (path.includes('/discover')) return 'discovery';
    return '';
  };

  const currentPage = getCurrentPage();

  return (
    <div className="navigation-bar-container">
      {/* Center button removed as requested */}
      
      {/* Top-right buttons removed as requested */}
      
      {/* Bottom-right button removed as requested */}
    </div>
  );
};

export default NavigationBar;
