import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";
import { MessageCircle, Heart, Share2, MoreHorizontal } from "lucide-react";
import { toast } from "sonner";

export function EnhancedFeed() {
  const [activities, setActivities] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadActivities();
    subscribeToActivities();
  }, []);

  const loadActivities = async () => {
    try {
      const { data, error } = await supabase
        .from('gaming_history')
        .select(`
          *,
          profiles:user_id(username, avatar_url, display_name)
        `)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      setActivities(data || []);
    } catch (error) {
      console.error('Error loading activities:', error);
      toast.error("Failed to load activity feed");
    } finally {
      setIsLoading(false);
    }
  };

  const subscribeToActivities = () => {
    const channel = supabase
      .channel('public:gaming_history')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'gaming_history'
        },
        async (payload) => {
          // Fetch the complete activity with profile data
          const { data: newActivity } = await supabase
            .from('gaming_history')
            .select(`
              *,
              profiles:user_id(username, avatar_url, display_name)
            `)
            .eq('id', payload.new.id)
            .single();

          if (newActivity) {
            setActivities(current => [newActivity, ...current]);
            toast.info("New activity available!");
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const handleLike = async (activityId: string) => {
    // Here we would implement like functionality
    toast.success("Activity liked!");
  };

  const handleComment = (activityId: string) => {
    // Here we would implement comment functionality
    toast.info("Comments coming soon!");
  };

  const handleShare = async (activityId: string) => {
    try {
      await navigator.share({
        title: 'Check out this activity!',
        text: 'Interesting gaming activity',
        url: window.location.href,
      });
    } catch (error) {
      toast.info("Sharing not supported on this device");
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="p-4">
            <div className="flex items-start gap-4 animate-pulse">
              <div className="w-10 h-10 rounded-full bg-gray-200" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-1/4" />
                <div className="h-4 bg-gray-200 rounded w-3/4" />
              </div>
            </div>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {activities.map((activity) => (
        <Card 
          key={activity.id} 
          className="p-4 hover:shadow-md transition-shadow duration-200"
        >
          <div className="flex items-start gap-4">
            <Avatar className="w-10 h-10">
              <AvatarImage src={activity.profiles?.avatar_url} />
              <AvatarFallback>
                {activity.profiles?.username?.[0]?.toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1 space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-semibold">
                    {activity.profiles?.display_name || activity.profiles?.username}
                  </span>
                  <span className="text-sm text-muted-foreground ml-2">
                    {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
                  </span>
                </div>
                <Button variant="ghost" size="icon">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </div>
              
              <p className="text-sm">{activity.details?.description}</p>
              
              {activity.details?.image_url && (
                <img 
                  src={activity.details.image_url} 
                  alt="Activity content"
                  className="rounded-lg max-h-96 object-cover w-full"
                />
              )}
              
              <div className="flex items-center gap-4 pt-2">
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="text-muted-foreground hover:text-primary"
                  onClick={() => handleLike(activity.id)}
                >
                  <Heart className="h-4 w-4 mr-2" />
                  <span>Like</span>
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="text-muted-foreground hover:text-primary"
                  onClick={() => handleComment(activity.id)}
                >
                  <MessageCircle className="h-4 w-4 mr-2" />
                  <span>Comment</span>
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="text-muted-foreground hover:text-primary"
                  onClick={() => handleShare(activity.id)}
                >
                  <Share2 className="h-4 w-4 mr-2" />
                  <span>Share</span>
                </Button>
              </div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}