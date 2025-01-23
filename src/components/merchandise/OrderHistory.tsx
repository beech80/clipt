import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { formatDistanceToNow } from "date-fns";
import { Package2, Clock, CreditCard } from "lucide-react";

export function OrderHistory() {
  const { user } = useAuth();

  const { data: orders, isLoading } = useQuery({
    queryKey: ['merchandise-orders', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('merchandise_orders')
        .select(`
          *,
          merchandise_order_items (
            *,
            merchandise_products (
              name,
              price
            )
          )
        `)
        .eq('buyer_id', user?.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  if (isLoading) {
    return <div>Loading order history...</div>;
  }

  if (!orders?.length) {
    return (
      <Card className="p-6 text-center">
        <Package2 className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
        <h3 className="text-lg font-semibold mb-2">No Orders Yet</h3>
        <p className="text-muted-foreground">Your order history will appear here</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold mb-4">Order History</h2>
      
      {orders.map((order) => (
        <Card key={order.id} className="p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                {formatDistanceToNow(new Date(order.created_at), { addSuffix: true })}
              </span>
            </div>
            <Badge variant={order.status === 'completed' ? 'default' : 'secondary'}>
              {order.status}
            </Badge>
          </div>
          
          <div className="space-y-2">
            {order.merchandise_order_items?.map((item) => (
              <div key={item.id} className="flex justify-between items-center">
                <span>{item.merchandise_products?.name} x{item.quantity}</span>
                <span className="font-medium">
                  ${(item.quantity * (item.merchandise_products?.price || 0)).toFixed(2)}
                </span>
              </div>
            ))}
          </div>
          
          <div className="mt-4 pt-4 border-t flex justify-between items-center">
            <div className="flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              <span className="font-medium">Total:</span>
            </div>
            <span className="font-bold">${order.total_amount.toFixed(2)}</span>
          </div>
        </Card>
      ))}
    </div>
  );
}