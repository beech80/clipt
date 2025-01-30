import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Card } from "@/components/ui/card";
import { DollarSign, TrendingUp, Gift, Users } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface RevenueMetrics {
  total_revenue: number;
  subscription_revenue: number;
  donation_revenue: number;
  average_donation: number;
  unique_donors: number;
}

export function RevenueAnalytics({ streamId }: { streamId: string }) {
  const { data: metrics, isLoading } = useQuery({
    queryKey: ["stream-revenue-metrics", streamId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("calculate_stream_revenue_metrics", {
        stream_id: streamId,
      });

      if (error) throw error;
      return data[0] as RevenueMetrics;
    },
  });

  const { data: revenueHistory } = useQuery({
    queryKey: ["revenue-history", streamId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("stream_revenue")
        .select("*")
        .eq("stream_id", streamId)
        .order("created_at", { ascending: true });

      if (error) throw error;

      return data.map((item) => ({
        date: new Date(item.created_at).toLocaleDateString(),
        amount: item.amount,
      }));
    },
  });

  if (isLoading) {
    return <div>Loading revenue data...</div>;
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
            ${metrics?.total_revenue?.toFixed(2) || "0.00"}
          </p>
        </Card>

        <Card className="p-4">
          <div className="flex items-center space-x-2">
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-sm font-medium">Subscription Revenue</h3>
          </div>
          <p className="text-2xl font-bold mt-2">
            ${metrics?.subscription_revenue?.toFixed(2) || "0.00"}
          </p>
        </Card>

        <Card className="p-4">
          <div className="flex items-center space-x-2">
            <Gift className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-sm font-medium">Average Donation</h3>
          </div>
          <p className="text-2xl font-bold mt-2">
            ${metrics?.average_donation?.toFixed(2) || "0.00"}
          </p>
        </Card>

        <Card className="p-4">
          <div className="flex items-center space-x-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-sm font-medium">Unique Donors</h3>
          </div>
          <p className="text-2xl font-bold mt-2">{metrics?.unique_donors || 0}</p>
        </Card>
      </div>

      <Card className="p-4">
        <h3 className="text-lg font-semibold mb-4">Revenue Over Time</h3>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={revenueHistory}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip formatter={(value) => [`$${value}`, "Revenue"]} />
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
}