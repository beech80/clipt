import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Users, MessageSquare, Clock, TrendingUp } from 'lucide-react';

interface EngagementMetrics {
  engagement_rate: number;
  max_concurrent_viewers: number;
  total_stream_time: string;
  average_watch_time: string;
}

export const ViewerEngagementMetrics = ({ streamId }: { streamId: string }) => {
  const { data: metrics, isLoading } = useQuery({
    queryKey: ['stream-engagement-metrics', streamId],
    queryFn: async () => {
      const { data, error } = await supabase
        .rpc('calculate_enhanced_analytics', { stream_id_param: streamId });
      
      if (error) throw error;
      return data[0] as EngagementMetrics;
    },
  });

  if (isLoading) {
    return <Skeleton className="h-[200px] w-full" />;
  }

  const metricCards = [
    {
      icon: Users,
      label: 'Peak Viewers',
      value: metrics?.max_concurrent_viewers || 0,
    },
    {
      icon: MessageSquare,
      label: 'Engagement Rate',
      value: `${(metrics?.engagement_rate || 0).toFixed(2)}%`,
    },
    {
      icon: Clock,
      label: 'Avg Watch Time',
      value: metrics?.average_watch_time || '0:00',
    },
    {
      icon: TrendingUp,
      label: 'Stream Duration',
      value: metrics?.total_stream_time || '0:00',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {metricCards.map((card) => (
        <Card key={card.label} className="p-4">
          <div className="flex items-center space-x-2">
            <card.icon className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-sm font-medium">{card.label}</h3>
          </div>
          <p className="text-2xl font-bold mt-2">{card.value}</p>
        </Card>
      ))}
    </div>
  );
};