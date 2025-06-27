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
    const { 
      amount, 
      streamerId, 
      streamerName, 
      donationType, 
      message = '', 
      customerId = null 
    } = await req.json();

    if (!amount || !streamerId) {
      return new Response(
        JSON.stringify({ error: 'Amount and streamer ID are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get the origin for success/cancel URLs
    const origin = req.headers.get('origin') || 'http://localhost:5173';
    const success_url = `${origin}/donation-success?session_id={CHECKOUT_SESSION_ID}`;
    const cancel_url = `${origin}/donation-cancel`;
    
    // Look up if streamer has a connected Stripe account
    const { data: connectAccount } = await supabase
      .from('stripe_connect_accounts')
      .select('account_id')
      .eq('user_id', streamerId)
      .eq('account_status', 'completed')
      .eq('charges_enabled', true)
      .single();
      
    const stripeAccountId = connectAccount?.account_id;
    
    console.log(`Streamer ${streamerId} ${stripeAccountId ? 'has' : 'does not have'} a connected Stripe account`);
    
    // Create or use customer
    let customer = customerId;
    if (!customer) {
      // Get user email from auth if possible
      const auth = req.headers.get('authorization');
      let userEmail = null;
      
      if (auth && auth.startsWith('Bearer ')) {
        const token = auth.substring(7);
        const { data: userData } = await supabase.auth.getUser(token);
        userEmail = userData?.user?.email;
      }
      
      const customerData = await stripe.customers.create({
        email: userEmail || undefined,
        metadata: {
          donation_type: donationType,
        }
      });
      
      customer = customerData.id;
    }
    
    // Amount sent from client is in whole dollars/currency, convert to cents for Stripe
    const amountInCents = Math.round(parseFloat(amount) * 100);
    
    // No platform fee - streamers keep 100%
    // Direct fund transfer - donations go directly to streamer's account
    
    // Create the checkout session options
    const sessionOptions = {
      payment_method_types: ['card'],
      mode: 'payment',
      customer,
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `${donationType || 'Donation'} to ${streamerName}`,
              description: message ? `Message: ${message}` : undefined,
            },
            unit_amount: amountInCents,
          },
          quantity: 1,
        },
      ],
      metadata: {
        streamerId,
        streamerName,
        donationType,
        message,
      },
      success_url,
      cancel_url,
    };
    
    // If streamer has a connected account, use destination charges
    if (stripeAccountId) {
      Object.assign(sessionOptions, {
        payment_intent_data: {
          transfer_data: {
            destination: stripeAccountId,
          },
          // No application fee - streamers keep 100%
        }
      });
    }
    
    // Create the checkout session
    const session = await stripe.checkout.sessions.create(sessionOptions);
    
    // Return the session ID and URL
    return new Response(
      JSON.stringify({ 
        sessionId: session.id, 
        url: session.url 
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
    
  } catch (error) {
    console.error('Error creating donation session:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to create donation session',
        message: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
