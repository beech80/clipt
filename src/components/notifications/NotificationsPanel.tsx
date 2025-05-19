import React, { useState, useEffect } from 'react';
import { Bell, Sparkles, MessageCircle, Heart, UserPlus, Share2, Clock, X, ChevronRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Notification, getUserNotifications, markNotificationsAsRead, getUnreadNotificationCount } from '@/services/notificationService';
import { useToast } from '@/components/ui/use-toast';

interface NotificationsPanelProps {
  userId: string;
  onClose: () => void;
}

const NotificationsPanel: React.FC<NotificationsPanelProps> = ({ userId, onClose }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'boost' | 'social'>('all');
  const { toast } = useToast();

  // Fetch notifications when component mounts
  useEffect(() => {
    fetchNotifications();
    
    // Set up polling for new notifications every 30 seconds
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, [userId]);

  // Fetch notifications from the server
  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const notifs = await getUserNotifications(userId);
      setNotifications(notifs);
      
      // Count unread notifications
      const unread = notifs.filter(n => !n.read).length;
      setUnreadCount(unread);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      toast({
        title: 'Failed to load notifications',
        description: 'Unable to retrieve your notifications. Please try again later.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Fetch only the unread count
  const fetchUnreadCount = async () => {
    try {
      const count = await getUnreadNotificationCount(userId);
      setUnreadCount(count);
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  };

  // Mark all notifications as read
  const markAllAsRead = async () => {
    try {
      const unreadIds = notifications
        .filter(notif => !notif.read)
        .map(notif => notif.id);
        
      if (unreadIds.length === 0) return;
      
      const success = await markNotificationsAsRead(unreadIds);
      
      if (success) {
        // Update local state to mark all as read
        setNotifications(
          notifications.map(notif => ({
            ...notif,
            read: true,
          }))
        );
        setUnreadCount(0);
        
        toast({
          title: 'All notifications marked as read',
          description: `${unreadIds.length} notifications have been marked as read.`,
        });
      }
    } catch (error) {
      console.error('Error marking notifications as read:', error);
      toast({
        title: 'Failed to mark as read',
        description: 'Unable to mark notifications as read. Please try again.',
        variant: 'destructive',
      });
    }
  };

  // Mark a single notification as read
  const markAsRead = async (notificationId: string) => {
    try {
      const success = await markNotificationsAsRead([notificationId]);
      
      if (success) {
        // Update local state
        setNotifications(
          notifications.map(notif => 
            notif.id === notificationId ? { ...notif, read: true } : notif
          )
        );
        
        // Update unread count
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  // Handle clicking a notification
  const handleNotificationClick = (notification: Notification) => {
    // Mark as read
    if (!notification.read) {
      markAsRead(notification.id);
    }
    
    // Navigation or actions based on notification type
    switch (notification.type) {
      case 'boost_result':
        // Navigate to boost analytics or show modal with details
        // For example: router.push(`/boost-analytics/${notification.reference_id}`);
        break;
      case 'comment':
      case 'like':
      case 'share':
        // Navigate to the post
        // For example: router.push(`/post/${notification.reference_id}`);
        break;
      case 'follow':
        // Navigate to the user's profile
        // For example: router.push(`/profile/${notification.reference_id}`);
        break;
    }
  };

  // Get filtered notifications based on active tab
  const getFilteredNotifications = () => {
    switch (activeTab) {
      case 'boost':
        return notifications.filter(n => n.type === 'boost_result');
      case 'social':
        return notifications.filter(n => ['comment', 'like', 'follow', 'share', 'mention'].includes(n.type));
      default:
        return notifications;
    }
  };

  // Get icon for notification type
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'boost_result':
        return <Sparkles className="h-5 w-5 text-amber-400" />;
      case 'comment':
        return <MessageCircle className="h-5 w-5 text-blue-400" />;
      case 'like':
        return <Heart className="h-5 w-5 text-red-400" />;
      case 'follow':
        return <UserPlus className="h-5 w-5 text-green-400" />;
      case 'share':
        return <Share2 className="h-5 w-5 text-purple-400" />;
      default:
        return <Bell className="h-5 w-5 text-indigo-400" />;
    }
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffMins < 60) {
      return `${diffMins}m ago`;
    } else if (diffHours < 24) {
      return `${diffHours}h ago`;
    } else if (diffDays < 7) {
      return `${diffDays}d ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  return (
    <div className="fixed inset-y-0 right-0 w-full sm:w-96 bg-slate-950/95 backdrop-blur-lg border-l border-indigo-800/30 shadow-2xl shadow-purple-950/20 z-50 flex flex-col text-white animate-in slide-in-from-right">
      <div className="p-4 border-b border-indigo-800/30 flex justify-between items-center bg-gradient-to-r from-indigo-950 to-purple-900">
        <div className="flex items-center gap-2">
          <Bell className="h-5 w-5 text-blue-400" />
          <h2 className="text-lg font-semibold">Notifications</h2>
          {unreadCount > 0 && (
            <Badge className="bg-red-500 text-white">{unreadCount}</Badge>
          )}
        </div>
        
        <div className="flex gap-2">
          {unreadCount > 0 && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={markAllAsRead} 
              className="hover:bg-indigo-800/20 text-indigo-300"
            >
              Mark all read
            </Button>
          )}
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onClose}
            className="hover:bg-indigo-800/20"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
      </div>
      
      <Tabs 
        value={activeTab} 
        onValueChange={(value) => setActiveTab(value as 'all' | 'boost' | 'social')} 
        className="flex-1 flex flex-col"
      >
        <div className="px-4 pt-2">
          <TabsList className="grid grid-cols-3 bg-indigo-950/50">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="boost" className="flex items-center gap-1">
              <Sparkles className="h-3 w-3" /> Boosts
            </TabsTrigger>
            <TabsTrigger value="social" className="flex items-center gap-1">
              <Heart className="h-3 w-3" /> Social
            </TabsTrigger>
          </TabsList>
        </div>
        
        <ScrollArea className="flex-1 p-4">
          <TabsContent value="all" className="mt-0">
            <NotificationList 
              notifications={getFilteredNotifications()}
              loading={loading}
              getNotificationIcon={getNotificationIcon}
              formatDate={formatDate}
              handleNotificationClick={handleNotificationClick}
            />
          </TabsContent>
          
          <TabsContent value="boost" className="mt-0">
            <NotificationList 
              notifications={getFilteredNotifications()}
              loading={loading}
              getNotificationIcon={getNotificationIcon}
              formatDate={formatDate}
              handleNotificationClick={handleNotificationClick}
            />
          </TabsContent>
          
          <TabsContent value="social" className="mt-0">
            <NotificationList 
              notifications={getFilteredNotifications()}
              loading={loading}
              getNotificationIcon={getNotificationIcon}
              formatDate={formatDate}
              handleNotificationClick={handleNotificationClick}
            />
          </TabsContent>
        </ScrollArea>
      </Tabs>
    </div>
  );
};

// Separate component for notification list to avoid code duplication
interface NotificationListProps {
  notifications: Notification[];
  loading: boolean;
  getNotificationIcon: (type: string) => JSX.Element;
  formatDate: (dateString: string) => string;
  handleNotificationClick: (notification: Notification) => void;
}

const NotificationList: React.FC<NotificationListProps> = ({
  notifications,
  loading,
  getNotificationIcon,
  formatDate,
  handleNotificationClick,
}) => {
  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        {[1, 2, 3, 4, 5].map((i) => (
          <div 
            key={i} 
            className="p-4 rounded-lg bg-indigo-900/20 flex items-center gap-3"
          >
            <div className="w-10 h-10 rounded-full bg-indigo-800/30" />
            <div className="flex-1">
              <div className="h-4 bg-indigo-800/30 rounded w-3/4 mb-2" />
              <div className="h-3 bg-indigo-800/30 rounded w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }
  
  if (notifications.length === 0) {
    return (
      <div className="text-center py-12">
        <Bell className="h-12 w-12 text-indigo-500/40 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-indigo-300 mb-2">No notifications</h3>
        <p className="text-indigo-400/70 text-sm">
          You're all caught up! Notifications will appear here.
        </p>
      </div>
    );
  }
  
  return (
    <div className="space-y-3">
      {notifications.map((notification) => {
        const isBoostResult = notification.type === 'boost_result';
        const boostData = isBoostResult ? notification.data as any : null;
        
        return (
          <div 
            key={notification.id}
            onClick={() => handleNotificationClick(notification)}
            className={`p-3 rounded-lg border ${notification.read 
              ? 'bg-indigo-950/30 border-indigo-800/20' 
              : 'bg-indigo-900/30 border-indigo-700/30'
            } cursor-pointer hover:bg-indigo-800/30 transition-colors`}
          >
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-1">
                {getNotificationIcon(notification.type)}
              </div>
              
              <div className="flex-1">
                <div className="flex justify-between items-start">
                  <h4 className="font-medium text-indigo-100">
                    {notification.title}
                  </h4>
                  <span className="text-xs text-indigo-400 whitespace-nowrap ml-2">
                    {formatDate(notification.created_at)}
                  </span>
                </div>
                
                <p className="text-sm text-indigo-300 mt-1">
                  {notification.message}
                </p>
                
                {/* Special rendering for boost results */}
                {isBoostResult && boostData && (
                  <div className="mt-3 p-2 rounded bg-indigo-900/20 border border-indigo-700/30">
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="flex items-center gap-1">
                        <Sparkles className="h-3 w-3 text-amber-400" />
                        <span className="text-indigo-300">Views:</span>
                        <span className="font-medium text-white">{boostData.metrics.views}</span>
                        <span className="text-green-400">+{boostData.metrics.viewsFromBoost}</span>
                      </div>
                      
                      {boostData.metrics.likesFromBoost > 0 && (
                        <div className="flex items-center gap-1">
                          <Heart className="h-3 w-3 text-red-400" />
                          <span className="text-indigo-300">Likes:</span>
                          <span className="font-medium text-white">{boostData.metrics.likes}</span>
                          <span className="text-green-400">+{boostData.metrics.likesFromBoost}</span>
                        </div>
                      )}
                      
                      {boostData.boostType === 'chain_reaction' && boostData.metrics.chainMultiplier && (
                        <div className="flex items-center gap-1">
                          <Share2 className="h-3 w-3 text-purple-400" />
                          <span className="text-indigo-300">Multiplier:</span>
                          <span className="font-medium text-white">{boostData.metrics.chainMultiplier}x</span>
                        </div>
                      )}
                      
                      {boostData.boostType === 'king' && boostData.metrics.rankImprovement && (
                        <div className="flex items-center gap-1">
                          <ChevronRight className="h-3 w-3 text-yellow-400" />
                          <span className="text-indigo-300">Rank:</span>
                          <span className="font-medium text-white">#{boostData.metrics.rankDuring}</span>
                          <span className="text-green-400">↑{boostData.metrics.rankImprovement}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default NotificationsPanel;
