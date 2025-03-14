import { useState, useEffect } from 'react';
import { Calendar, BarChart3, Users, Clock, TrendingUp, Maximize2 } from 'lucide-react';
import { Activity } from '@/components/ui/icon-fix';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ResponsiveContainer, LineChart, Line, AreaChart, Area, CartesianGrid, XAxis, YAxis, Tooltip, Legend, BarChart, Bar } from 'recharts';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDistanceToNow, format, subDays, getUnixTime, fromUnixTime } from 'date-fns';

// Types for analytics data
interface ViewerCount {
  timestamp: number;
  viewer_count: number;
}

interface StreamSession {
  id: string;
  title: string;
  start_time: string;
  end_time: string | null;
  duration_seconds: number | null;
  max_viewers: number;
  avg_viewers: number;
  total_views: number;
  clips_created: number;
  donations_received: number;
}

interface StreamMetrics {
  total_streams: number;
  total_hours_streamed: number;
  avg_viewers: number;
  max_viewers: number;
  total_followers_gained: number;
  total_donations: number;
  donations_amount: number;
}

interface StreamAnalyticsProps {
  userId: string;
  streamId?: string; // Optional: If viewing analytics for a specific stream
}

export function StreamAnalytics({ userId, streamId }: StreamAnalyticsProps) {
  const { user } = useAuth();
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');
  const [activeTab, setActiveTab] = useState('overview');
  
  // Only allow the actual streamer or admins to view analytics
  const canViewAnalytics = user && (user.id === userId || user.app_metadata?.role === 'admin');
  
  // Query for overview metrics
  const { data: metrics, isLoading: isLoadingMetrics } = useQuery({
    queryKey: ['stream-metrics', userId, timeRange, streamId],
    queryFn: async () => {
      if (!canViewAnalytics) return null;
      
      const startDate = getUnixTime(subDays(new Date(), 
        timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90
      ));
      
      let query = supabase.rpc('get_stream_metrics', { 
        p_user_id: userId,
        p_days: timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90
      });
      
      if (streamId) {
        query = supabase.rpc('get_single_stream_metrics', { 
          p_stream_id: streamId
        });
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      return data as StreamMetrics;
    },
    enabled: canViewAnalytics,
  });
  
  // Query for stream sessions
  const { data: sessions, isLoading: isLoadingSessions } = useQuery({
    queryKey: ['stream-sessions', userId, timeRange, streamId],
    queryFn: async () => {
      if (!canViewAnalytics) return [];
      
      const startDate = subDays(new Date(), 
        timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90
      );
      
      let query = supabase
        .from('streams')
        .select(`
          id,
          title,
          start_time,
          end_time,
          duration_seconds,
          max_viewers,
          avg_viewers,
          total_views,
          (
            SELECT count(*) FROM stream_clips WHERE stream_id = streams.id
          ) as clips_created,
          (
            SELECT count(*) FROM stream_donations WHERE stream_id = streams.id
          ) as donations_received
        `)
        .eq('user_id', userId)
        .gte('start_time', startDate.toISOString())
        .order('start_time', { ascending: false });
      
      if (streamId) {
        query = query.eq('id', streamId);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      return data as StreamSession[];
    },
    enabled: canViewAnalytics,
  });
  
  // Query for viewer count over time (for charts)
  const { data: viewerData, isLoading: isLoadingViewerData } = useQuery({
    queryKey: ['stream-viewer-data', userId, timeRange, streamId],
    queryFn: async () => {
      if (!canViewAnalytics) return [];
      
      const startDate = subDays(new Date(), 
        timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90
      );
      
      let query = supabase
        .from('stream_viewer_counts')
        .select('timestamp, viewer_count, stream_id')
        .eq('user_id', userId)
        .gte('timestamp', getUnixTime(startDate));
      
      if (streamId) {
        query = query.eq('stream_id', streamId);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      // Process data for charts - group by day for the overview
      if (!streamId) {
        const groupedByDay: Record<string, number> = {};
        
        if (data && Array.isArray(data)) {
          data.forEach((item) => {
            const date = format(fromUnixTime(item.timestamp), 'yyyy-MM-dd');
            if (!groupedByDay[date]) {
              groupedByDay[date] = 0;
            }
            groupedByDay[date] = Math.max(groupedByDay[date], item.viewer_count);
          });
        
          return Object.keys(groupedByDay).map(date => ({
            date,
            viewers: groupedByDay[date]
          }));
        }
        
        return [];
      }
      
      // Return detailed data for a specific stream
      return data && Array.isArray(data) ? data.map(item => ({
        time: format(fromUnixTime(item.timestamp), 'HH:mm'),
        timestamp: item.timestamp,
        viewers: item.viewer_count
      })).sort((a, b) => a.timestamp - b.timestamp) : [];
    },
    enabled: canViewAnalytics,
  });
  
  if (!canViewAnalytics) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Stream Analytics</CardTitle>
          <CardDescription>
            You don't have permission to view these analytics.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }
  
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">
          {streamId ? 'Stream Analytics' : 'Streaming Analytics'}
        </h2>
        
        {!streamId && (
          <Select
            value={timeRange}
            onValueChange={(value) => setTimeRange(value as '7d' | '30d' | '90d')}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select Time Range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 Days</SelectItem>
              <SelectItem value="30d">Last 30 Days</SelectItem>
              <SelectItem value="90d">Last 90 Days</SelectItem>
            </SelectContent>
          </Select>
        )}
      </div>
      
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Streams</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoadingMetrics ? (
              <Skeleton className="h-7 w-16" />
            ) : (
              <div className="text-2xl font-bold">{metrics?.total_streams || 0}</div>
            )}
            <p className="text-xs text-muted-foreground">
              {timeRange === '7d' ? 'Last 7 days' : timeRange === '30d' ? 'Last 30 days' : 'Last 90 days'}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Hours Streamed</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoadingMetrics ? (
              <Skeleton className="h-7 w-20" />
            ) : (
              <div className="text-2xl font-bold">
                {Math.round((metrics?.total_hours_streamed || 0) * 10) / 10}h
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              {timeRange === '7d' ? 'Last 7 days' : timeRange === '30d' ? 'Last 30 days' : 'Last 90 days'}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Viewers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoadingMetrics ? (
              <Skeleton className="h-7 w-16" />
            ) : (
              <div className="text-2xl font-bold">{Math.round(metrics?.avg_viewers || 0)}</div>
            )}
            <p className="text-xs text-muted-foreground">
              {metrics?.max_viewers ? `Peak: ${metrics.max_viewers}` : ''}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Donations</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoadingMetrics ? (
              <Skeleton className="h-7 w-24" />
            ) : (
              <div className="text-2xl font-bold">
                ${Math.round((metrics?.donations_amount || 0) * 100) / 100}
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              {metrics?.total_donations ? `${metrics.total_donations} donations` : 'No donations yet'}
            </p>
          </CardContent>
        </Card>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="streams">Streams</TabsTrigger>
          <TabsTrigger value="viewers">Viewers</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-4">
          <Card className="col-span-4">
            <CardHeader>
              <CardTitle>Viewer Activity</CardTitle>
              <CardDescription>
                Peak concurrent viewers over time
              </CardDescription>
            </CardHeader>
            <CardContent className="h-[300px]">
              {isLoadingViewerData || !viewerData ? (
                <div className="flex items-center justify-center h-full">
                  <Skeleton className="h-[250px] w-full" />
                </div>
              ) : viewerData.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                  <Activity className="h-12 w-12 mb-2" />
                  <p>No viewer data available for this period.</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={viewerData}>
                    <defs>
                      <linearGradient id="colorViewers" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#8884d8" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                    <XAxis 
                      dataKey="date" 
                      tickFormatter={(date) => {
                        // Show abbreviated date
                        const parts = date.split('-');
                        return `${parts[1]}/${parts[2]}`;
                      }}
                    />
                    <YAxis />
                    <Tooltip 
                      formatter={(value) => [`${value} viewers`, 'Viewers']}
                      labelFormatter={(label) => label}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="viewers" 
                      stroke="#8884d8" 
                      fillOpacity={1} 
                      fill="url(#colorViewers)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="streams" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Stream Sessions</CardTitle>
              <CardDescription>
                Your most recent streaming sessions
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingSessions ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-20 w-full" />
                  ))}
                </div>
              ) : sessions?.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground">
                  <Calendar className="h-12 w-12 mx-auto mb-2" />
                  <p>No streaming sessions found for this period.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {sessions?.map((session) => (
                    <div key={session.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-medium">{session.title}</h3>
                        <div className="px-2 py-0.5 rounded text-xs bg-muted">
                          {session.end_time ? 'Completed' : 'Live'}
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 text-sm mb-3">
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-1 text-muted-foreground" />
                          {format(new Date(session.start_time), 'MMM dd, yyyy')}
                        </div>
                        <div className="flex items-center">
                          <Clock className="h-4 w-4 mr-1 text-muted-foreground" />
                          {session.duration_seconds 
                            ? `${Math.floor(session.duration_seconds / 3600)}h ${Math.floor((session.duration_seconds % 3600) / 60)}m`
                            : 'Still Live'
                          }
                        </div>
                        <div className="flex items-center">
                          <Users className="h-4 w-4 mr-1 text-muted-foreground" />
                          {session.avg_viewers ? `Avg: ${session.avg_viewers}` : 'No viewers'} 
                          {session.max_viewers ? ` | Peak: ${session.max_viewers}` : ''}
                        </div>
                        <div className="flex items-center">
                          <Maximize2 className="h-4 w-4 mr-1 text-muted-foreground" />
                          {session.clips_created} clips created
                        </div>
                      </div>
                      
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full md:w-auto"
                        asChild
                      >
                        <a href={`/analytics/stream/${session.id}`}>
                          <BarChart3 className="h-4 w-4 mr-1" />
                          Detailed Analytics
                        </a>
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="viewers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Viewer Growth</CardTitle>
              <CardDescription>
                Follower growth and viewer retention
              </CardDescription>
            </CardHeader>
            <CardContent className="h-[300px]">
              {/* Placeholder for viewer growth chart */}
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                <Activity className="h-12 w-12 mb-2" />
                <p>Detailed viewer analytics coming soon!</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default StreamAnalytics;
