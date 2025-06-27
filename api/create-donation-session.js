// @ts-check
import Stripe from 'stripe';

/**
 * @param {import('@vercel/node').VercelRequest} req
 * @param {import('@vercel/node').VercelResponse} res
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { amount, streamerName, streamerId, message, email } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Valid amount is required' });
    }

    if (!streamerId) {
      return res.status(400).json({ error: 'Streamer ID is required' });
    }

    // Convert amount to cents for Stripe (needs to be an integer)
    const amountInCents = Math.round(amount * 100);

    // Initialize Stripe with secret key (stored securely in environment variables)
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
      apiVersion: '2023-10-16',
    });

    // Create a new customer or use existing one if email is provided
    let customer;
    if (email) {
      // Try to find existing customer
      const customerData = await stripe.customers.create({
        email: email,
        metadata: {
          streamerId: streamerId
        }
      });
      customer = customerData.id;
    }
    
    // Look up the streamer's connected account in your database
    // This is a placeholder - you'll need to implement the database query
    // to fetch the stripe_account_id for the given streamerId
    let stripeAccountId = null;
    
    try {
      // Placeholder for database lookup
      // Replace this with your actual database query
      // Example: const streamer = await db.collection('streamers').findOne({ id: streamerId });
      // if (streamer && streamer.stripe_account_id) stripeAccountId = streamer.stripe_account_id;
      
      // For testing, we'll try to find the account from Stripe directly using metadata
      const accounts = await stripe.accounts.list({
        limit: 100,
      });
      
      const connectedAccount = accounts.data.find(acc => 
        acc.metadata && acc.metadata.streamerId === streamerId
      );
      
      if (connectedAccount) {
        stripeAccountId = connectedAccount.id;
      }
    } catch (error) {
      console.error('Error finding connected account:', error);
      // Continue with platform account if we can't find the connected account
    }
    
    // Calculate platform fee (e.g., 10% of the donation)
    const platformFeePercent = 10;
    const platformFeeAmount = Math.round(amountInCents * (platformFeePercent / 100));
    
    // Create Stripe checkout session
    const sessionOptions = {
      payment_method_types: ['card'],
      mode: 'payment',
      customer: customer,
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `Donation to ${streamerName || 'Streamer'}`,
              description: message ? `Message: ${message}` : 'Thank you for your support!'
            },
            unit_amount: amountInCents,
          },
          quantity: 1,
        },
      ],
      metadata: {
        streamerId: streamerId,
        streamerName: streamerName || 'Streamer',
        donationType: 'one-time',
        message: message || ''
      },
      success_url: `${req.headers.origin}?donation=success`,
      cancel_url: `${req.headers.origin}?donation=canceled`,
    };
    
    // If we have a connected account, use it for direct payout
    if (stripeAccountId) {
      // Direct payment to connected account with platform fee
      sessionOptions.payment_intent_data = {
        transfer_data: {
          destination: stripeAccountId,
        },
        application_fee_amount: platformFeeAmount,
      };
    }
    
    // Create the session with our options
    const session = await stripe.checkout.sessions.create(sessionOptions);

    // Return the session ID to the client
    return res.status(200).json({ sessionId: session.id });
  } catch (error) {
    console.error('Error creating donation session:', error);
    return res.status(500).json({ 
      error: 'Internal Server Error',
      message: error.message 
    });
  }
}
