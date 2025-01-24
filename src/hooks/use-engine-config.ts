import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { EngineConfig } from '@/types/broadcast';

export const useEngineConfig = (userId: string) => {
  return useQuery({
    queryKey: ['streaming-engine-config', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('streaming_engine_config')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) throw error;
      
      if (data) {
        const qualityPresets = data.quality_presets as {
          low: { fps: number; bitrate: number; resolution: string };
          medium: { fps: number; bitrate: number; resolution: string };
          high: { fps: number; bitrate: number; resolution: string };
        };

        return {
          ...data,
          quality_presets: qualityPresets,
          encoder_settings: data.encoder_settings as EngineConfig['encoder_settings'],
          ingest_endpoints: data.ingest_endpoints as any[]
        } as EngineConfig;
      }
      return null;
    },
  });
};