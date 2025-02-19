
import React from 'react';
import { Card } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';

interface StreamWidgetsProps {
  userId: string;
}

export const StreamWidgets = ({ userId }: StreamWidgetsProps) => {
  const { data: widgets, refetch } = useQuery({
    queryKey: ['stream-widgets', userId],
    queryFn: async () => {
      const { data: streamData, error } = await supabase
        .from('streams')
        .select(`
          viewer_count,
          chat_enabled,
          started_at
        `)
        .eq('user_id', userId)
        .single();

      if (error) throw error;
      return streamData;
    }
  });

  return (
    <Card className="p-6 space-y-6">
      <h3 className="text-xl font-semibold">Stream Widgets</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Viewer Count Widget */}
        <Card className="p-4">
          <h4 className="font-medium mb-2">Current Viewers</h4>
          <p className="text-2xl font-bold">{widgets?.viewer_count || 0}</p>
        </Card>

        {/* Stream Duration Widget */}
        <Card className="p-4">
          <h4 className="font-medium mb-2">Stream Duration</h4>
          <p className="text-2xl font-bold">
            {widgets?.started_at 
              ? new Date(Date.now() - new Date(widgets.started_at).getTime()).toISOString().substr(11, 8)
              : '00:00:00'
            }
          </p>
        </Card>

        {/* Recent Events Widget */}
        <Card className="p-4">
          <h4 className="font-medium mb-2">Recent Events</h4>
          <div className="space-y-2">
            <p className="text-sm">Latest Follow: User123</p>
            <p className="text-sm">Latest Sub: User456</p>
          </div>
        </Card>

        {/* Chat Stats Widget */}
        <Card className="p-4">
          <h4 className="font-medium mb-2">Chat Statistics</h4>
          <div className="space-y-2">
            <p className="text-sm">Messages: 150</p>
            <p className="text-sm">Active Chatters: 25</p>
          </div>
        </Card>
      </div>
    </Card>
  );
};
