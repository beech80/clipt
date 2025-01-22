import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar
} from 'recharts';
import { format } from 'date-fns';
import { Card } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface PerformanceData {
  timestamp: string;
  metric_name: string;
  value: number;
  component: string;
  browser_info: {
    userAgent: string;
    platform: string;
    language: string;
  };
  metadata: Record<string, any>;
}

const MonitoringDashboard = () => {
  const { data: metrics, isLoading, error } = useQuery({
    queryKey: ['performance-metrics'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('performance_metrics_enhanced')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(1000);

      if (error) throw error;
      return data as PerformanceData[];
    },
    refetchInterval: 30000 // Refresh every 30 seconds
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-[400px] w-full" />
        <Skeleton className="h-[300px] w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>Failed to load performance metrics</AlertDescription>
      </Alert>
    );
  }

  const formatMetricsForChart = (metricName: string) => {
    return metrics
      ?.filter(m => m.metric_name === metricName)
      .map(m => ({
        timestamp: format(new Date(m.timestamp), 'HH:mm:ss'),
        value: m.value,
        component: m.component
      }));
  };

  return (
    <div className="space-y-6 p-6">
      <h1 className="text-2xl font-bold mb-6">Performance Monitoring</h1>

      <Card className="p-4">
        <h2 className="text-xl font-semibold mb-4">Memory Usage</h2>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={formatMetricsForChart('memory_usage')}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="timestamp" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="value"
                stroke="#8884d8"
                name="Memory Usage (MB)"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card className="p-4">
        <h2 className="text-xl font-semibold mb-4">Component Render Times</h2>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={formatMetricsForChart('component_lifecycle')}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="component" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar
                dataKey="value"
                fill="#82ca9d"
                name="Render Time (ms)"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card className="p-4">
        <h2 className="text-xl font-semibold mb-4">Network Performance</h2>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={formatMetricsForChart('resource_timing')}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="timestamp" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="value"
                stroke="#ffc658"
                name="Response Time (ms)"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
};

export default MonitoringDashboard;