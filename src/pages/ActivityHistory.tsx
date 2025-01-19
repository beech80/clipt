import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Card } from "@/components/ui/card";
import { formatDistanceToNow } from "date-fns";
import { History, Trophy, Flag, Calendar } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const ActivityHistory = () => {
  const { user } = useAuth();

  const { data: activities, isLoading } = useQuery({
    queryKey: ['activity-history', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('gaming_history')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'achievement':
        return <Trophy className="h-5 w-5 text-yellow-500" />;
      case 'tournament':
        return <Flag className="h-5 w-5 text-blue-500" />;
      default:
        return <History className="h-5 w-5 text-gray-500" />;
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center gap-2 mb-6">
        <Calendar className="h-6 w-6" />
        <h1 className="text-2xl font-bold">Activity History</h1>
      </div>

      <div className="space-y-4">
        {isLoading ? (
          <div className="text-center py-8">Loading activity history...</div>
        ) : activities?.length === 0 ? (
          <div className="text-center py-8">
            <History className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold">No activity yet</h3>
            <p className="text-muted-foreground">Your activities will appear here!</p>
          </div>
        ) : (
          activities?.map((activity) => (
            <Card key={activity.id} className="p-4">
              <div className="flex items-start gap-4">
                {getActivityIcon(activity.activity_type)}
                <div>
                  <p className="font-medium">{activity.details.description}</p>
                  <span className="text-sm text-muted-foreground">
                    {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
                  </span>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default ActivityHistory;