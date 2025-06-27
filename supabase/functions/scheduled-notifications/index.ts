import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'
import * as webPush from 'https://esm.sh/web-push@3.5.0'

interface ScheduleConfig {
  type: 'daily' | 'weekly' | 'custom';
  time?: string; // HH:MM format for daily
  day?: number;  // 0-6 for weekly (Sunday = 0)
  customInterval?: number; // minutes
}

interface Notification {
  id: string;
  user_id: string;
  title: string;
  body: string;
  icon?: string;
  image?: string;
  data?: Record<string, unknown>;
  topic: string;
  schedule: ScheduleConfig;
  last_sent?: string;
  next_scheduled?: string;
  enabled: boolean;
  created_at: string;
}

// Create Supabase client
const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
)

serve(async (req) => {
  try {
    // Handle CORS
    if (req.method === 'OPTIONS') {
      return new Response('ok', {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization'
        }
      })
    }

    // Check for cron job or manual trigger
    const isCronJob = req.headers.get('user-agent')?.includes('Supabase-Cron');
    
    // Set up VAPID keys for web push
    webPush.setVapidDetails(
      'mailto:' + (Deno.env.get('VAPID_MAILTO') ?? 'example@clipt.com'),
      Deno.env.get('VAPID_PUBLIC_KEY') ?? '',
      Deno.env.get('VAPID_PRIVATE_KEY') ?? ''
    )

    // If it's a cron job or manual trigger, process scheduled notifications
    if (isCronJob || req.method === 'POST') {
      const now = new Date();
      
      // Get all scheduled notifications that are due
      const { data: scheduledNotifications, error: fetchError } = await supabase
        .from('scheduled_notifications')
        .select('*')
        .eq('enabled', true)
        .lt('next_scheduled', now.toISOString());
      
      if (fetchError) {
        throw fetchError;
      }
      
      if (!scheduledNotifications || scheduledNotifications.length === 0) {
        return new Response(
          JSON.stringify({ message: 'No notifications due' }),
          { headers: { 'Content-Type': 'application/json' } }
        );
      }
      
      const results = await Promise.all(
        scheduledNotifications.map(async (notification: Notification) => {
          // Process this notification
          return await processScheduledNotification(notification);
        })
      );
      
      // Count successes and failures
      const sent = results.filter(r => r.success).length;
      const failed = results.filter(r => !r.success).length;
      
      return new Response(
        JSON.stringify({ 
          message: `Processed ${results.length} notifications`, 
          sent,
          failed
        }),
        { headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error processing scheduled notifications:', error);
    
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
})

/**
 * Process a single scheduled notification
 */
async function processScheduledNotification(notification: Notification) {
  try {
    // Get all subscriptions for this user
    const { data: subscriptions, error: subError } = await supabase
      .from('push_subscriptions')
      .select('*')
      .eq('user_id', notification.user_id);
    
    if (subError) {
      throw subError;
    }
    
    if (!subscriptions || subscriptions.length === 0) {
      // No subscriptions for this user, disable the notification
      await updateScheduleStatus(notification.id, false);
      return { success: false, error: 'No subscription found' };
    }
    
    // Filter subscriptions by topic preference
    const eligibleSubscriptions = subscriptions.filter(sub => {
      const prefs = sub.preferences || {};
      
      // Check if this notification's topic is enabled in preferences
      return prefs[notification.topic] === true;
    });
    
    if (eligibleSubscriptions.length === 0) {
      // Update next schedule time but don't disable
      await calculateAndUpdateNextSchedule(notification);
      return { success: false, error: 'No eligible subscriptions' };
    }
    
    // Send push notification to all eligible subscriptions
    const sendResults = await Promise.all(
      eligibleSubscriptions.map(async (subscription) => {
        try {
          await sendPushNotification(subscription, notification);
          return { success: true };
        } catch (error) {
          console.error(`Error sending to subscription ${subscription.id}:`, error);
          
          // Handle subscription expiry
          if (error.statusCode === 410) {
            await supabase
              .from('push_subscriptions')
              .delete()
              .eq('id', subscription.id);
          }
          
          return { success: false, error: error.message };
        }
      })
    );
    
    // Calculate next schedule time
    await calculateAndUpdateNextSchedule(notification);
    
    // Log notification sent
    await supabase.from('notification_logs').insert({
      notification_id: notification.id,
      user_id: notification.user_id,
      title: notification.title,
      body: notification.body,
      topic: notification.topic,
      sent_at: new Date().toISOString(),
      success_count: sendResults.filter(r => r.success).length,
      failure_count: sendResults.filter(r => !r.success).length
    });
    
    // Update last_sent timestamp
    await supabase
      .from('scheduled_notifications')
      .update({ last_sent: new Date().toISOString() })
      .eq('id', notification.id);
    
    return { 
      success: sendResults.some(r => r.success),
      sentCount: sendResults.filter(r => r.success).length
    };
  } catch (error) {
    console.error('Error processing notification:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Calculate when this notification should next be sent
 */
async function calculateAndUpdateNextSchedule(notification: Notification) {
  const now = new Date();
  let nextSchedule: Date;
  
  switch (notification.schedule.type) {
    case 'daily':
      // Schedule for tomorrow at the specified time
      nextSchedule = new Date();
      nextSchedule.setDate(nextSchedule.getDate() + 1);
      
      // Set the time if specified
      if (notification.schedule.time) {
        const [hours, minutes] = notification.schedule.time.split(':').map(Number);
        nextSchedule.setHours(hours, minutes, 0, 0);
      } else {
        // Default to same time tomorrow
        nextSchedule.setHours(now.getHours(), now.getMinutes(), 0, 0);
      }
      break;
      
    case 'weekly':
      // Schedule for next week on the specified day
      nextSchedule = new Date();
      const currentDay = nextSchedule.getDay();
      const targetDay = notification.schedule.day !== undefined ? notification.schedule.day : currentDay;
      
      // Calculate days to add (handles wrapping around the week)
      const daysToAdd = (targetDay + 7 - currentDay) % 7 || 7;
      nextSchedule.setDate(nextSchedule.getDate() + daysToAdd);
      
      // Set the time if specified
      if (notification.schedule.time) {
        const [hours, minutes] = notification.schedule.time.split(':').map(Number);
        nextSchedule.setHours(hours, minutes, 0, 0);
      } else {
        // Default to same time
        nextSchedule.setHours(now.getHours(), now.getMinutes(), 0, 0);
      }
      break;
      
    case 'custom':
      // Schedule based on custom interval in minutes
      const intervalMinutes = notification.schedule.customInterval || 1440; // Default to 1 day
      nextSchedule = new Date(now.getTime() + intervalMinutes * 60000);
      break;
      
    default:
      // Default to tomorrow
      nextSchedule = new Date();
      nextSchedule.setDate(nextSchedule.getDate() + 1);
      nextSchedule.setHours(9, 0, 0, 0); // 9:00 AM
  }
  
  // Update the next_scheduled field
  await supabase
    .from('scheduled_notifications')
    .update({ next_scheduled: nextSchedule.toISOString() })
    .eq('id', notification.id);
    
  return nextSchedule;
}

/**
 * Temporarily disable a scheduled notification
 */
async function updateScheduleStatus(notificationId: string, enabled: boolean) {
  await supabase
    .from('scheduled_notifications')
    .update({ enabled })
    .eq('id', notificationId);
}

/**
 * Send a push notification to a specific subscription
 */
async function sendPushNotification(subscription: any, notification: Notification) {
  const pushSubscription = {
    endpoint: subscription.endpoint,
    keys: {
      auth: subscription.auth,
      p256dh: subscription.p256dh
    }
  };
  
  const payload = JSON.stringify({
    title: notification.title,
    body: notification.body,
    icon: notification.icon || '/favicon.ico',
    image: notification.image,
    data: {
      ...notification.data,
      notificationId: notification.id,
      topic: notification.topic,
      url: `${Deno.env.get('PUBLIC_SITE_URL')}/notifications`
    }
  });
  
  await webPush.sendNotification(pushSubscription, payload);
  
  // Update last_used on the subscription
  await supabase
    .from('push_subscriptions')
    .update({ last_used: new Date().toISOString() })
    .eq('id', subscription.id);
}
