import { useState } from 'react';
import { Heart, DollarSign, MessageSquare, Sparkles, StarIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose
} from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';

// Animation component for donation alerts
interface DonationAlertProps {
  username: string;
  amount: number;
  message?: string;
  onFinish: () => void;
}

export const DonationAlert = ({ username, amount, message, onFinish }: DonationAlertProps) => {
  // Auto-hide animation after 7 seconds
  useState(() => {
    const timer = setTimeout(() => {
      onFinish();
    }, 7000);
    
    return () => clearTimeout(timer);
  });
  
  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
      <div className="animate-bounceIn bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 p-4 rounded-lg shadow-lg border-2 border-white text-white max-w-lg">
        <div className="flex items-center justify-center mb-2">
          <Sparkles className="h-6 w-6 mr-2 text-yellow-300 animate-spin" />
          <h3 className="text-xl font-bold">NEW DONATION!</h3>
          <Sparkles className="h-6 w-6 ml-2 text-yellow-300 animate-spin" />
        </div>
        
        <div className="text-center mb-2">
          <span className="font-semibold text-xl">{username}</span>
          <span className="mx-2">donated</span>
          <span className="font-bold text-2xl text-yellow-300">${amount.toFixed(2)}</span>
        </div>
        
        {message && (
          <div className="bg-black/20 p-2 rounded text-center italic">
            "{message}"
          </div>
        )}
      </div>
    </div>
  );
};

interface StreamDonationProps {
  streamId: string;
  streamerUsername: string;
  streamerId: string;
  className?: string;
}

