import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import type { Database } from '@/lib/database.types';

// Type augmentation for Supabase tables
type Tables = Database['public']['Tables'];
type PushSubscriptionTable = Tables['push_subscriptions']['Row'];
type UserPreferencesTable = Tables['user_preferences']['Row'];
type NotificationTable = Tables['notifications']['Row'];

// URL for our service worker
const SERVICE_WORKER_URL = '/push-service-worker.js';

/**
 * Notification and Push API Types
 */
export interface NotificationPermissionStatus {
  supported: boolean;
  permission: NotificationPermission;
  pushSupported: boolean;
  subscribed: boolean;
}

export interface PushSubscriptionInfo {
  endpoint: string;
  expirationTime: number | null;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export interface NotificationPayload {
  title: string;
  body: string;
  icon?: string;
  image?: string;
  badge?: string;
  url?: string;
  tag?: string;
  requireInteraction?: boolean;
  topic?: string;
  actions?: Array<{
    action: string;
    title: string;
    icon?: string;
  }>;
  data?: Record<string, any>;
}

// Database types for push subscriptions
export interface PushSubscriptionRecord {
  id?: string;
  user_id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  created_at?: string;
  updated_at?: string;
  browser_info?: Record<string, any>;
}

/**
 * Helper functions for Web Push
 */
const pushHelpers = {
  // Convert URL base64 to Uint8Array (for applicationServerKey)
  urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    
    return outputArray;
  },

  // Convert ArrayBuffer to base64
  arrayBufferToBase64(buffer: ArrayBuffer | null): string {
    if (!buffer) return '';
    
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  },

  // Gets browser information for telemetry
  getBrowserInfo(): Record<string, any> {
    const { userAgent } = navigator;
    return {
      userAgent,
      language: navigator.language,
      platform: navigator.platform,
      timestamp: new Date().toISOString()
    };
  }
};

/**
 * Production-ready Push Notification Service
 */
