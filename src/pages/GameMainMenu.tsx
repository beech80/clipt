import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Settings, Search, Film, User, MessageSquare, 
  Users, Sparkles, Layers, Camera
} from 'lucide-react';
import styled from 'styled-components';

const MenuContainer = styled.div`
  width: 100%;
  min-height: 100vh;
  background-color: #0c0c0c;
  color: white;
  display: flex;
  flex-direction: column;
  position: relative;
  padding: 0;
  overflow: hidden;
  
  &::after {
    content: '';
    position: absolute;
    top: 0;
    right: 0;
    bottom: 0;
    width: 4px;
    background-color: #FF7700;
    pointer-events: none;
    z-index: 10;
  }
`;

const MenuHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px 0 20px;
  margin-bottom: 0;
  width: 100%;
  
  h1 {
    font-size: 30px;
    font-weight: bold;
    color: #FF7700;
  }
`;

const MenuItemIconContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 25px;
  height: 25px;
  margin-right: 15px;
  color: #FF7700;
  opacity: 0.9;
`;

const MenuList = styled.div`
  flex: 1;
  overflow-y: auto;
  width: 100%;
  display: flex;
  flex-direction: column;
  padding-top: 0;
  align-items: flex-start;
  max-width: 400px;
  margin: 0 auto;
`;

const MenuItem = styled.div<{ active?: boolean }>`
  display: flex;
  align-items: center;
  padding: 15px 20px;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
  background-color: ${props => props.active ? 'rgba(255, 119, 0, 0.05)' : 'transparent'};
  width: 100%;
  max-width: 600px;
  margin: 0;
  
  &:hover {
    background-color: rgba(255, 119, 0, 0.1);
  }
  
  ${props => props.active && `
    &::before {
      content: '';
      position: absolute;
      left: 0;
      top: 0;
      bottom: 0;
      width: 3px;
      background-color: #FF7700;
    }
  `}
`;

const MenuItemContent = styled.div`
  display: flex;
  flex-direction: column;
`;

const MenuItemTitle = styled.h3`
  font-weight: 500;
  font-size: 14px;
  text-transform: uppercase;
  margin: 0;
  color: white;
`;

const MenuItemDescription = styled.p`
  font-size: 12px;
  color: #666;
  margin-top: 4px;
  margin-bottom: 0;
`;

const Footer = styled.div`
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  text-align: center;
  font-size: 12px;
  color: #666;
  padding: 15px 0;
  margin-top: auto;
  
  &::before {
    content: 'CLIPT v2.5 • Gaming Edition';
    display: block;
    margin-bottom: 5px;
  }
`;

const GameMainMenu: React.FC = () => {
  const navigate = useNavigate();
  const [activeItem, setActiveItem] = useState(2); // Start with DISCOVERY PAGE selected
  
  // Define menu items
  // Keyboard event to capture arrow keys
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Capture arrow keys for navigation
      if (e.key === 'ArrowDown') {
        setActiveItem(prev => (prev < menuItems.length - 1 ? prev + 1 : 0));
      } else if (e.key === 'ArrowUp') {
        setActiveItem(prev => (prev > 0 ? prev - 1 : menuItems.length - 1));
      } else if (e.key === 'Enter') {
        navigate(menuItems[activeItem].path);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [activeItem]);

  const menuItems = [
    { 
      id: 1, 
      name: 'Settings', 
      path: '/settings', 
      icon: <Settings size={20} />, 
      description: 'Configure your experience' 
    },
    { 
      id: 2, 
      name: 'Profile', 
      path: '/profile', 
      icon: <User size={20} />, 
      description: 'View your profile and stats' 
    },
    { 
      id: 3, 
      name: 'DISCOVERY PAGE', 
      path: '/discovery', 
      icon: <Search size={20} />, 
      description: 'Discover your new favorite streamer' 
    },
    { 
      id: 4, 
      name: 'Clipts', 
      path: '/clipts', 
      icon: <Camera size={20} />, 
      description: 'View short gaming clips' 
    },
    { 
      id: 5, 
      name: 'Streaming', 
      path: '/streaming', 
      icon: <Layers size={20} />, 
      description: 'Set up OBS with stream key and URL' 
    },
    { 
      id: 6, 
      name: 'Squads Clipts', 
      path: '/squads-clipts', 
      icon: <Users size={20} />, 
      description: 'View your squad\'s best clips' 
    },
    { 
      id: 7, 
      name: 'Top Clipts', 
      path: '/top-clipts', 
      icon: <Sparkles size={20} />, 
      description: 'Hall of fame clips' 
    },
    { 
      id: 8, 
      name: 'Messages', 
      path: '/messages', 
      icon: <MessageSquare size={20} />, 
      description: 'Chat with other players' 
    },
  ];

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowUp':
          setActiveItem(prev => (prev > 0 ? prev - 1 : menuItems.length - 1));
          break;
        case 'ArrowDown':
          setActiveItem(prev => (prev < menuItems.length - 1 ? prev + 1 : 0));
          break;
        case 'Enter':
          navigate(menuItems[activeItem].path);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeItem, navigate, menuItems]);

  // Navigate to the selected page
  const handleNavigation = (path: string, index: number) => {
    setActiveItem(index);
    navigate(path);
  };

  const handleMenuItemClick = (index: number, path: string) => {
    handleNavigation(path, index);
  };

  const handleKeyDown = (e: KeyboardEvent, index: number) => {
    if (e.key === 'Enter') {
      handleNavigation(menuItems[index].path, index);
    }
  };

  return (
    <MenuContainer>
      <MenuHeader>
        <h1>Navigation</h1>
      </MenuHeader>
      
      <MenuList>
        {menuItems.map((item, index) => (
          <MenuItem 
            key={item.id} 
            active={activeItem === index}
            onClick={() => handleMenuItemClick(index, item.path)}
            onKeyDown={(e) => handleKeyDown(e, index)}
            tabIndex={0}
            role="button"
            aria-label={item.name}
          >
            <MenuItemIconContainer>
              {item.icon}
            </MenuItemIconContainer>
            <MenuItemContent>
              <MenuItemTitle>{item.name}</MenuItemTitle>
              <MenuItemDescription>{item.description}</MenuItemDescription>
            </MenuItemContent>
          </MenuItem>
        ))}
      </MenuList>
      
      <Footer>
        © 2025 Clipt, Inc. All rights reserved
      </Footer>
    </MenuContainer>
  );
};

export default GameMainMenu;
