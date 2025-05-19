import React, { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { getUnreadNotificationCount } from '@/services/notificationService';

interface NotificationButtonProps {
  userId: string;
  onOpenNotifications: () => void;
  className?: string;
}

const NotificationButton: React.FC<NotificationButtonProps> = ({ 
  userId, 
  onOpenNotifications,
  className = '' 
}) => {
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [animate, setAnimate] = useState<boolean>(false);

  // Fetch unread notification count
  useEffect(() => {
    const fetchUnreadCount = async () => {
      try {
        const count = await getUnreadNotificationCount(userId);
        
        // If count increased, trigger animation
        if (count > unreadCount) {
          setAnimate(true);
          setTimeout(() => setAnimate(false), 1000);
        }
        
        setUnreadCount(count);
      } catch (error) {
        console.error('Error fetching notifications count:', error);
      }
    };
    
    // Fetch initially
    fetchUnreadCount();
    
    // Set up polling every 15 seconds
    const interval = setInterval(fetchUnreadCount, 15000);
    
    return () => {
      clearInterval(interval);
    };
  }, [userId, unreadCount]);

  return (
    <Button
      variant="ghost"
      size="icon"
      className={`relative bg-indigo-950/40 hover:bg-indigo-900/50 text-white ${className}`}
      onClick={onOpenNotifications}
    >
      <Bell className={`h-5 w-5 ${animate ? 'animate-ping' : ''}`} />
      {unreadCount > 0 && (
        <Badge 
          className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center bg-red-500 text-white"
        >
          {unreadCount > 99 ? '99+' : unreadCount}
        </Badge>
      )}
    </Button>
  );
};

export default NotificationButton;
