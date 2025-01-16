import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { AlertCircle, CheckCircle2, AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";

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
    refetchInterval: 5000, // Poll every 5 seconds
  });

  useEffect(() => {
    if (stream?.health_status === 'critical') {
      toast.error('Stream health is critical. Please check your connection.');
    }
  }, [stream?.health_status]);

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

  const getHealthIcon = (status: string) => {
    switch (status) {
      case 'excellent':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'good':
        return <CheckCircle2 className="h-4 w-4 text-green-400" />;
      case 'poor':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'critical':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-400" />;
    }
  };

  const getHealthColor = (status: string) => {
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

  const getBitrateQuality = (bitrate: number) => {
    if (bitrate >= 6000) return 100;
    if (bitrate >= 4500) return 75;
    if (bitrate >= 3000) return 50;
    return 25;
  };

  const getFPSQuality = (fps: number) => {
    if (fps >= 60) return 100;
    if (fps >= 30) return 75;
    if (fps >= 24) return 50;
    return 25;
  };

  return (
    <div className="space-y-4 p-4 rounded-lg border bg-card">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {getHealthIcon(stream.health_status)}
          <span className="font-semibold capitalize">{stream.health_status}</span>
        </div>
        <span className="text-sm text-muted-foreground">
          {stream.stream_resolution}
        </span>
      </div>

      <div className="space-y-2">
        <div className="space-y-1">
          <div className="flex justify-between text-sm">
            <span>Bitrate</span>
            <span>{(stream.current_bitrate / 1000).toFixed(1)} Mbps</span>
          </div>
          <Progress 
            value={getBitrateQuality(stream.current_bitrate)} 
            className={getHealthColor(stream.health_status)}
          />
        </div>

        <div className="space-y-1">
          <div className="flex justify-between text-sm">
            <span>FPS</span>
            <span>{stream.current_fps}</span>
          </div>
          <Progress 
            value={getFPSQuality(stream.current_fps)} 
            className={getHealthColor(stream.health_status)}
          />
        </div>
      </div>
    </div>
  );
};