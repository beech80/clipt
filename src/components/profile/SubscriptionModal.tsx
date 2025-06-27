import React from 'react';
import ReactDOM from 'react-dom';
import { Star, ArrowLeft, Rocket, Check, Shield } from 'lucide-react';
import { toast } from 'sonner';

interface SubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  username: string;
  onSubscribe: () => void;
}

// Enhanced subscription modal with debug logs and maximum visibility
const SubscriptionModal: React.FC<SubscriptionModalProps> = ({
  isOpen,
  onClose,
  username,
  onSubscribe
}) => {
  const [selectedTier, setSelectedTier] = React.useState<string>('');
  
  React.useEffect(() => {
    console.log('SubscriptionModal rendered with props:', { isOpen, username });
    
    if (isOpen) {
      console.log('Modal should be open!');
      // Ensure body scroll lock
      document.body.style.overflow = 'hidden';
      
      // Force modal visibility with an extremely high z-index
      const styleId = 'force-modal-visible';
      if (!document.getElementById(styleId)) {
        const style = document.createElement('style');
        style.id = styleId;
        style.innerHTML = `
          .subscription-modal-overlay {
            position: fixed !important;
            inset: 0 !important;
            z-index: 2147483647 !important; /* Max possible z-index */
            display: flex !important;
            visibility: visible !important;
            opacity: 1 !important;
          }
          
          .subscription-modal-content {
            z-index: 2147483647 !important;
            visibility: visible !important;
            opacity: 1 !important;
            position: relative !important;
            background: linear-gradient(135deg, #1e1b4b, #4c1d95) !important;
          }
        `;
        document.head.appendChild(style);
      }
    } else {
      // Clean up styles when modal closes
      const style = document.getElementById('force-modal-visible');
      if (style) style.remove();
      
      // Restore scroll
      document.body.style.overflow = 'auto';
    }
    
    return () => {
      // Cleanup on unmount
      const style = document.getElementById('force-modal-visible');
      if (style) style.remove();
      document.body.style.overflow = 'auto';
    };
  }, [isOpen, username]);
  
  if (!isOpen) {
    console.log('Modal not open, returning null');
    return null;
  }
  
  const handleSubscribe = () => {
    if (selectedTier) {
      toast.success(`Subscribed to ${username} with ${selectedTier === 'pro' ? 'Pro' : 'Maxed'} tier!`);
      onSubscribe();
      onClose();
    } else {
      toast.error('Please select a subscription tier first');
    }
  };
  
  console.log('Rendering subscription modal content');
  
  // Use portal to render at the body level to avoid z-index issues
  return ReactDOM.createPortal(
    <div 
      className="subscription-modal-overlay fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center"
      onClick={onClose}
      data-testid="subscription-modal-overlay"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 99999
      }}
    >
      <div 
        className="subscription-modal-content bg-gradient-to-br from-indigo-950 to-purple-900 border-2 border-purple-500/50 rounded-xl p-6 max-w-md w-full mx-4 shadow-xl"
        onClick={(e) => e.stopPropagation()}
        data-testid="subscription-modal-content"
        style={{
          boxShadow: '0 0 30px rgba(139, 92, 246, 0.3), 0 0 15px rgba(236, 72, 153, 0.2) inset',
          backgroundImage: 'radial-gradient(circle at top right, rgba(139, 92, 246, 0.2), transparent 80%), radial-gradient(circle at bottom left, rgba(236, 72, 153, 0.2), transparent 80%)',
          zIndex: 100000,
        }}
      >
        <div className="relative">
          <h2 className="text-2xl font-bold text-center text-white mb-6">
            <Star className="inline-block h-5 w-5 mr-2 text-pink-400" />
            Subscribe to {username}
          </h2>
          <button 
            onClick={onClose}
            className="absolute top-0 right-0 text-gray-300 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-6 w-6" />
          </button>
          
          <p className="text-purple-200/80 mb-6 text-center text-sm">
            Choose your subscription tier to unlock Clipt Coins &amp; exclusive cosmic content
          </p>
          
          {/* Subscription Tiers */}
          <div className="space-y-4">
            <button
              className={`w-full p-4 rounded-lg border border-green-500/30 relative overflow-hidden ${selectedTier === 'pro' ? 'border-green-400' : 'hover:border-green-400/50'}`}
              onClick={() => setSelectedTier('pro')}
              style={{
                backgroundColor: selectedTier === 'pro' ? 'rgba(74, 222, 128, 0.25)' : 'rgba(30, 27, 75, 0.6)',
                boxShadow: selectedTier === 'pro' ? '0 0 15px rgba(74, 222, 128, 0.3)' : 'none'
              }}
            >
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                    <Star className="h-4 w-4 text-green-400" />
                    Pro Tier
                  </h3>
                  <p className="text-green-200/70 text-sm mt-1">Enhanced cosmic experience</p>
                </div>
                <div className="text-white font-bold">
                  $4.99<span className="text-xs font-normal text-green-300">/mo</span>
                </div>
              </div>
              <div className="mt-3 text-xs text-green-200/60">
                500 coins daily • 5,000 coin wallet cap • Premium content
              </div>
              {selectedTier === 'pro' && (
                <div className="absolute top-1 right-1">
                  <Check className="h-4 w-4 text-green-300" />
                </div>
              )}
            </button>
            
            <button
              className={`w-full p-4 rounded-lg border border-pink-500/30 relative ${selectedTier === 'maxed' ? 'border-pink-400' : 'hover:border-pink-400/50'}`}
              onClick={() => setSelectedTier('maxed')}
              style={{
                backgroundColor: selectedTier === 'maxed' ? 'rgba(236, 72, 153, 0.25)' : 'rgba(30, 27, 75, 0.6)',
                boxShadow: selectedTier === 'maxed' ? '0 0 15px rgba(236, 72, 153, 0.3)' : 'none'
              }}
            >
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                    <Rocket className="h-4 w-4 text-pink-400" />
                    Maxed Tier
                  </h3>
                  <p className="text-pink-200/70 text-sm mt-1">Ultimate cosmic experience</p>
                </div>
                <div className="text-white font-bold">
                  $9.99<span className="text-xs font-normal text-pink-300">/mo</span>
                </div>
              </div>
              <div className="mt-3 text-xs text-pink-200/60">
                1,500 coins daily • 15,000 coin wallet cap • Exclusive content
              </div>
              {selectedTier === 'maxed' && (
                <div className="absolute top-1 right-1">
                  <Check className="h-4 w-4 text-pink-300" />
                </div>
              )}
            </button>
            
            <div className="mt-2 p-3 rounded-lg border border-gray-500/20 bg-gray-800/30">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-sm font-medium text-gray-300 flex items-center gap-2">
                    <Shield className="h-3.5 w-3.5 text-gray-400" />
                    Current: Free Tier
                  </h3>
                </div>
                <div className="text-gray-400 text-sm">
                  <span>100 coins daily</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-6 flex justify-end">
            <button
              className="px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg font-medium text-white"
              disabled={!selectedTier}
              onClick={handleSubscribe}
              style={{
                opacity: selectedTier ? 1 : 0.5,
                cursor: selectedTier ? 'pointer' : 'not-allowed'
              }}
            >
              Subscribe {selectedTier && `- ${selectedTier === 'pro' ? '$4.99' : '$9.99'}/mo`}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default SubscriptionModal;
