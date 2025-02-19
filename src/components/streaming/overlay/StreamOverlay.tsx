
import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { toast } from 'sonner';

interface StreamOverlayProps {
  userId: string;
}

export const StreamOverlay = ({ userId }: StreamOverlayProps) => {
  const [overlaySettings, setOverlaySettings] = useState({
    enabled: true,
    opacity: 0.8,
    position: { x: 10, y: 10 },
  });

  const { data: customOverlays, refetch } = useQuery({
    queryKey: ['stream-overlays', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('custom_overlays')
        .select('*')
        .eq('user_id', userId);

      if (error) throw error;
      return data;
    }
  });

  const saveOverlay = async () => {
    const { error } = await supabase
      .from('custom_overlays')
      .upsert({
        user_id: userId,
        settings: overlaySettings,
        is_active: true,
      });

    if (error) {
      toast.error('Failed to save overlay');
      return;
    }

    toast.success('Overlay saved');
    refetch();
  };

  return (
    <Card className="p-6 space-y-6">
      <h3 className="text-xl font-semibold">Stream Overlays</h3>
      
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-medium">Enable Overlay</h4>
            <p className="text-sm text-muted-foreground">Show custom overlays on your stream</p>
          </div>
          <Switch
            checked={overlaySettings.enabled}
            onCheckedChange={(checked) => setOverlaySettings(s => ({ ...s, enabled: checked }))}
          />
        </div>

        <div>
          <h4 className="font-medium mb-2">Overlay Opacity</h4>
          <Slider
            value={[overlaySettings.opacity * 100]}
            onValueChange={(value) => setOverlaySettings(s => ({ ...s, opacity: value[0] / 100 }))}
            max={100}
            step={1}
          />
        </div>

        <div className="space-y-2">
          <h4 className="font-medium">Custom HTML</h4>
          <textarea
            className="w-full h-32 p-2 rounded-md bg-background border"
            placeholder="Enter custom HTML for your overlay"
          />
        </div>

        <Button onClick={saveOverlay}>Save Overlay</Button>
      </div>
    </Card>
  );
};
