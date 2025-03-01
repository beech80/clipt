import { useState } from 'react';
import { Bell, BellOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import {
  requestPushPermission,
  registerPushSubscription,
  unregisterPushSubscription,
} from '@/services/pushNotificationService';

interface PushNotificationOptInProps {
  className?: string;
}

export function PushNotificationOptIn({ className = '' }: PushNotificationOptInProps) {
  const { user } = useAuth();
  const [isSubscribed, setIsSubscribed] = useState(Notification.permission === 'granted');
  const [isLoading, setIsLoading] = useState(false);

  const handleToggleNotifications = async () => {
    if (!user) {
      toast.error('You need to be logged in to enable notifications');
      return;
    }

    setIsLoading(true);

    try {
      if (isSubscribed) {
        const success = await unregisterPushSubscription(user.id);
        if (success) {
          setIsSubscribed(false);
          toast.success('Notifications disabled');
        } else {
          toast.error('Failed to disable notifications');
        }
      } else {
        const permissionResult = await requestPushPermission();
        
        if (permissionResult !== 'granted') {
          toast.error('You need to allow notification permissions to receive updates');
          setIsSubscribed(false);
          return;
        }
        
        const success = await registerPushSubscription(user.id);
        if (success) {
          setIsSubscribed(true);
          toast.success('Notifications enabled! You\'ll be notified when your favorite streamers go live.');
        } else {
          toast.error('Failed to enable notifications');
          setIsSubscribed(false);
        }
      }
    } catch (error) {
      console.error('Error toggling notifications:', error);
      toast.error('Something went wrong. Please try again later.');
      setIsSubscribed(false);
    } finally {
      setIsLoading(false);
    }
  };

  // If Push API is not supported
  if (!('Notification' in window)) {
    return null;
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Switch
        checked={isSubscribed}
        onCheckedChange={handleToggleNotifications}
        disabled={isLoading}
        id="push-notifications"
      />
      <label 
        htmlFor="push-notifications" 
        className="text-sm font-medium cursor-pointer flex items-center gap-1"
      >
        {isSubscribed ? (
          <>
            <Bell className="h-4 w-4" />
            Notifications enabled
          </>
        ) : (
          <>
            <BellOff className="h-4 w-4" />
            Enable notifications
          </>
        )}
      </label>
    </div>
  );
}

export default PushNotificationOptIn;
