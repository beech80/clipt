import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'
import * as webPush from 'https://esm.sh/web-push@3.5.0'
import { NotificationRateLimiter } from './rate-limiter.ts'
import { corsHeaders } from '../_shared/cors.ts'

interface PushPayload {
  userId?: string;
  userIds?: string[];
  title: string;
  body: string;
  icon?: string;
  url?: string;
  image?: string;
  data?: Record<string, any>;
  topic?: string;
  actions?: Array<{
    action: string;
    title: string;
    icon?: string;
  }>;
  badge?: string;
  tag?: string;
}

// Handle CORS and method routing
serve(async (request) => {
  // Handle CORS
  const corsResponse = handleCors(request)
  if (corsResponse) return corsResponse
  
  // Route based on request method
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  } else if (request.method === 'POST') {
    // Check if this is a cleanup request with special header
    const isCleanupRequest = request.headers.get('X-Cleanup-Request') === 'true';
    
    if (isCleanupRequest) {
      await cleanupStaleSubscriptions();
      return new Response(
        JSON.stringify({ message: 'Cleanup process completed' }),
        { headers: {...corsHeaders, 'Content-Type': 'application/json'} }
      );
    }
    
    // Regular push notification request
    return handlePOST(request);
  } else if (request.method === 'GET') {
    return new Response(
      JSON.stringify({ message: 'Push notification service is running' }),
      { headers: {...corsHeaders, 'Content-Type': 'application/json'} }
    );
  } else {
    return new Response('Method not allowed', { 
      status: 405, 
      headers: corsHeaders 
    });
  }
});

// Handle CORS preflight requests
function handleCors(req: Request): Response | null {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }
  return null
}

// Function to clean up stale subscriptions (not used for over 90 days)
async function cleanupStaleSubscriptions() {
  try {
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
    const isoDate = ninetyDaysAgo.toISOString();
    
    // Find subscriptions that haven't been used in 90 days
    const { data: staleSubscriptions, error: findError } = await supabaseAdmin
      .from('push_subscriptions')
      .select('id, endpoint')
      .lt('last_used', isoDate);
      
    if (findError) {
      console.error('Error finding stale subscriptions:', findError);
      return;
    }
    
    if (staleSubscriptions && staleSubscriptions.length > 0) {
      console.log(`Found ${staleSubscriptions.length} stale subscriptions to clean up`);
      
      // Delete the stale subscriptions in batches of 10
      const batchSize = 10;
      for (let i = 0; i < staleSubscriptions.length; i += batchSize) {
        const batch = staleSubscriptions.slice(i, i + batchSize);
        const ids = batch.map(sub => sub.id);
        
        const { error: deleteError } = await supabaseAdmin
          .from('push_subscriptions')
          .delete()
          .in('id', ids);
          
        if (deleteError) {
          console.error('Error deleting stale subscriptions:', deleteError);
        } else {
          console.log(`Successfully deleted ${batch.length} stale subscriptions`);
        }
      }
    } else {
      console.log('No stale subscriptions found');
    }
  } catch (error) {
    console.error('Error in cleanupStaleSubscriptions:', error);
  }
}

// Create Supabase client
const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
)

// Create rate limiter
const rateLimiter = new NotificationRateLimiter(supabase)

