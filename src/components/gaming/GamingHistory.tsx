import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { Card } from "@/components/ui/card";
import { formatDistanceToNow } from "date-fns";
import { History, Trophy, Flag, Calendar } from "lucide-react";

export function GamingHistory() {
  const { user } = useAuth();
  const [history, setHistory] = useState<any[]>([]);

  useEffect(() => {
    if (user) {
      loadHistory();
    }
  }, [user]);

  const loadHistory = async () => {
    const { data } = await supabase
      .from('gaming_history')
      .select('*')
      .eq('user_id', user?.id)
      .order('created_at', { ascending: false });

    setHistory(data || []);
  };

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
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Calendar className="h-6 w-6" />
        <h2 className="text-2xl font-bold">Gaming History</h2>
      </div>

      <div className="space-y-4">
        {history.map((item) => (
          <Card key={item.id} className="p-4">
            <div className="flex items-start gap-4">
              {getActivityIcon(item.activity_type)}
              <div>
                <p className="font-medium">{item.details.description}</p>
                <span className="text-sm text-muted-foreground">
                  {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
                </span>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}