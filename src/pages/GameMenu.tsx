import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Settings, Search, Film, Home, User, MessageSquare, 
  Users, Gamepad, Sparkles, ChevronRight, Layers, Award
} from 'lucide-react';
import '../styles/game-dashboard.css';

const GameMenu: React.FC = () => {
  const navigate = useNavigate();
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  
  // Define app pages
  const appPages = [
    { id: 1, name: 'Settings', path: '/settings', icon: Settings, description: 'Configure your experience' },
    { id: 2, name: 'Profile', path: '/profile', icon: User, description: 'View your profile and stats' },
    { id: 3, name: 'DISCOVERY PAGE', path: '/discover', icon: Search, description: 'Discover your new favorite streamer' },
    { id: 4, name: 'Clipts', path: '/clipts', icon: Film, description: 'View short gaming clips' },
    { id: 5, name: 'Streaming', path: '/streams', icon: Layers, description: 'Watch live streams' },
    { id: 6, name: 'Squads Clipts', path: '/squads-clipts', icon: Users, description: 'View your squad\'s best clips' },
    { id: 7, name: 'Top Clipts', path: '/top-clipts', icon: Sparkles, description: 'Hall of fame clips' }
  ];

  const handleNavigation = (path: string) => {
    navigate(path);
  };
  
  useEffect(() => {
    // Add background animation effect
    const handleMouseMove = (e: MouseEvent) => {
      const x = e.clientX / window.innerWidth;
      const y = e.clientY / window.innerHeight;
      
      document.documentElement.style.setProperty('--mouse-x', x.toString());
      document.documentElement.style.setProperty('--mouse-y', y.toString());
    };
    
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div className="menu-container">
      {/* Animated background */}
      <div className="menu-bg">
        <div className="menu-particles"></div>
        <div className="menu-glow"></div>
      </div>
      
      {/* App Logo */}
      <div className="menu-header">
        <div className="app-logo">
          <Sparkles size={32} className="logo-icon" />
          <h1 className="logo-text">CLIPT</h1>
        </div>
      </div>
      
      {/* Main Navigation Menu */}
      <div className="main-navigation">
        {appPages.map((page, index) => (
          <div 
            key={page.id}
            className={`menu-item ${page.name === 'DISCOVERY PAGE' ? 'discovery-highlight' : ''} ${hoverIndex === index ? 'active' : ''}`}
            onClick={() => handleNavigation(page.path)}
            onMouseEnter={() => setHoverIndex(index)}
            onMouseLeave={() => setHoverIndex(null)}
          >
            <div className="item-content">
              <div className="item-icon">
                <page.icon size={24} />
              </div>
              <div className="item-details">
                <h3 className="item-name">{page.name}</h3>
                <p className="item-description">{page.description}</p>
              </div>
              <div className="item-arrow">
                <ChevronRight size={20} />
              </div>
            </div>
            <div className="item-highlight"></div>
          </div>
        ))}
      </div>
      
      {/* Bottom info */}
      <div className="menu-footer">
        <p className="version-info">CLIPT v2.5 • Gaming Edition</p>
        <p className="copyright">© 2025 Clipt, Inc. All rights reserved.</p>
      </div>
    </div>
  );
};

export default GameMenu;
