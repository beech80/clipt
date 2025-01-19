import { useState, useEffect } from "react";
import { AnalyticsDashboard } from "@/components/analytics/AnalyticsDashboard";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TrendingUp, Calendar } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";

const Analytics = () => {
  const [timeRange, setTimeRange] = useState("7d");
  const [currentStreamId, setCurrentStreamId] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    const fetchLatestStream = async () => {
      if (!user) return;
      
      const { data, error } = await supabase
        .from('streams')
        .select('id')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      
      if (data && !error) {
        setCurrentStreamId(data.id);
      }
    };

    fetchLatestStream();
  }, [user]);

  if (!currentStreamId) {
    return (
      <div className="container mx-auto p-6">
        <h1 className="text-2xl font-bold mb-4">Analytics</h1>
        <p>No streams found. Start streaming to see your analytics!</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-6 w-6" />
          <h1 className="text-2xl font-bold">Analytics Dashboard</h1>
        </div>
        
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-[180px]">
            <Calendar className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Select time range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="24h">Last 24 Hours</SelectItem>
            <SelectItem value="7d">Last 7 Days</SelectItem>
            <SelectItem value="30d">Last 30 Days</SelectItem>
            <SelectItem value="90d">Last 90 Days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <AnalyticsDashboard streamId={currentStreamId} />
    </div>
  );
};

export default Analytics;