export const pushNotificationService = {
  // Check if push notifications are supported
  isSupported(): boolean {
    return 'serviceWorker' in navigator && 'PushManager' in window;
  },

  // Check if notifications are allowed
  async areNotificationsAllowed(): Promise<boolean> {
    if (!this.isSupported()) return false;
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  },

  // Get current permission status with detailed info
  async getPermissionStatus(): Promise<NotificationPermissionStatus> {
    const pushSupported = this.isSupported();
    const permission = pushSupported ? Notification.permission : 'denied';
    
    // Check if already subscribed
    let subscribed = false;
    if (pushSupported) {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      subscribed = !!subscription;
    }

    return {
      supported: 'Notification' in window,
      permission,
      pushSupported,
      subscribed
    };
  },
  
  // Register the service worker
  async registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
    try {
      if (!this.isSupported()) return null;
      
      const registration = await navigator.serviceWorker.register(SERVICE_WORKER_URL, {
        scope: '/'
      });
      console.log('Service Worker registered successfully:', registration);
      
      // Send auth token to service worker if available
      const session = await supabase.auth.getSession();
      const token = session?.data?.session?.access_token;
      if (token && registration.active) {
        registration.active.postMessage({
          type: 'STORE_AUTH_TOKEN',
          token
        });
      }
      
      return registration;
    } catch (error) {
      console.error('Service Worker registration failed:', error);
      toast.error('Failed to register notification service worker');
      return null;
    }
  },

  // Request permission for notifications
  async requestPermission(): Promise<NotificationPermission> {
    try {
      return await Notification.requestPermission();
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return 'denied';
    }
  },

  // Subscribe to push notifications
  async subscribe(): Promise<PushSubscriptionInfo | null> {
    try {
      // Check if push is supported
      if (!this.isSupported()) {
        toast.error('Push notifications are not supported in your browser');
        return null;
      }

      // Request permission
      const permission = await this.requestPermission();
      if (permission !== 'granted') {
        toast.error('Notification permission was denied');
        return null;
      }

      // Register service worker if not already registered
      let swRegistration = await navigator.serviceWorker.ready
        .catch(() => null);
        
      if (!swRegistration) {
        swRegistration = await this.registerServiceWorker();
        if (!swRegistration) {
          toast.error('Failed to register service worker');
          return null;
        }
      }

      // Get VAPID public key from environment
      const vapidPublicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
      if (!vapidPublicKey) {
        console.error('VAPID public key is not configured');
        toast.error('Push notification configuration is missing');
        return null;
      }

      // Convert VAPID key to Uint8Array
      const convertedVapidKey = pushHelpers.urlBase64ToUint8Array(vapidPublicKey);

      // Get push subscription
      let subscription = await swRegistration.pushManager.getSubscription();
      
      // If no subscription exists, create one
      if (!subscription) {
        try {
          subscription = await swRegistration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: convertedVapidKey
          });
        } catch (subscribeError) {
          console.error('Failed to subscribe to push:', subscribeError);
          toast.error('Failed to enable push notifications');
          return null;
        }
      }

      // Format subscription for our API
      const formattedSubscription: PushSubscriptionInfo = {
        endpoint: subscription.endpoint,
        expirationTime: subscription.expirationTime,
        keys: {
          p256dh: pushHelpers.arrayBufferToBase64(subscription.getKey('p256dh')),
          auth: pushHelpers.arrayBufferToBase64(subscription.getKey('auth'))
        }
      };

      // Save subscription to database
      const saved = await this.saveSubscriptionToDatabase(formattedSubscription);
      if (!saved) {
        toast.error('Failed to save notification settings');
        return null;
      }

      toast.success('Push notifications enabled');
      return formattedSubscription;
    } catch (error) {
      console.error('Error subscribing to push notifications:', error);
      toast.error('Something went wrong enabling notifications');
      return null;
    }
  },

  // Save the subscription to our database
  async saveSubscriptionToDatabase(subscription: PushSubscriptionInfo): Promise<boolean> {
    try {
      const user = await supabase.auth.getUser();
      const userId = user.data.user?.id;
      
      if (!userId) {
        console.error('User not logged in');
        return false;
      }
      
      // Get browser info for telemetry
      const browserInfo = pushHelpers.getBrowserInfo();

      // Save to push_subscriptions table with proper types
      const { error } = await supabase
        .from<PushSubscriptionRecord>('push_subscriptions')
        .upsert({
          user_id: userId,
          endpoint: subscription.endpoint,
          p256dh: subscription.keys.p256dh,
          auth: subscription.keys.auth,
          browser_info: browserInfo,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id, endpoint'
        });

      if (error) {
        console.error('Error saving push subscription:', error);
        return false;
      }

      // Also update user preferences to enable push notifications globally
      const { error: prefError } = await supabase
        .from<UserPreferencesTable>('user_preferences')
        .upsert({
          user_id: userId,
          push_notifications_enabled: true,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        });

      if (prefError) {
        console.error('Error updating notification preferences:', prefError);
        // Continue anyway as the subscription was saved
      }

      return true;
    } catch (error) {
      console.error('Error saving push subscription:', error);
      return false;
    }
  },

  // Unsubscribe from push notifications
  async unsubscribe(): Promise<boolean> {
    try {
      if (!this.isSupported()) {
        toast.error('Push notifications are not supported');
        return false;
      }

      // Get service worker registration
      const swRegistration = await navigator.serviceWorker.ready
        .catch(() => null);
      
      if (!swRegistration) {
        console.warn('Service worker not ready');
        return false;
      }
      
      // Get current subscription
      const subscription = await swRegistration.pushManager.getSubscription();
      
      if (!subscription) {
        // Already unsubscribed from browser
        // But still update preferences in database
        await this.updateNotificationPreferences(false);
        return true; 
      }

      try {
        // Delete from database first
        await this.deleteSubscriptionFromDatabase(subscription.endpoint);
        
        // Then unsubscribe from the browser
        await subscription.unsubscribe();
        toast.success('Push notifications disabled');
        
        // Update user preferences
        await this.updateNotificationPreferences(false);
        
        return true;
      } catch (unsubError) {
        console.error('Error unsubscribing:', unsubError);
        toast.error('Failed to disable push notifications');
        return false;
      }
    } catch (error) {
      console.error('Error unsubscribing from push notifications:', error);
      toast.error('Something went wrong');
      return false;
    }
  },
  
  // Update user notification preferences
  async updateNotificationPreferences(
    enabled: boolean,
    topics?: Record<string, boolean>
  ): Promise<boolean> {
    try {
      const user = await supabase.auth.getUser();
      const userId = user.data.user?.id;
      
      if (!userId) {
        console.error('User not logged in');
        return false;
      }
      
      // Get current preferences
      const { data: currentPrefs } = await supabase
        .from<UserPreferencesTable>('user_preferences')
        .select('notification_topics')
        .eq('user_id', userId)
        .single();
        
      // Merge with new topics if provided
      const notification_topics = topics 
        ? { ...(currentPrefs?.notification_topics || {}), ...topics }
        : (currentPrefs?.notification_topics || {});
      
      // Update preferences
      const { error } = await supabase
        .from<UserPreferencesTable>('user_preferences')
        .upsert({
          user_id: userId,
          push_notifications_enabled: enabled,
          notification_topics: notification_topics || {},
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        });

      if (error) {
        console.error('Error updating notification preferences:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error updating notification preferences:', error);
      return false;
    }
  },

  // Delete subscription from database
  async deleteSubscriptionFromDatabase(endpoint: string): Promise<boolean> {
    try {
      const user = await supabase.auth.getUser();
      const userId = user.data.user?.id;
      if (!userId) {
        console.error('User not logged in');
        return false;
      }

      const { error } = await supabase
        .from<PushSubscriptionRecord>('push_subscriptions')
        .delete()
        .eq('user_id', userId)
        .eq('endpoint', endpoint);

      if (error) {
        console.error('Error deleting subscription from database:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error deleting subscription from database:', error);
      return false;
    }
  },
  
  // Send a notification via the Edge Function
  async sendNotification(
    userIds: string | string[],
    payload: NotificationPayload
  ): Promise<{ success: boolean, results?: any }> {
    try {
      const session = await supabase.auth.getSession();
      const token = session?.data?.session?.access_token;
      
      if (!token) {
        console.error('No auth token available');
        return { success: false };
      }
      
      // Convert single ID to array
      const recipients = Array.isArray(userIds) ? userIds : [userIds];
      
      // Call the Edge Function to send notifications
      try {
        const { data, error } = await supabase.functions.invoke('push-notifications', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: {
            userIds: recipients,
            title: payload.title,
            body: payload.body,
            icon: payload.icon,
            image: payload.image,
            badge: payload.badge,
            url: payload.url,
            tag: payload.tag,
            topic: payload.topic,
            requireInteraction: payload.requireInteraction,
            actions: payload.actions,
            data: payload.data
          }
        });
        
        if (error) {
          console.error('Error sending notification:', error);
          toast.error('Failed to send notification');
          return { success: false };
        }
      
        return { success: true, results: data };
      } catch (error) {
        console.error('Error sending notification:', error);
        toast.error('Notification service error');
        return { success: false };
      }
    } catch (error) {
      console.error('Error preparing notification:', error);
      toast.error('Failed to prepare notification');
      return { success: false };
    }
  },
  
  // Initialize push notifications system (call on app startup)
  async initialize(): Promise<void> {
    try {
      // Only initialize if supported
      if (!this.isSupported()) return;
      
      // Register service worker in background
      const registration = await navigator.serviceWorker.register(SERVICE_WORKER_URL, {
        scope: '/'
      }).catch(() => null);
      
      if (registration) {
        // Send auth token to service worker if available
        const session = await supabase.auth.getSession();
        const token = session?.data?.session?.access_token;
        
        if (token && registration.active) {
          registration.active.postMessage({
            type: 'STORE_AUTH_TOKEN',
            token
          });
        }
      }
      
      // Setup auth state change listener
      supabase.auth.onAuthStateChange((event, session) => {
        const token = session?.access_token;
        const serviceWorker = navigator.serviceWorker.controller;
        
        if (token && serviceWorker) {
          // Update token in service worker
          serviceWorker.postMessage({
            type: 'STORE_AUTH_TOKEN',
            token
          });
        } else if (!token && serviceWorker) {
          // Clear token on signout
          serviceWorker.postMessage({
            type: 'CLEAR_AUTH_TOKEN'
          });
        }
      });
    } catch (error) {
      console.error('Error initializing push notifications:', error);
    }
  }
}

