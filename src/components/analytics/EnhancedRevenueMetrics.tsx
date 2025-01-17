import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  DollarSign, 
  TrendingUp, 
  Users, 
  Gift,
  CreditCard
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface RevenueData {
  date: string;
  amount: number;
  revenue_type: string;
  created_at: string;
}

interface RevenueMetrics {
  total_revenue: number;
  subscription_revenue: number;
  donation_revenue: number;
  average_donation: number;
  unique_donors: number;
}

export const EnhancedRevenueMetrics = ({ streamId }: { streamId: string }) => {
  const { data: revenueData, isLoading: isRevenueLoading } = useQuery({
    queryKey: ['stream-revenue-data', streamId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('stream_revenue')
        .select('amount, revenue_type, created_at')
        .eq('stream_id', streamId)
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      return data as RevenueData[];
    },
  });

  const { data: metrics, isLoading: isMetricsLoading } = useQuery({
    queryKey: ['stream-revenue-metrics', streamId],
    queryFn: async () => {
      const { data, error } = await supabase
        .rpc('calculate_stream_revenue_metrics', { stream_id: streamId });
      
      if (error) throw error;
      return data as RevenueMetrics;
    },
  });

  if (isRevenueLoading || isMetricsLoading) {
    return <Skeleton className="h-[400px] w-full" />;
  }

  const chartData = revenueData?.map(item => ({
    date: new Date(item.created_at).toLocaleDateString(),
    amount: Number(item.amount),
    type: item.revenue_type
  }));

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
            <CreditCard className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-sm font-medium">Subscription Revenue</h3>
          </div>
          <p className="text-2xl font-bold mt-2">
            ${metrics?.subscription_revenue?.toFixed(2) || '0.00'}
          </p>
        </Card>

        <Card className="p-4">
          <div className="flex items-center space-x-2">
            <Gift className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-sm font-medium">Average Donation</h3>
          </div>
          <p className="text-2xl font-bold mt-2">
            ${metrics?.average_donation?.toFixed(2) || '0.00'}
          </p>
        </Card>

        <Card className="p-4">
          <div className="flex items-center space-x-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-sm font-medium">Unique Donors</h3>
          </div>
          <p className="text-2xl font-bold mt-2">
            {metrics?.unique_donors || 0}
          </p>
        </Card>
      </div>

      <Card className="p-4">
        <div className="flex items-center space-x-2 mb-4">
          <TrendingUp className="h-5 w-5 text-muted-foreground" />
          <h3 className="text-lg font-semibold">Revenue Over Time</h3>
        </div>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Line 
                type="monotone" 
                dataKey="amount" 
                stroke="#8884d8" 
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
};