import { useState, useEffect } from "react";
import { CosmicAnalyticsDashboard } from "@/components/analytics/CosmicAnalyticsDashboard";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TrendingUp, Calendar, Sparkles } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { BackButton } from "@/components/BackButton";
import { motion } from "framer-motion";

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
      <div className="container mx-auto p-6 bg-gradient-to-b from-gray-900 to-black min-h-screen">
        <div className="flex items-center gap-2">
          <BackButton />
          <h1 className="text-2xl font-bold mb-4 text-white">Analytics</h1>
        </div>
        <motion.div 
          className="p-8 rounded-xl text-center bg-gradient-to-br from-gray-900 to-gray-950 border border-blue-900/30"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          style={{
            boxShadow: '0 0 30px rgba(0, 80, 255, 0.1)',
          }}
        >
          <Sparkles className="h-12 w-12 text-blue-400 mx-auto mb-4" />
          <p className="text-blue-300 text-lg mb-2">No streams found</p>
          <p className="text-gray-400">Start streaming to see your analytics!</p>
          <motion.button 
            className="mt-6 px-6 py-2 rounded-lg bg-blue-600 text-white font-medium"
            whileHover={{ scale: 1.05, backgroundColor: '#3B82F6' }}
            whileTap={{ scale: 0.95 }}
          >
            Start Your First Stream
          </motion.button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black">
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <BackButton />
            <motion.div 
              className="flex items-center"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
            >
              <TrendingUp className="h-6 w-6 text-blue-400 mr-2" />
              <h1 className="text-2xl font-bold text-white">Analytics</h1>
            </motion.div>
          </div>
          
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-[180px] border-blue-900/50 bg-gray-900/80 text-white">
                <Calendar className="h-4 w-4 mr-2 text-blue-400" />
                <SelectValue placeholder="Select time range" />
              </SelectTrigger>
              <SelectContent className="bg-gray-900 border-blue-900/50 text-white">
                <SelectItem value="24h" className="focus:bg-blue-900/20 hover:bg-blue-900/20">Last 24 Hours</SelectItem>
                <SelectItem value="7d" className="focus:bg-blue-900/20 hover:bg-blue-900/20">Last 7 Days</SelectItem>
                <SelectItem value="30d" className="focus:bg-blue-900/20 hover:bg-blue-900/20">Last 30 Days</SelectItem>
                <SelectItem value="90d" className="focus:bg-blue-900/20 hover:bg-blue-900/20">Last 90 Days</SelectItem>
              </SelectContent>
            </Select>
          </motion.div>
        </div>

        <CosmicAnalyticsDashboard streamId={currentStreamId} timeRange={timeRange} />
      </div>
    </div>
  );
};

export default Analytics;