/**
 * Application notification interface
 * This represents notifications stored in the database
 */
export interface Notification {
  id: string;
  user_id: string;
  type: 'comment' | 'like' | 'follow' | 'share' | 'system' | 'mention' | 'stream_live' | 'reply';
  title: string;
  message: string;
  reference_id?: string; // ID of post or user this relates to
  reference_type?: 'post' | 'user' | 'system';
  data?: Record<string, any>; // Additional structured data
  read: boolean;
  created_at: string;
}

/**
 * Core notification service to handle application notifications
 * (different from push notifications)
 */

// Interface for database notification schema
interface DbNotification {
  id: string;
  user_id: string;
  actor_id?: string;
  type: 'comment' | 'like' | 'follow' | 'mention' | 'stream_live' | 'reply' | 'boost_result' | 'share' | 'system';
  content?: string;
  resource_id?: string;
  resource_type?: string;
  read: boolean;
  created_at: string;
}

// Define boost type for notifications
export type BoostType = 'squad_blast' | 'chain_reaction' | 'king' | 'stream_surge' | 'generic';

export interface BoostResultData {
  boostType: BoostType;
  metrics: {
    views: number;
    viewsFromBoost: number;
    engagement: number;
    engagementFromBoost: number;
    likes: number;
    likesFromBoost: number;
    shares: number;
    sharesFromBoost: number;
    newFollowers: number;
    // Type-specific metrics
    chainMultiplier?: number;
    rankImprovement?: number; 
    viewersPeak?: number;
    reachedUsers?: number;
  };
  contentTitle: string;
  contentId: string;
}

