import { Card } from "@/components/ui/card";
import { Users, Activity, TrendingUp, Award, Clock, MessageSquare } from "lucide-react";

interface MetricCardsProps {
  metrics: {
    total_users: number;
    active_streams: number;
    total_engagement: number;
    peak_concurrent: number;
    daily_stats: {
      avg_session: number;
      chat_activity: number;
    }[];
  } | undefined;
}

export function MetricCards({ metrics }: MetricCardsProps) {
  if (!metrics) return null;

  return (
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
  );
}