import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { Users, Activity, TrendingUp, Award } from "lucide-react";

interface PlatformMetrics {
  total_users: number;
  active_streams: number;
  total_engagement: number;
  peak_concurrent: number;
  daily_stats: {
    date: string;
    users: number;
    streams: number;
    engagement: number;
  }[];
}

export function PlatformAnalytics() {
  const { data: metrics, isLoading } = useQuery({
    queryKey: ['platform-metrics'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('platform_analytics')
        .select('*')
        .single();
      
      if (error) throw error;
      
      // Transform the data to match the expected type
      const transformedData = {
        ...data,
        daily_stats: Array.isArray(data.daily_stats) 
          ? data.daily_stats.map((stat: any) => ({
              date: stat.date,
              users: Number(stat.users) || 0,
              streams: Number(stat.streams) || 0,
              engagement: Number(stat.engagement) || 0
            }))
          : []
      };
      
      return transformedData as PlatformMetrics;
    },
  });

  if (isLoading) {
    return <Skeleton className="h-[600px] w-full" />;
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center space-x-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-sm font-medium">Total Users</h3>
          </div>
          <p className="text-2xl font-bold mt-2">
            {metrics?.total_users?.toLocaleString()}
          </p>
        </Card>

        <Card className="p-4">
          <div className="flex items-center space-x-2">
            <Activity className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-sm font-medium">Active Streams</h3>
          </div>
          <p className="text-2xl font-bold mt-2">
            {metrics?.active_streams?.toLocaleString()}
          </p>
        </Card>

        <Card className="p-4">
          <div className="flex items-center space-x-2">
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-sm font-medium">Total Engagement</h3>
          </div>
          <p className="text-2xl font-bold mt-2">
            {metrics?.total_engagement?.toLocaleString()}
          </p>
        </Card>

        <Card className="p-4">
          <div className="flex items-center space-x-2">
            <Award className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-sm font-medium">Peak Concurrent</h3>
          </div>
          <p className="text-2xl font-bold mt-2">
            {metrics?.peak_concurrent?.toLocaleString()}
          </p>
        </Card>
      </div>

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">User Growth Trend</h3>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={metrics?.daily_stats}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Line 
                type="monotone" 
                dataKey="users" 
                stroke="#8884d8" 
                name="Users"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Stream Activity</h3>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={metrics?.daily_stats}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Bar 
                dataKey="streams" 
                fill="#82ca9d" 
                name="Active Streams"
              />
              <Bar 
                dataKey="engagement" 
                fill="#ffc658" 
                name="Engagement"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
}