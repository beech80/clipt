import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card } from "@/components/ui/card";
import { supabase } from '@/lib/supabase';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

interface EnhancedStreamMetricsProps {
  streamId: string;
}

export function EnhancedStreamMetrics({ streamId }: EnhancedStreamMetricsProps) {
  const { data: analytics, isLoading } = useQuery({
    queryKey: ['stream-analytics-enhanced', streamId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('stream_analytics')
        .select('*')
        .eq('stream_id', streamId)
        .single();
      
      if (error) throw error;
      return data;
    },
    refetchInterval: 5000 // Refresh every 5 seconds
  });

  if (isLoading) {
    return (
      <Card className="p-4">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          <div className="h-48 bg-gray-200 rounded"></div>
        </div>
      </Card>
    );
  }

  const qualityMetrics = [
    {
      name: 'Buffer Health',
      value: (100 - (analytics?.buffer_ratio || 0) * 100).toFixed(1),
      unit: '%',
      color: 'text-green-500'
    },
    {
      name: 'Frame Health',
      value: (100 - (analytics?.dropped_frames_ratio || 0) * 100).toFixed(1),
      unit: '%',
      color: 'text-blue-500'
    },
    {
      name: 'Audio Quality',
      value: (analytics?.audio_quality_score || 0).toFixed(1),
      unit: '/10',
      color: 'text-purple-500'
    },
    {
      name: 'Video Quality',
      value: (analytics?.video_quality_score || 0).toFixed(1),
      unit: '/10',
      color: 'text-orange-500'
    }
  ];

  return (
    <Card className="p-6 space-y-6">
      <h3 className="text-lg font-semibold">Stream Health Metrics</h3>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {qualityMetrics.map((metric) => (
          <div key={metric.name} className="p-4 rounded-lg bg-background/50">
            <p className="text-sm text-muted-foreground">{metric.name}</p>
            <p className={`text-2xl font-bold ${metric.color}`}>
              {metric.value}{metric.unit}
            </p>
          </div>
        ))}
      </div>

      <div className="h-[300px] mt-6">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={[
              {
                time: 'Now',
                bufferHealth: 100 - (analytics?.buffer_ratio || 0) * 100,
                frameHealth: 100 - (analytics?.dropped_frames_ratio || 0) * 100,
                audioQuality: analytics?.audio_quality_score || 0,
                videoQuality: analytics?.video_quality_score || 0
              }
            ]}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="time" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="bufferHealth" 
              stroke="#22c55e" 
              name="Buffer Health"
            />
            <Line 
              type="monotone" 
              dataKey="frameHealth" 
              stroke="#3b82f6" 
              name="Frame Health"
            />
            <Line 
              type="monotone" 
              dataKey="audioQuality" 
              stroke="#a855f7" 
              name="Audio Quality"
            />
            <Line 
              type="monotone" 
              dataKey="videoQuality" 
              stroke="#f97316" 
              name="Video Quality"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}