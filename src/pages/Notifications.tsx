import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { Heart, MessageSquare, Award, User, Bell, Check, CheckCheck } from 'lucide-react';
import { toast } from 'sonner';

interface Notification {
  id: string;
  type: 'follow' | 'like' | 'comment' | 'mention' | 'stream_live' | 'reply' | 'achievement' | 'rank';
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

const NotificationIcon = ({ type }: { type: Notification['type'] }) => {
  switch (type) {
    case 'like':
      return <Heart className="h-4 w-4 text-red-500" />;
    case 'comment':
    case 'reply':
      return <MessageSquare className="h-4 w-4 text-blue-500" />;
    case 'follow':
      return <User className="h-4 w-4 text-green-500" />;
    case 'achievement':
      return <Award className="h-4 w-4 text-amber-500" />;
    case 'rank':
      return <Award className="h-4 w-4 text-purple-500" />;
    case 'stream_live':
      return <Bell className="h-4 w-4 text-red-500" />;
    default:
      return <Bell className="h-4 w-4 text-gray-500" />;
  }
};

const NotificationsPage = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'all' | 'unread'>('all');

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ['notifications', user?.id, activeTab],
    queryFn: async () => {
      const query = supabase
        .from('notifications')
        .select(`
          *,
          actor:profiles!notifications_actor_id_fkey(username, avatar_url)
        `)
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (activeTab === 'unread') {
        query.eq('read', false);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as unknown as Notification[];
    },
    enabled: !!user,
  });

  // Mark a notification as read
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

  // Mark all notifications as read
  const markAllAsRead = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', user?.id)
        .eq('read', false);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      toast.success("All notifications marked as read");
    },
    onError: () => {
      toast.error("Failed to mark all notifications as read");
    },
  });

  const handleNotificationClick = (notification: Notification) => {
    // Mark as read
    if (!notification.read) {
      markAsRead.mutate(notification.id);
    }

    // Navigate based on notification type and resource
    if (notification.resource_id && notification.resource_type) {
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
        case 'achievement':
          navigate(`/achievements`);
          break;
        default:
          break;
      }
    } else if (notification.type === 'follow' && notification.actor_id) {
      navigate(`/profile/${notification.actor_id}`);
    }
  };

  // Group notifications by date
  const groupedNotifications = notifications.reduce((groups, notification) => {
    const date = new Date(notification.created_at).toDateString();
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(notification);
    return groups;
  }, {} as Record<string, Notification[]>);

  const notificationGroups = Object.entries(groupedNotifications);

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <p>Please log in to view your notifications</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold flex items-center">
          <Bell className="mr-2 h-5 w-5" />
          Notifications
        </h1>
        {notifications.some(n => !n.read) && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => markAllAsRead.mutate()}
            disabled={markAllAsRead.isPending}
            className="flex items-center"
          >
            <CheckCheck className="mr-1 h-4 w-4" />
            Mark all as read
          </Button>
        )}
      </div>

      <Tabs defaultValue={activeTab} onValueChange={(value) => setActiveTab(value as 'all' | 'unread')} className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="unread">
            Unread
            {notifications.filter(n => !n.read).length > 0 && (
              <Badge variant="destructive" className="ml-2 px-1.5 py-0.5 h-5">
                {notifications.filter(n => !n.read).length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-6">
          {isLoading ? (
            <div className="text-center py-12">Loading notifications...</div>
          ) : notifications.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <p className="text-muted-foreground">No notifications to display</p>
              </CardContent>
            </Card>
          ) : (
            notificationGroups.map(([date, dateNotifications]) => (
              <div key={date} className="space-y-2">
                <h3 className="text-sm font-medium text-muted-foreground mb-2">
                  {date === new Date().toDateString() 
                    ? 'Today' 
                    : date === new Date(Date.now() - 86400000).toDateString() 
                      ? 'Yesterday' 
                      : date}
                </h3>
                <Card>
                  <CardContent className="p-0">
                    <ul className="divide-y">
                      {dateNotifications.map((notification) => (
                        <li 
                          key={notification.id}
                          className={`p-4 cursor-pointer hover:bg-muted/50 transition-colors ${!notification.read ? 'bg-muted/20' : ''}`}
                          onClick={() => handleNotificationClick(notification)}
                        >
                          <div className="flex items-start gap-3">
                            <Avatar className="h-10 w-10">
                              {notification.actor?.avatar_url ? (
                                <AvatarImage src={notification.actor.avatar_url} />
                              ) : (
                                <AvatarFallback>
                                  {notification.actor?.username?.charAt(0).toUpperCase() || 'U'}
                                </AvatarFallback>
                              )}
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <NotificationIcon type={notification.type} />
                                  <span className="font-medium">
                                    {notification.actor?.username || 'Someone'}
                                  </span>
                                  <span className="text-xs text-muted-foreground">
                                    {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                                  </span>
                                </div>
                                {!notification.read && (
                                  <Badge variant="secondary" className="h-2 w-2 rounded-full p-0" />
                                )}
                              </div>
                              <p className="mt-1 text-sm">{notification.content}</p>
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </div>
            ))
          )}
        </TabsContent>

        <TabsContent value="unread" className="space-y-6">
          {isLoading ? (
            <div className="text-center py-12">Loading notifications...</div>
          ) : notifications.filter(n => !n.read).length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <p className="text-muted-foreground">No unread notifications</p>
              </CardContent>
            </Card>
          ) : (
            notificationGroups.map(([date, dateNotifications]) => {
              const unreadNotifications = dateNotifications.filter(n => !n.read);
              if (unreadNotifications.length === 0) return null;
              
              return (
                <div key={date} className="space-y-2">
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">
                    {date === new Date().toDateString() 
                      ? 'Today' 
                      : date === new Date(Date.now() - 86400000).toDateString() 
                        ? 'Yesterday' 
                        : date}
                  </h3>
                  <Card>
                    <CardContent className="p-0">
                      <ul className="divide-y">
                        {unreadNotifications.map((notification) => (
                          <li 
                            key={notification.id}
                            className="p-4 cursor-pointer hover:bg-muted/50 transition-colors bg-muted/20"
                            onClick={() => handleNotificationClick(notification)}
                          >
                            <div className="flex items-start gap-3">
                              <Avatar className="h-10 w-10">
                                {notification.actor?.avatar_url ? (
                                  <AvatarImage src={notification.actor.avatar_url} />
                                ) : (
                                  <AvatarFallback>
                                    {notification.actor?.username?.charAt(0).toUpperCase() || 'U'}
                                  </AvatarFallback>
                                )}
                              </Avatar>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <NotificationIcon type={notification.type} />
                                    <span className="font-medium">
                                      {notification.actor?.username || 'Someone'}
                                    </span>
                                    <span className="text-xs text-muted-foreground">
                                      {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                                    </span>
                                  </div>
                                  <Badge variant="secondary" className="h-2 w-2 rounded-full p-0" />
                                </div>
                                <p className="mt-1 text-sm">{notification.content}</p>
                              </div>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                </div>
              );
            }).filter(Boolean)
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default NotificationsPage;
