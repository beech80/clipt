
import React from "react";
import { Card } from "@/components/ui/card";
import { StreamHealthIndicator } from "./StreamHealthIndicator";
import { StreamMetricsDisplay } from "./StreamMetricsDisplay";
import { StreamControlPanel } from "./StreamControlPanel";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { Stream } from "@/types/stream";

interface StreamDashboardProps {
  userId: string;
}

export const StreamDashboard = ({ userId }: StreamDashboardProps) => {
  const { data: stream, isLoading } = useQuery<Stream>({
    queryKey: ['stream', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('streams')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!userId
  });

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!stream) {
    return <div>No stream found</div>;
  }

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Stream Status</h3>
            <StreamHealthIndicator status={stream.stream_health_status} />
          </div>
          
          <div className="grid gap-4 md:grid-cols-2">
            <StreamMetricsDisplay stream={stream} />
            <StreamControlPanel stream={stream} />
          </div>
        </div>
      </Card>
    </div>
  );
};