// Create a boost result notification when a boost completes
export const createBoostResultNotification = async (
  userId: string, 
  boostId: string,
  boostType: BoostType,
  metrics: BoostResultData['metrics'],
  contentTitle: string,
  contentId: string
): Promise<Notification | null> => {
  try {
    // Generate a title based on boost type
    let title = '';
    switch (boostType) {
      case 'squad_blast':
        title = 'Squad Blast Results';
        break;
      case 'chain_reaction':
        title = 'Chain Reaction Performance';
        break;
      case 'king':
        title = 'King Boost Performance';
        break;
      case 'stream_surge':
        title = 'Stream Surge Results';
        break;
      default:
        title = 'Boost Performance';
    }
    
    // Generate message with key metrics
    let message = '';
    
    switch (boostType) {
      case 'squad_blast':
        message = `Your Squad Blast reached ${metrics.reachedUsers} friends and generated ${metrics.viewsFromBoost} extra views and ${metrics.likesFromBoost} extra likes.`;
        break;
      case 'chain_reaction':
        message = `Your Chain Reaction achieved a ${metrics.chainMultiplier}x multiplier, spreading to ${metrics.reachedUsers} users and generating ${metrics.viewsFromBoost} extra views.`;
        break;
      case 'king':
        message = `Your King boost placed you in the Top 10, improving your rank by ${metrics.rankImprovement} positions and generating ${metrics.viewsFromBoost} extra views.`;
        break;
      case 'stream_surge':
        message = `Your Stream Surge reached a peak of ${metrics.viewersPeak} viewers and generated ${metrics.engagementFromBoost} extra engagement actions.`;
        break;
      default:
        message = `Your boost generated ${metrics.viewsFromBoost} extra views and ${metrics.likesFromBoost} extra likes.`;
    }
    
    // Prepare the notification data
    const notificationData = {
      user_id: userId,
      type: 'boost_result',
      title,
      message,
      reference_id: boostId,
      reference_type: 'boost',
      data: {
        boostType,
        metrics,
        contentTitle,
        contentId
      },
      read: false,
      created_at: new Date().toISOString()
    };
    
    // Map our notification format to DB format
    const dbNotification: DbNotification = {
      user_id: notificationData.user_id,
      type: notificationData.type,
      content: notificationData.message,
      resource_id: notificationData.reference_id,
      resource_type: notificationData.reference_type,
      read: notificationData.read,
      created_at: notificationData.created_at
    };
    
    // Insert the notification into the database
    const { data, error } = await supabase
      .from<NotificationTable>('notifications')
      .insert([dbNotification])
      .select()
      .single();
      
    if (error) {
      console.error('Error creating notification:', error);
      return null;
    }
    
    // Map DB response to our notification format
    return {
      id: data.id,
      user_id: data.user_id,
      type: data.type,
      title: notificationData.title,
      message: data.content || '',
      reference_id: data.resource_id,
      reference_type: data.resource_type,
      data: notificationData.data,
      read: data.read,
      created_at: data.created_at
    };
  } catch (error) {
    console.error('Error in createBoostResultNotification:', error);
    return null;
  }
};

