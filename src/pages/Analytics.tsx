import { useAuth } from "@/contexts/AuthContext";
import { AnalyticsDashboard } from "@/components/analytics/AnalyticsDashboard";
import { TrendingUp } from "lucide-react";

const Analytics = () => {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <TrendingUp className="h-6 w-6" />
        <h1 className="text-2xl font-bold">Analytics Dashboard</h1>
      </div>

      <AnalyticsDashboard streamId={user.id} />
    </div>
  );
};

export default Analytics;