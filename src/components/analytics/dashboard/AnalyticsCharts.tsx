import { Card } from "@/components/ui/card";
import { AreaChart, LineChart, BarChart, Area, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface AnalyticsChartsProps {
  data: {
    date: string;
    users: number;
    streams: number;
    engagement: number;
    retention: number;
    avg_session: number;
    chat_activity: number;
  }[] | undefined;
}

export function AnalyticsCharts({ data }: AnalyticsChartsProps) {
  if (!data) return null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">User Growth & Retention</h3>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
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
            <LineChart data={data}>
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
            <BarChart data={data}>
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
  );
}