// Create a social interaction notification (like, comment, follow)
export const createSocialNotification = async (
  userId: string,
  type: 'comment' | 'like' | 'follow' | 'share' | 'mention',
  fromUserId: string,
  fromUsername: string,
  contentId?: string,
  contentTitle?: string,
  commentText?: string
): Promise<Notification | null> => {
  try {
    let title = '';
    let message = '';
    let referenceType: 'post' | 'user' = 'post';
    
    switch (type) {
      case 'comment':
        title = 'New Comment';
        message = `@${fromUsername} commented: "${commentText?.substring(0, 50)}${commentText && commentText.length > 50 ? '...' : ''}"`;
        referenceType = 'post';
        break;
      case 'like':
        title = 'New Like';
        message = `@${fromUsername} liked your ${contentTitle ? `"${contentTitle}"` : 'post'}`;
        referenceType = 'post';
        break;
      case 'follow':
        title = 'New Follower';
        message = `@${fromUsername} started following you`;
        referenceType = 'user';
        break;
      case 'share':
        title = 'New Share';
        message = `@${fromUsername} shared your ${contentTitle ? `"${contentTitle}"` : 'post'}`;
        referenceType = 'post';
        break;
      case 'mention':
        title = 'New Mention';
        message = `@${fromUsername} mentioned you in a ${contentTitle ? `"${contentTitle}"` : 'post'}`;
        referenceType = 'post';
        break;
    }
    
    // Prepare notification data
    const notificationData = {
      user_id: userId,
      type,
      title,
      message,
      reference_id: type === 'follow' ? fromUserId : contentId,
      reference_type: referenceType,
      data: {
        fromUserId,
        fromUsername,
        contentId,
        contentTitle,
        commentText
      },
      read: false,
      created_at: new Date().toISOString()
    };
    
    // Map our notification format to DB format
    const dbNotification: DbNotification = {
      user_id: notificationData.user_id,
      type: notificationData.type,
      content: notificationData.message,
      resource_id: notificationData.reference_id,
      resource_type: notificationData.reference_type,
      actor_id: fromUserId,
      read: notificationData.read,
      created_at: notificationData.created_at
    };
    
    // Insert notification
    const { data, error } = await supabase
      .from<NotificationTable>('notifications')
      .insert([dbNotification])
      .select()
      .single();
      
    if (error) {
      console.error('Error creating social notification:', error);
      return null;
    }
    
    // Map DB response to our notification format
    return {
      id: data.id,
      user_id: data.user_id,
      type: data.type,
      title: notificationData.title,
      message: notificationData.message,
      reference_id: data.resource_id,
      reference_type: data.resource_type,
      data: notificationData.data,
      read: data.read,
      created_at: data.created_at
    };
  } catch (error) {
    console.error('Error in createSocialNotification:', error);
    return null;
  }
};

