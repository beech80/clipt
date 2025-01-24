import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import { PresetForm, type PresetFormData } from './quality/PresetForm';
import { PresetList } from './quality/PresetList';
import { PresetPreview } from './quality/PresetPreview';
import type { QualityPreset } from '@/types/streaming';
import type { PresetData, RawPresetData } from './quality/types';
import { Loader2 } from 'lucide-react';

interface QualityPresetManagerProps {
  streamId: string;
  onPresetChange: (preset: QualityPreset) => void;
}

export function QualityPresetManager({ streamId, onPresetChange }: QualityPresetManagerProps) {
  const [editingPreset, setEditingPreset] = useState<PresetFormData | null>(null);
  const [activePreset, setActivePreset] = useState<string | null>(null);

  const { data: presets, refetch, isLoading } = useQuery({
    queryKey: ['quality-presets'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('quality_presets')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      return (data as RawPresetData[]).map(preset => ({
        id: preset.id,
        name: preset.name,
        description: preset.description,
        settings: preset.settings as PresetData['settings']
      }));
    },
  });

  const createPreset = useMutation({
    mutationFn: async (data: PresetFormData) => {
      const { error } = await supabase
        .from('quality_presets')
        .insert([{
          name: data.name,
          description: data.description,
          settings: data.settings,
        }]);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Preset created successfully');
      refetch();
    },
    onError: () => {
      toast.error('Failed to create preset');
    },
  });

  const updatePreset = useMutation({
    mutationFn: async (data: PresetFormData & { id: string }) => {
      const { error } = await supabase
        .from('quality_presets')
        .update({
          name: data.name,
          description: data.description,
          settings: data.settings,
        })
        .eq('id', data.id);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Preset updated successfully');
      refetch();
      setEditingPreset(null);
    },
    onError: () => {
      toast.error('Failed to update preset');
    },
  });

  const deletePreset = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('quality_presets')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Preset deleted successfully');
      refetch();
    },
    onError: () => {
      toast.error('Failed to delete preset');
    },
  });

  const applyPreset = useMutation({
    mutationFn: async (presetId: string) => {
      const preset = presets?.find(p => p.id === presetId);
      if (!preset) throw new Error('Preset not found');
      
      const { error } = await supabase
        .from('streams')
        .update({
          current_bitrate: preset.settings.video.bitrate,
          current_fps: preset.settings.video.fps,
          stream_resolution: preset.settings.video.resolution
        })
        .eq('id', streamId);

      if (error) throw error;
      
      const qualityPreset: QualityPreset = {
        resolution: preset.settings.video.resolution,
        bitrate: preset.settings.video.bitrate,
        fps: preset.settings.video.fps
      };
      
      return qualityPreset;
    },
    onSuccess: (settings) => {
      toast.success('Quality preset applied successfully');
      onPresetChange(settings);
    },
    onError: () => {
      toast.error('Failed to apply preset');
    },
  });

  const handleSubmit = (data: PresetFormData) => {
    if (editingPreset) {
      updatePreset.mutate({ ...data, id: (editingPreset as any).id });
    } else {
      createPreset.mutate(data);
    }
  };

  const handleApplyPreset = (presetId: string) => {
    setActivePreset(presetId);
    applyPreset.mutate(presetId);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">
          {editingPreset ? 'Edit Preset' : 'Create New Preset'}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <PresetForm
            onSubmit={handleSubmit}
            initialData={editingPreset || undefined}
            isLoading={createPreset.isPending || updatePreset.isPending}
          />
          <PresetPreview
            preset={editingPreset || {
              name: '',
              description: '',
              settings: {
                video: { fps: 30, bitrate: 3000, resolution: '1280x720' },
                audio: { bitrate: 160, channels: 2, sampleRate: 48000 }
              }
            }}
          />
        </div>
      </Card>

      <div>
        <h2 className="text-lg font-semibold mb-4">Saved Presets</h2>
        <PresetList
          presets={presets || []}
          activePreset={activePreset}
          onEdit={setEditingPreset}
          onApply={handleApplyPreset}
          onDelete={(id) => deletePreset.mutate(id)}
          isApplying={applyPreset.isPending}
        />
      </div>
    </div>
  );
}