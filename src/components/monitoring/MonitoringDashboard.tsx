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
  ResponsiveContainer
} from 'recharts';
import { format } from 'date-fns';

interface MetricData {
  timestamp: string;
  value: number;
  metric_name: string;
}

interface LogEntry {
  id: string;
  level: string;
  message: string;
  component: string;
  created_at: string;
}

const MonitoringDashboard = () => {
  const [metrics, setMetrics] = useState<MetricData[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch metrics
        const { data: metricsData, error: metricsError } = await supabase
          .from('performance_metrics')
          .select('*')
          .order('timestamp', { ascending: false })
          .limit(100);

        if (metricsError) throw metricsError;

        // Fetch logs
        const { data: logsData, error: logsError } = await supabase
          .from('application_logs')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(50);

        if (logsError) throw logsError;

        setMetrics(metricsData || []);
        setLogs(logsData || []);
      } catch (error) {
        console.error('Error fetching monitoring data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    // Set up real-time subscription for new logs
    const logsSubscription = supabase
      .channel('monitoring_logs')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'application_logs'
        },
        (payload) => {
          setLogs((current) => [payload.new as LogEntry, ...current.slice(0, 49)]);
        }
      )
      .subscribe();

    return () => {
      logsSubscription.unsubscribe();
    };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Monitoring Dashboard</h1>

      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Performance Metrics</h2>
        <div className="bg-white p-4 rounded-lg shadow h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={metrics}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="timestamp"
                tickFormatter={(timestamp) =>
                  format(new Date(timestamp), 'HH:mm:ss')
                }
              />
              <YAxis />
              <Tooltip
                labelFormatter={(timestamp) =>
                  format(new Date(timestamp), 'yyyy-MM-dd HH:mm:ss')
                }
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="value"
                stroke="#8884d8"
                name="Value"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-4">Application Logs</h2>
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Timestamp
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Level
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Component
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Message
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {logs.map((log) => (
                <tr key={log.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {format(new Date(log.created_at), 'yyyy-MM-dd HH:mm:ss')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        log.level === 'error'
                          ? 'bg-red-100 text-red-800'
                          : log.level === 'warn'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-green-100 text-green-800'
                      }`}
                    >
                      {log.level}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {log.component || '-'}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {log.message}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default MonitoringDashboard;