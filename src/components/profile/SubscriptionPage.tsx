import React, { useState } from 'react';
import { Star, Rocket, Check, X, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate, useParams } from 'react-router-dom';
import '../../styles/subscription-page.css';
import StripeCheckout from '../payments/StripeCheckout';

interface SubscriptionPageProps {
  // Props can be added if needed
}

const SubscriptionPage: React.FC<SubscriptionPageProps> = () => {
  const [selectedTier, setSelectedTier] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const navigate = useNavigate();
  const { username } = useParams<{ username: string }>();
  
  // Removed handleSubscribe function since we now use StripeCheckout component
  
  const handleGoBack = () => {
    navigate(-1); // Go back to previous page
  };

  return (
    <div className="subscription-page">
      {/* Cosmic background with stars and nebula */}
      <div className="cosmic-background">
        <div className="stars"></div>
        <div className="nebula-1"></div>
        <div className="nebula-2"></div>
      </div>
      
      {/* Content */}
      <div className="subscription-container">
        <div className="subscription-card">
          <div className="back-button" onClick={handleGoBack}>
            <ArrowLeft />
            <span>Back</span>
          </div>
          
          <h1 className="subscription-title">
            <span className="glow">Subscribe to {username}</span>
          </h1>
          
          <p className="subscription-description">
            Subscribe to {username} to unlock Squad Chat access, bonus Clipt Coins & exclusive cosmic content
          </p>
          
          <div className="token-system-info">
            <h3>Clipt Coins Token System</h3>
            <p>Clipt Coins are the in-app currency used to boost your content's visibility and access premium features</p>
          </div>
          
          {/* Subscription Tiers */}
          <div className="tiers-container">
            <button
              className={`tier-card ${selectedTier === 'pro' ? 'selected-pro' : ''}`}
              onClick={() => setSelectedTier('pro')}
            >
              <div className="tier-header">
                <div className="tier-title">
                  <Star className="tier-icon pro-icon" />
                  <h3>Pro Tier</h3>
                </div>
                <div className="tier-price">
                  $4.99<span>/mo</span>
                </div>
              </div>
              
              <p className="tier-description">Enhanced cosmic experience</p>
              
              <div className="tier-features">
                <ul>
                  <li><strong>20 tokens/day</strong> (10 more than free)</li>
                  <li><strong>400 token wallet cap</strong></li> 
                  <li><strong>+100 bonus tokens</strong> monthly</li>
                  <li>10% off all boosts</li>
                  <li>Access to exclusive Clipt Channels</li>
                  <li>Fewer ads</li>
                  <li>1 free Squad Blast per week</li>
                  <li>Access to all subscriber Squad Chats</li>
                </ul>
              </div>
              
              {selectedTier === 'pro' && (
                <div className="selected-check">
                  <Check />
                </div>
              )}
            </button>
            
            <button
              className={`tier-card ${selectedTier === 'maxed' ? 'selected-maxed' : ''}`}
              onClick={() => setSelectedTier('maxed')}
            >
              <div className="tier-header">
                <div className="tier-title">
                  <Rocket className="tier-icon maxed-icon" />
                  <h3>Maxed Tier</h3>
                </div>
                <div className="tier-price">
                  $14.99<span>/mo</span>
                </div>
              </div>
              
              <p className="tier-description">Ultimate cosmic experience</p>
              
              <div className="tier-features">
                <ul>
                  <li><strong>30 tokens/day</strong> (20 more than free)</li>
                  <li><strong>800 token wallet cap</strong></li>
                  <li><strong>+300 bonus tokens</strong> monthly</li>
                  <li>25% off all boosts</li>
                  <li>Priority ranking & premium visibility</li>
                  <li>1 free boost of your choice weekly</li>
                  <li>Ad-free experience</li>
                  <li>Streamer vault access & early features</li>
                  <li>Access to all subscriber Squad Chats</li>
                </ul>
              </div>
              
              {selectedTier === 'maxed' && (
                <div className="selected-check">
                  <Check />
                </div>
              )}
            </button>
          </div>
          
          {selectedTier ? (
            <StripeCheckout 
              tier={selectedTier as 'pro' | 'maxed'}
              streamerUsername={username || ''}
              onSuccess={() => {
                // Update user token limits based on tier
                const tokenBonus = selectedTier === 'pro' ? 100 : 300;
                const newDailyCap = selectedTier === 'pro' ? 20 : 30;
                const newWalletCap = selectedTier === 'pro' ? 400 : 800;
                
                // Show success message
                toast.success(
                  `Subscribed to ${username} with ${selectedTier === 'pro' ? 'Pro' : 'Maxed'} tier!`,
                  {
                    description: `You've been granted ${tokenBonus} bonus tokens and your daily cap is now ${newDailyCap} tokens!`,
                    duration: 5000
                  }
                );
                
                // Navigate back to profile
                navigate(`/profile/${username}`);
              }}
              onCancel={() => {
                toast.error('Subscription canceled');
              }}
            />
          ) : (
            <button
              className="subscribe-button disabled"
              disabled
            >
              Select a Tier
            </button>
          )}
          
          <div className="subscription-details">
            <small>Your subscription will be billed monthly. Cancel anytime.</small>
            <small>Subscribing grants you access to {username}'s exclusive content and squad chat.</small>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionPage;
