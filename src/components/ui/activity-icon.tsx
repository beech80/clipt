/**
 * ISOLATED ACTIVITY ICON IMPLEMENTATION
 * 
 * This is a completely standalone implementation with NO imports from any other files
 * to avoid ALL circular dependencies and initialization errors.
 */

// Standalone Activity Icon implementation
// This component is completely isolated to avoid circular dependencies

import React from 'react';

interface ActivityIconProps {
  className?: string;
}

const ActivityIcon: React.FC<ActivityIconProps> = ({ className = "" }) => {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width="24" 
      height="24" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
    </svg>
  );
};

export default ActivityIcon;
