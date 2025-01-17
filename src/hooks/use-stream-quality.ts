import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

interface StreamQuality {
  resolution: string;
  bitrate: number;
  fps: number;
}

const QUALITY_PRESETS: Record<string, StreamQuality> = {
  '1080p': { resolution: '1920x1080', bitrate: 6000, fps: 60 },
  '720p': { resolution: '1280x720', bitrate: 4500, fps: 60 },
  '480p': { resolution: '854x480', bitrate: 2500, fps: 30 },
};

export const useStreamQuality = (streamId: string) => {
  const [isUpdating, setIsUpdating] = useState(false);

  const { data: currentQuality } = useQuery({
    queryKey: ['stream-quality', streamId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('streams')
        .select('stream_resolution, current_bitrate, current_fps')
        .eq('id', streamId)
        .single();

      if (error) throw error;
      return data;
    },
  });

  const updateQuality = useMutation({
    mutationFn: async (quality: StreamQuality) => {
      setIsUpdating(true);
      const { error } = await supabase
        .from('streams')
        .update({
          stream_resolution: quality.resolution,
          current_bitrate: quality.bitrate,
          current_fps: quality.fps,
        })
        .eq('id', streamId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Stream quality updated successfully');
      setIsUpdating(false);
    },
    onError: () => {
      toast.error('Failed to update stream quality');
      setIsUpdating(false);
    },
  });

  const setQualityPreset = (preset: keyof typeof QUALITY_PRESETS) => {
    updateQuality.mutate(QUALITY_PRESETS[preset]);
  };

  return {
    currentQuality,
    isUpdating,
    setQualityPreset,
    updateQuality: updateQuality.mutate,
    QUALITY_PRESETS,
  };
};