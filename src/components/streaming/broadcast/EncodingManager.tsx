import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Cpu, Activity, Zap } from 'lucide-react';

interface EncodingManagerProps {
  streamId: string;
  engineConfig: any;
  encodingSession: any;
}

export const EncodingManager = ({
  streamId,
  engineConfig,
  encodingSession,
}: EncodingManagerProps) => {
  const [stats, setStats] = useState(encodingSession?.encoder_stats || {
    cpu_usage: 0,
    dropped_frames: 0,
    bandwidth_usage: 0,
    current_fps: 0,
  });

  useEffect(() => {
    if (encodingSession?.encoder_stats) {
      setStats(encodingSession.encoder_stats);
    }
  }, [encodingSession]);

  const getHealthStatus = (cpuUsage: number, droppedFrames: number) => {
    if (cpuUsage > 90 || droppedFrames > 100) return 'critical';
    if (cpuUsage > 70 || droppedFrames > 50) return 'warning';
    return 'good';
  };

  const healthStatus = getHealthStatus(stats.cpu_usage, stats.dropped_frames);

  const getBadgeVariant = (status: string) => {
    switch (status) {
      case 'good':
        return 'default';
      case 'warning':
        return 'secondary';
      case 'critical':
        return 'destructive';
      default:
        return 'default';
    }
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Encoding Status</h3>
        <Badge variant={getBadgeVariant(healthStatus)}>
          {healthStatus.toUpperCase()}
        </Badge>
      </div>

      <div className="space-y-6">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Cpu className="h-4 w-4" />
              <span>CPU Usage</span>
            </div>
            <span>{stats.cpu_usage}%</span>
          </div>
          <Progress value={stats.cpu_usage} />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              <span>Frame Rate</span>
            </div>
            <span>{stats.current_fps} FPS</span>
          </div>
          <Progress
            value={(stats.current_fps / (engineConfig?.encoder_settings.fps_options[1] || 60)) * 100}
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4" />
              <span>Bandwidth Usage</span>
            </div>
            <span>{(stats.bandwidth_usage / 1000).toFixed(1)} Mbps</span>
          </div>
          <Progress
            value={(stats.bandwidth_usage / (engineConfig?.encoder_settings.video_bitrate_range.max || 8000)) * 100}
          />
        </div>

        <div className="text-sm text-muted-foreground">
          Dropped Frames: {stats.dropped_frames}
        </div>
      </div>
    </Card>
  );
};