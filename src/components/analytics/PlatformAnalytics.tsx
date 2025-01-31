import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Skeleton } from "@/components/ui/skeleton";
import { MetricCards } from "./dashboard/MetricCards";
import { AnalyticsCharts } from "./dashboard/AnalyticsCharts";

export function PlatformAnalytics() {
  const { data: metrics, isLoading } = useQuery({
    queryKey: ['platform-metrics'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('platform_analytics')
        .select('*')
        .single();
      
      if (error) throw error;
      
      const transformedData = {
        ...data,
        daily_stats: Array.isArray(data.daily_stats) 
          ? data.daily_stats.map((stat: any) => ({
              date: stat.date,
              users: Number(stat.users) || 0,
              streams: Number(stat.streams) || 0,
              engagement: Number(stat.engagement) || 0,
              retention: Number(stat.retention) || 0,
              avg_session: Number(stat.avg_session) || 0,
              chat_activity: Number(stat.chat_activity) || 0
            }))
          : []
      };
      
      return transformedData;
    },
  });

  if (isLoading) {
    return <Skeleton className="h-[600px] w-full" />;
  }

  return (
    <div className="space-y-6">
      <MetricCards metrics={metrics} />
      <AnalyticsCharts data={metrics?.daily_stats} />
    </div>
  );
}