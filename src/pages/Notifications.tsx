import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDistanceToNow } from "date-fns";
import { Bell } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

const NotificationsPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data: notifications, isLoading } = useQuery({
    queryKey: ['notifications', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('notifications')
        .select(`
          *,
          actor:profiles!notifications_actor_id_fkey(username, avatar_url)
        `)
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const handleNotificationClick = (notification: any) => {
    if (notification.resource_type && notification.resource_id) {
      switch (notification.resource_type) {
        case 'post':
          navigate(`/post/${notification.resource_id}`);
          break;
        case 'profile':
          navigate(`/profile/${notification.resource_id}`);
          break;
        case 'stream':
          navigate(`/stream/${notification.resource_id}`);
          break;
      }
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center gap-2 mb-6">
        <Bell className="h-6 w-6" />
        <h1 className="text-2xl font-bold">Notifications</h1>
      </div>

      <div className="space-y-4">
        {isLoading ? (
          <div className="text-center py-8">Loading notifications...</div>
        ) : notifications?.length === 0 ? (
          <div className="text-center py-8">
            <Bell className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold">No notifications yet</h3>
            <p className="text-muted-foreground">We'll notify you when something happens!</p>
          </div>
        ) : (
          notifications?.map((notification) => (
            <Card
              key={notification.id}
              className="p-4 cursor-pointer hover:bg-accent/50 transition-colors"
              onClick={() => handleNotificationClick(notification)}
            >
              <div className="flex items-start gap-4">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={notification.actor?.avatar_url || undefined} />
                  <AvatarFallback>
                    {notification.actor?.username?.[0]?.toUpperCase() || '?'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="text-sm">
                    <span className="font-medium">{notification.actor?.username || 'Someone'}</span>
                    {' '}{notification.content}
                  </p>
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
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

export default NotificationsPage;