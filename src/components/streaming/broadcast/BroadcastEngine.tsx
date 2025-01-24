import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StreamKeyManager } from './StreamKeyManager';
import { BroadcastQualityManager } from './BroadcastQualityManager';
import { QualityPresetManager } from './QualityPresetManager';
import { BroadcastHealthMonitor } from './BroadcastHealthMonitor';
import { EngineConfig } from '@/types/broadcast';

interface BroadcastEngineProps {
  streamId: string;
  userId: string;
}

export const BroadcastEngine = ({ streamId, userId }: BroadcastEngineProps) => {
  const [engineStatus, setEngineStatus] = useState<'idle' | 'starting' | 'active' | 'error'>('idle');
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);

  const { data: engineConfig } = useQuery({
    queryKey: ['streaming-engine-config', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('streaming_engine_config')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) throw error;
      
      // Parse the JSONB fields to ensure they match the EngineConfig type
      if (data) {
        return {
          ...data,
          quality_presets: data.quality_presets as EngineConfig['quality_presets'],
          encoder_settings: data.encoder_settings as EngineConfig['encoder_settings'],
          ingest_endpoints: data.ingest_endpoints as any[]
        } as EngineConfig;
      }
      return null;
    },
  });

  const initializeEngineMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase
        .from('stream_encoding_sessions')
        .insert({
          stream_id: streamId,
          status: 'active',
          current_settings: engineConfig?.quality_presets?.medium || {},
          encoder_stats: {
            cpu_usage: 0,
            current_fps: 0,
            dropped_frames: 0,
            bandwidth_usage: 0
          }
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      setCurrentSessionId(data.id);
      setEngineStatus('active');
      toast.success('Broadcast engine initialized');
    },
    onError: (error) => {
      console.error('Failed to initialize broadcast engine:', error);
      setEngineStatus('error');
      toast.error('Failed to initialize broadcast engine');
    },
  });

  const handleEngineStart = () => {
    setEngineStatus('starting');
    initializeEngineMutation.mutate();
  };

  const handleEngineStop = async () => {
    if (currentSessionId) {
      const { error } = await supabase
        .from('stream_encoding_sessions')
        .update({
          status: 'ended',
          ended_at: new Date().toISOString()
        })
        .eq('id', currentSessionId);

      if (error) {
        console.error('Failed to stop encoding session:', error);
        toast.error('Failed to stop broadcast engine');
      } else {
        setCurrentSessionId(null);
        setEngineStatus('idle');
        toast.success('Broadcast engine stopped');
      }
    }
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Broadcast Engine</h2>
          <Button
            onClick={engineStatus === 'active' ? handleEngineStop : handleEngineStart}
            variant={engineStatus === 'active' ? "destructive" : "default"}
            disabled={engineStatus === 'starting' || !engineConfig}
          >
            {engineStatus === 'active' ? 'Stop Engine' : 'Start Engine'}
          </Button>
        </div>

        {engineStatus === 'active' && currentSessionId && (
          <>
            <StreamKeyManager 
              streamId={streamId}
            />
            <QualityPresetManager
              streamId={streamId}
              engineConfig={engineConfig}
              encodingSession={currentSessionId}
            />
            <BroadcastQualityManager
              streamId={streamId}
              engineConfig={engineConfig}
              encodingSession={currentSessionId}
              currentSessionId={currentSessionId}
            />
            <BroadcastHealthMonitor
              streamId={streamId}
              sessionId={currentSessionId}
            />
          </>
        )}
      </Card>
    </div>
  );
};