export const StreamDonation = ({ 
  streamId, 
  streamerUsername, 
  streamerId,
  className = '' 
}: StreamDonationProps) => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState<number>(5);
  const [message, setMessage] = useState('');
  const [customAmount, setCustomAmount] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [lastDonation, setLastDonation] = useState<{
    username: string;
    amount: number;
    message?: string;
  } | null>(null);

  const handleCustomAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === '' || /^\d+(\.\d{0,2})?$/.test(value)) {
      setCustomAmount(value);
      if (value !== '') {
        setAmount(parseFloat(value));
      }
    }
  };

  const handleSelectPresetAmount = (preset: number) => {
    setAmount(preset);
    setCustomAmount('');
  };

  const handleDonate = async () => {
    if (!user) {
      toast.error('You need to be logged in to donate');
      return;
    }
    
    if (amount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }
    
    setIsProcessing(true);
    
    try {
      // In a real app, you would integrate with a payment processor here
      // For this example, we'll simulate a successful donation
      
      // First, record the donation in your database
      const { data, error } = await supabase
        .from('stream_donations')
        .insert({
          stream_id: streamId,
          user_id: user.id,
          streamer_id: streamerId,
          amount: amount,
          message: message.trim() || null,
          currency: 'USD',
          status: 'completed', // In a real app, this would initially be 'pending'
          created_at: new Date().toISOString()
        })
        .select()
        .single();
        
      if (error) throw error;
      
      // Get user's display name
      const { data: profile } = await supabase
        .from('profiles')
        .select('username, display_name')
        .eq('id', user.id)
        .single();
      
      const username = profile?.display_name || profile?.username || 'Anonymous';
      
      // Show donation alert
      setLastDonation({
        username,
        amount,
        message: message.trim() || undefined
      });
      setShowAlert(true);
      
      // Close donation dialog
      setOpen(false);
      
      // Reset form
      setAmount(5);
      setMessage('');
      setCustomAmount('');
      
      toast.success('Thank you for your donation!');
      
    } catch (error) {
      console.error('Error processing donation:', error);
      toast.error('Failed to process donation');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button 
            variant="default" 
            className={`bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white ${className}`}
          >
            <Heart className="h-4 w-4 mr-2" />
            Donate
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Heart className="h-5 w-5 text-pink-500" />
              Support {streamerUsername}
            </DialogTitle>
          </DialogHeader>
          
          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Select Amount</Label>
              
              <RadioGroup 
                defaultValue="5" 
                className="grid grid-cols-4 gap-2"
                onValueChange={(value) => handleSelectPresetAmount(Number(value))}
              >
                <div>
                  <RadioGroupItem 
                    value="1" 
                    id="amount-1" 
                    className="sr-only" 
                    checked={amount === 1 && customAmount === ''}
                  />
                  <Label
                    htmlFor="amount-1"
                    className={`flex flex-col items-center justify-between rounded-md border-2 border-muted p-2 hover:bg-accent hover:text-accent-foreground cursor-pointer ${
                      amount === 1 && customAmount === '' ? 'border-primary bg-primary/10' : ''
                    }`}
                  >
                    <DollarSign className="h-4 w-4 mb-1" />
                    <span>$1</span>
                  </Label>
                </div>
                
                <div>
                  <RadioGroupItem 
                    value="5" 
                    id="amount-5" 
                    className="sr-only" 
                    checked={amount === 5 && customAmount === ''}
                  />
                  <Label
                    htmlFor="amount-5"
                    className={`flex flex-col items-center justify-between rounded-md border-2 border-muted p-2 hover:bg-accent hover:text-accent-foreground cursor-pointer ${
                      amount === 5 && customAmount === '' ? 'border-primary bg-primary/10' : ''
                    }`}
                  >
                    <DollarSign className="h-4 w-4 mb-1" />
                    <span>$5</span>
                  </Label>
                </div>
                
                <div>
                  <RadioGroupItem 
                    value="10" 
                    id="amount-10" 
                    className="sr-only" 
                    checked={amount === 10 && customAmount === ''}
                  />
                  <Label
                    htmlFor="amount-10"
                    className={`flex flex-col items-center justify-between rounded-md border-2 border-muted p-2 hover:bg-accent hover:text-accent-foreground cursor-pointer ${
                      amount === 10 && customAmount === '' ? 'border-primary bg-primary/10' : ''
                    }`}
                  >
                    <DollarSign className="h-4 w-4 mb-1" />
                    <span>$10</span>
                  </Label>
                </div>
                
                <div>
                  <RadioGroupItem 
                    value="25" 
                    id="amount-25" 
                    className="sr-only" 
                    checked={amount === 25 && customAmount === ''}
                  />
                  <Label
                    htmlFor="amount-25"
                    className={`flex flex-col items-center justify-between rounded-md border-2 border-muted p-2 hover:bg-accent hover:text-accent-foreground cursor-pointer ${
                      amount === 25 && customAmount === '' ? 'border-primary bg-primary/10' : ''
                    }`}
                  >
                    <DollarSign className="h-4 w-4 mb-1" />
                    <span>$25</span>
                  </Label>
                </div>
              </RadioGroup>
              
              <div className="pt-2">
                <Label htmlFor="custom-amount">Custom Amount</Label>
                <div className="relative mt-1">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <DollarSign className="h-4 w-4 text-gray-400" />
                  </div>
                  <Input
                    id="custom-amount"
                    placeholder="Enter amount"
                    className="pl-8"
                    value={customAmount}
                    onChange={handleCustomAmountChange}
                  />
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="message" className="flex items-center gap-1">
                <MessageSquare className="h-4 w-4" />
                Message (optional)
              </Label>
              <Textarea
                id="message"
                placeholder="Add a message to your donation..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                maxLength={200}
                rows={3}
              />
              <div className="text-xs text-right text-muted-foreground">
                {message.length}/200
              </div>
            </div>
            
            <div className="bg-muted p-3 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Total donation:</span>
                <span className="text-xl font-bold">${amount.toFixed(2)}</span>
              </div>
              <div className="text-xs mt-1 text-muted-foreground">
                Support {streamerUsername} to help them continue creating great content!
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </DialogClose>
            <Button 
              onClick={handleDonate}
              disabled={isProcessing || amount <= 0}
              className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700"
            >
              {isProcessing ? (
                <>Processing...</>
              ) : (
                <>
                  <Heart className="h-4 w-4 mr-2" />
                  Donate ${amount.toFixed(2)}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {showAlert && lastDonation && (
        <DonationAlert
          username={lastDonation.username}
          amount={lastDonation.amount}
          message={lastDonation.message}
          onFinish={() => setShowAlert(false)}
        />
      )}
    </>
  );
};

// Add required animation CSS
import './StreamDonation.css';

export default StreamDonation;
