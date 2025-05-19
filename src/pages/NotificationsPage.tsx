import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, ArrowLeft, CheckCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import notificationService from '@/services/notificationService';
import { formatDistanceToNow } from 'date-fns';

// Types
interface NotificationData {
  id: string;
  user_id: string;
  type: 'boost_result' | 'like' | 'comment' | 'follow' | 'system';
  title: string;
  message: string;
  reference_id?: string;
  reference_type?: string;
  data?: any;
  read: boolean;
  created_at: string;
}

const NotificationsPage = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [activeTab, setActiveTab] = useState('all');
  const [loading, setLoading] = useState(true);
  
  // Mock user ID for demo purposes - in a real app, this would come from auth context
  const userId = "user-123";
  
  // Fetch notifications
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        setLoading(true);
        const data = await notificationService.getUserNotifications(userId);
        setNotifications(data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching notifications:', error);
        setLoading(false);
      }
    };
    
    fetchNotifications();
  }, [userId]);
  
  // Filter notifications by type
  const getFilteredNotifications = (filter: string) => {
    if (filter === 'all') return notifications;
    if (filter === 'unread') return notifications.filter(n => !n.read);
    if (filter === 'boosts') return notifications.filter(n => 
      n.type === 'boost_result' || 
      (n.type === 'system' && n.reference_type === 'boost')
    );
    if (filter === 'social') return notifications.filter(n => 
      ['like', 'comment', 'follow'].includes(n.type)
    );
    
    return notifications;
  };
  
  // Handle marking notification as read
  const handleNotificationClick = async (notification: NotificationData) => {
    if (!notification.read) {
      try {
        await notificationService.markNotificationAsRead(notification.id);
        
        // Update local state
        setNotifications(prev => 
          prev.map(n => n.id === notification.id ? { ...n, read: true } : n)
        );
      } catch (error) {
        console.error('Error marking notification as read:', error);
      }
    }
    
    // Handle navigation based on notification type
    if (notification.reference_type === 'post' && notification.reference_id) {
      navigate(`/post/${notification.reference_id}`);
    } else if (notification.reference_type === 'stream' && notification.reference_id) {
      navigate(`/stream/${notification.reference_id}`);
    }
  };
  
  // Mark all as read
  const handleMarkAllAsRead = async () => {
    try {
      await notificationService.markAllNotificationsAsRead(userId);
      
      // Update local state
      setNotifications(prev => 
        prev.map(n => ({ ...n, read: true }))
      );
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };
  
  // Get notification icon based on type
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'boost_result':
        return <div className="h-8 w-8 rounded-full bg-indigo-600 flex items-center justify-center">
          <span className="text-white text-xs font-bold">B</span>
        </div>;
      case 'like':
        return <div className="h-8 w-8 rounded-full bg-red-500 flex items-center justify-center">
          <span className="text-white text-xs">❤️</span>
        </div>;
      case 'comment':
        return <div className="h-8 w-8 rounded-full bg-green-500 flex items-center justify-center">
          <span className="text-white text-xs">💬</span>
        </div>;
      case 'follow':
        return <div className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center">
          <span className="text-white text-xs">👤</span>
        </div>;
      default:
        return <div className="h-8 w-8 rounded-full bg-purple-500 flex items-center justify-center">
          <span className="text-white text-xs">📢</span>
        </div>;
    }
  };
  
  return (
    <div className="min-h-screen bg-black bg-opacity-90 text-white">
      {/* Cosmic background with particles */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-indigo-900/20 via-gray-900/50 to-black"></div>
        <div className="absolute inset-0 bg-[url('/stars-bg.png')] opacity-50"></div>
      </div>
      
      {/* Centered Header */}
      <header className="p-4 fixed top-0 left-0 right-0 z-10 bg-gradient-to-r from-indigo-950 to-purple-900 backdrop-blur-md border-b border-indigo-800 shadow-lg flex items-center justify-center">
        <div className="flex items-center">
          <Bell className="h-6 w-6 text-blue-400 mr-2" />
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
            Notifications
          </h1>
        </div>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={handleMarkAllAsRead}
          className="text-blue-400 hover:bg-indigo-800/50 flex items-center gap-1 absolute right-4"
        >
          <CheckCheck className="h-4 w-4" />
          <span>Mark all read</span>
        </Button>
      </header>
      
      {/* Content - centered in the page */}
      <main className="container pt-20 pb-12 max-w-3xl mx-auto relative z-1 flex flex-col items-center">
        {/* Tabs */}
        <Tabs 
          defaultValue="all" 
          value={activeTab}
          onValueChange={setActiveTab}
          className="w-full max-w-2xl"
        >
          <TabsList className="grid grid-cols-4 mb-6 bg-indigo-950/70 border border-indigo-800/30">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="unread">Unread</TabsTrigger>
            <TabsTrigger value="boosts">Boosts</TabsTrigger>
            <TabsTrigger value="social">Social</TabsTrigger>
          </TabsList>
          
          <TabsContent value="all" className="space-y-4">
            {renderNotifications(getFilteredNotifications('all'))}
          </TabsContent>
          
          <TabsContent value="unread" className="space-y-4">
            {renderNotifications(getFilteredNotifications('unread'))}
          </TabsContent>
          
          <TabsContent value="boosts" className="space-y-4">
            {renderNotifications(getFilteredNotifications('boosts'))}
          </TabsContent>
          
          <TabsContent value="social" className="space-y-4">
            {renderNotifications(getFilteredNotifications('social'))}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
  
  // Helper function to render notifications
  function renderNotifications(filteredNotifications: NotificationData[]) {
    if (loading) {
      return (
        <div className="flex justify-center py-8">
          <div className="animate-spin h-10 w-10 border-4 border-indigo-500 rounded-full border-t-transparent"></div>
        </div>
      );
    }
    
    if (filteredNotifications.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Bell className="h-16 w-16 text-indigo-800 mb-4" />
          <h3 className="text-xl font-semibold mb-2">No notifications</h3>
          <p className="text-gray-400 max-w-md">
            When you receive notifications about boosts, likes, comments, and followers, they'll appear here.
          </p>
        </div>
      );
    }
    
    return filteredNotifications.map(notification => (
      <div 
        key={notification.id}
        onClick={() => handleNotificationClick(notification)}
        className={`
          border border-indigo-800/30 rounded-lg p-4 
          ${notification.read ? 'bg-gray-900/20' : 'bg-indigo-950/30'} 
          cursor-pointer hover:bg-indigo-900/20 transition-colors
        `}
      >
        <div className="flex gap-3">
          {getNotificationIcon(notification.type)}
          
          <div className="flex-1">
            <div className="flex justify-between items-start mb-1">
              <h3 className="font-semibold text-sm">{notification.title}</h3>
              <span className="text-xs text-gray-400">
                {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
              </span>
            </div>
            
            <p className="text-sm text-gray-300 mb-2">{notification.message}</p>
            
            {!notification.read && (
              <span className="inline-block h-2 w-2 rounded-full bg-blue-500"></span>
            )}
          </div>
        </div>
      </div>
    ));
  }
};

export default NotificationsPage;
