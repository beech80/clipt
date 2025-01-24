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

interface BroadcastEngineProps {
  streamId: string;
  userId: string;
}

interface QualityPreset {
  fps: number;
  bitrate: number;
  resolution: string;
}

interface EncoderConfig {
  quality_presets: Record<string, QualityPreset>;
  encoder_settings: {
    fps_options: number[];
    video_codec: string;
    audio_codec: string;
    keyframe_interval: number;
    audio_bitrate_range: { min: number; max: number };
    video_bitrate_range: { min: number; max: number };
  };
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
      
      const config = {
        ...data,
        quality_presets: data.quality_presets as unknown as Record<string, QualityPreset>,
        encoder_settings: data.encoder_settings as unknown as EncoderConfig['encoder_settings']
      };

      return config;
    },
  });

  const { data: encodingSession } = useQuery({
    queryKey: ['encoding-session', currentSessionId],
    queryFn: async () => {
      if (!currentSessionId) return null;

      const { data, error } = await supabase
        .from('stream_encoding_sessions')
        .select('*')
        .eq('id', currentSessionId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!currentSessionId,
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
              encodingSession={encodingSession}
            />
            <BroadcastQualityManager
              streamId={streamId}
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