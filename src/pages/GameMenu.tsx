import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Settings, Search, Camera, User, MessageSquare, 
  Users, Sparkles, ChevronRight, Layers
} from 'lucide-react';
import '../styles/game-dashboard.css';

interface MenuItemType {
  id: number;
  name: string;
  path: string;
  icon: React.ComponentType<{ size?: number | string }>;
  description: string;
}

const GameMenu: React.FC = () => {
  const navigate = useNavigate();
  const [hoverIndex, setHoverIndex] = React.useState<number | null>(null);
  
  // Add background animation effect
  React.useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const x = e.clientX / window.innerWidth;
      const y = e.clientY / window.innerHeight;
      
      document.documentElement.style.setProperty('--mouse-x', x.toString());
      document.documentElement.style.setProperty('--mouse-y', y.toString());
    };
    
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);
  
  const handleHover = (index: number) => {
    setHoverIndex(index);
  };
  
  const clearHover = () => {
    setHoverIndex(null);
  };
  
  const handleNavigation = (path: string) => {
    navigate(path);
  };
  
  const appPages: MenuItemType[] = [
    { id: 1, name: 'Settings', path: '/settings', icon: Settings, description: 'Configure your experience' },
    { id: 2, name: 'Profile', path: '/profile', icon: User, description: 'View your profile and stats' },
    { id: 3, name: 'DISCOVERY PAGE', path: '/discovery', icon: Search, description: 'Discover your new favorite streamer' },
    { id: 4, name: 'Clipts', path: '/clipts', icon: Camera, description: 'View and share gaming clips' },
    { id: 5, name: 'Streaming', path: '/streaming', icon: Layers, description: 'Set up OBS with stream key and URL' },
    { id: 6, name: 'Squads Clipts', path: '/squads-clipts', icon: Users, description: 'View your squad\'s best clips' },
    { id: 7, name: 'Top Clipts', path: '/top-clipts', icon: Sparkles, description: 'Hall of fame clips' },
    { id: 8, name: 'Messages', path: '/messages', icon: MessageSquare, description: 'Chat and share clips with other players' }
  ];
    
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
            onMouseEnter={() => handleHover(index)}
            onMouseLeave={clearHover}
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
