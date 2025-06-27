// @ts-check
import { createClient } from '@supabase/supabase-js';

/**
 * API endpoint to handle push subscription updates
 * @param {import('@vercel/node').VercelRequest} req
 * @param {import('@vercel/node').VercelResponse} res
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { oldSubscription, newSubscription } = req.body;
    
    // Initialize Supabase client
    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return res.status(500).json({ error: 'Supabase credentials not configured' });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Handle subscription update
    if (oldSubscription && oldSubscription.endpoint) {
      // Delete old subscription
      await supabase
        .from('push_subscriptions')
        .delete()
        .eq('endpoint', oldSubscription.endpoint);
    }
    
    if (newSubscription && newSubscription.endpoint) {
      // Get user info from auth header
      const authHeader = req.headers.authorization;
      let userId;
      
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        const { data } = await supabase.auth.getUser(token);
        userId = data?.user?.id;
      }
      
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized - User ID not found' });
      }
      
      // Add new subscription
      const { error } = await supabase.from('push_subscriptions').insert({
        user_id: userId,
        endpoint: newSubscription.endpoint,
        p256dh: newSubscription.keys.p256dh,
        auth: newSubscription.keys.auth
      });
      
      if (error) {
        console.error('Error updating subscription:', error);
        return res.status(500).json({ error: 'Failed to update subscription' });
      }
    }
    
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error updating push subscription:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
