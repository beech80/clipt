// @ts-check
import Stripe from 'stripe';
import { buffer } from 'micro';

/**
 * @param {import('@vercel/node').VercelRequest} req
 * @param {import('@vercel/node').VercelResponse} res
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).end('Method Not Allowed');
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
    apiVersion: '2023-10-16',
  });

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    return res.status(500).json({ error: 'Webhook secret not configured' });
  }

  // Parse the request body
  let event;
  try {
    const rawBody = await buffer(req);
    const signature = req.headers['stripe-signature'];

    try {
      event = stripe.webhooks.constructEvent(
        rawBody,
        signature,
        webhookSecret
      );
    } catch (err) {
      console.error(`⚠️  Webhook signature verification failed.`, err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  console.log(`Event type: ${event.type}`);
  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        // Check if this is a subscription or one-time payment
        if (session.mode === 'subscription') {
          await handleSubscriptionCheckout(session);
        } else if (session.mode === 'payment') {
          // Handle one-time payments (donations)
          await handleDonationCheckout(session);
        }
        break;
      }
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object;
        // Check if this is a donation payment
        if (paymentIntent.metadata?.donation === 'true') {
          await handleDonationSuccess(paymentIntent);
        }
        break;
      }
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object;
        await handleSubscriptionChange(subscription);
        break;
      }
      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        await handleSubscriptionDeletion(subscription);
        break;
      }
      case 'invoice.payment_succeeded': {
        const invoice = event.data.object;
        // Only handle subscription invoices
        if (invoice.subscription) {
          await handleSuccessfulPayment(invoice);
        }
        break;
      }
      case 'invoice.payment_failed': {
        const invoice = event.data.object;
        if (invoice.subscription) {
          await handleFailedPayment(invoice);
        }
        break;
      }
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    // Return success response
    return res.status(200).json({ received: true });
  } catch (err) {
    console.error(`Error processing webhook: ${err.message}`);
    return res.status(500).json({ error: 'Webhook handler failed' });
  }
}

async function handleDonationCheckout(session) {
  console.log('Processing donation checkout:', session.id);
  
  // Extract donation metadata
  const { streamerName, message, amount } = session.metadata || {};
  
  if (!streamerName) {
    console.log('No streamer name provided in donation metadata');
    return;
  }
  
  console.log(`Donation to ${streamerName}: $${amount} - Message: ${message || 'None'}`);
  
  // TODO: Record the donation in your database
  // Example: await db.recordDonation({
  //   stripeSessionId: session.id,
  //   customerId: session.customer,
  //   streamerName,
  //   amount: parseFloat(amount || '0'),
  //   message: message || '',
  //   timestamp: new Date()
  // });
  
  // TODO: Update the streamer's donation stats
  // Example: await db.updateStreamerDonations(streamerName, parseFloat(amount || '0'));
  
  // TODO: Trigger any real-time notifications via websockets, etc.
}

async function handleDonationSuccess(paymentIntent) {
  console.log('Processing successful donation:', paymentIntent.id);
  
  // Extract donation metadata
  const { streamerName, message } = paymentIntent.metadata || {};
  const amount = paymentIntent.amount / 100; // Convert from cents to dollars
  
  console.log(`Confirmed donation to ${streamerName}: $${amount} - Message: ${message || 'None'}`);
  
  // TODO: Update donation status to confirmed in your database
  // Example: await db.confirmDonation(paymentIntent.id, true);
}

async function handleSubscriptionCheckout(session) {
  console.log('Processing subscription checkout:', session.id);
  // TODO: Update the user's subscription status in your database
  // const userId = session.client_reference_id or session.customer;
  // const priceId = session.line_items.data[0].price.id;
  
  // Example: await db.updateUserSubscription(userId, priceId, true);
}

async function handleSubscriptionChange(subscription) {
  console.log('Processing subscription change:', subscription.id);
  // TODO: Update the user's subscription plan in your database
  // const customerId = subscription.customer;
  // const status = subscription.status;
  // const priceId = subscription.items.data[0].price.id;
  
  // Example: await db.updateSubscriptionStatus(customerId, status, priceId);
}

async function handleSubscriptionDeletion(subscription) {
  console.log('Processing subscription deletion:', subscription.id);
  // TODO: Update the user's subscription status in your database
  // const customerId = subscription.customer;
  
  // Example: await db.cancelUserSubscription(customerId);
}

async function handleSuccessfulPayment(invoice) {
  console.log('Processing successful payment:', invoice.id);
  // TODO: Update the user's payment status and subscription validity
  // const customerId = invoice.customer;
  // const invoiceStatus = invoice.status;
  
  // Example: await db.updateUserPaymentStatus(customerId, invoiceStatus, true);
  // Example: await db.updateUserTokens(customerId, additionalTokens);
}

async function handleFailedPayment(invoice) {
  console.log('Processing failed payment:', invoice.id);
  // TODO: Update the user's payment status
  // const customerId = invoice.customer;
  // const invoiceStatus = invoice.status;
  
  // Example: await db.updateUserPaymentStatus(customerId, invoiceStatus, false);
}

// This is needed to parse the raw body as a buffer
export const config = {
  api: {
    bodyParser: false,
  },
};
