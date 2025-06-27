import { supabase } from '@/supabaseClient';

interface NotificationEvent {
  type: 'subscription' | 'permission' | 'delivery' | 'open' | 'click';
  status: 'success' | 'failure' | 'granted' | 'denied' | 'default';
  topic?: string;
  metadata?: Record<string, any>;
  timestamp?: string;
}

/**
 * Service for tracking notification-related analytics
 */
export const notificationAnalyticsService = {
  /**
   * Track a notification event
   */
  async trackEvent(userId: string, event: NotificationEvent): Promise<void> {
    try {
      // Make sure we have a timestamp
      if (!event.timestamp) {
        event.timestamp = new Date().toISOString();
      }
      
      // Insert the event into the analytics table
      await supabase.from('notification_analytics').insert({
        user_id: userId,
        event_type: event.type,
        event_status: event.status,
        topic: event.topic || null,
        metadata: event.metadata || {},
        created_at: event.timestamp
      });
    } catch (error) {
      console.error('Failed to track notification event:', error);
      // Silent failure in production - don't interrupt user experience for analytics
    }
  },

  /**
   * Track subscription event
   */
  async trackSubscription(userId: string, success: boolean, topic?: string): Promise<void> {
    await this.trackEvent(userId, {
      type: 'subscription',
      status: success ? 'success' : 'failure',
      topic
    });
  },

  /**
   * Track permission event
   */
  async trackPermission(userId: string, status: NotificationPermission): Promise<void> {
    await this.trackEvent(userId, {
      type: 'permission',
      status: status as 'granted' | 'denied' | 'default'
    });
  },

  /**
   * Track notification delivery
   */
  async trackDelivery(userId: string, topic: string): Promise<void> {
    await this.trackEvent(userId, {
      type: 'delivery',
      status: 'success',
      topic
    });
  },

  /**
   * Track notification open
   */
  async trackOpen(userId: string, topic: string, notificationId?: string): Promise<void> {
    await this.trackEvent(userId, {
      type: 'open',
      status: 'success',
      topic,
      metadata: { notification_id: notificationId }
    });
  },
  
  /**
   * Get analytics data for dashboard 
   */
  async getAnalytics(timeframe: 'day' | 'week' | 'month' = 'week'): Promise<any> {
    // Calculate date range based on timeframe
    const endDate = new Date();
    const startDate = new Date();
    
    switch (timeframe) {
      case 'day':
        startDate.setDate(endDate.getDate() - 1);
        break;
      case 'week':
        startDate.setDate(endDate.getDate() - 7);
        break;
      case 'month':
        startDate.setDate(endDate.getDate() - 30);
        break;
    }
    
    const { data: subscriptions, error: subError } = await supabase
      .from('notification_analytics')
      .select('event_status, count')
      .eq('event_type', 'subscription')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())
      .group('event_status');
    
    const { data: permissions, error: permError } = await supabase
      .from('notification_analytics')
      .select('event_status, count')
      .eq('event_type', 'permission')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())
      .group('event_status');
      
    const { data: topics, error: topicError } = await supabase
      .from('notification_analytics')
      .select('topic, count')
      .eq('event_type', 'delivery')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())
      .group('topic');
      
    const { data: opens, error: openError } = await supabase
      .from('notification_analytics')
      .select('topic, count')
      .eq('event_type', 'open')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())
      .group('topic');
      
    if (subError || permError || topicError || openError) {
      console.error('Error fetching analytics data:', subError || permError || topicError || openError);
    }
    
    // Calculate open rates
    const openRates: Record<string, number> = {};
    if (topics && opens) {
      topics.forEach(topic => {
        const delivered = topic.count;
        const opened = opens.find(o => o.topic === topic.topic)?.count || 0;
        openRates[topic.topic] = delivered > 0 ? (opened / delivered) * 100 : 0;
      });
    }
    
    return {
      subscriptions: subscriptions || [],
      permissions: permissions || [],
      topics: topics || [],
      opens: opens || [],
      openRates
    };
  }
};

export default notificationAnalyticsService;
