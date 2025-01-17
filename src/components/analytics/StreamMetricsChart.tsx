import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Card } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Skeleton } from '@/components/ui/skeleton';

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

  if (isLoading) {
    return <Skeleton className="h-[300px] w-full" />;
  }

  return (
    <Card className="p-4">
      <h3 className="text-lg font-semibold mb-4">Viewer Engagement Over Time</h3>
      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={viewerData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="created_at" 
              tickFormatter={(value) => new Date(value).toLocaleTimeString()}
            />
            <YAxis />
            <Tooltip 
              labelFormatter={(value) => new Date(value).toLocaleString()}
            />
            <Line 
              type="monotone" 
              dataKey="messages_sent" 
              stroke="#8884d8" 
              name="Messages"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
};