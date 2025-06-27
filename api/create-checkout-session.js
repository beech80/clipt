// @ts-check
import Stripe from 'stripe';

/**
 * @param {import('@vercel/node').VercelRequest} req
 * @param {import('@vercel/node').VercelResponse} res
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { tier, streamerUsername, customerId, priceId } = req.body;

  // Validate required parameters
  if (!tier || !priceId) {
    return res.status(400).json({ 
      error: 'Missing required parameters', 
      details: 'tier and priceId are required' 
    });
  }

  try {
    // Initialize Stripe with secret key (stored securely in environment variables)
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
      apiVersion: '2023-10-16',
    });

    // Create a customer if no customerId was provided
    let customer = customerId;
    if (!customer) {
      const customerData = await stripe.customers.create({
        metadata: { 
          streamerUsername: streamerUsername || '',
          tier
        }
      });
      customer = customerData.id;
    }

    // Get the domain URL from the request headers
    const origin = req.headers.origin || 'https://clipt.app';

    // Create the checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price: priceId,
        quantity: 1
      }],
      mode: 'subscription',
      customer: customer,
      client_reference_id: streamerUsername || '',
      success_url: `${origin}/profile/${streamerUsername || ''}?subscription=success&tier=${tier}`,
      cancel_url: `${origin}/subscription?canceled=true`,
      metadata: {
        tier,
        streamerUsername: streamerUsername || '',
        timestamp: new Date().toISOString()
      },
      allow_promotion_codes: true,
      billing_address_collection: 'auto',
      subscription_data: {
        metadata: {
          tier,
          streamerUsername: streamerUsername || ''
        },
        trial_period_days: process.env.STRIPE_TRIAL_DAYS ? parseInt(process.env.STRIPE_TRIAL_DAYS) : undefined
      }
    });

    // Return the session ID to the client
    return res.status(200).json({ sessionId: session.id });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    return res.status(500).json({ 
      error: 'Internal Server Error',
      message: error.message 
    });
  }
}
