import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { DollarSign } from 'lucide-react';

export const RevenueMetrics = ({ streamId }: { streamId: string }) => {
  const { data: revenue, isLoading } = useQuery({
    queryKey: ['stream-revenue', streamId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('stream_revenue')
        .select('*')
        .eq('stream_id', streamId);
      
      if (error) throw error;
      return data;
    },
  });

  if (isLoading) {
    return <Skeleton className="h-[200px] w-full" />;
  }

  const totalRevenue = revenue?.reduce((sum, item) => sum + Number(item.amount), 0) || 0;

  return (
    <Card className="p-4">
      <div className="flex items-center space-x-2 mb-4">
        <DollarSign className="h-5 w-5 text-muted-foreground" />
        <h3 className="text-lg font-semibold">Revenue Overview</h3>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 bg-muted rounded-lg">
          <p className="text-sm text-muted-foreground">Total Revenue</p>
          <p className="text-2xl font-bold">${totalRevenue.toFixed(2)}</p>
        </div>
        
        {revenue?.map((item) => (
          <div key={item.id} className="p-4 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground capitalize">
              {item.revenue_type.replace('_', ' ')}
            </p>
            <p className="text-2xl font-bold">${Number(item.amount).toFixed(2)}</p>
          </div>
        ))}
      </div>
    </Card>
  );
};