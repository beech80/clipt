import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

interface PushSubscription {
  endpoint: string;
  expirationTime: number | null;
  keys: {
    p256dh: string;
    auth: string;
  };
}

interface NotificationData {
  title: string;
  body: string;
  icon?: string;
  image?: string;
  tag?: string;
  data?: any;
  actions?: Array<{
    action: string;
    title: string;
    icon?: string;
  }>;
}

// This function checks if the browser supports notifications and if permission is granted
export const checkPushPermission = async (): Promise<NotificationPermission> => {
  try {
    // Check if notifications are supported
    if (!('Notification' in window)) {
      console.warn('This browser does not support push notifications');
      return 'denied';
    }

    // Check if service workers are supported
    if (!('serviceWorker' in navigator)) {
      console.warn('This browser does not support service workers');
      return 'denied';
    }
    
    // Check if Push API is supported
    if (!('PushManager' in window)) {
      console.warn('This browser does not support the Push API');
      return 'denied';
    }

    return Notification.permission;
  } catch (error) {
    console.error('Error checking notification permission:', error);
    return 'denied';
  }
};

// Request permission for push notifications
export const requestPushPermission = async (): Promise<NotificationPermission> => {
  try {
    if (!('Notification' in window)) {
      throw new Error('This browser does not support notifications');
    }
    
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      toast.success('Notifications enabled successfully!');
    }
    return permission;
  } catch (error) {
    console.error('Error requesting notification permission:', error);
    toast.error('Failed to enable notifications. Please try again.');
    return 'denied';
  }
};

// Register push subscription for a user
export const registerPushSubscription = async (userId: string): Promise<boolean> => {
  try {
    // Get the subscription object
    const subscription = await registerPushSubscriptionHelper();
    
    if (!subscription) {
      return false;
    }
    
    // Save subscription to database
    const { error } = await supabase
      .from('push_subscriptions')
      .upsert({
        user_id: userId,
        endpoint: subscription.endpoint,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
        expiration_time: subscription.expirationTime,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select();
    
    if (error) {
      console.error('Error saving push subscription:', error);
      return false;
    }
    
    console.log('Push subscription saved successfully');
    // Subscribe to push notifications
    return true;
  } catch (error) {
    console.error('Error registering push subscription:', error);
    return false;
  }
};

// Helper to register the push subscription
export const registerPushSubscriptionHelper = async (): Promise<PushSubscription | null> => {
  try {
    // Check if service worker is registered
    const registration = await navigator.serviceWorker.ready;
    
    // Subscribe to push notifications
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(
        'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8U'
      ),
    });
    
    return subscription as unknown as PushSubscription;
  } catch (error) {
    console.error('Error subscribing to push notifications:', error);
    return null;
  }
};

// Unregister push subscription
export const unregisterPushSubscription = async (userId: string): Promise<boolean> => {
  try {
    // Get service worker registration
    const registration = await navigator.serviceWorker.ready;
    
    // Get push subscription
    const subscription = await registration.pushManager.getSubscription();
    
    if (subscription) {
      // Unsubscribe
      await subscription.unsubscribe();
    }
    
    // Remove subscription from database
    const { error } = await supabase
      .from('push_subscriptions')
      .delete()
      .eq('user_id', userId);
    
    if (error) {
      console.error('Error removing push subscription:', error);
      return false;
    }
    
    console.log('Push subscription removed successfully');
    return true;
  } catch (error) {
    console.error('Error unregistering push subscription:', error);
    return false;
  }
};

// Send a local notification (useful for testing)
export const sendLocalNotification = (data: NotificationData): void => {
  if (Notification.permission === 'granted') {
    try {
      const notification = new Notification(data.title, {
        body: data.body,
        icon: data.icon,
        image: data.image,
        tag: data.tag,
        data: data.data,
      });
      
      notification.onclick = function() {
        window.focus();
        this.close();
      };
    } catch (error) {
      console.error('Error sending local notification:', error);
      toast.error('Failed to send notification');
    }
  }
};

// Helper function to convert base64 to Uint8Array for VAPID key
export function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');
  
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  
  return outputArray;
}
