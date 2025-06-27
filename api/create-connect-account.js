import Stripe from 'stripe';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { streamerId, streamerEmail, streamerName } = req.body;

    if (!streamerId) {
      return res.status(400).json({ error: 'Streamer ID is required' });
    }

    console.log('API Environment check:', {
      hasStripeKey: !!process.env.STRIPE_SECRET_KEY,
    });
    
    // Check for the Stripe secret key
    const stripeKey = process.env.STRIPE_SECRET_KEY || process.env.VITE_STRIPE_SECRET_KEY || '';
    if (!stripeKey) {
      console.error('Missing Stripe secret key');
      return res.status(500).json({ error: 'Invalid API configuration. Missing Stripe credentials.' });
    }
    
    // Initialize Stripe with secret key
    const stripe = new Stripe(stripeKey, {
      apiVersion: '2023-10-16',
    });

    // Create a Connect account or retrieve it if it exists
    let account;
    
    try {
      // Try to retrieve existing account using metadata
      const accounts = await stripe.accounts.list({
        limit: 1,
      });
      
      account = accounts.data.find(acc => 
        acc.metadata && acc.metadata.streamerId === streamerId
      );
    } catch (error) {
      // No existing account found
    }

    if (!account) {
      // Create a new Connect account
      account = await stripe.accounts.create({
        type: 'standard',
        metadata: {
          streamerId: streamerId
        },
        email: streamerEmail,
        business_profile: {
          name: streamerName || 'Clipt Creator'
        }
      });

      // Store the account.id in the database associated with the streamerId
      try {
        const { createClient } = await import('@supabase/supabase-js');
        
        // Create Supabase client
        const supabase = createClient(
          process.env.SUPABASE_URL,
          process.env.SUPABASE_SERVICE_KEY
        );
        
        // Store the account details
        const { data, error } = await supabase
          .from('stripe_connect_accounts')
          .upsert({
            user_id: streamerId,
            account_id: account.id,
            status: 'created',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }, { onConflict: 'user_id' });
          
        if (error) {
          console.error('Database error:', error);
          // Continue with the flow even if DB storage fails
        }
      } catch (dbError) {
        // Log but don't fail the request if database operations fail
        console.error('Database operation failed:', dbError);
      }
      
      console.log(`Created account ${account.id} for streamer ${streamerId}`);
    }

    // Create an account link for onboarding
    const accountLink = await stripe.accountLinks.create({
      account: account.id,
      refresh_url: `${req.headers.origin}/onboarding/refresh?accountId=${account.id}`,
      return_url: `${req.headers.origin}/streamer-dashboard?setup=complete`,
      type: 'account_onboarding',
    });

    // Return the account link URL
    return res.status(200).json({ 
      url: accountLink.url,
      accountId: account.id 
    });
  } catch (error) {
    console.error('Error creating Connect account:', error);
    return res.status(500).json({ 
      error: 'Failed to create Connect account',
      message: error.message 
    });
  }
}
