import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { calculateHealthStatus, getHealthColor } from "@/utils/streamHealth";

interface StreamMetricsDisplayProps {
  bitrate: number;
  fps: number;
  resolution: string;
  className?: string;
}

export const StreamMetricsDisplay = ({
  bitrate,
  fps,
  resolution,
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

  return (
    <Card className={`p-4 space-y-4 ${className}`}>
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span>Bitrate</span>
          <span>{(bitrate / 1000).toFixed(1)} Mbps</span>
        </div>
        <Progress value={getBitrateQuality(bitrate)} className={healthColor} />
      </div>

      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span>FPS</span>
          <span>{fps}</span>
        </div>
        <Progress value={getFPSQuality(fps)} className={healthColor} />
      </div>

      <div className="text-sm text-muted-foreground">
        Resolution: {resolution}
      </div>
    </Card>
  );
};