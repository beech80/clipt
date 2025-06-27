import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { notificationAnalyticsService } from '@/services/notificationAnalyticsService';
import { Loader2 } from 'lucide-react';
import { Badge } from './ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

interface AnalyticsDashboardProps {
  className?: string;
}

const NotificationAnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ className }) => {
  const [timeframe, setTimeframe] = useState<'day' | 'week' | 'month'>('week');
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const analyticsData = await notificationAnalyticsService.getAnalytics(timeframe);
        setData(analyticsData);
      } catch (error) {
        console.error('Error fetching analytics data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [timeframe]);

  const formatPermissionData = () => {
    if (!data?.permissions) return [];
    
    return [
      { name: 'Granted', value: data.permissions.find((p: any) => p.event_status === 'granted')?.count || 0 },
      { name: 'Denied', value: data.permissions.find((p: any) => p.event_status === 'denied')?.count || 0 },
      { name: 'Default', value: data.permissions.find((p: any) => p.event_status === 'default')?.count || 0 }
    ];
  };

  const formatSubscriptionData = () => {
    if (!data?.subscriptions) return [];
    
    return [
      { name: 'Success', value: data.subscriptions.find((s: any) => s.event_status === 'success')?.count || 0 },
      { name: 'Failure', value: data.subscriptions.find((s: any) => s.event_status === 'failure')?.count || 0 }
    ];
  };

  const formatTopicData = () => {
    if (!data?.topics) return [];
    
    return data.topics.map((topic: any) => ({
      name: topic.topic || 'unknown',
      sent: topic.count,
      opened: data.opens.find((o: any) => o.topic === topic.topic)?.count || 0
    })).sort((a: any, b: any) => b.sent - a.sent).slice(0, 5);
  };

  const renderOpenRatesTable = () => {
    if (!data?.openRates) return null;
    
    const openRateEntries = Object.entries(data.openRates)
      .map(([topic, rate]) => ({ topic, rate: rate as number }))
      .sort((a, b) => b.rate - a.rate);
    
    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Topic</TableHead>
            <TableHead className="text-right">Open Rate</TableHead>
            <TableHead className="text-right">Effectiveness</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {openRateEntries.map(({ topic, rate }) => (
            <TableRow key={topic}>
              <TableCell className="font-medium">{topic || 'unknown'}</TableCell>
              <TableCell className="text-right">{rate.toFixed(1)}%</TableCell>
              <TableCell className="text-right">
                {rate >= 50 ? (
                  <Badge className="ml-auto" variant="success">High</Badge>
                ) : rate >= 25 ? (
                  <Badge className="ml-auto" variant="default">Medium</Badge>
                ) : (
                  <Badge className="ml-auto" variant="destructive">Low</Badge>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Notification Analytics</CardTitle>
        <CardDescription>
          Track user engagement with push notifications
        </CardDescription>
        <Tabs
          value={timeframe}
          onValueChange={(value) => setTimeframe(value as 'day' | 'week' | 'month')}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="day">Last 24 Hours</TabsTrigger>
            <TabsTrigger value="week">Last 7 Days</TabsTrigger>
            <TabsTrigger value="month">Last 30 Days</TabsTrigger>
          </TabsList>
        </Tabs>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Permission Status</CardTitle>
                </CardHeader>
                <CardContent>
                  {data && (
                    <ResponsiveContainer width="100%" height={200}>
                      <PieChart>
                        <Pie
                          data={formatPermissionData()}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          outerRadius={60}
                          fill="#8884d8"
                          label
                        >
                          {formatPermissionData().map((entry: any, index: number) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Subscription Attempts</CardTitle>
                </CardHeader>
                <CardContent>
                  {data && (
                    <ResponsiveContainer width="100%" height={200}>
                      <PieChart>
                        <Pie
                          data={formatSubscriptionData()}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          outerRadius={60}
                          fill="#8884d8"
                          label
                        >
                          {formatSubscriptionData().map((entry: any, index: number) => (
                            <Cell 
                              key={`cell-${index}`} 
                              fill={index === 0 ? '#00C49F' : '#FF8042'} 
                            />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>
            </div>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Top 5 Notification Topics</CardTitle>
              </CardHeader>
              <CardContent>
                {data && (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart
                      data={formatTopicData()}
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="sent" name="Sent" fill="#8884d8" />
                      <Bar dataKey="opened" name="Opened" fill="#82ca9d" />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Notification Open Rates</CardTitle>
              </CardHeader>
              <CardContent>
                {data && renderOpenRatesTable()}
              </CardContent>
            </Card>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default NotificationAnalyticsDashboard;
