/**
 * Stripe utilities for client-side Stripe operations
 */
import { loadStripe } from '@stripe/stripe-js';

// Initialize Stripe with the publishable key
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUB);

/**
 * Get the appropriate price ID based on subscription tier
 * @param {('pro'|'maxed')} tier - The subscription tier
 * @returns {string} The Stripe price ID
 */
export const getPriceIdByTier = (tier) => {
  return tier === 'pro' 
    ? import.meta.env.VITE_STRIPE_PRO_PRICE_ID 
    : import.meta.env.VITE_STRIPE_MAXED_PRICE_ID;
};

/**
 * Creates a checkout session for subscription
 * @param {Object} params - Checkout parameters
 * @param {('pro'|'maxed')} params.tier - Subscription tier
 * @param {string} [params.streamerUsername] - Streamer username for subscription
 * @param {string} [params.customerId] - Existing customer ID if available
 * @returns {Promise<{sessionId: string}>} The checkout session ID
 */
export const createCheckoutSession = async ({ tier, streamerUsername, customerId }) => {
  const priceId = getPriceIdByTier(tier);
  
  try {
    const response = await fetch('/api/create-checkout-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tier,
        streamerUsername,
        customerId,
        priceId
      }),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Error creating checkout session');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error creating checkout session:', error);
    throw error;
  }
};

/**
 * Redirects to Stripe Checkout with the given session ID
 * @param {string} sessionId - Stripe Checkout session ID
 * @returns {Promise<{error?: Error}>} Result of the redirect
 */
export const redirectToCheckout = async (sessionId) => {
  try {
    const stripe = await stripePromise;
    if (!stripe) throw new Error('Stripe failed to load');
    
    const result = await stripe.redirectToCheckout({ sessionId });
    
    if (result.error) {
      throw new Error(result.error.message);
    }
    
    return {};
  } catch (error) {
    console.error('Error redirecting to checkout:', error);
    return { error };
  }
};

export default {
  getPriceIdByTier,
  createCheckoutSession,
  redirectToCheckout,
};
