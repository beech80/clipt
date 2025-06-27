/**
 * Notification Rate Limiter Module
 * 
 * Prevents notification fatigue by:
 * - Combining similar notifications
 * - Enforcing cooldown periods between notifications
 * - Respecting user's maximum notifications per day preference
 */
import { SupabaseClient } from '@supabase/supabase-js'

interface RateLimitSettings {
  maxPerDay?: number;        // Maximum notifications per day
  cooldownMinutes?: number;  // Minimum time between notifications
  combineThreshold?: number; // Combine notifications that arrive within this many seconds
}

interface ProcessedNotification {
  shouldSend: boolean;
  title: string;
  body: string;
  data?: Record<string, any>;
  combined?: boolean;
  combineCount?: number;
}

export class NotificationRateLimiter {
  private supabase: SupabaseClient;
  private defaultSettings = {
    maxPerDay: 20,
    cooldownMinutes: 5,
    combineThreshold: 60 // seconds
  };

  constructor(supabaseClient: SupabaseClient) {
    this.supabase = supabaseClient;
  }

  /**
   * Process a notification through rate limiting rules
   */
  async processNotification(
    userId: string,
    title: string,
    body: string,
    topic: string,
    data?: Record<string, any>
  ): Promise<ProcessedNotification> {
    // Get user's rate limit preferences
    const settings = await this.getUserSettings(userId);
    
    // Get user's notification history
    const history = await this.getRecentNotifications(userId);
    
    // Check if we should combine with a recent similar notification
    const combinedNotification = await this.tryCombineNotifications(
      history, 
      title, 
      body, 
      topic, 
      settings.combineThreshold,
      data
    );
    
    if (combinedNotification.combined) {
      return combinedNotification;
    }
    
    // Check if we're in a cooldown period
    const lastNotificationTime = this.getLastNotificationTime(history);
    if (lastNotificationTime) {
      const timeSinceLastNotif = (Date.now() - lastNotificationTime) / (1000 * 60); // minutes
      if (timeSinceLastNotif < settings.cooldownMinutes!) {
        return {
          shouldSend: false,
          title,
          body,
          data
        };
      }
    }
    
    // Check if we've hit the daily limit
    const todayCount = this.getNotificationCountToday(history);
    if (todayCount >= settings.maxPerDay!) {
      return {
        shouldSend: false,
        title,
        body,
        data
      };
    }
    
    // All checks passed, allow sending
    return {
      shouldSend: true,
      title,
      body,
      data
    };
  }
  
  /**
   * Get user's notification rate limit settings
   */
  private async getUserSettings(userId: string): Promise<RateLimitSettings> {
    try {
      const { data } = await this.supabase
        .from('user_preferences')
        .select('notification_rate_limits')
        .eq('user_id', userId)
        .single();
      
      if (data?.notification_rate_limits) {
        return {
          ...this.defaultSettings,
          ...data.notification_rate_limits
        };
      }
      
      return this.defaultSettings;
    } catch (error) {
      console.error('Error getting user rate limit settings:', error);
      return this.defaultSettings;
    }
  }
  
  /**
   * Get user's recent notification history
   */
  private async getRecentNotifications(userId: string) {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    try {
      const { data } = await this.supabase
        .from('notification_logs')
        .select('*')
        .eq('user_id', userId)
        .gte('sent_at', yesterday.toISOString())
        .order('sent_at', { ascending: false });
        
      return data || [];
    } catch (error) {
      console.error('Error getting notification history:', error);
      return [];
    }
  }
  
  /**
   * Try to combine with similar recent notifications
   */
  private async tryCombineNotifications(
    history: any[],
    title: string,
    body: string,
    topic: string,
    thresholdSeconds: number = 60,
    data?: Record<string, any>
  ): Promise<ProcessedNotification> {
    // Look for similar notifications of the same topic in the threshold window
    const now = Date.now();
    const similarNotifications = history.filter(notif => {
      const notifTime = new Date(notif.sent_at).getTime();
      const secondsAgo = (now - notifTime) / 1000;
      
      return (
        notif.topic === topic &&
        secondsAgo <= thresholdSeconds
      );
    });
    
    if (similarNotifications.length === 0) {
      return {
        shouldSend: true,
        title,
        body,
        data,
        combined: false
      };
    }
    
    // We have similar notifications, let's combine them
    const count = similarNotifications.length + 1;
    let newTitle = title;
    let newBody = body;
    
    // Modify the message to indicate it's combined
    if (count > 1) {
      // If title contains a name (common in notifications), preserve it
      const nameMatch = title.match(/^([^:]+):/);
      if (nameMatch) {
        newTitle = `${nameMatch[1]}: ${count} new updates`;
      } else {
        newTitle = `${count} new ${topic} notifications`;
      }
      
      // Add count to body
      newBody = `${body}\n\n+${count - 1} more notification${count > 2 ? 's' : ''}`;
    }
    
    return {
      shouldSend: true,
      title: newTitle,
      body: newBody,
      data: {
        ...data,
        combined: true,
        combineCount: count,
        originalTitle: title,
        originalBody: body
      },
      combined: true,
      combineCount: count
    };
  }
  
  /**
   * Get the timestamp of the last notification
   */
  private getLastNotificationTime(history: any[]): number | null {
    if (history.length === 0) return null;
    
    return new Date(history[0].sent_at).getTime();
  }
  
  /**
   * Get how many notifications were sent today
   */
  private getNotificationCountToday(history: any[]): number {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return history.filter(notif => {
      const notifDate = new Date(notif.sent_at);
      return notifDate >= today;
    }).length;
  }
}

export default NotificationRateLimiter;
