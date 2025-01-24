import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { Card } from '@/components/ui/card';
import { PresetSelector } from './components/PresetSelector';
import { BitrateControl } from './components/BitrateControl';
import { FPSSelector } from './components/FPSSelector';
import { EncoderPreset } from '@/types/broadcast';

interface QualityPresetManagerProps {
  streamId: string;
  engineConfig: any;
  encodingSession: any;
}

export const QualityPresetManager = ({
  streamId,
  engineConfig,
  encodingSession,
}: QualityPresetManagerProps) => {
  const [quality, setQuality] = useState(encodingSession?.current_settings || engineConfig?.quality_presets.medium);

  const { data: presets } = useQuery({
    queryKey: ['broadcast-presets', streamId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('broadcast_presets')
        .select('*')
        .eq('user_id', streamId);
      
      if (error) throw error;

      return data.map(preset => {
        const videoSettings = preset.video_settings as {
          fps: number;
          bitrate: number;
          resolution: string;
          keyframe_interval: number;
        };
        const audioSettings = preset.audio_settings as {
          bitrate: number;
          sample_rate: number;
        };

        return {
          name: preset.name,
          settings: {
            fps: videoSettings.fps,
            bitrate: videoSettings.bitrate,
            resolution: videoSettings.resolution,
            keyframe_interval: videoSettings.keyframe_interval,
            audio_bitrate: audioSettings.bitrate,
            audio_sample_rate: audioSettings.sample_rate
          },
          description: 'Custom preset'
        };
      });
    }
  });

  const updateQualityMutation = useMutation({
    mutationFn: async (newSettings: any) => {
      const { error } = await supabase.rpc('update_stream_quality', {
        stream_id: streamId,
        new_settings: newSettings,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Stream quality updated successfully');
    },
    onError: (error) => {
      console.error('Failed to update stream quality:', error);
      toast.error('Failed to update stream quality');
    },
  });

  const handleQualityPresetChange = (preset: string) => {
    const newSettings = engineConfig.quality_presets[preset];
    setQuality(newSettings);
    updateQualityMutation.mutate(newSettings);
  };

  const handleBitrateChange = (value: number[]) => {
    const newSettings = { ...quality, bitrate: value[0] };
    setQuality(newSettings);
  };

  const handleBitrateCommit = (value: number[]) => {
    updateQualityMutation.mutate({ ...quality, bitrate: value[0] });
  };

  const handleFPSChange = (value: string) => {
    const newSettings = { ...quality, fps: parseInt(value) };
    setQuality(newSettings);
    updateQualityMutation.mutate(newSettings);
  };

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">Quality Settings</h3>
      
      <div className="space-y-4">
        <PresetSelector
          presets={engineConfig?.quality_presets || {}}
          currentPreset={Object.entries(engineConfig?.quality_presets || {})
            .find(([_, preset]) => JSON.stringify(preset) === JSON.stringify(quality))?.[0] || 'custom'}
          onPresetChange={handleQualityPresetChange}
        />

        <BitrateControl
          bitrate={quality?.bitrate || 3000}
          minBitrate={engineConfig?.encoder_settings.video_bitrate_range.min || 1000}
          maxBitrate={engineConfig?.encoder_settings.video_bitrate_range.max || 8000}
          onBitrateChange={handleBitrateChange}
          onBitrateCommit={handleBitrateCommit}
        />

        <FPSSelector
          fps={quality?.fps || 30}
          availableFPS={engineConfig?.encoder_settings.fps_options || [30, 60]}
          onFPSChange={handleFPSChange}
        />
      </div>
    </Card>
  );
};