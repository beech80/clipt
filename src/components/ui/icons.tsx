import React from 'react';
import * as LucideIcons from 'lucide-react';

// Create a mapping of all Lucide icons
const iconsLib = { ...LucideIcons };

// Types for icon props
export interface IconProps {
  name: string;
  className?: string;
  fill?: string;
  size?: number;
  color?: string;
  onClick?: () => void;
}

/**
 * A unified Icon component that safely wraps Lucide icons to prevent bundling issues
 * 
 * Usage:
 * <Icon name="Heart" className="h-5 w-5" fill="red" />
 * <Icon name="MessageSquare" className="h-4 w-4" />
 */
export const Icon: React.FC<IconProps> = ({ 
  name, 
  className = "", 
  fill = "none", 
  size,
  color,
  onClick
}) => {
  // Get the icon component by name
  const IconComponent = iconsLib[name as keyof typeof iconsLib] as React.ElementType;
  
  if (!IconComponent) {
    console.error(`Icon ${name} not found`);
    return null;
  }

  // Build style props
  const sizeProps = size ? { width: size, height: size } : {};
  const colorProps = color ? { color } : {};
  
  return (
    <IconComponent 
      className={className} 
      fill={fill} 
      onClick={onClick}
      {...sizeProps}
      {...colorProps}
    />
  );
};

// Export common icon wrappers with preset styles
export const HeartIcon = (props: Omit<IconProps, 'name'>) => (
  <Icon name="Heart" {...props} />
);

export const MessageIcon = (props: Omit<IconProps, 'name'>) => (
  <Icon name="MessageSquare" {...props} />
);

export const TrophyIcon = (props: Omit<IconProps, 'name'>) => (
  <Icon name="Trophy" {...props} />
);

export const UserIcon = (props: Omit<IconProps, 'name'>) => (
  <Icon name="User" {...props} />
);

export const CloseIcon = (props: Omit<IconProps, 'name'>) => (
  <Icon name="X" {...props} />
);

export const MenuIcon = (props: Omit<IconProps, 'name'>) => (
  <Icon name="Menu" {...props} />
);

export const HomeIcon = (props: Omit<IconProps, 'name'>) => (
  <Icon name="Home" {...props} />
);

export const SearchIcon = (props: Omit<IconProps, 'name'>) => (
  <Icon name="Search" {...props} />
);

export const BellIcon = (props: Omit<IconProps, 'name'>) => (
  <Icon name="Bell" {...props} />
);

export const UploadIcon = (props: Omit<IconProps, 'name'>) => (
  <Icon name="Upload" {...props} />
);

export const SettingsIcon = (props: Omit<IconProps, 'name'>) => (
  <Icon name="Settings" {...props} />
);

export const BookmarkIcon = (props: Omit<IconProps, 'name'>) => (
  <Icon name="Bookmark" {...props} />
);

export const VideoIcon = (props: Omit<IconProps, 'name'>) => (
  <Icon name="Video" {...props} />
);

export const AwardIcon = (props: Omit<IconProps, 'name'>) => (
  <Icon name="Award" {...props} />
);

export const MonitorIcon = (props: Omit<IconProps, 'name'>) => (
  <Icon name="Monitor" {...props} />
);

export const CameraIcon = (props: Omit<IconProps, 'name'>) => (
  <Icon name="Camera" {...props} />
);

export const UserPlusIcon = (props: Omit<IconProps, 'name'>) => (
  <Icon name="UserPlus" {...props} />
);

export const UserCheckIcon = (props: Omit<IconProps, 'name'>) => (
  <Icon name="UserCheck" {...props} />
);

export const TrashIcon = (props: Omit<IconProps, 'name'>) => (
  <Icon name="Trash2" {...props} />
);

export const MoreIcon = (props: Omit<IconProps, 'name'>) => (
  <Icon name="MoreVertical" {...props} />
);

export const MoreVerticalIcon = (props: Omit<IconProps, 'name'>) => (
  <Icon name="MoreVertical" {...props} />
);

export const ChevronDownIcon = (props: Omit<IconProps, 'name'>) => (
  <Icon name="ChevronDown" {...props} />
);

export const ChevronUpIcon = (props: Omit<IconProps, 'name'>) => (
  <Icon name="ChevronUp" {...props} />
);

export const CheckIcon = (props: Omit<IconProps, 'name'>) => (
  <Icon name="Check" {...props} />
);

export const TrendingUpIcon = (props: Omit<IconProps, 'name'>) => (
  <Icon name="TrendingUp" {...props} />
);

export const MessageCircleIcon = (props: Omit<IconProps, 'name'>) => (
  <Icon name="MessageCircle" {...props} />
);
