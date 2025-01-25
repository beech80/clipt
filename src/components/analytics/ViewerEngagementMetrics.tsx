import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Users, MessageSquare, Clock, TrendingUp, BarChart2, ArrowUpRight } from 'lucide-react';

interface EngagementMetrics {
  engagement_rate: number;
  max_concurrent_viewers: number;
  total_stream_time: string;
  average_watch_time: string;
  bounce_rate: number;
  interaction_rate: number;
  retention_rate: number;
}

export const ViewerEngagementMetrics = ({ streamId }: { streamId: string }) => {
  const { data: metrics, isLoading } = useQuery({
    queryKey: ['stream-engagement-metrics', streamId],
    queryFn: async () => {
      const { data, error } = await supabase
        .rpc('calculate_viewer_retention', { stream_id_param: streamId });
      
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
      value: metrics?.max_concurrent_viewers?.toLocaleString() || '0',
      subValue: 'concurrent viewers'
    },
    {
      icon: MessageSquare,
      label: 'Engagement Rate',
      value: `${(metrics?.engagement_rate || 0).toFixed(1)}%`,
      subValue: 'of viewers engaged'
    },
    {
      icon: Clock,
      label: 'Avg Watch Time',
      value: metrics?.average_watch_time || '0:00',
      subValue: 'per viewer'
    },
    {
      icon: TrendingUp,
      label: 'Stream Duration',
      value: metrics?.total_stream_time || '0:00',
      subValue: 'total time'
    },
    {
      icon: BarChart2,
      label: 'Retention Rate',
      value: `${(metrics?.retention_rate || 0).toFixed(1)}%`,
      subValue: 'viewer retention'
    },
    {
      icon: ArrowUpRight,
      label: 'Interaction Rate',
      value: `${(metrics?.interaction_rate || 0).toFixed(1)}%`,
      subValue: 'viewer interactions'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {metricCards.map((card) => (
        <Card key={card.label} className="p-4">
          <div className="flex items-center space-x-2">
            <card.icon className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-sm font-medium">{card.label}</h3>
          </div>
          <p className="text-2xl font-bold mt-2">{card.value}</p>
          <p className="text-sm text-muted-foreground">{card.subValue}</p>
        </Card>
      ))}
    </div>
  );
};