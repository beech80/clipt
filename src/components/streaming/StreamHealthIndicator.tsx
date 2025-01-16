import React from 'react';
import { AlertCircle, CheckCircle2, AlertTriangle } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface StreamHealthIndicatorProps {
  status: string;
  className?: string;
  bitrate?: number;
  fps?: number;
  resolution?: string;
}

export const StreamHealthIndicator = ({ 
  status, 
  className,
  bitrate,
  fps,
  resolution 
}: StreamHealthIndicatorProps) => {
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

  const getHealthIcon = () => {
    switch (status) {
      case 'excellent':
      case 'good':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'poor':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'critical':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-400" />;
    }
  };

  const getHealthDescription = () => {
    switch (status) {
      case 'excellent':
        return 'Stream health is excellent';
      case 'good':
        return 'Stream health is good';
      case 'poor':
        return 'Stream quality is degraded';
      case 'critical':
        return 'Stream health is critical';
      default:
        return 'Stream health unknown';
    }
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={`flex items-center space-x-2 ${className}`}>
            {getHealthIcon()}
            <span className="text-sm capitalize">{status}</span>
            {bitrate && fps && resolution && (
              <span className="text-sm ml-2">
                {(bitrate / 1000).toFixed(1)} Mbps | {fps} FPS | {resolution}
              </span>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <div className="space-y-2">
            <p>{getHealthDescription()}</p>
            {bitrate && fps && resolution && (
              <>
                <p>Bitrate: {(bitrate / 1000).toFixed(1)} Mbps</p>
                <p>FPS: {fps}</p>
                <p>Resolution: {resolution}</p>
              </>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};