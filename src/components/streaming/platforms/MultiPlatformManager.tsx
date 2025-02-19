
import React from 'react';
import { Card } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface MultiPlatformManagerProps {
  userId: string;
}

export const MultiPlatformManager = ({ userId }: MultiPlatformManagerProps) => {
  const { data: platforms, refetch } = useQuery({
    queryKey: ['streaming-platforms', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('streaming_platforms')
        .select('*')
        .eq('user_id', userId);

      if (error) throw error;
      return data;
    }
  });

  const togglePlatform = async (platformName: string, isEnabled: boolean) => {
    const { error } = await supabase
      .from('streaming_platforms')
      .upsert({
        user_id: userId,
        platform_name: platformName,
        is_enabled: isEnabled
      });

    if (error) {
      toast.error(`Failed to update ${platformName} settings`);
      return;
    }

    toast.success(`${platformName} settings updated`);
    refetch();
  };

  return (
    <Card className="p-6 space-y-6">
      <h3 className="text-xl font-semibold">Multi-Platform Streaming</h3>

      <div className="space-y-6">
        {/* Twitch Integration */}
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-medium">Twitch</h4>
            <p className="text-sm text-muted-foreground">Stream to Twitch simultaneously</p>
          </div>
          <div className="flex items-center gap-2">
            <Switch
              checked={platforms?.some(p => p.platform_name === 'twitch')?.is_enabled ?? false}
              onCheckedChange={(checked) => togglePlatform('twitch', checked)}
            />
            <Button variant="outline">Connect</Button>
          </div>
        </div>

        {/* YouTube Integration */}
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-medium">YouTube</h4>
            <p className="text-sm text-muted-foreground">Stream to YouTube simultaneously</p>
          </div>
          <div className="flex items-center gap-2">
            <Switch
              checked={platforms?.some(p => p.platform_name === 'youtube')?.is_enabled ?? false}
              onCheckedChange={(checked) => togglePlatform('youtube', checked)}
            />
            <Button variant="outline">Connect</Button>
          </div>
        </div>

        {/* Facebook Gaming Integration */}
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-medium">Facebook Gaming</h4>
            <p className="text-sm text-muted-foreground">Stream to Facebook Gaming simultaneously</p>
          </div>
          <div className="flex items-center gap-2">
            <Switch
              checked={platforms?.some(p => p.platform_name === 'facebook')?.is_enabled ?? false}
              onCheckedChange={(checked) => togglePlatform('facebook', checked)}
            />
            <Button variant="outline">Connect</Button>
          </div>
        </div>
      </div>
    </Card>
  );
};
