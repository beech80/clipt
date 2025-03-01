import { supabase } from "@/lib/supabase";

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

export const requestPushPermission = async (): Promise<NotificationPermission> => {
  try {
    if (!('Notification' in window)) {
      throw new Error('This browser does not support notifications');
    }
    
    const permission = await Notification.requestPermission();
    return permission;
  } catch (error) {
    console.error('Error requesting notification permission:', error);
    return 'denied';
  }
};

export const registerPushSubscription = async (userId: string): Promise<boolean> => {
  try {
    const permission = await checkPushPermission();
    if (permission !== 'granted') return false;

    const subscription = await registerPushSubscriptionHelper();
    if (!subscription) return false;

    const subscriptionJson = subscription.toJSON() as PushSubscription;

    // Save subscription to Supabase
    const { error } = await supabase
      .from('push_subscriptions')
      .upsert({
        user_id: userId,
        endpoint: subscriptionJson.endpoint,
        p256dh: subscriptionJson.keys.p256dh,
        auth: subscriptionJson.keys.auth,
        created_at: new Date().toISOString(),
      }, { onConflict: 'endpoint' });

    if (error) {
      console.error('Error saving push subscription:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error registering push subscription:', error);
    return false;
  }
};

const registerPushSubscriptionHelper = async (): Promise<PushSubscription | null> => {
  try {
    const publicVapidKey = process.env.VITE_PUSH_PUBLIC_KEY;
    
    if (!publicVapidKey) {
      console.error('VAPID public key is missing. Check your environment variables.');
      return null;
    }
    
    // Register service worker
    const registration = await navigator.serviceWorker.ready;
    
    // Subscribe to push notifications
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicVapidKey)
    });
    
    return subscription;
  } catch (error) {
    console.error('Error registering push subscription:', error);
    return null;
  }
};

export const unregisterPushSubscription = async (userId: string): Promise<boolean> => {
  try {
    if (!('serviceWorker' in navigator)) return false;

    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();

    if (subscription) {
      await subscription.unsubscribe();

      // Remove from database
      const { error } = await supabase
        .from('push_subscriptions')
        .delete()
        .match({ 
          user_id: userId,
          endpoint: subscription.endpoint 
        });

      if (error) {
        console.error('Error removing push subscription from database:', error);
      }
    }

    return true;
  } catch (error) {
    console.error('Error unregistering push subscription:', error);
    return false;
  }
};

// Helper function to convert base64 to Uint8Array for VAPID key
function urlBase64ToUint8Array(base64String: string): Uint8Array {
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
