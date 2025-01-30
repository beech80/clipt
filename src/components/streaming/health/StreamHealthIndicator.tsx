import { useEffect, useState } from 'react';
import { Card } from "@/components/ui/card";
import { Shield, AlertCircle, CheckCircle2, AlertTriangle, Wifi, Gauge } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { supabase } from '@/lib/supabase';

interface StreamHealthIndicatorProps {
  streamId: string;
}

interface StreamMetrics {
  bitrate: number;
  fps: number;
  droppedFrames: number;
  bandwidth: number;
  bufferHealth: number;
}

export const StreamHealthIndicator = ({ streamId }: StreamHealthIndicatorProps) => {
  const [healthStatus, setHealthStatus] = useState<'offline' | 'excellent' | 'good' | 'poor' | 'critical'>('offline');
  const [lastCheck, setLastCheck] = useState<Date | null>(null);
  const [metrics, setMetrics] = useState<StreamMetrics>({
    bitrate: 0,
    fps: 0,
    droppedFrames: 0,
    bandwidth: 0,
    bufferHealth: 100
  });

  useEffect(() => {
    const channel = supabase
      .channel('stream-health')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'streams',
          filter: `id=eq.${streamId}`
        },
        (payload: any) => {
          if (payload.new) {
            setHealthStatus(payload.new.stream_health_status);
            setLastCheck(payload.new.last_health_check);
            
            // Update metrics from stream quality metrics table
            supabase
              .from('stream_quality_metrics')
              .select('*')
              .eq('stream_id', streamId)
              .single()
              .then(({ data }) => {
                if (data) {
                  setMetrics({
                    bitrate: data.bitrate || 0,
                    fps: data.fps || 0,
                    droppedFrames: data.dropped_frames || 0,
                    bandwidth: data.bandwidth_usage || 0,
                    bufferHealth: data.buffer_health || 100
                  });
                }
              });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [streamId]);

  const getStatusColor = () => {
    switch (healthStatus) {
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

  const getStatusIcon = () => {
    switch (healthStatus) {
      case 'excellent':
      case 'good':
        return <CheckCircle2 className={`h-5 w-5 ${getStatusColor()}`} />;
      case 'poor':
        return <AlertTriangle className={`h-5 w-5 ${getStatusColor()}`} />;
      case 'critical':
        return <AlertCircle className={`h-5 w-5 ${getStatusColor()}`} />;
      default:
        return <Shield className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusDescription = () => {
    switch (healthStatus) {
      case 'excellent':
        return 'Stream health is excellent';
      case 'good':
        return 'Stream health is good';
      case 'poor':
        return 'Stream experiencing some issues';
      case 'critical':
        return 'Critical stream issues detected';
      default:
        return 'Stream is offline';
    }
  };

  return (
    <Card className="p-4 space-y-4">
      <Alert>
        <div className="flex items-center gap-2">
          {getStatusIcon()}
          <AlertTitle className="capitalize">{healthStatus}</AlertTitle>
        </div>
        <AlertDescription>
          {getStatusDescription()}
          {lastCheck && (
            <div className="text-sm text-muted-foreground mt-1">
              Last checked: {new Date(lastCheck).toLocaleTimeString()}
            </div>
          )}
        </AlertDescription>
      </Alert>

      <div className="grid gap-4">
        <TooltipProvider>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Tooltip>
                <TooltipTrigger className="flex items-center gap-2">
                  <Wifi className="h-4 w-4" />
                  <span>Bitrate</span>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Current streaming bitrate</p>
                </TooltipContent>
              </Tooltip>
              <span>{(metrics.bitrate / 1000).toFixed(1)} Mbps</span>
            </div>
            <Progress value={(metrics.bitrate / 8000) * 100} />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Tooltip>
                <TooltipTrigger className="flex items-center gap-2">
                  <Gauge className="h-4 w-4" />
                  <span>FPS</span>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Frames per second</p>
                </TooltipContent>
              </Tooltip>
              <span>{metrics.fps}</span>
            </div>
            <Progress value={(metrics.fps / 60) * 100} />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Tooltip>
                <TooltipTrigger className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  <span>Dropped Frames</span>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Number of dropped frames</p>
                </TooltipContent>
              </Tooltip>
              <span>{metrics.droppedFrames}</span>
            </div>
            <Progress 
              value={100 - (metrics.droppedFrames / 100) * 100} 
              className={metrics.droppedFrames > 50 ? 'bg-red-200' : ''}
            />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Tooltip>
                <TooltipTrigger className="flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  <span>Buffer Health</span>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Stream buffer health</p>
                </TooltipContent>
              </Tooltip>
              <span>{metrics.bufferHealth}%</span>
            </div>
            <Progress 
              value={metrics.bufferHealth}
              className={metrics.bufferHealth < 50 ? 'bg-yellow-200' : ''}
            />
          </div>
        </TooltipProvider>
      </div>
    </Card>
  );
};