import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Card } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Skeleton } from '@/components/ui/skeleton';

interface ViewerEngagement {
  viewer_id: string;
  watch_duration: string;
}

export const ViewerEngagementChart = ({ streamId }: { streamId: string }) => {
  const { data: engagementData, isLoading } = useQuery<ViewerEngagement[]>({
    queryKey: ['viewer-engagement', streamId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('viewer_engagement')
        .select('*')
        .eq('stream_id', streamId);
      
      if (error) throw error;
      return data;
    },
  });

  if (isLoading) {
    return <Skeleton className="h-[300px] w-full" />;
  }

  return (
    <Card className="p-4">
      <h3 className="text-lg font-semibold mb-4">Viewer Watch Time</h3>
      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={engagementData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="viewer_id" 
              tickFormatter={(value) => value.substring(0, 8)}
            />
            <YAxis />
            <Tooltip />
            <Bar 
              dataKey="watch_duration" 
              fill="#82ca9d" 
              name="Watch Time (minutes)"
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
};