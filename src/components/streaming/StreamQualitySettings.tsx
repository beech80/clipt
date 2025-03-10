import React from 'react';
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useQuery, useMutation } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

interface StreamQualitySettingsProps {
  streamId: string;
}

export const StreamQualitySettings = ({ streamId }: StreamQualitySettingsProps) => {
  const { data: stream, isLoading } = useQuery({
    queryKey: ['stream-quality', streamId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('streams')
        .select('available_qualities, current_bitrate, current_fps, stream_resolution')
        .eq('id', streamId)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
  });

  const updateQualityMutation = useMutation({
    mutationFn: async ({ quality, bitrate, fps }: { quality: string, bitrate?: number, fps?: number }) => {
      const { error } = await supabase
        .from('streams')
        .update({ 
          stream_resolution: quality,
          ...(bitrate && { current_bitrate: bitrate }),
          ...(fps && { current_fps: fps })
        })
        .eq('id', streamId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Stream quality updated successfully');
    },
    onError: (error) => {
      toast.error('Failed to update stream quality');
      console.error('Error updating stream quality:', error);
    },
  });

  const availableQualities = (stream?.available_qualities as string[]) || [];
  const currentQuality = stream?.stream_resolution || 'auto';

  if (isLoading) {
    return <div>Loading quality settings...</div>;
  }

  const handleQualityChange = (quality: string) => {
    let bitrate = stream?.current_bitrate;
    let fps = stream?.current_fps;

    // Adjust bitrate and fps based on quality
    if (quality === '1080p') {
      bitrate = 6000;
      fps = 60;
    } else if (quality === '720p') {
      bitrate = 4500;
      fps = 60;
    } else if (quality === '480p') {
      bitrate = 2500;
      fps = 30;
    }

    updateQualityMutation.mutate({ quality, bitrate, fps });
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label>Stream Quality</Label>
        <Select
          value={currentQuality}
          onValueChange={handleQualityChange}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select quality" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="auto">Auto</SelectItem>
            {availableQualities.map((quality: string) => (
              <SelectItem key={quality} value={quality}>
                {quality}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <h3 className="text-lg font-semibold">Current Stream Stats</h3>
        <div className="grid grid-cols-2 gap-4 p-4 rounded-lg bg-background/50">
          <div>
            <Label>Bitrate</Label>
            <p className="text-sm text-muted-foreground">
              {stream?.current_bitrate ? `${(stream.current_bitrate / 1000).toFixed(1)} Mbps` : 'N/A'}
            </p>
          </div>
          <div>
            <Label>FPS</Label>
            <p className="text-sm text-muted-foreground">
              {stream?.current_fps || 'N/A'}
            </p>
          </div>
          <div>
            <Label>Resolution</Label>
            <p className="text-sm text-muted-foreground">
              {stream?.stream_resolution || 'N/A'}
            </p>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <Button
          variant="outline"
          onClick={() => updateQualityMutation.mutate({ quality: 'auto' })}
          disabled={currentQuality === 'auto'}
        >
          Reset to Auto
        </Button>
      </div>
    </div>
  );
};