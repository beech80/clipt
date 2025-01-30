import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tooltip } from "@/components/ui/tooltip";
import { calculateHealthStatus, getHealthColor } from "@/utils/streamHealth";
import { Signal, SignalHigh, SignalLow, SignalMedium } from "lucide-react";

interface StreamMetricsDisplayProps {
  bitrate: number;
  fps: number;
  resolution: string;
  droppedFrames?: number;
  bandwidthUsage?: number;
  bufferHealth?: number;
  className?: string;
}

export const StreamMetricsDisplay = ({
  bitrate,
  fps,
  resolution,
  droppedFrames = 0,
  bandwidthUsage = 0,
  bufferHealth = 100,
  className
}: StreamMetricsDisplayProps) => {
  const healthStatus = calculateHealthStatus(bitrate, fps, resolution);
  const healthColor = getHealthColor(healthStatus);

  const getBitrateQuality = (value: number) => {
    if (value >= 6000) return 100;
    if (value >= 4500) return 75;
    if (value >= 3000) return 50;
    return 25;
  };

  const getFPSQuality = (value: number) => {
    if (value >= 60) return 100;
    if (value >= 30) return 75;
    if (value >= 24) return 50;
    return 25;
  };

  const getHealthIcon = () => {
    switch (healthStatus) {
      case 'excellent':
        return <SignalHigh className="h-4 w-4 text-green-500" />;
      case 'good':
        return <SignalMedium className="h-4 w-4 text-green-400" />;
      case 'poor':
        return <SignalLow className="h-4 w-4 text-yellow-500" />;
      case 'critical':
        return <Signal className="h-4 w-4 text-red-500" />;
      default:
        return null;
    }
  };

  return (
    <Card className={`p-4 space-y-4 ${className}`}>
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-medium">Stream Health</h3>
        {getHealthIcon()}
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Bitrate</span>
            <span>{(bitrate / 1000).toFixed(1)} Mbps</span>
          </div>
          <Tooltip content={`Target: 6 Mbps for high quality streaming`}>
            <Progress value={getBitrateQuality(bitrate)} className={healthColor} />
          </Tooltip>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>FPS</span>
            <span>{fps}</span>
          </div>
          <Tooltip content={`Target: 60 FPS for smooth streaming`}>
            <Progress value={getFPSQuality(fps)} className={healthColor} />
          </Tooltip>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Bandwidth Usage</span>
            <span>{(bandwidthUsage / 1000).toFixed(1)} Mbps</span>
          </div>
          <Tooltip content={`Network bandwidth utilization`}>
            <Progress 
              value={(bandwidthUsage / 8000) * 100} 
              className={bandwidthUsage > 7000 ? 'bg-yellow-500' : healthColor} 
            />
          </Tooltip>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Buffer Health</span>
            <span>{bufferHealth}%</span>
          </div>
          <Tooltip content={`Stream buffer health status`}>
            <Progress 
              value={bufferHealth} 
              className={bufferHealth < 50 ? 'bg-red-500' : healthColor} 
            />
          </Tooltip>
        </div>

        <div className="flex justify-between text-sm text-muted-foreground">
          <span>Resolution</span>
          <span>{resolution}</span>
        </div>

        {droppedFrames > 0 && (
          <div className="flex justify-between text-sm text-red-500">
            <span>Dropped Frames</span>
            <span>{droppedFrames}</span>
          </div>
        )}
      </div>
    </Card>
  );
};