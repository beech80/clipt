import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { BroadcastQualityManager } from './BroadcastQualityManager';
import { EncodingManager } from './EncodingManager';
import { StreamKeyManager } from './StreamKeyManager';
import { BroadcastHealthMonitor } from './BroadcastHealthMonitor';
import { QualityPresetManager } from './QualityPresetManager';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { QualityPreset, EncoderPreset } from '@/types/broadcast';

interface BroadcastEngineProps {
  streamId: string;
  userId: string;
}

interface EngineConfig {
  id: string;
  user_id: string;
  quality_presets: Record<string, QualityPreset>;
  encoder_settings: Record<string, any>;
  ingest_endpoints: any[];
  created_at: string;
  updated_at: string;
}

export const BroadcastEngine = ({ streamId, userId }: BroadcastEngineProps) => {
  const [isInitialized, setIsInitialized] = useState(false);
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
      return data as EngineConfig;
    },
  });

  const { data: encodingSession } = useQuery({
    queryKey: ['encoding-session', streamId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('stream_encoding_sessions')
        .select('*')
        .eq('stream_id', streamId)
        .eq('status', 'active')
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: isInitialized,
    refetchInterval: 5000,
  });

  useEffect(() => {
    if (encodingSession?.id) {
      setCurrentSessionId(encodingSession.id);
    }
  }, [encodingSession]);

  const initializeEngineMutation = useMutation({
    mutationFn: async () => {
      const defaultSettings = {
        resolution: "1280x720",
        bitrate: 3000,
        fps: 30
      };

      const { error } = await supabase
        .from('stream_encoding_sessions')
        .insert({
          stream_id: streamId,
          current_settings: defaultSettings,
          status: 'active',
          encoder_stats: {
            cpu_usage: 0,
            current_fps: 0,
            dropped_frames: 0,
            bandwidth_usage: 0
          }
        });

      if (error) throw error;
    },
    onSuccess: () => {
      setIsInitialized(true);
      setEngineStatus('active');
      toast.success('Broadcast engine initialized successfully');
    },
    onError: (error) => {
      console.error('Failed to initialize broadcast engine:', error);
      setEngineStatus('error');
      toast.error('Failed to initialize broadcast engine');
    },
  });

  const handlePresetSelect = (preset: EncoderPreset) => {
    // Update encoding session with new preset settings
    if (currentSessionId) {
      supabase
        .from('stream_encoding_sessions')
        .update({
          current_settings: preset.settings
        })
        .eq('id', currentSessionId)
        .then(({ error }) => {
          if (error) {
            toast.error('Failed to apply preset');
          } else {
            toast.success(`Applied ${preset.name} preset`);
          }
        });
    }
  };

  const handleEngineStart = () => {
    setEngineStatus('starting');
    initializeEngineMutation.mutate();
  };

  if (engineStatus === 'error') {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          Failed to initialize broadcast engine. Please try again.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {!isInitialized ? (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Broadcast Engine</h3>
          <Button
            onClick={handleEngineStart}
            disabled={engineStatus === 'starting'}
          >
            {engineStatus === 'starting' ? 'Initializing...' : 'Initialize Engine'}
          </Button>
        </Card>
      ) : (
        <>
          <BroadcastHealthMonitor 
            streamId={streamId}
            sessionId={currentSessionId || undefined}
          />
          <QualityPresetManager
            streamId={streamId}
            onPresetSelect={handlePresetSelect}
          />
          <BroadcastQualityManager
            streamId={streamId}
            engineConfig={engineConfig}
            encodingSession={encodingSession}
          />
          <EncodingManager
            streamId={streamId}
            engineConfig={engineConfig}
            encodingSession={encodingSession}
          />
          <StreamKeyManager streamId={streamId} />
        </>
      )}
    </div>
  );
};