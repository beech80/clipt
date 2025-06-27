import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { pushNotificationService } from '@/services/notificationService';
import { toast } from 'sonner';
import { Bell, BellOff } from 'lucide-react';

interface NotificationPreferencesProps {
  className?: string;
}

export function NotificationPreferences({ className }: NotificationPreferencesProps) {
  const [pushEnabled, setPushEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSupported, setIsSupported] = useState(false);

  // Check if push notifications are enabled on component mount
  useEffect(() => {
    async function checkPushStatus() {
      try {
        // Check if push is supported in this browser
        const supported = pushNotificationService.isSupported();
        setIsSupported(supported);
        
        if (!supported) {
          setIsLoading(false);
          return;
        }
        
        // Check if notifications are allowed
        const allowed = await pushNotificationService.areNotificationsAllowed();
        setPushEnabled(allowed);
        
        // If allowed, check if service worker is already registered
        if (allowed) {
          navigator.serviceWorker.ready.then(() => {
            // Check if we have an active subscription
            navigator.serviceWorker.ready.then(registration => {
              return registration.pushManager.getSubscription();
            }).then(subscription => {
              setPushEnabled(!!subscription);
              setIsLoading(false);
            });
          });
        } else {
          setIsLoading(false);
        }
      } catch (error) {
        console.error('Error checking push status:', error);
        setIsLoading(false);
      }
    }
    
    checkPushStatus();
  }, []);

  // Toggle push notifications
  const togglePushNotifications = async () => {
    try {
      setIsLoading(true);
      
      if (pushEnabled) {
        // Unsubscribe from push notifications
        const unsubscribed = await pushNotificationService.unsubscribe();
        
        if (unsubscribed) {
          setPushEnabled(false);
          toast.success('Push notifications disabled');
        } else {
          toast.error('Failed to disable push notifications');
        }
      } else {
        // Request permission and subscribe
        const permission = await pushNotificationService.requestPermission();
        
        if (permission === 'granted') {
          const subscription = await pushNotificationService.subscribe();
          
          if (subscription) {
            setPushEnabled(true);
            toast.success('Push notifications enabled');
          } else {
            toast.error('Failed to enable push notifications');
          }
        } else if (permission === 'denied') {
          toast.error('Notification permission denied. Please update your browser settings.');
        } else {
          toast.error('Notification permission dismissed. Please try again.');
        }
      }
    } catch (error) {
      console.error('Error toggling push notifications:', error);
      toast.error('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isSupported) {
    return (
      <div className={`flex items-center justify-between p-4 rounded-md bg-muted/50 ${className}`}>
        <div className="flex items-center gap-3">
          <BellOff className="h-5 w-5 text-muted-foreground" />
          <div>
            <h3 className="font-medium text-sm">Push Notifications</h3>
            <p className="text-xs text-muted-foreground">Not supported in your browser</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex items-center justify-between p-4 rounded-md bg-muted/50 ${className}`}>
      <div className="flex items-center gap-3">
        {pushEnabled ? (
          <Bell className="h-5 w-5 text-primary" />
        ) : (
          <BellOff className="h-5 w-5 text-muted-foreground" />
        )}
        <div>
          <h3 className="font-medium text-sm">Push Notifications</h3>
          <p className="text-xs text-muted-foreground">
            {pushEnabled 
              ? 'You will receive notifications when you're not using the app' 
              : 'Enable to receive notifications when you're not using the app'}
          </p>
        </div>
      </div>
      
      <Switch
        checked={pushEnabled}
        onCheckedChange={togglePushNotifications}
        disabled={isLoading}
      />
    </div>
  );
}
