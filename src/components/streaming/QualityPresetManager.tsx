import { useQuery, useMutation } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { toast } from 'sonner';
import { Save, Settings } from 'lucide-react';

interface QualityPreset {
  id: string;
  name: string;
  description: string | null;
  settings: {
    video: {
      bitrate: number;
      fps: number;
      resolution: string;
      keyframe_interval: number;
      quality_preset: string;
      x264_options: { [key: string]: string | number | boolean };
    };
    audio: {
      bitrate: number;
      channels: number;
      sample_rate: number;
      codec: string;
    };
  };
  is_default: boolean;
}

interface QualityPresetManagerProps {
  userId: string;
  onPresetChange?: (preset: QualityPreset) => void;
}

export function QualityPresetManager({ userId, onPresetChange }: QualityPresetManagerProps) {
  const { data: presets, refetch } = useQuery({
    queryKey: ['quality-presets', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('quality_presets')
        .select('*')
        .eq('user_id', userId);
      
      if (error) throw error;
      return (data as any[]).map(preset => ({
        ...preset,
        settings: preset.settings as QualityPreset['settings']
      })) as QualityPreset[];
    },
  });

  const createPreset = useMutation({
    mutationFn: async (preset: Omit<QualityPreset, 'id'>) => {
      const { error } = await supabase
        .from('quality_presets')
        .insert({
          name: preset.name,
          description: preset.description,
          settings: preset.settings as unknown as Json,
          is_default: preset.is_default,
          user_id: userId
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Preset created successfully');
      refetch();
    },
    onError: (error) => {
      toast.error('Failed to create preset');
      console.error('Create preset error:', error);
    },
  });

  const updatePreset = useMutation({
    mutationFn: async (preset: Partial<QualityPreset> & { id: string }) => {
      const { error } = await supabase
        .from('quality_presets')
        .update({
          name: preset.name,
          description: preset.description,
          settings: preset.settings as unknown as Json,
          is_default: preset.is_default
        })
        .eq('id', preset.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Preset updated successfully');
      refetch();
    },
    onError: (error) => {
      toast.error('Failed to update preset');
      console.error('Update preset error:', error);
    },
  });

  const deletePreset = useMutation({
    mutationFn: async (presetId: string) => {
      const { error } = await supabase
        .from('quality_presets')
        .delete()
        .eq('id', presetId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Preset deleted successfully');
      refetch();
    },
    onError: (error) => {
      toast.error('Failed to delete preset');
      console.error('Delete preset error:', error);
    },
  });

  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-6">
        <Settings className="w-5 h-5" />
        <h2 className="text-xl font-bold">Quality Presets</h2>
      </div>

      <div className="space-y-6">
        {/* Preset Selection */}
        {presets && presets.length > 0 && (
          <div className="space-y-2">
            <Label>Active Preset</Label>
            <Select onValueChange={(presetId) => {
              const preset = presets.find(p => p.id === presetId);
              if (preset && onPresetChange) onPresetChange(preset);
            }}>
              <SelectTrigger>
                <SelectValue placeholder="Select a preset" />
              </SelectTrigger>
              <SelectContent>
                {presets.map((preset) => (
                  <SelectItem key={preset.id} value={preset.id}>
                    {preset.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* New Preset Form */}
        <form onSubmit={(e) => {
          e.preventDefault();
          const formData = new FormData(e.currentTarget as HTMLFormElement);
          const preset = {
            name: formData.get('name') as string,
            description: formData.get('description') as string,
            settings: {
              video: {
                bitrate: parseInt(formData.get('videoBitrate') as string),
                fps: parseInt(formData.get('fps') as string),
                resolution: formData.get('resolution') as string,
                keyframe_interval: 2,
                quality_preset: formData.get('qualityPreset') as string,
                x264_options: {}
              },
              audio: {
                bitrate: parseInt(formData.get('audioBitrate') as string),
                channels: 2,
                sample_rate: 48000,
                codec: 'aac'
              }
            },
            is_default: false
          };
          createPreset.mutate(preset);
        }} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Preset Name</Label>
            <Input id="name" name="name" placeholder="e.g., High Quality 1080p" required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Input id="description" name="description" placeholder="Optional description" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="resolution">Resolution</Label>
              <Select name="resolution" defaultValue="1280x720">
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
              <Label htmlFor="fps">FPS</Label>
              <Select name="fps" defaultValue="30">
                <SelectTrigger>
                  <SelectValue placeholder="Select FPS" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="30">30 FPS</SelectItem>
                  <SelectItem value="60">60 FPS</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="videoBitrate">Video Bitrate (kbps)</Label>
            <Input 
              type="number" 
              id="videoBitrate" 
              name="videoBitrate" 
              defaultValue="3000"
              min="1000"
              max="8000"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="audioBitrate">Audio Bitrate (kbps)</Label>
            <Input 
              type="number" 
              id="audioBitrate" 
              name="audioBitrate" 
              defaultValue="160"
              min="64"
              max="320"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="qualityPreset">Encoding Preset</Label>
            <Select name="qualityPreset" defaultValue="balanced">
              <SelectTrigger>
                <SelectValue placeholder="Select quality preset" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ultrafast">Ultrafast (Lower CPU)</SelectItem>
                <SelectItem value="fast">Fast</SelectItem>
                <SelectItem value="balanced">Balanced</SelectItem>
                <SelectItem value="slow">Slow (Better Quality)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button type="submit" className="w-full">
            <Save className="w-4 h-4 mr-2" />
            Save Preset
          </Button>
        </form>
      </div>
    </Card>
  );
}