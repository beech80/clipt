import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { AlertCircle, CheckCircle2, AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { StreamMetricsDisplay } from './StreamMetricsDisplay';
import { calculateHealthStatus, getHealthDescription } from '@/utils/streamHealth';
import type { HealthStatus } from '@/utils/streamHealth';

interface StreamHealthMonitorProps {
  streamId: string;
}

export const StreamHealthMonitor = ({ streamId }: StreamHealthMonitorProps) => {
  const { data: stream, error } = useQuery({
    queryKey: ['stream-health', streamId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('streams')
        .select('health_status, current_bitrate, current_fps, stream_resolution')
        .eq('id', streamId)
        .single();

      if (error) throw error;
      return data;
    },
    refetchInterval: 5000,
  });

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>Failed to fetch stream health data.</AlertDescription>
      </Alert>
    );
  }

  if (!stream) return null;

  const healthStatus = calculateHealthStatus(
    stream.current_bitrate,
    stream.current_fps,
    stream.stream_resolution
  ) as HealthStatus;

  const getHealthIcon = () => {
    switch (healthStatus) {
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

  return (
    <div className="space-y-4">
      <Alert>
        <div className="flex items-center gap-2">
          {getHealthIcon()}
          <AlertTitle className="capitalize">{healthStatus}</AlertTitle>
        </div>
        <AlertDescription>{getHealthDescription(healthStatus)}</AlertDescription>
      </Alert>

      {stream.current_bitrate && stream.current_fps && stream.stream_resolution && (
        <StreamMetricsDisplay
          bitrate={stream.current_bitrate}
          fps={stream.current_fps}
          resolution={stream.stream_resolution}
        />
      )}
    </div>
  );
};