import React, { useState } from 'react';
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
    <Card className="p-6 space-y-6" style={{ 
        background: '#2A1A12', 
        borderRadius: '12px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
        border: '1px solid #3A2A22',
        position: 'relative',
        overflow: 'hidden',
        width: '100%',
        color: 'white'           
      }}>
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '4px',
        background: 'linear-gradient(90deg, #FF5500, #FF7700)',
      }}></div>
      <div className="flex items-center gap-3 mb-4">
        <div style={{ 
          background: 'linear-gradient(135deg, #FF7700, #FF5500)', 
          width: '36px', 
          height: '36px', 
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 2px 6px rgba(255, 119, 0, 0.2)'
        }}>
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m22 8-6 4 6 4V8Z"/><rect x="2" y="6" width="14" height="12" rx="2"/></svg>
        </div>
        <h3 className="text-xl font-semibold text-white">Stream Settings</h3>
      </div>

      <div className="space-y-4 relative">
        <div style={{
          position: 'absolute',
          right: '-10px',
          bottom: '-10px',
          width: '90px',
          height: '90px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255, 119, 0, 0.1) 0%, rgba(255, 119, 0, 0) 70%)',
          zIndex: 0
        }}></div>
        <div className="flex items-center justify-between relative z-10 hover:bg-white/10 p-2 rounded-lg transition-colors duration-200">
          <div>
            <h4 className="font-medium text-white">Chat</h4>
            <p className="text-sm text-gray-400">Enable chat for your streams</p>
          </div>
          <Switch
            checked={settings?.chat_enabled ?? true}
            onCheckedChange={(checked) => updateSettings({ chat_enabled: checked })}
            className="orange-toggle"
          />
        </div>

        <div className="flex items-center justify-between relative z-10 hover:bg-white/10 p-2 rounded-lg transition-colors duration-200">
          <div>
            <h4 className="font-medium text-white">Followers-only Chat</h4>
            <p className="text-sm text-gray-400">Only followers can chat</p>
          </div>
          <Switch
            checked={settings?.chat_followers_only ?? false}
            onCheckedChange={(checked) => updateSettings({ chat_followers_only: checked })}
            className="orange-toggle"
          />
        </div>

        <div className="relative z-10 p-2 rounded-lg transition-colors duration-200 hover:bg-white/10">
          <h4 className="font-medium mb-2 text-white">Slow Mode</h4>
          <p className="text-sm text-gray-400 mb-2">Set delay between messages (in seconds)</p>
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
              style={{
                background: 'linear-gradient(135deg, #3A2A22, #2A1A12)',
                borderColor: '#FF7700',
                color: 'white'
              }}
            >
              Disable
            </Button>
          </div>
        </div>

        <div className="flex items-center justify-between relative z-10 hover:bg-white/10 p-2 rounded-lg transition-colors duration-200">
          <div>
            <h4 className="font-medium text-white">Stream Notifications</h4>
            <p className="text-sm text-gray-400">Notify followers when you go live</p>
          </div>
          <Switch
            checked={settings?.notification_enabled ?? true}
            onCheckedChange={(checked) => updateSettings({ notification_enabled: checked })}
            className="orange-toggle"
          />
        </div>
      </div>
    </Card>
  );
};
