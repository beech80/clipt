import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Button } from './ui/button';
import { Check, ExternalLink, RefreshCw } from 'lucide-react';

interface ConnectStripeButtonProps {
  streamerId: string;
  streamerName: string;
  streamerEmail?: string;
  className?: string;
}

interface StripeAccountStatus {
  connected: boolean;
  isActive?: boolean;
  status?: string;
  accountId?: string;
  details?: {
    chargesEnabled: boolean;
    payoutsEnabled: boolean;
    requiresSetup: boolean;
    businessProfile?: {
      name?: string;
    };
  };
}

/**
 * Production-ready Stripe Connect Button for streamers
 * Allows creators to connect their Stripe accounts to receive direct payouts
 */
export default function ConnectStripeButton({
  streamerId,
  streamerName,
  streamerEmail,
  className = '',
}: ConnectStripeButtonProps) {
  const [loading, setLoading] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(true);
  const [accountStatus, setAccountStatus] = useState<StripeAccountStatus | null>(null);

  // Check if the streamer already has a connected account on component mount
  useEffect(() => {
    if (streamerId) {
      checkConnectStatus();
    } else {
      setCheckingStatus(false);
    }
  }, [streamerId]);

  // Function to check if streamer already has a Stripe Connect account
  const checkConnectStatus = async () => {
    if (!streamerId) {
      setCheckingStatus(false);
      return;
    }
    
    try {
      setCheckingStatus(true);
      
      // Get base URL from window location - ensures working in both dev and production
      const baseUrl = window.location.origin;
      const apiUrl = `${baseUrl}/api/check-connect-status`;
      console.log('Checking connection status at:', apiUrl);
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ streamerId })
      });
      
      if (!response.ok) {
        // Non-critical error, we'll assume not connected
        console.error('Error checking Stripe connection status');
        setAccountStatus({ connected: false });
        return;
      }
      
      const status = await response.json();
      setAccountStatus(status);
    } catch (error) {
      console.error('Failed to check Stripe connection:', error);
      setAccountStatus({ connected: false });
    } finally {
      setCheckingStatus(false);
    }
  };

  // Connect a new Stripe account or complete onboarding for existing account
  const handleConnectStripe = async () => {
    if (!streamerId) {
      toast.error('Unable to connect: Missing streamer information');
      return;
    }
    
    try {
      setLoading(true);
      toast.loading('Connecting to Stripe...', { id: 'stripe-connect' });

      // Get base URL from window location - ensures working in both dev and production
      const baseUrl = window.location.origin;
      const apiUrl = `${baseUrl}/api/create-connect-account`;
      console.log('Creating connect account at:', apiUrl);
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          streamerId,
          streamerName,
          streamerEmail,
        }),
      });

      if (!response.ok) {
        // Handle error response safely
        let errorMessage = `Error (${response.status})`;
        try {
          const errorData = await response.clone().json();
          errorMessage = errorData.error || errorData.message || errorMessage;
        } catch (e) {
          // If we can't parse JSON, try text
          try {
            errorMessage = await response.text();
          } catch (textError) {
            // If all else fails, use status code
            errorMessage = `HTTP error ${response.status}`;
          }
        }
        
        toast.error(`Connection failed: ${errorMessage}`, { id: 'stripe-connect' });
        return;
      }

      const data = await response.json();
      
      if (data.url) {
        toast.success('Success! Redirecting to Stripe...', { id: 'stripe-connect' });
        // Add short delay to show success message before redirect
        setTimeout(() => {
          window.location.href = data.url;
        }, 1000);
      } else {
        toast.error('Error: Missing onboarding URL', { id: 'stripe-connect' });
      }
    } catch (error) {
      console.error('Stripe Connect error:', error);
      toast.error(`Connection error: ${error.message || 'Unknown error'}`, { id: 'stripe-connect' });
    } finally {
      setLoading(false);
    }
  };

  // Refresh connection status
  const handleRefreshStatus = () => {
    checkConnectStatus();
    toast.info('Refreshing connection status...');
  };

  // Show loading state while checking status
  if (checkingStatus) {
    return (
      <Button 
        className={`bg-gray-500 text-white ${className}`}
        disabled
      >
        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
        Checking Status...
      </Button>
    );
  }

  // Connected and active - show connected state
  if (accountStatus?.connected && accountStatus?.isActive) {
    return (
      <Button
        className={`bg-green-600 hover:bg-green-700 text-white ${className}`}
        onClick={handleRefreshStatus}
      >
        <Check className="mr-2 h-4 w-4" />
        Connected to Stripe
      </Button>
    );
  }
  
  // Connected but setup not complete
  if (accountStatus?.connected && !accountStatus?.isActive) {
    return (
      <Button 
        className={`bg-amber-500 hover:bg-amber-600 text-white ${className}`}
        onClick={handleConnectStripe}
      >
        <ExternalLink className="mr-2 h-4 w-4" />
        Complete Stripe Setup
      </Button>
    );
  }

  // Not connected - show connect button
  return (
    <Button 
      className={`bg-gradient-to-r from-orange-500 to-orange-400 hover:from-orange-600 hover:to-orange-500 text-white ${className}`}
      onClick={handleConnectStripe}
      disabled={loading}
    >
      {loading ? 'Connecting...' : 'Connect with Stripe'}
    </Button>
  );
}
