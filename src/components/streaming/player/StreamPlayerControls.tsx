import React from 'react';
import { QualitySelector } from '../QualitySelector';
import { StreamMetricsDisplay } from '../StreamMetricsDisplay';

interface StreamPlayerControlsProps {
  qualities: string[];
  currentQuality: string;
  onQualityChange: (quality: string) => void;
  streamMetrics: {
    bitrate: number;
    fps: number;
    resolution: string;
  };
  className?: string;
}

export function StreamPlayerControls({
  qualities,
  currentQuality,
  onQualityChange,
  streamMetrics,
  className
}: StreamPlayerControlsProps) {
  return (
    <div className={className}>
      <QualitySelector
        qualities={qualities}
        currentQuality={currentQuality}
        onQualityChange={onQualityChange}
        className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity"
      />
      <StreamMetricsDisplay
        bitrate={streamMetrics.bitrate}
        fps={streamMetrics.fps}
        resolution={streamMetrics.resolution}
        className="absolute bottom-16 right-4 opacity-0 group-hover:opacity-100 transition-opacity"
      />
    </div>
  );
}