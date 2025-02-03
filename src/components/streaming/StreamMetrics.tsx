import React from 'react';
import { Users, Clock } from 'lucide-react';

interface StreamMetricsProps {
  viewerCount: number;
  duration?: string;
}

export function StreamMetrics({ viewerCount, duration }: StreamMetricsProps) {
  return (
    <div className="flex items-center space-x-4 text-sm">
      <div className="flex items-center space-x-1">
        <Users className="h-4 w-4" />
        <span>{viewerCount}</span>
      </div>
      {duration && (
        <div className="flex items-center space-x-1">
          <Clock className="h-4 w-4" />
          <span>{duration}</span>
        </div>
      )}
    </div>
  );
}