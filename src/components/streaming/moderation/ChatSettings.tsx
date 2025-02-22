
import React from 'react';
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { toast } from "sonner";
import { useQueryClient, useMutation } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

interface ChatSettingsProps {
  streamId: string;
  settings?: {
    slow_mode: boolean;
    slow_mode_interval: number;
    subscriber_only: boolean;
    follower_only: boolean;
    follower_time_required: number;
    emote_only: boolean;
    auto_mod_settings: {
      enabled: boolean;
      spam_detection: boolean;
      link_protection: boolean;
      caps_limit_percent: number;
      max_emotes: number;
      blocked_terms: string[];
    };
  };
}

export const ChatSettings = ({ streamId, settings }: ChatSettingsProps) => {
  const queryClient = useQueryClient();

  const updateSettings = useMutation({
    mutationFn: async (newSettings: typeof settings) => {
      const { error } = await supabase
        .from('streams')
        .update({ chat_settings: newSettings })
        .eq('id', streamId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stream', streamId] });
      toast.success('Chat settings updated');
    },
    onError: () => {
      toast.error('Failed to update chat settings');
    }
  });

  const handleSettingChange = (
    key: string,
    value: any,
    subKey?: string
  ) => {
    if (!settings) return;

    const newSettings = { ...settings };
    if (subKey) {
      newSettings.auto_mod_settings = {
        ...newSettings.auto_mod_settings,
        [subKey]: value
      };
    } else {
      newSettings[key as keyof typeof settings] = value;
    }

    updateSettings.mutate(newSettings);
  };

  if (!settings) return null;

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <Label>Slow Mode</Label>
            <p className="text-sm text-muted-foreground">
              Limit how often users can send messages
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Switch
              checked={settings.slow_mode}
              onCheckedChange={(checked) => handleSettingChange('slow_mode', checked)}
            />
            {settings.slow_mode && (
              <Input
                type="number"
                min={0}
                value={settings.slow_mode_interval}
                onChange={(e) => handleSettingChange('slow_mode_interval', parseInt(e.target.value))}
                className="w-24"
              />
            )}
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <Label>Subscriber-Only Mode</Label>
            <p className="text-sm text-muted-foreground">
              Only subscribers can chat
            </p>
          </div>
          <Switch
            checked={settings.subscriber_only}
            onCheckedChange={(checked) => handleSettingChange('subscriber_only', checked)}
          />
        </div>

        <div className="flex items-center justify-between">
          <div>
            <Label>Follower-Only Mode</Label>
            <p className="text-sm text-muted-foreground">
              Only followers can chat
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Switch
              checked={settings.follower_only}
              onCheckedChange={(checked) => handleSettingChange('follower_only', checked)}
            />
            {settings.follower_only && (
              <Input
                type="number"
                min={0}
                value={settings.follower_time_required}
                onChange={(e) => handleSettingChange('follower_time_required', parseInt(e.target.value))}
                className="w-24"
              />
            )}
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <Label>Emote-Only Mode</Label>
            <p className="text-sm text-muted-foreground">
              Only emotes are allowed in chat
            </p>
          </div>
          <Switch
            checked={settings.emote_only}
            onCheckedChange={(checked) => handleSettingChange('emote_only', checked)}
          />
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold">AutoMod Settings</h3>

        <div className="flex items-center justify-between">
          <div>
            <Label>Enable AutoMod</Label>
            <p className="text-sm text-muted-foreground">
              Automatically moderate chat messages
            </p>
          </div>
          <Switch
            checked={settings.auto_mod_settings.enabled}
            onCheckedChange={(checked) => handleSettingChange('auto_mod_settings', checked, 'enabled')}
          />
        </div>

        {settings.auto_mod_settings.enabled && (
          <>
            <div className="flex items-center justify-between">
              <div>
                <Label>Spam Detection</Label>
                <p className="text-sm text-muted-foreground">
                  Detect and remove spam messages
                </p>
              </div>
              <Switch
                checked={settings.auto_mod_settings.spam_detection}
                onCheckedChange={(checked) => handleSettingChange('auto_mod_settings', checked, 'spam_detection')}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Link Protection</Label>
                <p className="text-sm text-muted-foreground">
                  Only allow trusted links
                </p>
              </div>
              <Switch
                checked={settings.auto_mod_settings.link_protection}
                onCheckedChange={(checked) => handleSettingChange('auto_mod_settings', checked, 'link_protection')}
              />
            </div>

            <div className="space-y-2">
              <Label>Maximum CAPS Percentage</Label>
              <Slider
                value={[settings.auto_mod_settings.caps_limit_percent]}
                onValueChange={([value]) => handleSettingChange('auto_mod_settings', value, 'caps_limit_percent')}
                max={100}
                step={1}
              />
            </div>

            <div className="space-y-2">
              <Label>Maximum Emotes Per Message</Label>
              <Slider
                value={[settings.auto_mod_settings.max_emotes]}
                onValueChange={([value]) => handleSettingChange('auto_mod_settings', value, 'max_emotes')}
                max={50}
                step={1}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
};
