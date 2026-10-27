
import React from 'react';
import { Card } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface AdvancedChatSettingsProps {
  userId: string;
}

export const AdvancedChatSettings = ({ userId }: AdvancedChatSettingsProps) => {
  const { data: settings, refetch } = useQuery({
    queryKey: ['chat-settings', userId],
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

  const { data: commands } = useQuery({
    queryKey: ['chat-commands', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('chat_commands')
        .select('*')
        .eq('created_by', userId);

      if (error) throw error;
      return data;
    }
  });

  const { data: chatbot, refetch: refetchChatbot } = useQuery({
    queryKey: ['chatbot-configuration', userId],
    queryFn: async () => {
      const { data, error } = await supabase.from('chatbot_configurations')
        .select('id, is_active').eq('user_id', userId).order('created_at', { ascending: false }).limit(1).maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!userId,
  });
  const toggleChatbot = async (enabled: boolean) => {
    const { error } = await supabase.from('chatbot_configurations').upsert({
      id: chatbot?.id, user_id: userId, name: 'Clipt chat assistant', is_active: enabled,
    });
    if (error) { toast.error('Unable to save chatbot configuration'); return; }
    await refetchChatbot();
  };
  const updateSettings = async (updates: { chat_moderation_enabled?: boolean; chat_word_filter_enabled?: boolean }) => {
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
      <h3 className="text-xl font-semibold">Advanced Chat Settings</h3>

      <div className="space-y-6">
        {/* Chat Moderation */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium">Auto Moderation</h4>
              <p className="text-sm text-muted-foreground">Filter inappropriate content</p>
            </div>
            <Switch
              checked={settings?.chat_moderation_enabled ?? true}
              onCheckedChange={(checked) => updateSettings({ chat_moderation_enabled: checked })}
            />
          </div>
        </div>

        {/* Custom Commands */}
        <div className="space-y-4">
          <h4 className="font-medium">Custom Commands</h4>
          <div className="grid gap-4">
            {commands?.map((command) => (
              <div key={command.id} className="flex items-center gap-2">
                <Input value={command.name} readOnly />
                <Input value={command.response_template} readOnly />
                <Button variant="outline" size="sm">Edit</Button>
              </div>
            ))}
            <Button>Add Command</Button>
          </div>
        </div>

        {/* Chatbot Settings */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium">Chatbot</h4>
              <p className="text-sm text-muted-foreground">Enable automated chat responses</p>
            </div>
            <Switch
              checked={chatbot?.is_active ?? false}
              onCheckedChange={toggleChatbot}
            />
          </div>
        </div>

        {/* Word Filter */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium">Word Filter</h4>
              <p className="text-sm text-muted-foreground">Block specific words or phrases</p>
            </div>
            <Switch
              checked={settings?.chat_word_filter_enabled ?? true}
              onCheckedChange={(checked) => updateSettings({ chat_word_filter_enabled: checked })}
            />
          </div>
        </div>
      </div>
    </Card>
  );
};
