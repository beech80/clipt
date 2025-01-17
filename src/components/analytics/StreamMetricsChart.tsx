import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Card } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDistanceToNow } from 'date-fns';

export const StreamMetricsChart = ({ streamId }: { streamId: string }) => {
  const { data: viewerData, isLoading } = useQuery({
    queryKey: ['stream-metrics', streamId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('viewer_engagement')
        .select('*')
        .eq('stream_id', streamId)
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      return data;
    },
  });

  const { data: analytics } = useQuery({
    queryKey: ['stream-enhanced-analytics', streamId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc(
        'calculate_enhanced_analytics',
        { stream_id_param: streamId }
      );
      
      if (error) throw error;
      return data[0];
    },
  });

  if (isLoading) {
    return <Skeleton className="h-[300px] w-full" />;
  }

  return (
    <div className="grid gap-4">
      <Card className="p-4">
        <h3 className="text-lg font-semibold mb-4">Viewer Engagement Over Time</h3>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={viewerData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="created_at" 
                tickFormatter={(value) => formatDistanceToNow(new Date(value), { addSuffix: true })}
              />
              <YAxis />
              <Tooltip 
                labelFormatter={(value) => new Date(value).toLocaleString()}
                formatter={(value, name) => [value, name === 'messages_sent' ? 'Messages' : name]}
              />
              <Line 
                type="monotone" 
                dataKey="messages_sent" 
                stroke="#8884d8" 
                name="Messages"
              />
              <Line 
                type="monotone" 
                dataKey="watch_duration" 
                stroke="#82ca9d" 
                name="Watch Time"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Engagement Rate</p>
            <p className="text-2xl font-bold">
              {analytics?.engagement_rate ? `${analytics.engagement_rate.toFixed(2)}%` : '0%'}
            </p>
          </div>
        </Card>

        <Card className="p-4">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Max Concurrent Viewers</p>
            <p className="text-2xl font-bold">
              {analytics?.max_concurrent_viewers || 0}
            </p>
          </div>
        </Card>

        <Card className="p-4">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Total Stream Time</p>
            <p className="text-2xl font-bold">
              {analytics?.total_stream_time ? 
                analytics.total_stream_time.substring(0, 8) : 
                '00:00:00'}
            </p>
          </div>
        </Card>

        <Card className="p-4">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Avg Watch Time</p>
            <p className="text-2xl font-bold">
              {analytics?.average_watch_time ? 
                analytics.average_watch_time.substring(0, 8) : 
                '00:00:00'}
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
};