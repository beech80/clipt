import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Card } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDistanceToNow } from 'date-fns';
import { DollarSign } from 'lucide-react';

interface GiftRevenue {
  id: string;
  amount: number;
  created_at: string;
  gift_id: string;
}

export const GiftRevenueChart = ({ streamId }: { streamId: string }) => {
  const { data: giftRevenue, isLoading } = useQuery({
    queryKey: ['gift-revenue', streamId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('stream_gifts')
        .select('*')
        .eq('stream_id', streamId)
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      return data as GiftRevenue[];
    },
  });

  if (isLoading) {
    return <Skeleton className="h-[300px] w-full" />;
  }

  const chartData = giftRevenue?.map(item => ({
    time: formatDistanceToNow(new Date(item.created_at), { addSuffix: true }),
    amount: Number(item.amount)
  }));

  const totalRevenue = giftRevenue?.reduce((sum, item) => sum + Number(item.amount), 0) || 0;

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Gift Revenue</h3>
        <div className="flex items-center gap-2">
          <DollarSign className="h-4 w-4 text-muted-foreground" />
          <span className="font-bold">${totalRevenue.toFixed(2)}</span>
        </div>
      </div>
      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="time" />
            <YAxis />
            <Tooltip 
              formatter={(value) => [`$${value}`, 'Revenue']}
            />
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
  );
};