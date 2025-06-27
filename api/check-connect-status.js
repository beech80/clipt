import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { streamerId } = req.body;

    if (!streamerId) {
      return res.status(400).json({ error: 'Streamer ID is required' });
    }

    console.log('API Environment check:', { 
      hasSupabaseUrl: !!process.env.SUPABASE_URL,
      hasSupabaseKey: !!process.env.SUPABASE_SERVICE_KEY,
    });
    
    // Initialize Supabase client - with fallbacks for development
    const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
    const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';
    
    if (!supabaseUrl || !supabaseKey) {
      console.error('Missing Supabase credentials');
      // Return a simple response without trying to connect to the database
      return res.status(200).json({ connected: false, error: 'api_configuration' });
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);

    // First check our database for existing account
    const { data: accountData, error: dbError } = await supabase
      .from('stripe_connect_accounts')
      .select('*')
      .eq('user_id', streamerId)
      .single();

    if (dbError && dbError.code !== 'PGRST116') { // Not a "no rows returned" error
      console.error('Database error:', dbError);
      return res.status(500).json({ error: 'Failed to check account status' });
    }

    // If we have an account ID in our database, verify with Stripe
    if (accountData?.account_id) {
      // Initialize Stripe with secret key
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
        apiVersion: '2023-10-16',
      });

      try {
        // Get account details from Stripe
        const account = await stripe.accounts.retrieve(accountData.account_id);
        
        // Check if the account is fully onboarded
        const isActive = account.charges_enabled && account.payouts_enabled;
        const status = isActive ? 'active' : 'pending';
        
        // Update status in our database if it has changed
        if (status !== accountData.status) {
          await supabase
            .from('stripe_connect_accounts')
            .update({ 
              status: status,
              updated_at: new Date().toISOString()
            })
            .eq('user_id', streamerId);
        }

        return res.status(200).json({
          connected: true,
          isActive,
          status,
          accountId: account.id,
          details: {
            chargesEnabled: account.charges_enabled,
            payoutsEnabled: account.payouts_enabled,
            requiresSetup: !(account.details_submitted && account.charges_enabled),
            businessProfile: account.business_profile
          }
        });
      } catch (stripeError) {
        // Account not found or other Stripe error
        console.error('Stripe error:', stripeError);
        
        // If account not found on Stripe, remove from our DB
        if (stripeError.code === 'resource_missing') {
          await supabase
            .from('stripe_connect_accounts')
            .delete()
            .eq('user_id', streamerId);
            
          return res.status(200).json({ connected: false });
        }
        
        return res.status(500).json({ 
          error: 'Failed to retrieve account details',
          message: stripeError.message 
        });
      }
    }

    // No account found
    return res.status(200).json({ connected: false });
  } catch (error) {
    console.error('Error checking Connect status:', error);
    return res.status(500).json({ 
      error: 'Failed to check Connect status',
      message: error.message 
    });
  }
}
