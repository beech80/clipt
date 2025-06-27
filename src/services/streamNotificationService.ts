import { supabase } from '@/supabaseClient';
import { toast } from 'sonner';

export interface StreamNotification {
  streamId: string;
  title: string;
  description?: string;
  userId: string;
  thumbnailUrl?: string;
  isLive: boolean;
  scheduledTime?: string;
  userName?: string;
  userAvatar?: string;
}

/**
 * Service to handle stream-related notifications
 */
export class StreamNotificationService {
  
  /**
   * Send notifications to followers when a user goes live
   */
  public async notifyLiveStream(streamData: StreamNotification): Promise<boolean> {
    try {
      // Check if user is authenticated
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error('User not authenticated');
        return false;
      }
      
      // Get user's followers
      const { data: followers, error: followerError } = await supabase
        .from('follows')
        .select('follower_id')
        .eq('following_id', streamData.userId);
      
      if (followerError) {
        console.error('Error fetching followers:', followerError);
        return false;
      }
      
      if (!followers || followers.length === 0) {
        console.log('No followers to notify');
        return true;
      }
      
      const followerIds = followers.map(f => f.follower_id);
      
      // Get push subscriptions for these followers
      const { data: subscriptions, error: subscriptionError } = await supabase
        .from('push_subscriptions')
        .select('subscription, user_id')
        .in('user_id', followerIds)
        .eq('active', true);
      
      if (subscriptionError) {
        console.error('Error fetching subscriptions:', subscriptionError);
        return false;
      }
      
      if (!subscriptions || subscriptions.length === 0) {
        console.log('No active subscriptions to notify');
        return true;
      }
      
      // Get user profile data
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, avatar_url')
        .eq('id', streamData.userId)
        .single();
      
      // Prepare notification data
      const notificationData = {
        title: streamData.isLive 
          ? `${profile?.full_name || 'Someone'} is live now!`
          : `${profile?.full_name || 'Someone'} scheduled a stream`,
        body: streamData.title,
        image: profile?.avatar_url || streamData.thumbnailUrl,
        url: `/stream/${streamData.streamId}`,
        topic: 'stream',
        data: {
          streamId: streamData.streamId,
          userId: streamData.userId,
          type: streamData.isLive ? 'live' : 'scheduled',
          scheduledTime: streamData.scheduledTime,
          description: streamData.description
        }
      };
      
      // Log notification to analytics
      await this.logNotification({
        userId: streamData.userId,
        type: streamData.isLive ? 'live_stream' : 'scheduled_stream',
        topic: 'stream',
        title: notificationData.title,
        body: streamData.title,
        recipients: subscriptions.length,
        metadata: {
          streamId: streamData.streamId,
          isLive: streamData.isLive,
          scheduledTime: streamData.scheduledTime
        }
      });
      
      // Send notification through the push notifications API
      const response = await fetch('/api/push-notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        },
        body: JSON.stringify({
          subscriptions: subscriptions.map(s => s.subscription),
          notification: notificationData
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to send notification');
      }
      
      const result = await response.json();
      console.log(`Sent notifications to ${result.successCount || 0} subscribers`);
      
      return true;
    } catch (error) {
      console.error('Error sending stream notifications:', error);
      toast.error('Failed to send notifications to followers');
      return false;
    }
  }
  
  /**
   * Send reminder notifications for upcoming scheduled streams
   */
  public async sendStreamReminders(): Promise<boolean> {
    try {
      // Get upcoming scheduled streams that start within 10 minutes
      const tenMinutesFromNow = new Date(Date.now() + 10 * 60 * 1000).toISOString();
      const now = new Date().toISOString();
      
      const { data: upcomingStreams, error: streamError } = await supabase
        .from('streams')
        .select('id, title, description, user_id, scheduled_start_time, thumbnail_url')
        .gte('scheduled_start_time', now)
        .lte('scheduled_start_time', tenMinutesFromNow)
        .eq('is_live', false);
      
      if (streamError) {
        console.error('Error fetching upcoming streams:', streamError);
        return false;
      }
      
      if (!upcomingStreams || upcomingStreams.length === 0) {
        return true;
      }
      
      // Process each upcoming stream
      for (const stream of upcomingStreams) {
        // Get user's followers
        const { data: followers } = await supabase
          .from('follows')
          .select('follower_id')
          .eq('following_id', stream.user_id);
        
        if (!followers || followers.length === 0) continue;
        
        const followerIds = followers.map(f => f.follower_id);
        
        // Get push subscriptions for these followers
        const { data: subscriptions } = await supabase
          .from('push_subscriptions')
          .select('subscription, user_id')
          .in('user_id', followerIds)
          .eq('active', true);
        
        if (!subscriptions || subscriptions.length === 0) continue;
        
        // Get user profile data
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name, avatar_url')
          .eq('id', stream.user_id)
          .single();
        
        // Prepare notification data
        const notificationData = {
          title: `${profile?.full_name || 'Someone'}'s stream starts soon!`,
          body: stream.title,
          image: profile?.avatar_url || stream.thumbnail_url,
          url: `/stream/${stream.id}`,
          topic: 'stream_reminder',
          data: {
            streamId: stream.id,
            userId: stream.user_id,
            type: 'reminder',
            scheduledTime: stream.scheduled_start_time
          }
        };
        
        // Log notification to analytics
        await this.logNotification({
          userId: stream.user_id,
          type: 'stream_reminder',
          topic: 'stream_reminder',
          title: notificationData.title,
          body: stream.title,
          recipients: subscriptions.length,
          metadata: {
            streamId: stream.id,
            scheduledTime: stream.scheduled_start_time
          }
        });
        
        // Send notification through the push notifications API
        await fetch('/api/push-notifications', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
          },
          body: JSON.stringify({
            subscriptions: subscriptions.map(s => s.subscription),
            notification: notificationData
          })
        });
      }
      
      return true;
    } catch (error) {
      console.error('Error sending stream reminders:', error);
      return false;
    }
  }
  
  /**
   * Log notification to analytics
   */
  private async logNotification(data: {
    userId: string,
    type: string,
    topic: string,
    title: string,
    body: string,
    recipients: number,
    metadata?: any
  }): Promise<void> {
    try {
      await supabase
        .from('notification_events')
        .insert({
          user_id: data.userId,
          event_type: 'sent',
          notification_type: data.type,
          topic: data.topic,
          title: data.title,
          body: data.body,
          recipient_count: data.recipients,
          metadata: data.metadata || {}
        });
    } catch (error) {
      console.error('Error logging notification to analytics:', error);
    }
  }
}

export const streamNotificationService = new StreamNotificationService();
