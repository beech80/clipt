import { StreamHealthIndicator } from './StreamHealthIndicator';
import { StreamMetrics } from './StreamMetrics';
import { Card } from "@/components/ui/card";

interface StreamMetricsDisplayProps {
  isLive: boolean;
  healthStatus: string;
  viewerCount: number;
  metrics: {
    bitrate: number;
    fps: number;
    resolution: string;
  };
}

export const StreamMetricsDisplay = ({
  isLive,
  healthStatus,
  viewerCount,
  metrics
}: StreamMetricsDisplayProps) => {
  if (!isLive) return null;

  return (
    <>
      <Card className="absolute top-4 left-4 bg-black/60 px-3 py-1">
        <StreamHealthIndicator 
          status={healthStatus}
          bitrate={metrics.bitrate}
          fps={metrics.fps}
          resolution={metrics.resolution}
        />
      </Card>
      
      <Card className="absolute top-4 right-4 bg-black/60 px-3 py-1 text-white text-sm flex items-center space-x-2">
        <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
        <span>{viewerCount} watching</span>
      </Card>
      
      <StreamMetrics
        bitrate={metrics.bitrate}
        fps={metrics.fps}
        className="absolute top-14 right-4 bg-black/60"
      />
    </>
  );
};