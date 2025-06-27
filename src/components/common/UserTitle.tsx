import React from 'react';
import { Trophy, Flame, Globe, Beaker, Eye } from 'lucide-react';

interface TitleConfig {
  icon: JSX.Element;
  label: string;
  color: string;
  shadow: string;
}

interface UserTitleProps {
  titleId?: string;
  size?: 'small' | 'medium' | 'large';
  showText?: boolean;
}

const titleConfigs: Record<string, TitleConfig> = {
  'clipt-legend': { 
    icon: <Trophy />,
    label: 'Clipt Legend', 
    color: '#FFD700',
    shadow: 'rgba(255, 215, 0, 0.5)'
  },
  'timeline-terror': { 
    icon: <Flame />,
    label: 'Timeline Terror', 
    color: '#FF4500',
    shadow: 'rgba(255, 69, 0, 0.5)'
  },
  'the-architect': { 
    icon: <Globe />,
    label: 'The Architect', 
    color: '#00BFFF',
    shadow: 'rgba(0, 191, 255, 0.5)'
  },
  'meta-maker': { 
    icon: <Beaker />,
    label: 'Meta Maker', 
    color: '#9C27B0',
    shadow: 'rgba(156, 39, 176, 0.5)'
  },
  'shadow-mode': { 
    icon: <Eye />,
    label: 'Shadow Mode', 
    color: '#4caf50',
    shadow: 'rgba(76, 175, 80, 0.5)'
  },
};

export const UserTitle: React.FC<UserTitleProps> = ({ 
  titleId, 
  size = 'medium', 
  showText = true 
}) => {
  if (!titleId) return null;
  
  const config = titleConfigs[titleId] || {
    icon: <Trophy />,
    label: titleId.replace(/-/g, ' '),
    color: '#FFD700',
    shadow: 'rgba(255, 215, 0, 0.5)'
  };
  
  const iconSizes = {
    small: 12,
    medium: 16,
    large: 20
  };
  
  const fontSizes = {
    small: '0.7rem',
    medium: '0.85rem',
    large: '1rem'
  };
  
  const paddings = {
    small: '2px 8px',
    medium: '4px 10px',
    large: '6px 14px'
  };
  
  const iconElement = React.cloneElement(config.icon, {
    size: iconSizes[size]
  });

  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        backgroundColor: 'rgba(0,0,0,0.3)',
        borderRadius: '16px',
        padding: paddings[size],
        fontWeight: 'bold',
        fontSize: fontSizes[size],
        color: config.color,
        textShadow: `0 0 5px ${config.shadow}`,
        boxShadow: `0 0 8px ${config.shadow}`,
        border: `1px solid ${config.color}40`,
        marginLeft: '4px',
        verticalAlign: 'middle',
      }}
      className="user-title-badge"
      title={config.label}
    >
      <span style={{ display: 'flex', alignItems: 'center' }}>
        {iconElement}
      </span>
      {showText && <span>{config.label}</span>}
    </div>
  );
};

export default UserTitle;
