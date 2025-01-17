import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Users, Clock, MessageSquare, TrendingUp } from 'lucide-react';
import { StreamMetricsChart } from './StreamMetricsChart';
import { ViewerEngagementChart } from './ViewerEngagementChart';
import { RevenueMetrics } from './RevenueMetrics';

interface StreamAnalytics {
  id: string;
  stream_id: string;
  peak_viewers: number;
  average_viewers: number;
  stream_duration: string;
  chat_messages_count: number;
  created_at: string;
}

export const AnalyticsDashboard = ({ streamId }: { streamId: string }) => {
  const { data: analytics, isLoading, error } = useQuery<StreamAnalytics>({
    queryKey: ['stream-analytics', streamId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('stream_analytics')
        .select('*')
        .eq('stream_id', streamId)
        .single();
      
      if (error) throw error;
      return data as StreamAnalytics;
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-[200px] w-full" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-[100px]" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>Failed to load analytics data</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center space-x-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-sm font-medium">Peak Viewers</h3>
          </div>
          <p className="text-2xl font-bold mt-2">{analytics?.peak_viewers || 0}</p>
        </Card>

        <Card className="p-4">
          <div className="flex items-center space-x-2">
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-sm font-medium">Average Viewers</h3>
          </div>
          <p className="text-2xl font-bold mt-2">{analytics?.average_viewers || 0}</p>
        </Card>

        <Card className="p-4">
          <div className="flex items-center space-x-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-sm font-medium">Stream Duration</h3>
          </div>
          <p className="text-2xl font-bold mt-2">
            {analytics?.stream_duration ? 
              analytics.stream_duration.substring(0, 8) : 
              '00:00:00'}
          </p>
        </Card>

        <Card className="p-4">
          <div className="flex items-center space-x-2">
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-sm font-medium">Chat Messages</h3>
          </div>
          <p className="text-2xl font-bold mt-2">{analytics?.chat_messages_count || 0}</p>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <StreamMetricsChart streamId={streamId} />
        <ViewerEngagementChart streamId={streamId} />
      </div>

      <RevenueMetrics streamId={streamId} />
    </div>
  );
};