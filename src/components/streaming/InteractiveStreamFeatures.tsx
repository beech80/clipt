import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { MessageSquare, Users, Gift } from 'lucide-react';
import { Card } from '@/components/ui/card';

interface InteractiveStreamFeaturesProps {
  streamId: string;
  isLive: boolean;
}

export const InteractiveStreamFeatures = ({ streamId, isLive }: InteractiveStreamFeaturesProps) => {
  const [viewerCount, setViewerCount] = useState(0);
  const [chatEnabled, setChatEnabled] = useState(true);

  useEffect(() => {
    if (!streamId || !isLive) return;

    // Subscribe to viewer count updates
    const channel = supabase
      .channel(`stream_${streamId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'streams',
          filter: `id=eq.${streamId}`,
        },
        (payload) => {
          if (payload.new.viewer_count !== undefined) {
            setViewerCount(payload.new.viewer_count);
          }
        }
      )
      .subscribe();

    // Subscribe to chat status updates
    const chatChannel = supabase
      .channel(`stream_chat_${streamId}`)
      .on(
        'presence',
        { event: 'sync' },
        () => {
          const state = chatChannel.presenceState();
          console.log('Chat presence state:', state);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      supabase.removeChannel(chatChannel);
    };
  }, [streamId, isLive]);

  const toggleChat = async () => {
    try {
      const { error } = await supabase
        .from('streams')
        .update({ chat_enabled: !chatEnabled })
        .eq('id', streamId);

      if (error) throw error;
      setChatEnabled(!chatEnabled);
      toast.success(`Chat ${chatEnabled ? 'disabled' : 'enabled'}`);
    } catch (error) {
      console.error('Error toggling chat:', error);
      toast.error('Failed to toggle chat');
    }
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4">
      <Card className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-medium">Viewers</span>
        </div>
        <span className="text-lg font-bold">{viewerCount}</span>
      </Card>

      <Card className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-medium">Chat</span>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={toggleChat}
          className={chatEnabled ? 'bg-green-500/10' : 'bg-red-500/10'}
        >
          {chatEnabled ? 'Enabled' : 'Disabled'}
        </Button>
      </Card>

      <Card className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Gift className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-medium">Gifts</span>
        </div>
        <Button variant="outline" size="sm" onClick={() => toast.info('Gift feature coming soon')}>
          Manage
        </Button>
      </Card>
    </div>
  );
};