import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.37.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  
  try {
    // Create Supabase client with service role key
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
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
      throw new Error(`Error fetching upcoming streams: ${streamError.message}`);
    }
    
    if (!upcomingStreams || upcomingStreams.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          message: 'No upcoming streams to send reminders for',
          data: { processedCount: 0 }
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }
    
    // Array to track results
    const results = [];
    
    // Process each upcoming stream
    for (const stream of upcomingStreams) {
      // Get user's followers
      const { data: followers } = await supabase
        .from('follows')
        .select('follower_id')
        .eq('following_id', stream.user_id);
      
      if (!followers || followers.length === 0) {
        results.push({
          streamId: stream.id,
          status: 'skipped',
          reason: 'no followers'
        });
        continue;
      }
      
      const followerIds = followers.map(f => f.follower_id);
      
      // Get push subscriptions for these followers
      const { data: subscriptions } = await supabase
        .from('push_subscriptions')
        .select('subscription, user_id')
        .in('user_id', followerIds)
        .eq('active', true);
      
      if (!subscriptions || subscriptions.length === 0) {
        results.push({
          streamId: stream.id,
          status: 'skipped',
          reason: 'no active subscriptions'
        });
        continue;
      }
      
      // Get streamer profile data
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
      await supabase
        .from('notification_events')
        .insert({
          user_id: stream.user_id,
          event_type: 'sent',
          notification_type: 'stream_reminder',
          topic: 'stream_reminder',
          title: notificationData.title,
          body: stream.title,
          recipient_count: subscriptions.length,
          metadata: {
            streamId: stream.id,
            scheduledTime: stream.scheduled_start_time
          }
        });
      
      // Format subscription data for our push notification service
      const subscriptionObjects = subscriptions.map(sub => {
        try {
          return typeof sub.subscription === 'string' 
            ? JSON.parse(sub.subscription) 
            : sub.subscription;
        } catch (e) {
          console.error('Invalid subscription format:', e);
          return null;
        }
      }).filter(Boolean);
      
      // Call the send-push-notification function
      const { data: pushResult, error: pushError } = await supabase.functions.invoke(
        'send-push-notification',
        {
          body: {
            subscriptions: subscriptionObjects,
            notification: notificationData
          }
        }
      );
      
      if (pushError) {
        results.push({
          streamId: stream.id,
          status: 'error',
          error: pushError.message
        });
      } else {
        results.push({
          streamId: stream.id,
          status: 'success',
          recipients: subscriptions.length,
          result: pushResult
        });
      }
      
      // Mark that reminders have been sent for this stream
      await supabase
        .from('streams')
        .update({ reminder_sent: true })
        .eq('id', stream.id);
    }
    
    return new Response(
      JSON.stringify({
        success: true,
        message: `Processed ${upcomingStreams.length} upcoming streams`,
        data: { results }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
    
  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        message: error.message,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
