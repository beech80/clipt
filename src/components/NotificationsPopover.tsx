import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useEffect, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useNavigate } from "react-router-dom";

interface Notification {
  id: string;
  type: 'follow' | 'like' | 'comment' | 'mention' | 'stream_live' | 'reply';
  content: string;
  created_at: string;
  read: boolean;
  actor_id: string;
  user_id: string;
  resource_id?: string;
  resource_type?: string;
  actor: {
    username: string | null;
    avatar_url: string | null;
  } | null;
}

const NotificationsPopover = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);

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
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      return data as unknown as Notification[];
    },
    enabled: !!user,
  });

  // Mark notifications as read
  const markAsRead = useMutation({
    mutationFn: async (notificationId: string) => {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
    onError: () => {
      toast.error("Failed to mark notification as read");
    },
  });

  // Subscribe to new notifications
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          queryClient.invalidateQueries({ queryKey: ['notifications'] });
          toast.info("New notification received");
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, queryClient]);

  // Update unread count
  useEffect(() => {
    if (notifications) {
      setUnreadCount(notifications.filter(n => !n.read).length);
    }
  }, [notifications]);

  const handleNotificationClick = (notification: Notification) => {
    markAsRead.mutate(notification.id);
    
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

  const getNotificationContent = (notification: Notification) => {
    const actor = notification.actor?.username || 'Someone';
    
    switch (notification.type) {
      case 'follow':
        return `${actor} followed you`;
      case 'like':
        return `${actor} liked your post`;
      case 'comment':
        return `${actor} commented on your post`;
      case 'mention':
        return `${actor} mentioned you`;
      case 'stream_live':
        return `${actor} went live`;
      case 'reply':
        return `${actor} replied to your comment`;
      default:
        return notification.content || 'New notification';
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className="relative touch-manipulation active:scale-95 transition-transform"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-red-500 text-[10px] font-medium text-white flex items-center justify-center">
              {unreadCount}
            </span>
          )}
          <span className="sr-only">Notifications</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-[calc(100vw-32px)] sm:w-80 max-h-[80vh] overflow-hidden"
        align="end"
        sideOffset={8}
      >
        <div className="space-y-4">
          <div className="text-sm font-medium px-1">Notifications</div>
          {isLoading ? (
            <div className="text-sm text-muted-foreground p-4 text-center">
              Loading...
            </div>
          ) : notifications?.length === 0 ? (
            <div className="text-sm text-muted-foreground p-4 text-center">
              No notifications
            </div>
          ) : (
            <ScrollArea className="h-[calc(80vh-100px)] sm:h-[300px]">
              <div className="space-y-1 p-1">
                {notifications?.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-3 rounded-lg text-sm hover:bg-accent cursor-pointer active:scale-98 transition-transform touch-manipulation ${
                      !notification.read ? 'bg-muted' : ''
                    }`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-8 w-8 shrink-0">
                        <AvatarImage src={notification.actor?.avatar_url || undefined} />
                        <AvatarFallback>
                          {notification.actor?.username?.[0]?.toUpperCase() || '?'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="line-clamp-2">{getNotificationContent(notification)}</div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default NotificationsPopover;