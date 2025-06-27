// @ts-check
import { createClient } from '@supabase/supabase-js';
import webpush from 'web-push';

/**
 * @param {import('@vercel/node').VercelRequest} req
 * @param {import('@vercel/node').VercelResponse} res
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    // Get notification data from request
    const { 
      userId, 
      title, 
      body, 
      icon, 
      url, 
      image, 
      actions 
    } = req.body;

    // Validate required parameters
    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    if (!title || !body) {
      return res.status(400).json({ error: 'Notification title and body are required' });
    }

    // Initialize Supabase client
    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return res.status(500).json({ error: 'Supabase credentials not configured' });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Configure webpush with VAPID keys
    const vapidPublicKey = process.env.VITE_VAPID_PUBLIC_KEY || process.env.VAPID_PUBLIC_KEY;
    const vapidPrivateKey = process.env.VITE_VAPID_PRIVATE_KEY || process.env.VAPID_PRIVATE_KEY;
    
    if (!vapidPublicKey || !vapidPrivateKey) {
      return res.status(500).json({ error: 'VAPID keys not configured' });
    }
    
    webpush.setVapidDetails(
      'mailto:notifications@clipt.com', // Replace with your contact email
      vapidPublicKey,
      vapidPrivateKey
    );

    // Fetch subscriptions for the user from database
    const { data: subscriptions, error } = await supabase
      .from('push_subscriptions')
      .select('*')
      .eq('user_id', userId);

    if (error) {
      console.error('Error fetching subscriptions:', error);
      return res.status(500).json({ error: 'Failed to fetch subscriptions' });
    }

    if (!subscriptions || subscriptions.length === 0) {
      return res.status(404).json({ message: 'No push subscriptions found for this user' });
    }

    // Prepare the notification payload
    const payload = JSON.stringify({
      title,
      body,
      icon: icon || '/icons/icon-512x512.png',
      url: url || '/',
      image,
      actions,
      timestamp: new Date().getTime()
    });

    // Send notifications to all subscriptions
    const pushPromises = subscriptions.map(async (subscription) => {
      try {
        // Format subscription object for web-push
        const pushSubscription = {
          endpoint: subscription.endpoint,
          keys: {
            p256dh: subscription.p256dh,
            auth: subscription.auth
          }
        };

        // Send the notification
        await webpush.sendNotification(pushSubscription, payload);
        return { success: true, endpoint: subscription.endpoint };
      } catch (error) {
        console.error(`Error sending notification to ${subscription.endpoint}:`, error);
        
        // Check if this is an expired subscription
        if (error.statusCode === 404 || error.statusCode === 410) {
          // Delete the expired subscription
          await supabase
            .from('push_subscriptions')
            .delete()
            .eq('endpoint', subscription.endpoint);
          
          return { 
            success: false, 
            endpoint: subscription.endpoint, 
            error: 'Subscription expired and was removed'
          };
        }
        
        return { 
          success: false, 
          endpoint: subscription.endpoint, 
          error: error.message 
        };
      }
    });

    // Wait for all notifications to be sent
    const results = await Promise.all(pushPromises);
    const successful = results.filter(result => result.success).length;

    // Return success response
    return res.status(200).json({
      message: `Sent push notifications to ${successful} of ${subscriptions.length} devices`,
      results
    });
  } catch (error) {
    console.error('Error processing push notification:', error);
    return res.status(500).json({ error: 'Failed to send push notification' });
  }
}
