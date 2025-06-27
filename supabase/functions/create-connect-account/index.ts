import { createClient } from '@supabase/supabase-js';
import { serve } from 'std/http/server';
import { corsHeaders } from '../_shared/cors';
import Stripe from 'stripe';

// Initialize Stripe
const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2023-10-16',
});

// Create Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

export const supabase = createClient(supabaseUrl, supabaseServiceKey);

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  
  try {
    // Parse the request body
    const { streamerId, streamerName, streamerEmail } = await req.json();

    if (!streamerId) {
      return new Response(
        JSON.stringify({ error: 'Streamer ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if user has an existing Connect account in the database
    let stripeAccountId;
    const { data: streamerData, error: dbError } = await supabase
      .from('stripe_connect_accounts')
      .select('account_id')
      .eq('user_id', streamerId)
      .maybeSingle();
    
    if (dbError) {
      console.error('Database error:', dbError);
    } else if (streamerData?.account_id) {
      stripeAccountId = streamerData.account_id;
      console.log(`Found existing account ${stripeAccountId} for streamer ${streamerId}`);
    }
    
    // Create a Connect account or retrieve it
    let account;
    if (stripeAccountId) {
      try {
        // Retrieve existing account
        account = await stripe.accounts.retrieve(stripeAccountId);
      } catch (error) {
        console.error('Error retrieving Stripe account:', error);
        stripeAccountId = null; // Reset if account doesn't exist
      }
    }

    if (!stripeAccountId) {
      // Create a new Connect account
      account = await stripe.accounts.create({
        type: 'standard',
        metadata: {
          streamerId,
        },
        email: streamerEmail,
        business_profile: {
          name: streamerName || 'Clipt Creator',
        },
      });
      
      // Store the account ID in the database
      const { error: insertError } = await supabase
        .from('stripe_connect_accounts')
        .insert({
          user_id: streamerId,
          account_id: account.id,
          created_at: new Date().toISOString(),
          account_status: account.details_submitted ? 'completed' : 'pending',
        });
      
      if (insertError) {
        console.error('Error saving account ID:', insertError);
      }
      
      console.log(`Created account ${account.id} for streamer ${streamerId}`);
    }

    // Get the request origin for redirect URLs
    const origin = req.headers.get('origin') || 'https://your-default-domain.com';

    // Create an account link for onboarding
    const accountLink = await stripe.accountLinks.create({
      account: account.id,
      refresh_url: `${origin}/onboarding/refresh?accountId=${account.id}`,
      return_url: `${origin}/streamer-dashboard?setup=complete`,
      type: 'account_onboarding',
    });

    // Return the account link URL
    return new Response(
      JSON.stringify({ 
        url: accountLink.url,
        accountId: account.id 
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  } catch (error) {
    console.error('Error creating Connect account:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to create Connect account',
        message: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
