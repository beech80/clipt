import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, AreaChart, Area } from 'recharts';
import { Users, Activity, TrendingUp, Award, Clock, MessageSquare } from "lucide-react";

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
    retention: number;
    avg_session: number;
    chat_activity: number;
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
      
      return transformedData as PlatformMetrics;
    },
  });

  if (isLoading) {
    return <Skeleton className="h-[600px] w-full" />;
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
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

        <Card className="p-4">
          <div className="flex items-center space-x-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-sm font-medium">Avg Session</h3>
          </div>
          <p className="text-2xl font-bold mt-2">
            {metrics?.daily_stats[metrics.daily_stats.length - 1]?.avg_session.toFixed(1)}m
          </p>
        </Card>

        <Card className="p-4">
          <div className="flex items-center space-x-2">
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-sm font-medium">Chat Activity</h3>
          </div>
          <p className="text-2xl font-bold mt-2">
            {metrics?.daily_stats[metrics.daily_stats.length - 1]?.chat_activity.toLocaleString()}
          </p>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">User Growth & Retention</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={metrics?.daily_stats}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Area 
                  type="monotone" 
                  dataKey="users" 
                  stroke="#8884d8" 
                  fill="#8884d8" 
                  fillOpacity={0.3}
                  name="Total Users"
                />
                <Area 
                  type="monotone" 
                  dataKey="retention" 
                  stroke="#82ca9d" 
                  fill="#82ca9d" 
                  fillOpacity={0.3}
                  name="Retention Rate"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Engagement Metrics</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={metrics?.daily_stats}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line 
                  type="monotone" 
                  dataKey="engagement" 
                  stroke="#8884d8" 
                  name="Engagement"
                />
                <Line 
                  type="monotone" 
                  dataKey="chat_activity" 
                  stroke="#82ca9d" 
                  name="Chat Activity"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-6 lg:col-span-2">
          <h3 className="text-lg font-semibold mb-4">Stream Activity Overview</h3>
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
                  dataKey="avg_session" 
                  fill="#ffc658" 
                  name="Avg Session (min)"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </div>
  );
}