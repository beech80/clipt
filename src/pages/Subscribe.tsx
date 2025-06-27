import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Star, MessageSquare, Lock, Gift, Check, ArrowLeft, CreditCard, Shield } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const Subscribe = () => {
  const { streamerId } = useParams();
  const navigate = useNavigate();
  const [streamerDetails, setStreamerDetails] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvc, setCardCvc] = useState('');
  const [cardName, setCardName] = useState('');
  const [promoCode, setPromoCode] = useState('');
  const [promoApplied, setPromoApplied] = useState(false);
  const [discount, setDiscount] = useState(0);
  
  const subscriptionPrice = 4.99;
  const finalPrice = promoApplied ? (subscriptionPrice - discount).toFixed(2) : subscriptionPrice.toFixed(2);

  // Load streamer details
  useEffect(() => {
    const loadStreamerDetails = async () => {
      try {
        // For demo purposes, create mock streamer data if can't load from Supabase
        const mockStreamerData = {
          id: streamerId,
          username: 'CosmicStreamer',
          display_name: 'Cosmic Streamer',
          avatar_url: 'https://i.pravatar.cc/150?img=3',
          followers_count: 2548,
          subscriber_count: 342,
          bio: 'Gaming and streaming across the cosmos!'
        };
        
        setStreamerDetails(mockStreamerData);
        document.title = `Subscribe to ${mockStreamerData.username}`;
        
        // Try to load real data from Supabase if available
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', streamerId)
          .single();
          
        if (!error && data) {
          setStreamerDetails(data);
          document.title = `Subscribe to ${data.username}`;
        }
      } catch (err) {
        console.error('Error loading streamer details:', err);
        // Don't show error toast - we're using mock data as fallback
      } finally {
        setIsLoading(false);
      }
    };
    
    if (streamerId) {
      loadStreamerDetails();
    }
  }, [streamerId]);
  
  // Handle card number input formatting
  const handleCardNumberInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '');
    const formattedValue = value.replace(/(\d{4})(?=\d)/g, '$1 ').trim();
    setCardNumber(formattedValue.substring(0, 19)); // 16 digits + 3 spaces
  };
  
  // Handle card expiry input formatting
  const handleExpiryInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '');
    if (value.length <= 2) {
      setCardExpiry(value);
    } else {
      setCardExpiry(value.substring(0, 2) + '/' + value.substring(2, 4));
    }
  };
  
  // Handle promo code
  const applyPromoCode = () => {
    if (!promoCode) return;
    
    // Demo promo codes
    if (promoCode === 'CLIPT10') {
      setDiscount(1.00);
      setPromoApplied(true);
      toast.success('Promo code applied: $1.00 off');
    } else if (promoCode === 'SPACE25') {
      setDiscount(1.25);
      setPromoApplied(true);
      toast.success('Promo code applied: $1.25 off');
    } else {
      toast.error('Invalid promo code');
    }
  };
  
  // Handle subscription
  const handleSubscribe = async () => {
    // Basic validation
    if (!cardNumber || !cardExpiry || !cardCvc || !cardName) {
      toast.error('Please fill in all payment details');
      return;
    }
    
    if (cardNumber.replace(/\s/g, '').length !== 16) {
      toast.error('Please enter a valid card number');
      return;
    }
    
    if (cardExpiry.length !== 5) {
      toast.error('Please enter a valid expiry date (MM/YY)');
      return;
    }
    
    if (cardCvc.length !== 3) {
      toast.error('Please enter a valid CVC code');
      return;
    }
    
    setIsProcessing(true);
    
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error('You must be logged in to subscribe');
        return;
      }
      
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Create subscription record
      const subscription = {
        user_id: user.id,
        streamer_id: streamerId,
        subscription_type: 'monthly',
        price: parseFloat(finalPrice),
        is_active: true,
        started_at: new Date().toISOString(),
        next_billing_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        created_at: new Date().toISOString()
      };
      
      const { error } = await supabase
        .from('user_subscriptions')
        .insert(subscription);
        
      if (error) throw error;
      
      // Update streamer subscription count
      await supabase.rpc('increment_subscribers', { 
        creator_id: streamerId,
        amount: 1
      });
      
      // Success!
      toast.success('Subscription successful!');
      
      // Redirect to squad chat
      setTimeout(() => {
        navigate(`/squad-chat/${streamerId}`);
      }, 1000);
    } catch (err) {
      console.error('Error subscribing:', err);
      toast.error('Failed to process subscription');
    } finally {
      setIsProcessing(false);
    }
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f0224] to-[#1d0436] text-white p-4 md:p-8">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-center mb-8"
      >
        <h1 className="text-2xl md:text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-cyan-300">
          Subscribe to {isLoading ? 'Streamer' : streamerDetails?.username}
        </h1>
      </motion.div>
      
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column - Subscription Info */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-black/30 backdrop-blur-md rounded-xl border border-purple-500/30 overflow-hidden"
        >
          <div className="p-6">
            <h2 className="text-xl font-bold mb-4 flex items-center">
              <Star className="h-5 w-5 text-yellow-400 mr-2" />
              Subscription Benefits
            </h2>
            
            {isLoading ? (
              <div className="flex items-center justify-center h-40">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500"></div>
              </div>
            ) : (
              <>
                <div className="flex items-center mb-6">
                  {streamerDetails?.avatar_url ? (
                    <img 
                      src={streamerDetails.avatar_url} 
                      alt={streamerDetails.username} 
                      className="w-16 h-16 rounded-full border-2 border-purple-500 mr-4"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center text-2xl font-bold mr-4">
                      {streamerDetails?.username?.[0]?.toUpperCase() || '?'}
                    </div>
                  )}
                  <div>
                    <div className="text-lg font-medium">{streamerDetails?.username}</div>
                    <div className="text-sm text-gray-400">{streamerDetails?.followers_count || 0} followers</div>
                    <div className="text-sm text-purple-300">{streamerDetails?.subscriber_count || 0} subscribers</div>
                  </div>
                </div>
                
                <div className="space-y-6">
                  <div className="space-y-3">
                    <h3 className="text-lg font-medium text-purple-300">Unlock Exclusive Features</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-black/30 rounded-lg p-4 flex items-start">
                        <MessageSquare className="h-5 w-5 text-purple-400 mr-3 mt-1 flex-shrink-0" />
                        <div>
                          <div className="font-medium mb-1">Squad Chat</div>
                          <div className="text-sm text-gray-400">Real-time chat with other subscribers and direct access to {streamerDetails?.username}</div>
                        </div>
                      </div>
                      <div className="bg-black/30 rounded-lg p-4 flex items-start">
                        <Lock className="h-5 w-5 text-blue-400 mr-3 mt-1 flex-shrink-0" />
                        <div>
                          <div className="font-medium mb-1">Streamer Vault</div>
                          <div className="text-sm text-gray-400">Exclusive content only available to subscribers</div>
                        </div>
                      </div>
                      <div className="bg-black/30 rounded-lg p-4 flex items-start">
                        <Gift className="h-5 w-5 text-pink-400 mr-3 mt-1 flex-shrink-0" />
                        <div>
                          <div className="font-medium mb-1">Token Gifting</div>
                          <div className="text-sm text-gray-400">Special effects and recognition when gifting tokens</div>
                        </div>
                      </div>
                      <div className="bg-black/30 rounded-lg p-4 flex items-start">
                        <Star className="h-5 w-5 text-yellow-400 mr-3 mt-1 flex-shrink-0" />
                        <div>
                          <div className="font-medium mb-1">Maxed Tier Progress</div>
                          <div className="text-sm text-gray-400">Subscribe to 2 streamers to unlock Maxed tier benefits</div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="bg-gradient-to-r from-purple-900/30 to-indigo-900/30 rounded-lg p-5">
                      <div className="flex justify-between items-center mb-3">
                        <div className="text-lg font-medium">Standard Subscription</div>
                        <div className="text-2xl font-bold">
                          ${subscriptionPrice.toFixed(2)}<span className="text-sm font-normal text-gray-400">/mo</span>
                        </div>
                      </div>
                      <ul className="space-y-2">
                        <li className="flex items-center text-sm text-gray-300">
                          <Check className="h-4 w-4 text-green-400 mr-2" />
                          Unlock all subscriber benefits
                        </li>
                        <li className="flex items-center text-sm text-gray-300">
                          <Check className="h-4 w-4 text-green-400 mr-2" />
                          Support {streamerDetails?.username} directly
                        </li>
                        <li className="flex items-center text-sm text-gray-300">
                          <Check className="h-4 w-4 text-green-400 mr-2" />
                          Cancel anytime, no commitment
                        </li>
                      </ul>
                    </div>
                    
                    <div className="bg-gradient-to-r from-indigo-900/30 to-purple-900/30 rounded-lg p-5 border-2 border-yellow-500/30">
                      <div className="flex justify-between items-center mb-3">
                        <div className="flex items-center">
                          <div className="text-lg font-medium mr-2">Maxed Tier</div>
                          <span className="bg-yellow-500/20 text-yellow-300 text-xs px-2 py-0.5 rounded">PREMIUM</span>
                        </div>
                        <div className="text-2xl font-bold">
                          $14.99<span className="text-sm font-normal text-gray-400">/mo</span>
                        </div>
                      </div>
                      <ul className="space-y-2">
                        <li className="flex items-center text-sm text-gray-300">
                          <Check className="h-4 w-4 text-green-400 mr-2" />
                          Premium subscription to {streamerDetails?.username}
                        </li>
                        <li className="flex items-center text-sm text-yellow-200 font-medium">
                          <Star className="h-4 w-4 text-yellow-400 mr-2" />
                          Full Maxed tier benefits unlocked immediately
                        </li>
                        <li className="flex items-center text-sm text-gray-300">
                          <Check className="h-4 w-4 text-green-400 mr-2" />
                          100 bonus tokens monthly
                        </li>
                        <li className="flex items-center text-sm text-gray-300">
                          <Check className="h-4 w-4 text-green-400 mr-2" />
                          Exclusive Galaxy profile badge
                        </li>
                        <li className="flex items-center text-sm text-gray-300">
                          <Check className="h-4 w-4 text-green-400 mr-2" />
                          Priority Squad Chat features
                        </li>
                      </ul>
                    </div>
                  </div>
                  
                  {promoApplied && (
                    <div className="bg-green-900/30 border border-green-500/30 rounded-lg p-4">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center">
                          <Check className="h-5 w-5 text-green-400 mr-2" />
                          <span className="font-medium">Promo code applied!</span>
                        </div>
                        <div className="text-green-400">-${discount.toFixed(2)}</div>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </motion.div>
        
        {/* Right Column - Payment Form */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="bg-black/30 backdrop-blur-md rounded-xl border border-purple-500/30 overflow-hidden"
        >
          <div className="p-6">
            <h2 className="text-xl font-bold mb-4 flex items-center">
              <CreditCard className="h-5 w-5 text-purple-400 mr-2" />
              Payment Details
            </h2>
            
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-purple-900/20 to-indigo-900/20 rounded-lg p-4 flex justify-between items-center mb-6">
                <div>
                  <div className="text-sm text-gray-400">Total due today</div>
                  <div className="text-2xl font-bold">${finalPrice}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-400">Next billing date</div>
                  <div className="text-sm text-gray-300">
                    {new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString()}
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Cardholder Name</label>
                  <input
                    type="text"
                    placeholder="John Smith"
                    value={cardName}
                    onChange={(e) => setCardName(e.target.value)}
                    className="w-full bg-black/50 border border-purple-500/30 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Card Number</label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="1234 5678 9012 3456"
                      value={cardNumber}
                      onChange={handleCardNumberInput}
                      maxLength={19}
                      className="w-full bg-black/50 border border-purple-500/30 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                    />
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <div className="flex space-x-1">
                        <div className="w-6 h-4 bg-gray-700 rounded"></div>
                        <div className="w-6 h-4 bg-gray-700 rounded"></div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Expiry Date</label>
                    <input
                      type="text"
                      placeholder="MM/YY"
                      value={cardExpiry}
                      onChange={handleExpiryInput}
                      maxLength={5}
                      className="w-full bg-black/50 border border-purple-500/30 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">CVC</label>
                    <input
                      type="text"
                      placeholder="123"
                      value={cardCvc}
                      onChange={(e) => setCardCvc(e.target.value.replace(/\D/g, '').substring(0, 3))}
                      maxLength={3}
                      className="w-full bg-black/50 border border-purple-500/30 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Promo Code (Optional)</label>
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      placeholder="Enter promo code"
                      value={promoCode}
                      onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                      disabled={promoApplied}
                      className="flex-1 bg-black/50 border border-purple-500/30 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 disabled:opacity-50"
                    />
                    <button
                      onClick={applyPromoCode}
                      disabled={!promoCode || promoApplied}
                      className="px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Apply
                    </button>
                  </div>
                </div>
              </div>
              
              <div className="mt-3">
                <div className="flex items-center text-xs text-gray-400 mb-6">
                  <Shield className="h-4 w-4 mr-2 text-purple-400" />
                  Your payment information is secure and encrypted
                </div>
                
                <div className="space-y-3">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleSubscribe}
                    disabled={isProcessing}
                    className="w-full py-3 bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-700 hover:to-purple-600 text-white font-medium rounded-lg flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {isProcessing ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2"></div>
                        Processing...
                      </>
                    ) : (
                      <>
                        Subscribe ($4.99/mo) <Star className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </motion.button>
                  
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      // Set subscription type to maxed
                      setTokenAmount(14.99);
                      handleSubscribe();
                    }}
                    disabled={isProcessing}
                    className="w-full py-3 bg-gradient-to-r from-yellow-600 to-amber-500 hover:from-yellow-700 hover:to-amber-600 text-white font-medium rounded-lg flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {isProcessing ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2"></div>
                        Processing...
                      </>
                    ) : (
                      <>
                        Subscribe to Maxed Tier ($14.99/mo) <Star className="ml-2 h-4 w-4" /><Star className="h-4 w-4" />
                      </>
                    )}
                  </motion.button>
                </div>
                
                <div className="text-center mt-3 text-xs text-gray-400">
                  By subscribing, you agree to our Terms and automatically renew at ${subscriptionPrice.toFixed(2)}/month until canceled
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Subscribe;
