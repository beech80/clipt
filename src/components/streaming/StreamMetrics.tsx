import React from 'react';

interface StreamMetricsProps {
  bitrate: number;
  fps: number;
  className?: string;
}

export const StreamMetrics = ({ bitrate, fps, className }: StreamMetricsProps) => {
  if (bitrate === 0) return null;
  
  return (
    <div className={`text-white text-sm ${className}`}>
      {(bitrate / 1000).toFixed(1)} Mbps | {fps} FPS
    </div>
  );
};