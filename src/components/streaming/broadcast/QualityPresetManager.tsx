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

const DEFAULT_PRESETS: Record<string, EncoderPreset> = {
  ultrafast: {
    name: 'Ultra Fast',
    settings: {
      fps: 30,
      bitrate: 2500,
      resolution: '1280x720',
      keyframe_interval: 2,
      audio_bitrate: 128,
      audio_sample_rate: 44100
    },
    description: 'Lowest CPU usage, good for low-end computers'
  },
  balanced: {
    name: 'Balanced',
    settings: {
      fps: 60,
      bitrate: 4500,
      resolution: '1920x1080',
      keyframe_interval: 2,
      audio_bitrate: 160,
      audio_sample_rate: 48000
    },
    description: 'Good balance between quality and performance'
  },
  quality: {
    name: 'High Quality',
    settings: {
      fps: 60,
      bitrate: 6000,
      resolution: '1920x1080',
      keyframe_interval: 2,
      audio_bitrate: 320,
      audio_sample_rate: 48000
    },
    description: 'Best quality, requires powerful computer'
  }
};

interface QualityPresetManagerProps {
  streamId: string;
  onPresetSelect: (preset: EncoderPreset) => void;
}

export function QualityPresetManager({ streamId, onPresetSelect }: QualityPresetManagerProps) {
  const [selectedPreset, setSelectedPreset] = useState<string>('balanced');
  const [isCustomizing, setIsCustomizing] = useState(false);
  const [customPreset, setCustomPreset] = useState<EncoderPreset>({
    name: 'Custom',
    settings: DEFAULT_PRESETS.balanced.settings,
    description: 'Custom preset'
  });

  const { data: savedPresets, isLoading } = useQuery({
    queryKey: ['broadcast-presets', streamId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('broadcast_presets')
        .select('*')
        .eq('stream_id', streamId);
      
      if (error) throw error;
      return data;
    }
  });

  const savePresetMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase
        .from('broadcast_presets')
        .insert({
          stream_id: streamId,
          name: customPreset.name,
          settings: customPreset.settings,
          description: customPreset.description
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
    const preset = DEFAULT_PRESETS[presetKey];
    if (preset) {
      onPresetSelect(preset);
    }
  };

  const handleSaveCustomPreset = () => {
    savePresetMutation.mutate(customPreset);
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
              {Object.entries(DEFAULT_PRESETS).map(([key, preset]) => (
                <SelectItem key={key} value={key}>
                  {preset.name}
                </SelectItem>
              ))}
              {savedPresets?.map((preset) => (
                <SelectItem key={preset.id} value={preset.id}>
                  {preset.name} (Custom)
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="text-sm text-muted-foreground">
            {DEFAULT_PRESETS[selectedPreset]?.description}
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
