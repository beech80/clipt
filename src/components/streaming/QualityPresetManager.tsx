import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { PresetForm } from "./quality/PresetForm";
import { PresetList } from "./quality/PresetList";
import { PresetPreview } from "./quality/PresetPreview";
import { PresetData } from "./quality/types";

interface QualityPresetManagerProps {
  streamId: string;
  onPresetChange?: (preset: PresetData) => void;
}

const DEFAULT_PRESET: PresetData = {
  id: 'preview',
  name: '',
  description: '',
  settings: {
    video: { fps: 30, bitrate: 3000, resolution: '1280x720' },
    audio: { bitrate: 160, channels: 2, sampleRate: 48000 }
  }
};

export function QualityPresetManager({ streamId, onPresetChange }: QualityPresetManagerProps) {
  const [editingPreset, setEditingPreset] = useState<PresetData | null>(null);
  const [activePreset, setActivePreset] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data: presets, isLoading } = useQuery({
    queryKey: ['quality-presets'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('quality_presets')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      // Transform the data to match PresetData type
      return data.map(preset => ({
        id: preset.id,
        name: preset.name,
        description: preset.description,
        settings: preset.settings as PresetData['settings']
      }));
    }
  });

  const createPreset = useMutation({
    mutationFn: async (newPreset: Omit<PresetData, 'id'>) => {
      const { data, error } = await supabase
        .from('quality_presets')
        .insert([newPreset])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quality-presets'] });
      toast.success("Preset created successfully");
      setEditingPreset(null);
    },
    onError: (error) => {
      toast.error("Failed to create preset");
      console.error("Create preset error:", error);
    }
  });

  const updatePreset = useMutation({
    mutationFn: async (updatedPreset: PresetData) => {
      const { data, error } = await supabase
        .from('quality_presets')
        .update(updatedPreset)
        .eq('id', updatedPreset.id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quality-presets'] });
      toast.success("Preset updated successfully");
      setEditingPreset(null);
    },
    onError: (error) => {
      toast.error("Failed to update preset");
      console.error("Update preset error:", error);
    }
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
      queryClient.invalidateQueries({ queryKey: ['quality-presets'] });
      toast.success("Preset deleted successfully");
    },
    onError: (error) => {
      toast.error("Failed to delete preset");
      console.error("Delete preset error:", error);
    }
  });

  const handleSubmit = (data: Omit<PresetData, 'id'>) => {
    if (editingPreset) {
      updatePreset.mutate({ ...data, id: editingPreset.id });
    } else {
      createPreset.mutate(data);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <PresetForm 
            onSubmit={handleSubmit}
            initialData={editingPreset || undefined}
            isLoading={createPreset.isPending || updatePreset.isPending}
          />
          <PresetPreview preset={editingPreset || DEFAULT_PRESET} />
        </div>
      </Card>

      <PresetList
        presets={presets || []}
        activePreset={activePreset}
        onPresetSelect={(preset) => {
          setActivePreset(preset.id);
          onPresetChange?.(preset);
        }}
        onEdit={setEditingPreset}
        onDelete={(id) => deletePreset.mutate(id)}
        isApplying={false}
      />
    </div>
  );
}