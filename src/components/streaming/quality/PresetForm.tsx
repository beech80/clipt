import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import type { Json } from '@/integrations/supabase/types';

interface PresetFormProps {
  onSubmit: (data: PresetFormData) => void;
  initialData?: PresetFormData;
  isLoading?: boolean;
}

export interface PresetFormData {
  name: string;
  description: string;
  settings: {
    video: {
      fps: number;
      bitrate: number;
      resolution: string;
    };
    audio: {
      bitrate: number;
      channels: number;
      sampleRate: number;
    };
  };
}

export function PresetForm({ onSubmit, initialData, isLoading }: PresetFormProps) {
  const [formData, setFormData] = useState<PresetFormData>(initialData || {
    name: '',
    description: '',
    settings: {
      video: {
        fps: 30,
        bitrate: 3000,
        resolution: '1280x720'
      },
      audio: {
        bitrate: 160,
        channels: 2,
        sampleRate: 48000
      }
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) {
      toast.error('Please enter a preset name');
      return;
    }
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        placeholder="Preset Name"
        value={formData.name}
        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
      />
      
      <Textarea
        placeholder="Description"
        value={formData.description}
        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
      />
      
      <div className="space-y-2">
        <h3 className="text-sm font-medium">Video Settings</h3>
        <div className="grid grid-cols-3 gap-2">
          <Input
            type="number"
            placeholder="FPS"
            value={formData.settings.video.fps}
            onChange={(e) => setFormData({
              ...formData,
              settings: {
                ...formData.settings,
                video: {
                  ...formData.settings.video,
                  fps: parseInt(e.target.value)
                }
              }
            })}
          />
          <Input
            type="number"
            placeholder="Bitrate (kbps)"
            value={formData.settings.video.bitrate}
            onChange={(e) => setFormData({
              ...formData,
              settings: {
                ...formData.settings,
                video: {
                  ...formData.settings.video,
                  bitrate: parseInt(e.target.value)
                }
              }
            })}
          />
          <Input
            placeholder="Resolution"
            value={formData.settings.video.resolution}
            onChange={(e) => setFormData({
              ...formData,
              settings: {
                ...formData.settings,
                video: {
                  ...formData.settings.video,
                  resolution: e.target.value
                }
              }
            })}
          />
        </div>
      </div>

      <div className="space-y-2">
        <h3 className="text-sm font-medium">Audio Settings</h3>
        <div className="grid grid-cols-3 gap-2">
          <Input
            type="number"
            placeholder="Bitrate (kbps)"
            value={formData.settings.audio.bitrate}
            onChange={(e) => setFormData({
              ...formData,
              settings: {
                ...formData.settings,
                audio: {
                  ...formData.settings.audio,
                  bitrate: parseInt(e.target.value)
                }
              }
            })}
          />
          <Input
            type="number"
            placeholder="Channels"
            value={formData.settings.audio.channels}
            onChange={(e) => setFormData({
              ...formData,
              settings: {
                ...formData.settings,
                audio: {
                  ...formData.settings.audio,
                  channels: parseInt(e.target.value)
                }
              }
            })}
          />
          <Input
            type="number"
            placeholder="Sample Rate"
            value={formData.settings.audio.sampleRate}
            onChange={(e) => setFormData({
              ...formData,
              settings: {
                ...formData.settings,
                audio: {
                  ...formData.settings.audio,
                  sampleRate: parseInt(e.target.value)
                }
              }
            })}
          />
        </div>
      </div>

      <Button type="submit" disabled={isLoading}>
        {isLoading ? 'Saving...' : 'Save Preset'}
      </Button>
    </form>
  );
}