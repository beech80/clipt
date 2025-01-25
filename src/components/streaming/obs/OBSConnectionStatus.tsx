import { useEffect, useState } from 'react';
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Plug, Wifi } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface OBSConnectionStatusProps {
  streamId: string;
}

export const OBSConnectionStatus = ({ streamId }: OBSConnectionStatusProps) => {
  const [isConnected, setIsConnected] = useState(false);
  const [lastConnected, setLastConnected] = useState<Date | null>(null);

  useEffect(() => {
    const channel = supabase
      .channel('obs-connection')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'obs_connection_logs',
          filter: `stream_id=eq.${streamId}`
        },
        (payload: any) => {
          if (payload.new) {
            setIsConnected(payload.new.disconnected_at === null);
            setLastConnected(new Date(payload.new.connected_at));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [streamId]);

  return (
    <Card className="p-4">
      <Alert>
        <div className="flex items-center gap-2">
          {isConnected ? (
            <Wifi className="h-5 w-5 text-green-500" />
          ) : (
            <Plug className="h-5 w-5 text-gray-400" />
          )}
          <AlertTitle>
            {isConnected ? 'OBS Connected' : 'OBS Disconnected'}
          </AlertTitle>
        </div>
        <AlertDescription>
          {isConnected ? (
            'OBS is currently connected and streaming'
          ) : (
            'Waiting for OBS connection...'
          )}
          {lastConnected && (
            <div className="text-sm text-muted-foreground mt-1">
              Last connected: {lastConnected.toLocaleString()}
            </div>
          )}
        </AlertDescription>
      </Alert>
    </Card>
  );
};