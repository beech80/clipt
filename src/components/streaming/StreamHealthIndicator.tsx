import React from 'react';

interface StreamHealthIndicatorProps {
  status: string;
  className?: string;
}

export const StreamHealthIndicator = ({ status, className }: StreamHealthIndicatorProps) => {
  const getHealthStatusColor = () => {
    switch (status) {
      case 'excellent':
        return 'bg-green-500';
      case 'good':
        return 'bg-green-400';
      case 'poor':
        return 'bg-yellow-500';
      case 'critical':
        return 'bg-red-500';
      default:
        return 'bg-gray-400';
    }
  };

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <span className={`h-2 w-2 rounded-full ${getHealthStatusColor()}`} />
      <span className="text-white text-sm capitalize">{status}</span>
    </div>
  );
};