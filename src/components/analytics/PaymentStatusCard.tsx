import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { DollarSign, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface Payment {
  id: string;
  amount: number;
  payment_status: string;
  payment_provider: string;
  revenue_type: string;
  created_at: string;
}

export const PaymentStatusCard = ({ streamId }: { streamId: string }) => {
  const { data: payments, isLoading } = useQuery({
    queryKey: ['stream-payments', streamId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('stream_revenue')
        .select('*')
        .eq('stream_id', streamId)
        .order('created_at', { ascending: false });
      
      if (error) {
        toast.error('Failed to load payment data');
        throw error;
      }
      return data as Payment[];
    },
  });

  if (isLoading) {
    return <Skeleton className="h-[200px] w-full" />;
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500';
      case 'pending':
        return 'bg-yellow-500';
      case 'failed':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <Card className="p-4">
      <div className="flex items-center space-x-2 mb-4">
        <DollarSign className="h-5 w-5 text-muted-foreground" />
        <h3 className="text-lg font-semibold">Recent Payments</h3>
      </div>
      
      <div className="space-y-4">
        {payments?.length === 0 && (
          <div className="flex items-center justify-center p-4 text-muted-foreground">
            <AlertCircle className="h-4 w-4 mr-2" />
            No payment data available
          </div>
        )}
        
        {payments?.map((payment) => (
          <div key={payment.id} className="flex items-center justify-between p-2 bg-muted rounded-lg">
            <div>
              <p className="font-medium">${payment.amount.toFixed(2)}</p>
              <p className="text-sm text-muted-foreground capitalize">
                {payment.revenue_type.replace('_', ' ')}
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <Badge className={getStatusColor(payment.payment_status)}>
                {payment.payment_status}
              </Badge>
              {payment.payment_provider && (
                <Badge variant="outline">{payment.payment_provider}</Badge>
              )}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};