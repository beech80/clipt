import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDistanceToNow } from "date-fns";
import { MessageCircle, Heart, Trophy } from "lucide-react";

export function EnhancedFeed() {
  const [activities, setActivities] = useState<any[]>([]);

  useEffect(() => {
    loadActivities();
  }, []);

  const loadActivities = async () => {
    const { data } = await supabase
      .from('gaming_history')
      .select(`
        *,
        profiles:user_id(username, avatar_url)
      `)
      .order('created_at', { ascending: false })
      .limit(10);

    setActivities(data || []);
  };

  return (
    <div className="space-y-4">
      {activities.map((activity) => (
        <Card key={activity.id} className="p-4">
          <div className="flex items-start gap-4">
            <Avatar>
              <AvatarImage src={activity.profiles.avatar_url} />
              <AvatarFallback>{activity.profiles.username[0]}</AvatarFallback>
            </Avatar>
            
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-semibold">{activity.profiles.username}</span>
                <span className="text-sm text-muted-foreground">
                  {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
                </span>
              </div>
              
              <p className="mt-1">{activity.details.description}</p>
              
              <div className="flex items-center gap-4 mt-4">
                <button className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Heart className="h-4 w-4" />
                  <span>Like</span>
                </button>
                <button className="flex items-center gap-1 text-sm text-muted-foreground">
                  <MessageCircle className="h-4 w-4" />
                  <span>Comment</span>
                </button>
              </div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}