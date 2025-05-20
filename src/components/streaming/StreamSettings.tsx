
import React from 'react';
import { Card } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface StreamSettingsProps {
  userId: string;
}

export const StreamSettings = ({ userId }: StreamSettingsProps) => {
  const { data: settings, refetch } = useQuery({
    queryKey: ['stream-settings', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('stream_settings')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data;
    }
  });

  const updateSettings = async (updates: Partial<typeof settings>) => {
    const { error } = await supabase
      .from('stream_settings')
      .upsert({
        user_id: userId,
        ...settings,
        ...updates,
      });

    if (error) {
      toast.error('Failed to update settings');
      return;
    }

    toast.success('Settings updated');
    refetch();
  };

  return (
    <Card className="p-6 space-y-6">
      <h3 className="text-xl font-semibold">Stream Settings</h3>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-medium">Chat</h4>
            <p className="text-sm text-muted-foreground">Enable chat for your streams</p>
          </div>
          <Switch
            checked={settings?.chat_enabled ?? true}
            onCheckedChange={(checked) => updateSettings({ chat_enabled: checked })}
          />
        </div>

        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-medium">Followers-only Chat</h4>
            <p className="text-sm text-muted-foreground">Only followers can chat</p>
          </div>
          <Switch
            checked={settings?.chat_followers_only ?? false}
            onCheckedChange={(checked) => updateSettings({ chat_followers_only: checked })}
          />
        </div>

        <div>
          <h4 className="font-medium mb-2">Slow Mode</h4>
          <p className="text-sm text-muted-foreground mb-2">Set delay between messages (in seconds)</p>
          <div className="flex gap-2">
            <Input
              type="number"
              min="0"
              value={settings?.chat_slow_mode ?? 0}
              onChange={(e) => updateSettings({ chat_slow_mode: parseInt(e.target.value) })}
            />
            <Button
              variant="outline"
              onClick={() => updateSettings({ chat_slow_mode: 0 })}
            >
              Disable
            </Button>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-medium">Stream Notifications</h4>
            <p className="text-sm text-muted-foreground">Notify followers when you go live</p>
          </div>
          <Switch
            checked={settings?.notification_enabled ?? true}
            onCheckedChange={(checked) => updateSettings({ notification_enabled: checked })}
          />
        </div>
      </div>
    </Card>
  );
};
