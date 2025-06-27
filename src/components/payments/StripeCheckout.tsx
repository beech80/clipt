import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { createCheckoutSession, redirectToCheckout } from '../../lib/stripe';

// Stripe checkout component for handling subscription payments

interface StripeCheckoutProps {
  customerId?: string;
  tier: 'pro' | 'maxed';
  streamerUsername: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

const StripeCheckout: React.FC<StripeCheckoutProps> = ({ 
  customerId,
  tier, 
  streamerUsername,
  onSuccess,
  onCancel
}) => {
  const [isLoading, setIsLoading] = useState(false);

  // Determine price based on tier
  const price = tier === 'pro' ? '499' : '1499'; // in cents
  const priceDisplayed = tier === 'pro' ? '$4.99' : '$14.99';
  const tierName = tier === 'pro' ? 'Pro' : 'Maxed';

  const handleCheckout = async () => {
    setIsLoading(true);
    
    try {
      // Log checkout attempt
      console.log(`Creating Stripe checkout for ${tierName} tier (${priceDisplayed}/mo)`);
      
      try {
        // Create a checkout session using our utility
        const { sessionId } = await createCheckoutSession({
          tier,
          streamerUsername,
          customerId
        });
        
        // Redirect to Stripe checkout
        const { error } = await redirectToCheckout(sessionId);
        
        if (error) {
          throw error;
        }
      } catch (apiError) {
        // For development: fallback to simulation if API fails
        if (!import.meta.env.PROD) {
          console.log('Falling back to simulated checkout - connect to real backend in production');
          
          // Simulate successful checkout
          setTimeout(() => {
            setIsLoading(false);
            toast.success('Subscription successful! (SIMULATED)', {
              description: `You're now subscribed to ${streamerUsername} with ${tierName} tier!`,
              duration: 5000
            });
            
            if (onSuccess) onSuccess();
          }, 2000);
          
          // Exit the function early
          return;
        } else {
          // In production, propagate the error
          throw apiError;
        }
      }
    } catch (error) {
      console.error('Error during checkout:', error);
      setIsLoading(false);
      
      toast.error('Checkout failed', {
        description: 'There was an issue processing your payment. Please try again.',
        duration: 5000
      });
      
      // Call cancel callback
      if (onCancel) onCancel();
    }
  };
  
  return (
    <div className="stripe-checkout">
      <button
        className={`subscribe-button ${isLoading ? 'loading' : 'active'}`}
        disabled={isLoading}
        onClick={handleCheckout}
      >
        {isLoading ? (
          <>Processing Payment...</>
        ) : (
          <>Continue to Stripe Checkout • {priceDisplayed}/mo</>
        )}
      </button>
      
      <div className="mt-4 text-center">
        <div className="flex items-center justify-center mb-2">
          <img 
            src="https://stripe.com/img/v3/home/social.png" 
            alt="Stripe" 
            className="h-5 mr-2" 
          />
          <span className="text-sm text-gray-300">Secure payment by Stripe</span>
        </div>
        <p className="text-xs text-gray-400">
          Your subscription will be processed securely through Stripe. 
          Your card information is never stored on our servers.
        </p>
      </div>
    </div>
  );
};

export default StripeCheckout;
