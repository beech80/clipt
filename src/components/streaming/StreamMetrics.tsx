import React from 'react';
import { Card, CardContent } from "@/components/ui/card";

interface StreamMetricsProps {
  bitrate: number;
  fps: number;
  className?: string;
}

export const StreamMetrics = ({ bitrate, fps, className }: StreamMetricsProps) => {
  if (bitrate === 0) return null;
  
  return (
    <Card className={className}>
      <CardContent className="p-2 text-sm">
        {(bitrate / 1000).toFixed(1)} Mbps | {fps} FPS
      </CardContent>
    </Card>
  );
};