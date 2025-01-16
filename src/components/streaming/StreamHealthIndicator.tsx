import { AlertCircle, CheckCircle2, SignalHigh } from "lucide-react";
import { cn } from "@/lib/utils";

interface StreamHealthIndicatorProps {
  status: string;
  bitrate?: number;
  fps?: number;
  resolution?: string;
  className?: string;
}

export const StreamHealthIndicator = ({ 
  status, 
  bitrate, 
  fps, 
  resolution,
  className 
}: StreamHealthIndicatorProps) => {
  const getHealthColor = () => {
    switch (status) {
      case 'excellent':
        return 'text-green-500';
      case 'good':
        return 'text-green-400';
      case 'poor':
        return 'text-yellow-500';
      case 'critical':
        return 'text-red-500';
      default:
        return 'text-gray-400';
    }
  };

  const getHealthIcon = () => {
    switch (status) {
      case 'excellent':
      case 'good':
        return <CheckCircle2 className="w-4 h-4" />;
      case 'poor':
        return <SignalHigh className="w-4 h-4" />;
      case 'critical':
      default:
        return <AlertCircle className="w-4 h-4" />;
    }
  };

  return (
    <div className={cn("space-y-2", className)}>
      <div className={cn("flex items-center gap-2", getHealthColor())}>
        {getHealthIcon()}
        <span className="font-medium">Stream Health: {status}</span>
      </div>
      
      <div className="grid grid-cols-3 gap-4 text-sm text-muted-foreground">
        {bitrate && (
          <div>
            <p className="font-medium">Bitrate</p>
            <p>{(bitrate / 1000).toFixed(1)} Mbps</p>
          </div>
        )}
        {fps && (
          <div>
            <p className="font-medium">FPS</p>
            <p>{fps}</p>
          </div>
        )}
        {resolution && (
          <div>
            <p className="font-medium">Resolution</p>
            <p>{resolution}</p>
          </div>
        )}
      </div>
    </div>
  );
};