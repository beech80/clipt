import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { DollarSign, TrendingUp } from 'lucide-react';
import { GiftRevenueChart } from './GiftRevenueChart';
import { ViewerEngagementMetrics } from './ViewerEngagementMetrics';

interface RevenueMetrics {
  total_revenue: number;
  subscription_revenue: number;
  donation_revenue: number;
  average_donation: number;
  unique_donors: number;
}

export const EnhancedRevenueMetrics = ({ streamId }: { streamId: string }) => {
  const { data: metrics, isLoading } = useQuery({
    queryKey: ['stream-revenue-metrics', streamId],
    queryFn: async () => {
      const { data, error } = await supabase
        .rpc('calculate_stream_revenue_metrics', { stream_id: streamId });
      
      if (error) throw error;
      return data[0] as RevenueMetrics;
    },
  });

  if (isLoading) {
    return <Skeleton className="h-[400px] w-full" />;
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center space-x-2">
            <DollarSign className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-sm font-medium">Total Revenue</h3>
          </div>
          <p className="text-2xl font-bold mt-2">
            ${metrics?.total_revenue?.toFixed(2) || '0.00'}
          </p>
        </Card>

        <Card className="p-4">
          <div className="flex items-center space-x-2">
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-sm font-medium">Subscription Revenue</h3>
          </div>
          <p className="text-2xl font-bold mt-2">
            ${metrics?.subscription_revenue?.toFixed(2) || '0.00'}
          </p>
        </Card>

        <Card className="p-4">
          <div className="flex items-center space-x-2">
            <DollarSign className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-sm font-medium">Average Donation</h3>
          </div>
          <p className="text-2xl font-bold mt-2">
            ${metrics?.average_donation?.toFixed(2) || '0.00'}
          </p>
        </Card>

        <Card className="p-4">
          <div className="flex items-center space-x-2">
            <DollarSign className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-sm font-medium">Unique Donors</h3>
          </div>
          <p className="text-2xl font-bold mt-2">
            {metrics?.unique_donors || 0}
          </p>
        </Card>
      </div>

      <ViewerEngagementMetrics streamId={streamId} />
      <GiftRevenueChart streamId={streamId} />
    </div>
  );
};