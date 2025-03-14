import { useEffect, useState } from 'react';
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { AlertCircle, Cpu, Zap } from "lucide-react";
import { Activity } from '@/components/ui/icon-fix';
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

interface BroadcastHealthMonitorProps {
  streamId: string;
  sessionId?: string;
}

interface HealthMetrics {
  cpu_usage: number;
  current_fps: number;
  dropped_frames: number;
  bandwidth_usage: number;
}

export const BroadcastHealthMonitor = ({ streamId, sessionId }: BroadcastHealthMonitorProps) => {
  const [metrics, setMetrics] = useState<HealthMetrics>({
    cpu_usage: 0,
    current_fps: 0,
    dropped_frames: 0,
    bandwidth_usage: 0
  });

  useEffect(() => {
    if (!streamId || !sessionId) return;

    const channel = supabase
      .channel('encoding-stats')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'stream_encoding_sessions',
          filter: `id=eq.${sessionId}`,
        },
        (payload) => {
          if (payload.new.encoder_stats) {
            setMetrics(payload.new.encoder_stats as HealthMetrics);
            
            // Alert on critical issues
            if (payload.new.encoder_stats.cpu_usage > 90) {
              toast.warning("High CPU usage detected");
            }
            if (payload.new.encoder_stats.dropped_frames > 100) {
              toast.error("High number of dropped frames detected");
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [streamId, sessionId]);

  const getHealthStatus = () => {
    if (metrics.cpu_usage > 90 || metrics.dropped_frames > 100) return 'critical';
    if (metrics.cpu_usage > 70 || metrics.dropped_frames > 50) return 'warning';
    return 'good';
  };

  const getStatusColor = () => {
    const status = getHealthStatus();
    switch (status) {
      case 'critical':
        return 'text-red-500';
      case 'warning':
        return 'text-yellow-500';
      default:
        return 'text-green-500';
    }
  };

  return (
    <Card className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Broadcast Health</h3>
        <AlertCircle className={`h-5 w-5 ${getStatusColor()}`} />
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Cpu className="h-4 w-4" />
              <span>CPU Usage</span>
            </div>
            <span>{metrics.cpu_usage}%</span>
          </div>
          <Progress value={metrics.cpu_usage} />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              <span>Frame Rate</span>
            </div>
            <span>{metrics.current_fps} FPS</span>
          </div>
          <Progress value={(metrics.current_fps / 60) * 100} />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4" />
              <span>Bandwidth Usage</span>
            </div>
            <span>{(metrics.bandwidth_usage / 1000).toFixed(1)} Mbps</span>
          </div>
          <Progress value={(metrics.bandwidth_usage / 8000) * 100} />
        </div>

        <div className="text-sm text-muted-foreground">
          Dropped Frames: {metrics.dropped_frames}
        </div>
      </div>
    </Card>
  );
};