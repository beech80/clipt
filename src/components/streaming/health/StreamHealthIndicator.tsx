import { useEffect, useState } from 'react';
import { Card } from "@/components/ui/card";
import { Shield, AlertCircle, CheckCircle2, AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { supabase } from '@/lib/supabase';

interface StreamHealthIndicatorProps {
  streamId: string;
}

export const StreamHealthIndicator = ({ streamId }: StreamHealthIndicatorProps) => {
  const [healthStatus, setHealthStatus] = useState<'offline' | 'excellent' | 'good' | 'poor' | 'critical'>('offline');
  const [lastCheck, setLastCheck] = useState<Date | null>(null);

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
    <Card className="p-4">
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
    </Card>
  );
};