import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Card } from '@/components/ui/card';
import { StreamPreview } from './StreamPreview';
import { StreamMetricsChart } from '../analytics/StreamMetricsChart';
import { ViewerEngagementMetrics } from '../analytics/ViewerEngagementMetrics';
import { StreamHealthIndicator } from './StreamHealthIndicator';
import { Trophy, Sword, Shield, Users, Gamepad2, Crown } from 'lucide-react';

interface GamingMetrics {
  kda_ratio: number;
  win_rate: number;
  avg_game_duration: string;
  peak_viewers: number;
  engagement_rate: number;
}

interface EnhancedGamingDashboardProps {
  streamId: string;
  userId: string;
  isLive: boolean;
}

export function EnhancedGamingDashboard({ streamId, userId, isLive }: EnhancedGamingDashboardProps) {
  const [streamKey, setStreamKey] = useState<string | null>(null);

  const { data: gamingMetrics } = useQuery({
    queryKey: ['gaming-metrics', streamId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('calculate_gaming_metrics', {
        stream_id_param: streamId
      });
      if (error) throw error;
      return data as GamingMetrics;
    },
    enabled: isLive,
    refetchInterval: 5000
  });

  const { data: stream } = useQuery({
    queryKey: ['stream', streamId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('streams')
        .select('*')
        .eq('id', streamId)
        .single();
      if (error) throw error;
      return data;
    }
  });

  const metricCards = [
    {
      icon: Sword,
      label: 'K/D/A Ratio',
      value: gamingMetrics?.kda_ratio?.toFixed(2) || '0.00',
      color: 'text-red-500'
    },
    {
      icon: Crown,
      label: 'Win Rate',
      value: `${(gamingMetrics?.win_rate || 0).toFixed(1)}%`,
      color: 'text-yellow-500'
    },
    {
      icon: Shield,
      label: 'Avg Game Duration',
      value: gamingMetrics?.avg_game_duration || '00:00:00',
      color: 'text-blue-500'
    },
    {
      icon: Users,
      label: 'Peak Viewers',
      value: gamingMetrics?.peak_viewers?.toString() || '0',
      color: 'text-green-500'
    },
    {
      icon: Trophy,
      label: 'Engagement Rate',
      value: `${(gamingMetrics?.engagement_rate || 0).toFixed(1)}%`,
      color: 'text-purple-500'
    },
    {
      icon: Gamepad2,
      label: 'Stream Status',
      value: isLive ? 'LIVE' : 'OFFLINE',
      color: isLive ? 'text-red-500' : 'text-gray-500'
    }
  ];

  return (
    <div className="space-y-6 p-6 bg-background/95 rounded-lg">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <StreamPreview 
            streamUrl={stream?.stream_url} 
            isLive={isLive} 
            className="rounded-lg overflow-hidden shadow-lg"
          />
          <StreamHealthIndicator 
            status={stream?.health_status || 'unknown'}
            bitrate={stream?.current_bitrate}
            fps={stream?.current_fps}
            resolution={stream?.stream_resolution}
            className="bg-card p-4 rounded-lg shadow"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          {metricCards.map((card) => (
            <Card key={card.label} className="p-4 flex flex-col items-center justify-center text-center">
              <card.icon className={`h-8 w-8 mb-2 ${card.color}`} />
              <h3 className="text-sm font-medium text-muted-foreground">{card.label}</h3>
              <p className="text-2xl font-bold mt-1">{card.value}</p>
            </Card>
          ))}
        </div>
      </div>

      <div className="grid gap-6 mt-6">
        <StreamMetricsChart streamId={streamId} />
        <ViewerEngagementMetrics streamId={streamId} />
      </div>
    </div>
  );
}