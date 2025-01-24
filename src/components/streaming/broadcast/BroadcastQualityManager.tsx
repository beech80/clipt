import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';

interface BroadcastQualityManagerProps {
  streamId: string;
  engineConfig: any;
  encodingSession: any;
  currentSessionId: string;
}

export const BroadcastQualityManager = ({
  streamId,
  engineConfig,
  encodingSession,
  currentSessionId,
}: BroadcastQualityManagerProps) => {
  const [quality, setQuality] = useState(encodingSession?.current_settings || engineConfig?.quality_presets.medium);

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

  const handleFpsChange = (value: string) => {
    const newSettings = { ...quality, fps: parseInt(value) };
    setQuality(newSettings);
    updateQualityMutation.mutate(newSettings);
  };

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">Quality Settings</h3>
      
      <div className="space-y-4">
        <div className="space-y-2">
          <Label>Quality Preset</Label>
          <Select
            value={Object.entries(engineConfig?.quality_presets || {})
              .find(([_, preset]) => JSON.stringify(preset) === JSON.stringify(quality))?.[0] || 'custom'}
            onValueChange={handleQualityPresetChange}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select quality preset" />
            </SelectTrigger>
            <SelectContent>
              {Object.keys(engineConfig?.quality_presets || {}).map((preset) => (
                <SelectItem key={preset} value={preset}>
                  {preset.charAt(0).toUpperCase() + preset.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Bitrate (kbps)</Label>
          <Slider
            value={[quality?.bitrate || 3000]}
            min={engineConfig?.encoder_settings.video_bitrate_range.min || 1000}
            max={engineConfig?.encoder_settings.video_bitrate_range.max || 8000}
            step={100}
            onValueChange={handleBitrateChange}
            onValueCommit={(value) => updateQualityMutation.mutate({ ...quality, bitrate: value[0] })}
          />
          <span className="text-sm text-muted-foreground">{quality?.bitrate} kbps</span>
        </div>

        <div className="space-y-2">
          <Label>Frame Rate</Label>
          <Select
            value={String(quality?.fps || 30)}
            onValueChange={handleFpsChange}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select frame rate" />
            </SelectTrigger>
            <SelectContent>
              {engineConfig?.encoder_settings.fps_options.map((fps: number) => (
                <SelectItem key={fps} value={String(fps)}>
                  {fps} FPS
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </Card>
  );
};