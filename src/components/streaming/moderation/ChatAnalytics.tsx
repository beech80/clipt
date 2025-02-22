
import React from 'react';
import { Card } from "@/components/ui/card";
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

interface ChatAnalyticsProps {
  streamId: string;
}

export const ChatAnalytics = ({ streamId }: ChatAnalyticsProps) => {
  const { data: analytics } = useQuery({
    queryKey: ['chat-analytics', streamId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('chat_analytics')
        .select('*')
        .eq('stream_id', streamId)
        .single();
      
      if (error) throw error;
      return data;
    },
    refetchInterval: 30000 // Refresh every 30 seconds
  });

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Total Messages</p>
          <p className="text-2xl font-bold">{analytics?.total_messages || 0}</p>
        </Card>
        
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Unique Chatters</p>
          <p className="text-2xl font-bold">{analytics?.unique_chatters || 0}</p>
        </Card>
        
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Commands Used</p>
          <p className="text-2xl font-bold">{analytics?.commands_used || 0}</p>
        </Card>
        
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Timeouts Issued</p>
          <p className="text-2xl font-bold">{analytics?.timeouts_issued || 0}</p>
        </Card>
      </div>

      <Card className="p-4">
        <h3 className="text-lg font-semibold mb-4">Chat Activity</h3>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={[analytics].filter(Boolean)}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="updated_at" />
              <YAxis />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="total_messages"
                stroke="#8884d8"
                name="Messages"
              />
              <Line
                type="monotone"
                dataKey="unique_chatters"
                stroke="#82ca9d"
                name="Chatters"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
};
