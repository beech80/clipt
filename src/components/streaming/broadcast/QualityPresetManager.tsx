import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Save, Plus, Trash } from 'lucide-react';
import { toast } from 'sonner';
import { useQuery, useMutation } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { EncoderPreset } from '@/types/broadcast';

interface QualityPresetManagerProps {
  streamId: string;
  onPresetSelect: (preset: EncoderPreset) => void;
}

export function QualityPresetManager({ streamId, onPresetSelect }: QualityPresetManagerProps) {
  const [selectedPreset, setSelectedPreset] = useState<string>('balanced');
  const [isCustomizing, setIsCustomizing] = useState(false);
  const [customPreset, setCustomPreset] = useState<EncoderPreset>({
    name: 'Custom',
    settings: {
      fps: 30,
      bitrate: 3000,
      resolution: '1280x720',
      keyframe_interval: 2,
      audio_bitrate: 160,
      audio_sample_rate: 48000
    },
    description: 'Custom preset'
  });

  const { data: savedPresets, isLoading } = useQuery({
    queryKey: ['broadcast-presets', streamId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('broadcast_presets')
        .select('*')
        .eq('user_id', streamId);
      
      if (error) throw error;
      return data;
    }
  });

  const savePresetMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase
        .from('broadcast_presets')
        .insert({
          user_id: streamId,
          name: customPreset.name,
          encoder_preset: 'custom',
          video_settings: {
            fps: customPreset.settings.fps,
            bitrate: customPreset.settings.bitrate,
            resolution: customPreset.settings.resolution,
            keyframe_interval: customPreset.settings.keyframe_interval
          },
          audio_settings: {
            bitrate: customPreset.settings.audio_bitrate,
            sample_rate: customPreset.settings.audio_sample_rate
          }
        });
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('Preset saved successfully');
      setIsCustomizing(false);
    },
    onError: () => {
      toast.error('Failed to save preset');
    }
  });

  const handlePresetSelect = (presetKey: string) => {
    setSelectedPreset(presetKey);
    const preset = savedPresets?.find(p => p.id === presetKey);
    if (preset) {
      onPresetSelect({
        name: preset.name,
        settings: {
          fps: preset.video_settings.fps,
          bitrate: preset.video_settings.bitrate,
          resolution: preset.video_settings.resolution,
          keyframe_interval: preset.video_settings.keyframe_interval,
          audio_bitrate: preset.audio_settings.bitrate,
          audio_sample_rate: preset.audio_settings.sample_rate
        },
        description: preset.description
      });
    }
  };

  return (
    <Card className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Quality Presets</h3>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsCustomizing(!isCustomizing)}
        >
          <Plus className="w-4 h-4 mr-2" />
          Create Custom
        </Button>
      </div>

      {!isCustomizing ? (
        <div className="space-y-4">
          <Select value={selectedPreset} onValueChange={handlePresetSelect}>
            <SelectTrigger>
              <SelectValue placeholder="Select a preset" />
            </SelectTrigger>
            <SelectContent>
              {savedPresets?.map((preset) => (
                <SelectItem key={preset.id} value={preset.id}>
                  {preset.name} (Custom)
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="text-sm text-muted-foreground">
            {selectedPreset === 'balanced' ? 'Good balance between quality and performance' : ''}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Preset Name</Label>
            <Input
              value={customPreset.name}
              onChange={(e) => setCustomPreset({ ...customPreset, name: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Resolution</Label>
              <Select
                value={customPreset.settings.resolution}
                onValueChange={(value) => 
                  setCustomPreset({
                    ...customPreset,
                    settings: { ...customPreset.settings, resolution: value }
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select resolution" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1920x1080">1080p</SelectItem>
                  <SelectItem value="1280x720">720p</SelectItem>
                  <SelectItem value="854x480">480p</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>FPS</Label>
              <Select
                value={customPreset.settings.fps.toString()}
                onValueChange={(value) =>
                  setCustomPreset({
                    ...customPreset,
                    settings: { ...customPreset.settings, fps: parseInt(value) }
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select FPS" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="30">30 FPS</SelectItem>
                  <SelectItem value="60">60 FPS</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Video Bitrate (kbps)</Label>
              <Input
                type="number"
                value={customPreset.settings.bitrate}
                onChange={(e) =>
                  setCustomPreset({
                    ...customPreset,
                    settings: { ...customPreset.settings, bitrate: parseInt(e.target.value) }
                  })
                }
              />
            </div>

            <div className="space-y-2">
              <Label>Audio Bitrate (kbps)</Label>
              <Input
                type="number"
                value={customPreset.settings.audio_bitrate}
                onChange={(e) =>
                  setCustomPreset({
                    ...customPreset,
                    settings: { ...customPreset.settings, audio_bitrate: parseInt(e.target.value) }
                  })
                }
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Description</Label>
            <Input
              value={customPreset.description}
              onChange={(e) => setCustomPreset({ ...customPreset, description: e.target.value })}
            />
          </div>

          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setIsCustomizing(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveCustomPreset}>
              <Save className="w-4 h-4 mr-2" />
              Save Preset
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}
