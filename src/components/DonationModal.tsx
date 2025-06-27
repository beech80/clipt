import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faDollarSign } from '@fortawesome/free-solid-svg-icons';
import { useToast } from "../components/ui/use-toast";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { loadStripe } from '@stripe/stripe-js';

interface DonationModalProps {
  isOpen: boolean;
  onClose: () => void;
  streamerName?: string;
}

const DonationModal = ({ isOpen, onClose, streamerName = 'this streamer' }: DonationModalProps) => {
  const [amount, setAmount] = useState<string>('5');
  const [message, setMessage] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const donationAmounts = ['1', '5', '10', '20', '50'];

  const handleAmountSelect = (value: string) => {
    setAmount(value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // Create a Stripe checkout session for donation
      const response = await fetch('/api/create-donation-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: parseFloat(amount),
          streamerName,
          message
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to create donation session');
      }
      
      const { sessionId } = await response.json();
      
      // Load Stripe and redirect to checkout
      const stripe = await loadStripe(import.meta.env.VITE_STRIPE_PUB);
      if (!stripe) {
        throw new Error('Failed to load Stripe');
      }
      
      // Redirect to Stripe checkout
      const { error } = await stripe.redirectToCheckout({ sessionId });
      if (error) {
        throw error;
      }
      
      // This will only execute if the redirect fails
      toast({
        title: "Redirecting to payment...",
        description: `Preparing your $${amount} donation to ${streamerName}`,
      });
    } catch (error) {
      console.error('Donation error:', error);
      toast({
        variant: "destructive",
        title: "Donation Failed",
        description: error.message || "There was an error processing your donation",
      });
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/60 backdrop-blur-sm" 
      onClick={onClose}
      style={{ animation: 'fadeIn 0.2s ease-out' }}
    >
      <div 
        className="max-w-md w-full mx-4 bg-gray-900 rounded-xl border border-orange-500/50 shadow-xl" 
        onClick={e => e.stopPropagation()}
        style={{ 
          animation: 'slideUpFade 0.3s ease-out forwards',
          transform: 'translateY(0)'
        }}
      >
        <div className="p-6">
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-white bg-gray-800 rounded-full w-8 h-8 flex items-center justify-center"
          >
            <FontAwesomeIcon icon={faTimes} />
          </button>
        
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-orange-600/20 rounded-full mb-3">
              <FontAwesomeIcon icon={faDollarSign} className="text-orange-500 text-2xl" />
            </div>
            <h2 className="text-xl font-semibold text-white">Support {streamerName}</h2>
            <p className="text-gray-400 text-sm mt-1">Your donation helps keep the content coming!</p>
          </div>
          
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-200 mb-2">Select Amount</label>
              <div className="grid grid-cols-5 gap-2 mb-3">
                {donationAmounts.map((value) => (
                  <button
                    key={value}
                    type="button"
                    className={`py-2 rounded-md text-center font-medium ${
                      amount === value
                        ? "bg-orange-600 text-white"
                        : "bg-gray-800 text-gray-300 hover:bg-gray-700"
                    } transform hover:scale-105 active:scale-100 transition`}
                    onClick={() => handleAmountSelect(value)}
                  >
                    ${value}
                  </button>
                ))}
              </div>
              
              <div className="mt-3">
                <label className="block text-sm font-medium text-gray-200 mb-2">Custom Amount</label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-gray-400">$</span>
                  <Input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="pl-8 pr-4 py-2 w-full bg-gray-800 border border-gray-700 rounded-md text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    min="1"
                    step="any"
                  />
                </div>
              </div>
            </div>
            
            <div className="mb-5">
              <label className="block text-sm font-medium text-gray-200 mb-2">Message (Optional)</label>
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Add a message to your donation..."
                className="w-full p-2 bg-gray-800 border border-gray-700 text-white rounded-md focus:ring-2 focus:ring-orange-500 focus:border-transparent h-24 resize-none"
              />
            </div>
            
            <Button
              type="submit"
              className="w-full bg-orange-600 hover:bg-orange-700 text-white py-3 rounded-md transition-colors transform hover:scale-102 active:scale-98"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Processing..." : `Donate $${amount}`}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default DonationModal;
