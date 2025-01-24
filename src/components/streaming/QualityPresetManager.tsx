import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { Json } from '@/integrations/supabase/types';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { PresetForm, type PresetFormData } from './quality/PresetForm';
import { PresetList } from './quality/PresetList';
import { PresetPreview } from './quality/PresetPreview';

export function QualityPresetManager() {
  const [editingPreset, setEditingPreset] = useState<PresetFormData | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  const { data: presets, refetch } = useQuery({
    queryKey: ['quality-presets'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('quality_presets')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const createPreset = useMutation({
    mutationFn: async (data: PresetFormData) => {
      const { error } = await supabase
        .from('quality_presets')
        .insert([
          {
            name: data.name,
            description: data.description,
            settings: data.settings as Json,
          },
        ]);

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
          settings: data.settings as Json,
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

  const handleSubmit = (data: PresetFormData) => {
    if (editingPreset) {
      updatePreset.mutate({ ...data, id: (editingPreset as any).id });
    } else {
      createPreset.mutate(data);
    }
  };

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
          onEdit={setEditingPreset}
          onDelete={(id) => {
            if (window.confirm('Are you sure you want to delete this preset?')) {
              deletePreset.mutate(id);
            }
          }}
        />
      </div>
    </div>
  );
}