// Get all notifications for a user
export const getUserNotifications = async (userId: string, limit: number = 50, offset: number = 0): Promise<Notification[]> => {
  try {
    const { data, error } = await supabase
      .from<NotificationTable>('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
      
    if (error) {
      console.error('Error fetching notifications:', error);
      return [];
    }
    
    // Convert DB notifications to our app format
    return data.map((dbNotification: DbNotification) => ({
      id: dbNotification.id,
      user_id: dbNotification.user_id,
      type: dbNotification.type,
      title: generateNotificationTitle(dbNotification),
      message: dbNotification.content || generateNotificationMessage(dbNotification),
      reference_id: dbNotification.resource_id,
      reference_type: dbNotification.resource_type,
      data: {}, // In a real app, we'd fetch this from a JSON field
      read: dbNotification.read,
      created_at: dbNotification.created_at
    }));
  } catch (error) {
    console.error('Error in getUserNotifications:', error);
    return [];
  }
};

// Helper function to generate titles from DB notifications
const generateNotificationTitle = (notification: DbNotification): string => {
  switch (notification.type) {
    case 'comment': return 'New Comment';
    case 'like': return 'New Like';
    case 'follow': return 'New Follower';
    case 'mention': return 'New Mention';
    case 'share': return 'New Share';
    case 'boost_result': return 'Boost Results';
    case 'stream_live': return 'Stream Started';
    case 'reply': return 'New Reply';
    case 'system': return 'System Notification';
    default: return 'Notification';
  }
};

// Helper function to generate messages for notifications without content
const generateNotificationMessage = (notification: DbNotification): string => {
  switch (notification.type) {
    case 'comment': return 'Someone commented on your post';
    case 'like': return 'Someone liked your content';
    case 'follow': return 'You have a new follower';
    case 'mention': return 'Someone mentioned you';
    case 'share': return 'Your content was shared';
    case 'boost_result': return 'Your boost has completed';
    case 'stream_live': return 'A stream you follow is now live';
    case 'reply': return 'Someone replied to your comment';
    default: return '';
  }
};

// Get unread notification count
export const getUnreadNotificationCount = async (userId: string): Promise<number> => {
  try {
    const { data, error, count } = await supabase
      .from<NotificationTable>('notifications')
      .select('id', { count: 'exact' })
      .eq('user_id', userId)
      .eq('read', false);
      
    if (error) {
      console.error('Error counting unread notifications:', error);
      return 0;
    }
    
    return count || 0;
  } catch (error) {
    console.error('Error in getUnreadNotificationCount:', error);
    return 0;
  }
};

// Mark notifications as read
export const markNotificationsAsRead = async (notificationIds: string[]): Promise<boolean> => {
  try {
    if (notificationIds.length === 0) return true;
    
    const { error } = await supabase
      .from<NotificationTable>('notifications')
      .update({ read: true })
      .in('id', notificationIds);
      
    if (error) {
      console.error('Error marking notifications as read:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error in markNotificationsAsRead:', error);
    return false;
  }
};

// Mark single notification as read
export const markNotificationAsRead = async (notificationId: string): Promise<boolean> => {
  return markNotificationsAsRead([notificationId]);
};

// Mark all notifications as read for a user
export const markAllNotificationsAsRead = async (userId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from<NotificationTable>('notifications')
      .update({ read: true })
      .eq('user_id', userId)
      .eq('read', false);
      
    if (error) {
      console.error('Error marking all notifications as read:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error in markAllNotificationsAsRead:', error);
    return false;
  }
};

// Export all functions as a default object
const notificationService = {
  createBoostResultNotification,
  createSocialNotification,
  getUserNotifications,
  getUnreadNotificationCount,
  markNotificationsAsRead,
  markNotificationAsRead,
  markAllNotificationsAsRead
};

export default notificationService;