// Function to send push notification
async function handlePOST(request: Request): Promise<Response> {
  // Get auth token from request
  const authHeader = request.headers.get('Authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return new Response(
      JSON.stringify({ error: 'Missing or invalid authorization header' }),
      { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  try {
    // Validate the auth token
    const token = authHeader.substring(7)
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      console.error('Authentication error:', authError)
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Set up VAPID keys for web push
    const vapidPublicKey = Deno.env.get('VAPID_PUBLIC_KEY') || ''
    const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY') || ''
    
    if (!vapidPublicKey || !vapidPrivateKey) {
      console.error('VAPID keys not configured')
      return new Response(
        JSON.stringify({ error: 'Server configuration error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Set up web push with VAPID keys
    webPush.setVapidDetails(
      'mailto:notifications@clipt.com',
      vapidPublicKey,
      vapidPrivateKey
    )

    // Parse request body
    const requestData = await request.json()
    
    // Map request data to our push payload format
    const payload: PushPayload = {
      userIds: requestData.userIds,
      title: requestData.title,
      body: requestData.body,
      icon: requestData.icon,
      image: requestData.image,
      badge: requestData.badge,
      url: requestData.url,
      tag: requestData.tag,
      topic: requestData.topic,
      actions: requestData.actions,
      data: requestData.data
    }
    
    // Validate required parameters
    if ((!payload.userIds || !Array.isArray(payload.userIds) || payload.userIds.length === 0) || !payload.title || !payload.body) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters (userIds, title, body)' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Determine target user ids
    const targetUserIds: string[] = payload.userIds 
      ? payload.userIds 
      : (payload.userId ? [payload.userId] : [])

    if (targetUserIds.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No target users specified' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get user preferences for notifications
    const { data: userPrefs, error: prefError } = await supabase
      .from('user_preferences')
      .select('user_id, push_notifications_enabled, notification_topics')
      .in('user_id', targetUserIds)

    if (prefError) {
      console.error('Error fetching user preferences:', prefError)
    }

    // Filter users based on preferences
    const enabledUserIds = targetUserIds.filter(userId => {
      // If no preferences found, default to enabled
      const userPref = userPrefs?.find(pref => pref.user_id === userId)
      if (!userPref) return true
      
      // Check if push notifications are globally enabled
      if (userPref.push_notifications_enabled === false) return false
      
      // If topic filtering is available, check if this topic is enabled
      if (payload.topic && userPref.notification_topics) {
        return userPref.notification_topics[payload.topic] !== false
      }
      
      return true
    })

    if (enabledUserIds.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No users with push notifications enabled' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Fetch subscriptions for enabled users
    const { data: subscriptions, error: fetchError } = await supabase
      .from('push_subscriptions')
      .select('*')
      .in('user_id', enabledUserIds)
    
    if (fetchError) {
      console.error('Error fetching subscriptions:', fetchError)
      return new Response(
        JSON.stringify({ error: 'Failed to fetch subscriptions' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!subscriptions || subscriptions.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No push subscriptions found for target users' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Record this notification in the database for history/tracking
    if (user) {
      await supabase.from('notifications').insert({
        user_id: user.id,
        title: payload.title,
        body: payload.body,
        data: payload.data,
        sent_at: new Date().toISOString(),
        read: false
      })
    }
    
    // Update last_used timestamp for all subscriptions that received this notification
    if (subscriptions.length > 0) {
      const endpoints = subscriptions.map(sub => sub.endpoint);
      await supabase
        .from('push_subscriptions')
        .update({ last_used: new Date().toISOString() })
        .in('endpoint', endpoints);
    }

    // Prepare notification payload
    const notificationPayload = JSON.stringify({
      title: payload.title,
      body: payload.body,
      icon: payload.icon || '/icons/icon-512x512.png',
      badge: payload.badge || '/icons/badge-128x128.png',
      image: payload.image,
      url: payload.url || '/',
      data: payload.data || {},
      actions: payload.actions || [],
      tag: payload.tag,
      timestamp: new Date().getTime()
    })

    // Apply rate limiting
    const processedNotification = await rateLimiter.processNotification(
      enabledUserIds,
      payload.title,
      payload.body,
      payload.topic,
      payload.data
    )
    
    // If rate limiting prevents sending, log it and return
    if (!processedNotification.shouldSend) {
      await supabase.from('notification_logs').insert({
        user_id: enabledUserIds[0],
        title: payload.title,
        body: payload.body,
        topic: payload.topic,
        sent_at: new Date().toISOString(),
        success_count: 0,
        failure_count: 0,
        rate_limited: true
      })
      
      return new Response(
        JSON.stringify({ error: 'Notification rate limited' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    
    // Use the potentially modified notification content (for combined notifications)
    const finalTitle = processedNotification.title
    const finalBody = processedNotification.body
    const finalData = {
      ...payload.data,
      ...processedNotification.data
    }

    // Send notifications to all subscriptions
    const results = await Promise.all(
      subscriptions.map(async (subscription) => {
        try {
          // Format subscription object for web-push
          const pushSubscription = {
            endpoint: subscription.endpoint,
            keys: {
              p256dh: subscription.p256dh,
              auth: subscription.auth
            }
          }

          // Send the notification
          await webPush.sendNotification(pushSubscription, JSON.stringify({
            title: finalTitle,
            body: finalBody,
            icon: payload.icon || '/icons/icon-512x512.png',
            badge: payload.badge || '/icons/badge-128x128.png',
            image: payload.image,
            url: payload.url || '/',
            data: finalData,
            actions: payload.actions || [],
            tag: payload.tag,
            timestamp: new Date().getTime()
          }))
          return { success: true, endpoint: subscription.endpoint }
        } catch (error) {
          console.error(`Error sending notification to ${subscription.endpoint}:`, error)
          
          // Validate subscription and clean up if needed
          if (error.statusCode === 410) { // Gone - subscription is no longer valid
            console.log(`Subscription ${subscription.endpoint} is no longer valid, removing...`);
            await supabase.from('push_subscriptions').delete().eq('endpoint', subscription.endpoint);
          }
          return {
            success: false,
            endpoint: subscription.endpoint,
            error: error.message
          }
        }
      })
    )

    // Count successful deliveries
    const successful = results.filter(result => result.success).length

    // Return results
    return new Response(
      JSON.stringify({
        message: `Sent push notifications to ${successful} of ${subscriptions.length} devices`,
        results: {
          total: subscriptions.length,
          successful,
          failed: subscriptions.length - successful
        }
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error processing push notification:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
