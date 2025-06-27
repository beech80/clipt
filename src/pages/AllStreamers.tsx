import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import axios from 'axios';
import { Socket, io } from 'socket.io-client';
import { toast } from 'sonner';
import { 
  MessageSquare, 
  MessageSquareX, 
  HeartHandshake, 
  Share, 
  Scissors, 
  Star, 
  SendHorizontal, 
  BarChart, 
  ArrowRight, 
  Trophy, 
  Wallet, 
  Activity, 
  ChevronLeft, 
  Share2, 
  Users, 
  MessageCircle, 
  DollarSign, 
  RefreshCw, 
  Twitter, 
  Facebook, 
  Mail, 
  Clipboard, 
  X, 
  Send,
  ChartPie
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import styled from 'styled-components';
import { Dialog, DialogContent } from "@/components/ui/dialog";

// Define the Streamer interface
interface Streamer {
  id: string;
  streamerName: string;
  gameName: string;
  viewerCount: number;
  genres: string[];
  thumbnailUrl: string;
}

// Define chat message type
type ChatMessage = {
  user: string;
  message: string;
  time: string;
  system?: boolean;
  tier?: string | null; // For subscriber badge display
};

// Styled Components and keyframe animations
const pulsateKeyframes = `
  @keyframes pulsate {
    0% { opacity: 0.8; text-shadow: 0 0 20px rgba(255,85,0,0.3); }
    50% { opacity: 1; text-shadow: 0 0 30px rgba(255,85,0,0.6), 0 0 60px rgba(255,85,0,0.3); }
    100% { opacity: 0.8; text-shadow: 0 0 20px rgba(255,85,0,0.3); }
  }

  @keyframes animateStars {
    0% { background-position: 0 0; }
    100% { background-position: 500px 500px; }
  }

  @keyframes float {
    0% { transform: translateY(0px) scale(1); opacity: 0.5; }
    50% { transform: translateY(-20px) scale(1.1); opacity: 0.7; }
    100% { transform: translateY(0px) scale(1); opacity: 0.5; }
  }
`;

const StreamContainer = styled.div`
  width: 100%;
  height: 100vh;
  background: linear-gradient(to bottom, #0C0C0C, #151515, #0C0C0C);
  position: relative;
  overflow: hidden;
  touch-action: pan-y;
  display: flex;
  flex-direction: column;
  ${pulsateKeyframes}
`;

const StreamHeader = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  z-index: 10;
  background: linear-gradient(to bottom, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0) 100%);
`;

const StreamTitle = styled.h1`
  font-size: 2rem;
  color: #FFFFFF;
  font-weight: bold;
  text-shadow: 0 0 10px rgba(255, 85, 0, 0.7), 0 0 20px rgba(255, 85, 0, 0.5);
  margin: 0;
  position: relative;
  display: inline-block;
`;

const ActionButtons = styled.div`
  position: relative;
  width: 100%;
  display: flex;
  justify-content: space-around;
  padding: 15px 20px;
  z-index: 10;
  background: rgba(0, 0, 0, 0.8);
  border-top: 1px solid rgba(255, 85, 0, 0.3);
  margin-top: auto;
`;

const ActionButton = styled.button`
  background: rgba(0, 0, 0, 0.7);
  border: 2px solid rgba(255, 85, 0, 0.7);
  border-radius: 50%;
  width: 50px;
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #FF5500;
  transition: all 0.3s ease;
  box-shadow: 0 0 15px rgba(255, 85, 0, 0.3);
  
  &:hover {
    transform: scale(1.1);
    background: rgba(255, 85, 0, 0.2);
    box-shadow: 0 0 20px rgba(255, 85, 0, 0.5);
  }
`;

const AllStreamers = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  
  // States for streamers data
  const [streamers, setStreamers] = useState<Streamer[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // States for UI controls
  const [isChatOpen, setIsChatOpen] = useState(true);
  const [isCliptModalOpen, setIsCliptModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isDonateModalOpen, setIsDonateModalOpen] = useState(false);
  const [isSubscribeModalOpen, setIsSubscribeModalOpen] = useState(false);
  
  // States for payments
  const [donationAmount, setDonationAmount] = useState(5);
  const [currentMessage, setCurrentMessage] = useState('');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [selectedTier, setSelectedTier] = useState('Cosmic Supporter');
  
  // New state variables for cosmic features
  const [showDonationAnimation, setShowDonationAnimation] = useState<boolean>(false);
  const [showAnalyticsPanel, setShowAnalyticsPanel] = useState<boolean>(false);
  const [showDonationGoalModal, setShowDonationGoalModal] = useState<boolean>(false);
  const [donationGoal, setDonationGoal] = useState<{ name: string; amount: number; current: number; } | null>(null);
  
  // Refs for animations
  const donationAlertRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<Socket | null>(null);

  // Sample fallback data to display
  const fallbackStreamers: Streamer[] = [
    {
      id: 'ninja_123',
      streamerName: 'Ninja',
      gameName: 'Stellar Odyssey',
      viewerCount: 45000,
      genres: ['Space', 'Adventure', 'RPG'],
      thumbnailUrl: 'https://picsum.photos/800/450?random=1',
    },
    {
      id: 'pokimane_456',
      streamerName: 'Pokimane',
      gameName: 'Galactic Fleet Commander',
      viewerCount: 32000,
      genres: ['Strategy', 'Space', 'Simulation'],
      thumbnailUrl: 'https://picsum.photos/800/450?random=2',
    },
    {
      id: 'drdisrespect_789',
      streamerName: 'DrDisrespect',
      gameName: 'Event Horizon',
      viewerCount: 28000,
      genres: ['Horror', 'Space', 'Survival'],
      thumbnailUrl: 'https://picsum.photos/800/450?random=3',
    },
    {
      id: 'shroud_101',
      streamerName: 'Shroud',
      gameName: 'Cosmic Explorers',
      viewerCount: 35000,
      genres: ['Exploration', 'Space', 'Open World'],
      thumbnailUrl: 'https://picsum.photos/800/450?random=4',
    },
    {
      id: 'tfue_202',
      streamerName: 'Tfue',
      gameName: 'Space Station Simulator',
      viewerCount: 25000,
      genres: ['Simulation', 'Building', 'Space'],
      thumbnailUrl: 'https://picsum.photos/800/450?random=5',
    }
  ];

  // Navigation functions
  const handleNextStream = () => {
    if (currentIndex < streamers.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handlePrevStream = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  // Go back to discovery page
  const goBack = () => {
    // Disconnect socket if connected
    if (socketRef.current) {
      socketRef.current.disconnect();
    }
    navigate('/discovery');
  };

  // Action button handlers
  const handleChatToggle = () => {
    setIsChatOpen(!isChatOpen);
    
    if (!isChatOpen) {  
      // Initialize socket connection if not already connected
      if (!socketRef.current) {
        // Connect to Socket.io server
        socketRef.current = io(process.env.REACT_APP_SOCKET_URL || 'http://localhost:3001', {
          withCredentials: true,
          query: {
            streamerId: streamers[currentIndex]?.id,
          }
        });
        
        // Socket event listeners
        socketRef.current.on('connect', () => {
          console.log('Connected to chat server');
          setChatMessages(prev => [
            ...prev,
            { 
              user: 'System', 
              message: 'Connected to live chat', 
              time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
              system: true
            }
          ]);
        });
        
        socketRef.current.on('connect_error', (error) => {
          console.error('Connection error:', error);
          toast.error('Chat connection failed. Please try again.');
        });
        
        socketRef.current.on('chat_message', (data: {username: string; message: string; timestamp: string}) => {
          setChatMessages(prev => [
            ...prev, 
            { 
              user: data.username, 
              message: data.message, 
              time: new Date(data.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
            }
          ]);
          
          // Auto-scroll to bottom on new message
          setTimeout(() => {
            if (chatContainerRef.current) {
              chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
            }
          }, 100);
        });
        
        socketRef.current.on('user_join', (data: {username: string}) => {
          setChatMessages(prev => [
            ...prev, 
            { 
              user: 'System', 
              message: `${data.username} joined the chat`, 
              time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
              system: true 
            }
          ]);
        });
        
        socketRef.current.on('user_leave', (data: {username: string}) => {
          setChatMessages(prev => [
            ...prev, 
            { 
              user: 'System', 
              message: `${data.username} left the chat`, 
              time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
              system: true 
            }
          ]);
        });
        
        // Join the stream chat room
        socketRef.current.emit('join_stream', {
          streamId: streamers[currentIndex]?.id,
          username: user?.email ? user.email.split('@')[0] : 'Anonymous', // Use email prefix as username fallback
        });
      }
      
      // Load initial chat history if no messages yet
      if (chatMessages.length === 0) {
        // If backend API is available, fetch recent chat history
        axios.get(`/api/chat/history/${streamers[currentIndex]?.id}?limit=20`)
          .then(response => {
            const historyMessages = response.data.messages.map((msg: any) => ({
              user: msg.username,
              message: msg.content,
              time: new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
            }));
            setChatMessages(historyMessages);
          })
          .catch(() => {
            // Fall back to sample messages if API fails
            setChatMessages([
              { user: 'CosmicViewer42', message: 'Awesome stream!', time: '2:30 PM' },
              { user: 'StarGazer99', message: 'How did you beat that boss?', time: '2:31 PM' },
              { user: 'NebulaNomad', message: 'What mods are you using?', time: '2:32 PM' },
              { user: 'GalacticGamer', message: 'Been following you since day one!', time: '2:33 PM' },
              { user: streamers[currentIndex]?.streamerName, message: 'Thanks for watching everyone! Don\'t forget to subscribe!', time: '2:34 PM' }
            ]);
          });
      }
      
      // Scroll to bottom of chat when opening
      setTimeout(() => {
        if (chatContainerRef.current) {
          chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
      }, 100);
    } else {
      // Disconnect socket when closing chat
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    }
  };
  
  const handleSubscribe = () => {
    if (!user) {
      toast.error('Please log in to subscribe');
      navigate('/login', { state: { from: location.pathname } });
      return;
    }

    if (isSubscribed) {
      // Handle unsubscribe flow with confirmation
      if (window.confirm('Are you sure you want to cancel your subscription?')) {
        setIsProcessingPayment(true);
        axios.post('/api/subscription/cancel')
          .then(response => {
            setIsSubscribed(false);
            setSelectedTier(null);
            toast.success('Unsubscribed successfully. Your benefits will remain active until the end of the billing period.');
            setIsProcessingPayment(false);
          })
          .catch(err => {
            setIsProcessingPayment(false);
            setPaymentError(err.message || 'Error cancelling subscription');
            console.error('Error cancelling subscription:', err);
            toast.error('Failed to cancel subscription: ' + err.message);
          });
      }
    } else {
      // Open subscription modal to select tier
      setPaymentError(null);
      setIsSubscribeModalOpen(true);
      
      // Check existing subscription status
      axios.get('/api/subscription/status')
        .then(response => {
          if (response.data.active) {
            setIsSubscribed(true);
            setSelectedTier(response.data.tier);
          }
        })
        .catch(error => {
          console.error('Error checking subscription status:', error);
        });
    }
  };
  
  const confirmSubscription = (tier: string) => {
    if (!user) {
      toast.error('Please log in to subscribe');
      navigate('/login');
      return;
    }

    setIsProcessingPayment(true);
    setPaymentError(null);
    
    const tierPricing = {
      'Cosmic Supporter': {
        priceId: 'price_cosmic_supporter',
        amount: 500 // $5.00
      },
      'Galactic VIP': {
        priceId: 'price_galactic_vip',
        amount: 1400 // $14.00
      }
    };
    
    const selectedTierData = tierPricing[tier as keyof typeof tierPricing];
    
    // Platform keeps 25% of subscription revenue, streamer gets 75%
    const streamerAmount = Math.floor(selectedTierData.amount * 0.75);
    const platformAmount = selectedTierData.amount - streamerAmount;
    
    console.log(`Subscription revenue split - Streamer: $${streamerAmount/100}, Platform: $${platformAmount/100}`);
    
    // Create Stripe checkout session
    axios.post('/api/subscription/create-checkout', {
      priceId: selectedTierData.priceId,
      tier: tier,
      streamerAmount: streamerAmount,  // Pass the streamer portion amount
      platformAmount: platformAmount,  // Pass the platform portion amount
      streamerId: streamers[currentIndex]?.id
    })
      .then(response => {
        // Redirect to Stripe checkout
        window.location.href = response.data.url;
      })
      .catch(err => {
        setIsProcessingPayment(false);
        setPaymentError(err.message || 'Error creating checkout');
        console.error('Error creating checkout session:', err);
        toast.error('Error creating checkout session: ' + err.message);
      });
  };
  
  const sendChatMessage = () => {
    if (currentMessage.trim()) {
      const now = new Date();
      const timeString = now.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
      
      // Add message to local state immediately for better UX
      setChatMessages([...chatMessages, { 
        user: user?.email?.split('@')[0] || 'You', // Use email prefix as username
        message: currentMessage,
        time: timeString,
        tier: isSubscribed ? selectedTier : null // Include subscription tier for badge display
      }]);
      
      // Send message through socket if connected
      if (socketRef.current && socketRef.current.connected) {
        socketRef.current.emit('send_message', {
          streamId: streamers[currentIndex]?.id,
          message: currentMessage,
          username: user?.email?.split('@')[0] || 'Anonymous', // Use email prefix as username
        });
      } else {
        // If socket not connected, show warning
        toast.warning('Chat connection lost. Reconnecting...', {
          type: 'error',
          description: 'Please wait while we reconnect to the chat server.'
        });
      }
      
      setCurrentMessage('');
      
      // Scroll to bottom
      setTimeout(() => {
        if (chatContainerRef.current) {
          chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
      }, 100);
    }
  };
  
  const handleDonate = () => {
    if (!user) {
      toast.error('Please log in to donate');
      navigate('/login', { state: { from: location.pathname } });
      return;
    }
    
    setIsDonateModalOpen(true);
  };
  
  const handleShareStream = () => {
    setIsShareModalOpen(true);
  };

  // Handle creating a clip from the stream
  const handleCliptStream = () => {
    if (!streamers[currentIndex]) return;
    
    if (!user) {
      toast.error('Please log in to create clips');
      navigate('/login', { state: { from: location.pathname } });
      return;
    }
    
    setIsCliptModalOpen(true);
    toast.success('Ready to create a clip!', {
      description: 'Select the length and add a title to your clip',
    });
  };

  // Copy link to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Link copied to clipboard!');
  };
  
  // Show cosmic-themed donation alert animation
  const showDonationAlert = (amount: number) => {
    // Set the amount for the animation
    setDonationAmount(amount);
    
    // Show animation
    setShowDonationAnimation(true);
    
    // Hide after animation completes
    setTimeout(() => {
      setShowDonationAnimation(false);
    }, 5000); // 5 seconds for the full animation
  };
  
  // Handle donation goal creation
  const createDonationGoal = (name: string, amount: number) => {
    setDonationGoal({
      name,
      amount,
      current: 0 // Start at 0
    });
    setShowDonationGoalModal(false);
    toast.success(`Created donation goal: ${name}`);
  };
  
  // Toggle analytics panel
  const toggleAnalyticsPanel = () => {
    setShowAnalyticsPanel(!showAnalyticsPanel);
  };
  
  // Process donation
  const processDonation = (amount: number) => {
    setIsProcessingPayment(true);
    
    // 100% of donations go to the streamer
    console.log(`Donation amount - Streamer: $${amount}, Platform: $0`);
    
    // Show cosmic donation alert before processing
    showDonationAlert(amount);
    
    // Update donation goal if exists
    if (donationGoal) {
      const newAmount = donationGoal.current + amount;
      setDonationGoal({
        ...donationGoal,
        current: newAmount
      });
      
      if (newAmount >= donationGoal.amount) {
        toast.success(`🎉 Donation goal reached: ${donationGoal.name}!`);
      }
    }
    
    axios.post('/api/payments/donate', {
      streamerId: streamers[currentIndex]?.id,
      streamerAmount: amount, // 100% to streamer
      platformAmount: 0,      // 0% to platform
      amount: amount,
      currency: 'USD'
    })
      .then(response => {
        // Redirect to payment processing
        window.location.href = response.data.url;
      })
      .catch(err => {
        console.error('Error processing donation:', err);
        toast.error('Failed to process donation. Please try again.');
        setIsProcessingPayment(false);
        setPaymentError(err.message || 'Error processing donation');
      });
  };

  // Fetch streamers or use fallback
  const fetchStreamers = () => {
    setIsLoading(true);
    setError(null);
    
    // Simulate API call
    setTimeout(() => {
      setStreamers(fallbackStreamers);
      setIsLoading(false);
    }, 1000);
  };

  // Handle swipe gestures
  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      const touchDownY = e.touches[0].clientY;
      const touchDownX = e.touches[0].clientX;
      document.body.setAttribute('data-touch-start-y', touchDownY.toString());
      document.body.setAttribute('data-touch-start-x', touchDownX.toString());
    };

    const handleTouchMove = (e: TouchEvent) => {
      const touchDownY = Number(document.body.getAttribute('data-touch-start-y'));
      const touchDownX = Number(document.body.getAttribute('data-touch-start-x'));
      
      if (touchDownY === 0 && touchDownX === 0) {
        return;
      }

      const currentTouchY = e.touches[0].clientY;
      const currentTouchX = e.touches[0].clientX;
      
      const diffY = touchDownY - currentTouchY;
      const diffX = touchDownX - currentTouchX;
      
      // Determine if the swipe is primarily horizontal or vertical
      if (Math.abs(diffX) > Math.abs(diffY)) {
        // Horizontal swipe
        if (diffX > 50) { // Swiped left
          handleNextStream();
          document.body.setAttribute('data-touch-start-x', '0');
          document.body.setAttribute('data-touch-start-y', '0');
        } else if (diffX < -50) { // Swiped right
          handlePrevStream();
          document.body.setAttribute('data-touch-start-x', '0');
          document.body.setAttribute('data-touch-start-y', '0');
        }
      } else {
        // Vertical swipe
        if (diffY > 50) { // Swiped up
          handleNextStream();
          document.body.setAttribute('data-touch-start-y', '0');
          document.body.setAttribute('data-touch-start-x', '0');
        } else if (diffY < -50) { // Swiped down
          handlePrevStream();
          document.body.setAttribute('data-touch-start-y', '0');
          document.body.setAttribute('data-touch-start-x', '0');
        }
      }
    };

    // Handle keyboard navigation for testing on desktop
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        handleNextStream();
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        handlePrevStream();
      }
    };

    document.addEventListener('touchstart', handleTouchStart);
    document.addEventListener('touchmove', handleTouchMove);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [currentIndex]);

  useEffect(() => {
    // Add global styles for the page
    document.body.style.overflow = 'hidden';
    document.body.style.backgroundColor = '#000000';
    
    // Add cosmic styles for donation alerts
    const style = document.createElement('style');
    style.textContent = `
      @keyframes fadeInOut {
        0% { opacity: 0; }
        10% { opacity: 1; }
        90% { opacity: 1; }
        100% { opacity: 0; }
      }
      
      @keyframes cosmicExplosion {
        0% { transform: scale(0.5); opacity: 0; }
        10% { transform: scale(1.1); opacity: 1; }
        20% { transform: scale(0.9); }
        30% { transform: scale(1); }
        90% { transform: scale(1); opacity: 1; }
        100% { transform: scale(1.2); opacity: 0; }
      }
      
      @keyframes pulse {
        0% { transform: scale(1); }
        50% { transform: scale(1.05); }
        100% { transform: scale(1); }
      }
      
      @keyframes float {
        0% { transform: translateY(0px); }
        50% { transform: translateY(-10px); }
        100% { transform: translateY(0px); }
      }
      
      @keyframes rotate {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
      
      .cosmic-donation-alert {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 2rem;
        position: relative;
        animation: cosmicExplosion 5s forwards;
      }
      
      .cosmic-stars {
        position: absolute;
        width: 300px;
        height: 300px;
        border-radius: 50%;
        background: radial-gradient(circle, rgba(255, 165, 0, 0.3) 0%, rgba(0, 0, 0, 0) 70%);
        z-index: -1;
        animation: pulse 2s infinite;
      }
      
      .cosmic-planet {
        position: absolute;
        width: 80px;
        height: 80px;
        border-radius: 50%;
        background: linear-gradient(45deg, #FF6B00, #FF9E00);
        box-shadow: 0 0 40px rgba(255, 150, 0, 0.8);
        top: -50px;
        right: -30px;
        z-index: -1;
        animation: float 4s infinite ease-in-out;
      }
      
      .cosmic-text-gradient {
        background: linear-gradient(45deg, #FF5A00, #FFC800);
        background-clip: text;
        -webkit-background-clip: text;
        color: transparent;
      }
      
      .cosmic-donation-progress {
        background: linear-gradient(90deg, #FF5A00, #FF9E00);
        box-shadow: 0 0 10px rgba(255, 90, 0, 0.7);
        transition: width 1s ease-in-out;
      }
      
      .cosmic-badge {
        color: #FFA500;
        text-shadow: 0 0 5px rgba(255, 165, 0, 0.8);
        animation: pulse 2s infinite;
      }
      
      .galactic-badge {
        color: #00E5FF;
        text-shadow: 0 0 5px rgba(0, 229, 255, 0.8);
        animation: pulse 2s infinite;
      }
    `;
    document.head.appendChild(style);
    
    fetchStreamers();
    
    // Cleanup function
    return () => {
      document.body.style.overflow = '';
      document.body.style.backgroundColor = '';
      document.head.removeChild(style);
      // Clean up socket connection
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  return (
    <StreamContainer>
      {/* Main content - Swipeable stream views */}
      {/* Back button removed */}
      {/* Main content - Swipeable stream views */}
      <AnimatePresence>
        {!isLoading && !error && streamers.length > 0 && (
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            style={{
              width: '100%' as any,
              height: '100vh' as any,
              position: 'relative' as any,
              background: '#000000',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {/* Stream Header with Streamer Name */}
            <StreamHeader>
              <div style={{ flex: 1 }}></div>
              <StreamTitle>
                {/* Header title removed as requested */}
              </StreamTitle>
              <div style={{ flex: 1 }}></div>
            </StreamHeader>

            {/* Welcome message with cosmic theme */}
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: 'calc(100% - 80px)',
                zIndex: 1,
                background:
                  'linear-gradient(135deg, #0C0C2C 0%, #151525 50%, #1C1016 100%)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                overflow: 'hidden',
              }}
            >
              {/* Cosmic background elements */}
              <div
                className="stars"
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  backgroundImage:
                    'radial-gradient(2px 2px at 20px 30px, #eee, rgba(0,0,0,0)), radial-gradient(2px 2px at 40px 70px, #fff, rgba(0,0,0,0)), radial-gradient(2px 2px at 50px 160px, #ddd, rgba(0,0,0,0)), radial-gradient(2px 2px at 90px 40px, #fff, rgba(0,0,0,0)), radial-gradient(2px 2px at 130px 80px, #fff, rgba(0,0,0,0))',
                  backgroundSize: '200px 200px',
                  animation: 'animateStars 100s linear infinite',
                  opacity: 0.4,
                  zIndex: -1,
                }}
              />
              <div
                style={{
                  fontSize: '3.5rem',
                  fontWeight: 'bold',
                  color: 'transparent',
                  backgroundImage: 'linear-gradient(45deg, #FF5500, #FF8C66)',
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  textShadow: '0 0 20px rgba(255,85,0,0.4)',
                  marginBottom: '1rem',
                  textAlign: 'center',
                  letterSpacing: '3px',
                  animation: 'pulsate 3s infinite ease-in-out',
                }}
              >
                WELCOME TO CLIPT
              </div>

              <div
                style={{
                  fontSize: '1.2rem',
                  color: '#CCC',
                  textAlign: 'center',
                  maxWidth: '80%',
                  lineHeight: '1.6',
                  textShadow: '0 0 10px rgba(255,255,255,0.2)',
                  letterSpacing: '1px',
                }}
              >
                Your gateway to cosmic gaming experiences
              </div>

              <div
                style={{
                  position: 'absolute',
                  width: '300px',
                  height: '300px',
                  borderRadius: '50%',
                  background:
                    'radial-gradient(circle at center, rgba(255,85,0,0.1) 0%, rgba(255,85,0,0) 70%)',
                  filter: 'blur(80px)',
                  zIndex: -1,
                  animation: 'float 10s ease-in-out infinite',
                  top: '30%',
                  opacity: 0.6,
                }}
              />
              {/* Stream title overlay - Only shown when displaying actual streamer content */}
              {/* This welcome screen will hide the title and genres, but they will appear when real streamers load */}
              {false && (
                <div
                  style={{
                    position: 'absolute',
                    bottom: '20px',
                    left: '0',
                    width: '100%',
                    padding: '20px',
                    background:
                      'linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0) 100%)',
                    zIndex: 5,
                  }}
                >
              
              <div className="flex items-center justify-between text-sm text-gray-400 px-1">
                <span>Current viewers: {streamers[currentIndex]?.viewerCount.toLocaleString()}</span>
                <div className="flex items-center gap-1">
                  <Scissors size={14} className="text-orange-500" />
                  <span>{Math.floor(Math.random() * 500) + 100} clips today</span>
                </div>
              </div>
            </div>
          )}
          </div>

          {/* Action Buttons - Now positioned below the stream */}
          <ActionButtons>
            <ActionButton onClick={handleChatToggle}>
              <MessageCircle size={24} />
            </ActionButton>
            <ActionButton onClick={handleDonate}>
              <DollarSign size={24} />
            </ActionButton>
            <ActionButton onClick={handleShareStream}>
              <Share2 size={24} />
            </ActionButton>
            <ActionButton onClick={handleCliptStream} style={{ 
              background: 'rgba(255, 85, 0, 0.3)',
              borderColor: 'rgba(255, 85, 0, 0.8)'
            }}>
              <Scissors size={22} />
            </ActionButton>
            <ActionButton onClick={handleSubscribe} style={{ 
              background: isSubscribed ? 'rgba(255, 85, 0, 0.4)' : 'rgba(0, 0, 0, 0.7)',
              borderColor: isSubscribed ? 'rgba(255, 85, 0, 0.9)' : 'rgba(255, 85, 0, 0.7)'
            }}>
              <Star size={24} fill={isSubscribed ? '#FF5500' : 'none'} />
            </ActionButton>
          </ActionButtons>
        </motion.div>
      )}
    </AnimatePresence>
    
    {/* Clipt Modal */}
    <Dialog open={isCliptModalOpen} onOpenChange={setIsCliptModalOpen}>
      <DialogContent className="bg-[#151515] border border-orange-500/30 rounded-lg shadow-[0_0_30px_rgba(255,85,0,0.2)] max-w-md">
        <div>
          <div className="flex gap-3">
            <button 
              onClick={() => setIsCliptModalOpen(false)}
              className="flex-1 border border-gray-600 text-gray-300 bg-black/40 hover:bg-black/60 py-2 rounded-md text-sm font-medium transition-colors"
            >
              Cancel
            </button>
            <button 
              onClick={() => {
                setIsCliptModalOpen(false);
                toast.success('Clip created!', {
                  description: 'Your clip has been saved and shared with your followers',
                });
              }}
              className="flex-1 bg-orange-500 hover:bg-orange-600 text-white py-2 rounded-md text-sm font-medium transition-colors flex items-center justify-center gap-2"
            >
              <Scissors size={16} />
              Create Clip
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>

    {/* Share Modal */}
    <Dialog open={isShareModalOpen} onOpenChange={setIsShareModalOpen}>
      <DialogContent className="bg-[#151515] border border-orange-500/30 rounded-lg shadow-[0_0_30px_rgba(255,85,0,0.2)] max-w-md">
        <div>
          <div className="p-4">
            <h2 className="text-xl font-bold text-white mb-4 text-center">Share Stream</h2>
            
            <div className="grid grid-cols-4 gap-4 mb-6">
              <button className="flex flex-col items-center justify-center gap-2">
                <div className="w-12 h-12 rounded-full bg-[#1DA1F2]/20 flex items-center justify-center hover:bg-[#1DA1F2]/30 transition-colors border border-[#1DA1F2]/30">
                  <Twitter size={20} className="text-[#1DA1F2]" />
                </div>
                <span className="text-xs text-gray-400">Twitter</span>
              </button>
              
              <button className="flex flex-col items-center justify-center gap-2">
                <div className="w-12 h-12 rounded-full bg-[#4267B2]/20 flex items-center justify-center hover:bg-[#4267B2]/30 transition-colors border border-[#4267B2]/30">
                  <Facebook size={20} className="text-[#4267B2]" />
                </div>
                <span className="text-xs text-gray-400">Facebook</span>
              </button>
              
              <button className="flex flex-col items-center justify-center gap-2">
                <div className="w-12 h-12 rounded-full bg-[#5865F2]/20 flex items-center justify-center hover:bg-[#5865F2]/30 transition-colors border border-[#5865F2]/30">
                  <MessageCircle size={20} className="text-[#5865F2]" />
                </div>
                <span className="text-xs text-gray-400">Discord</span>
              </button>
              
              <button className="flex flex-col items-center justify-center gap-2" onClick={() => copyToClipboard(`https://clipt.tv/stream/${streamers[currentIndex].id}`)}>
                <div className="w-12 h-12 rounded-full bg-gray-700/30 flex items-center justify-center hover:bg-gray-700/50 transition-colors border border-gray-600/30">
                  <Clipboard size={20} className="text-gray-300" />
                </div>
                <span className="text-xs text-gray-400">Copy Link</span>
              </button>
            </div>
            
            <div className="space-y-3">
              <button 
                className="w-full py-2.5 bg-orange-500/20 hover:bg-orange-500/30 text-orange-400 rounded-md transition-colors border border-orange-500/40 flex items-center justify-center gap-2"
                onClick={() => copyToClipboard(`https://clipt.tv/stream/${streamers[currentIndex].id}`)}
              >
                <Clipboard size={16} /> Copy Stream Link
              </button>
              
              <button className="w-full py-2.5 bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 rounded-md transition-colors border border-purple-500/40 flex items-center justify-center gap-2">
                <Mail size={16} /> Share via Email
              </button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
      
    {/* Donate Modal */}
    <Dialog open={isDonateModalOpen} onOpenChange={setIsDonateModalOpen}>
      <DialogContent className="bg-[#151515] border border-orange-500/30 rounded-lg shadow-[0_0_30px_rgba(255,85,0,0.2)] max-w-md">
        <div>
          <div className="p-4">
            <h2 className="text-xl font-bold text-white mb-4 text-center">Support the Streamer</h2>
            
            <div className="flex items-center gap-3 mb-6">
              <div className="w-16 h-16 rounded-full bg-[#2D2D2D] overflow-hidden border-2 border-orange-500/30">
                <img 
                  src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${streamers[currentIndex]?.id || 'default'}`} 
                  alt="Streamer avatar" 
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">{streamers[currentIndex]?.streamerName}</h3>
                <p className="text-sm text-gray-400">Streaming {streamers[currentIndex]?.gameName}</p>
              </div>
            </div>
            
            <div className="space-y-3 mb-6">
              <button 
                onClick={() => processDonation(500)} 
                disabled={isProcessingPayment}
                className="w-full py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-md transition-colors flex items-center justify-center gap-2 font-bold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isProcessingPayment ? (
                  <>
                    <RefreshCw size={18} className="animate-spin" /> Processing...
                  </>
                ) : (
                  <>
                    <DollarSign size={18} /> Donate with PayPal
                  </>
                )}
              </button>
              
              <button 
                onClick={() => processDonation(500)} 
                disabled={isProcessingPayment}
                className="w-full py-3 bg-[#6F5AFA] hover:bg-[#7C69FF] text-white rounded-md transition-colors flex items-center justify-center gap-2 font-bold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isProcessingPayment ? (
                  <>
                    <RefreshCw size={18} className="animate-spin" /> Processing...
                  </>
                ) : (
                  <>
                    <DollarSign size={18} /> Donate with Clipt Coins
                  </>
                )}
              </button>
            </div>
            
            {/* Donation amounts */}
            <div className="grid grid-cols-3 gap-3 mb-4">
              {[5, 10, 20, 50, 100, 'Custom'].map((amount) => (
                <button 
                  key={amount.toString()}
                  onClick={() => typeof amount === 'number' ? processDonation(amount * 100) : setIsDonateModalOpen(false)}
                  disabled={isProcessingPayment}
                  className="py-2 bg-black/40 hover:bg-orange-500/20 text-white border border-orange-500/30 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {typeof amount === 'number' ? `$${amount}.00` : amount}
                </button>
              ))}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
      
    {/* Subscribe Modal */}
    <Dialog open={isSubscribeModalOpen} onOpenChange={setIsSubscribeModalOpen}>
      <DialogContent className="bg-[#151515] border border-orange-500/30 rounded-lg shadow-[0_0_30px_rgba(255,85,0,0.2)] max-w-md">
        <div>
          <div className="p-4">
            <h2 className="text-xl font-bold text-white mb-4 text-center">Subscribe to {streamers[currentIndex]?.streamerName}</h2>
            
              <div className="flex items-center gap-3 mb-6">
              <div className="w-16 h-16 rounded-full bg-[#2D2D2D] overflow-hidden border-2 border-orange-500/30">
                <img 
                  src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${streamers[currentIndex]?.id || 'default'}`} 
                  alt="Streamer avatar" 
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">{streamers[currentIndex]?.streamerName}</h3>
                <p className="text-sm text-gray-400">Streaming {streamers[currentIndex]?.gameName}</p>
              </div>
            </div>
            
            <h3 className="text-xl text-white mb-4">Choose Your Subscription</h3>
            {paymentError && (
              <div className="p-3 bg-red-900/40 border border-red-500 rounded-lg mb-4 text-white">
                Error: {paymentError}
              </div>
            )}
            
            {isProcessingPayment && (
              <div className="flex items-center justify-center mb-4">
                <RefreshCw size={24} className="animate-spin text-orange-500 mr-2" />
                <p className="text-orange-400">Processing your subscription...</p>
              </div>
            )}
            
            <div className="space-y-6">
              {/* Basic Tier */}
              <div className={`relative p-5 rounded-lg border ${selectedTier === 'Cosmic Supporter' ? 'border-orange-500 bg-orange-500/10' : 'border-gray-700 bg-black/40'} hover:border-orange-500/70 hover:bg-black/60 transition-all ${isProcessingPayment ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                onClick={() => !isProcessingPayment && confirmSubscription('Cosmic Supporter')}
              >
                <div className="flex justify-between items-center mb-3">
                  <h3 className="font-bold text-white text-lg">Cosmic Supporter</h3>
                  <span className="text-orange-400 font-bold">$5.00/month</span>
                </div>
                <p className="text-gray-400 text-sm mb-3">Join the cosmic community with our entry-level subscription plan, perfect for casual viewers who want to support their favorite streamer.</p>
                <ul className="text-gray-300 text-sm space-y-2">
                  <li className="flex items-center gap-2">
                    <span className="text-green-400">✓</span> <strong>Ad-Free Experience:</strong> Enjoy uninterrupted streaming without any ads
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-green-400">✓</span> <strong>Subscriber Badge:</strong> Stand out in chat with a special supporter badge
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-green-400">✓</span> <strong>Custom Emotes:</strong> Access to 10 unique space-themed emotes
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-green-400">✓</span> <strong>Sub-Only Chat:</strong> Participate in subscriber-only chat sessions
                  </li>
                </ul>
              </div>
              
              {/* Premium Tier */}
              <div className={`relative p-5 rounded-lg border ${selectedTier === 'Galactic VIP' ? 'border-orange-500 bg-orange-500/10' : 'border-gradient-cosmos'} hover:border-orange-500/70 hover:bg-black/60 transition-all ${isProcessingPayment ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                onClick={() => !isProcessingPayment && confirmSubscription('Galactic VIP')}
                style={selectedTier !== 'Galactic VIP' ? {
                  background: 'linear-gradient(45deg, rgba(0,0,0,0.8), rgba(55,0,110,0.3))',
                  borderImage: 'linear-gradient(45deg, #FF5500, #9900FF) 1',
                  borderStyle: 'solid'
                } : {}}
              >
                <div className="absolute -right-2 -top-2 bg-gradient-to-r from-orange-500 to-purple-600 text-white text-xs font-bold py-1 px-3 rounded-full">PREMIUM</div>
                <div className="flex justify-between items-center mb-3">
                  <h3 className="font-bold text-white text-lg">Galactic VIP</h3>
                  <span className="text-orange-400 font-bold">$14.00/month</span>
                </div>
                <p className="text-gray-400 text-sm mb-3">For true cosmic enthusiasts! Get VIP treatment with exclusive perks and maximum support for your favorite streamer.</p>
                <ul className="text-gray-300 text-sm space-y-2">
                  <li className="flex items-center gap-2">
                    <span className="text-green-400">✓</span> <strong>Everything in Cosmic Supporter tier</strong>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-green-400">✓</span> <strong>Priority Chat Highlighting:</strong> Your messages stand out in chat with special colors
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-green-400">✓</span> <strong>Exclusive Monthly Streams:</strong> Access to VIP-only streams and cosmic events
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-green-400">✓</span> <strong>Enhanced Emote Package:</strong> Access to 25+ premium animated emotes
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-green-400">✓</span> <strong>Discord Integration:</strong> Exclusive access to private Discord channels
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-green-400">✓</span> <strong>Game Priority:</strong> First in line for subscriber games and events
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>

    {/* Chat Box Panel */}
    <AnimatePresence>
      {isChatOpen && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: '50vh', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.3 }}
          style={{
            position: 'absolute' as any,
            bottom: 0,
            left: 0,
            right: 0,
            backgroundColor: '#0D0D0D',
            borderTop: '1px solid rgba(255,85,0,0.3)',
            zIndex: 50,
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column' as any
          }}
        >
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '12px 20px',
            borderBottom: '1px solid rgba(255,85,0,0.2)'
          }}>
            <h3 style={{ color: 'white', margin: 0, fontSize: '16px' }}>Live Chat</h3>
            <button 
              onClick={handleChatToggle}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#999',
                cursor: 'pointer',
                padding: '5px'
              }}
            >
              <X size={20} />
            </button>
          </div>
            
            <div 
              ref={chatContainerRef}
              style={{
                flex: 1,
                overflowY: 'auto',
                padding: '10px 20px',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px'
              }}
            >
              {chatMessages.map((msg, i) => (
                <div key={i} style={{
                  display: 'flex',
                  flexDirection: 'column'
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}>
                    <span style={{
                      color: msg.user === streamers[currentIndex]?.streamerName ? '#FF5500' : '#6F5AFA',
                      fontWeight: 'bold',
                      fontSize: '14px'
                    }}>{msg.user}</span>
                    <span style={{ color: '#777', fontSize: '12px' }}>{msg.time}</span>
                  </div>
                  <p style={{ color: msg.system ? 'rgba(255,85,0,0.7)' : 'white', margin: '2px 0 0 0', fontSize: '15px', fontStyle: msg.system ? 'italic' : 'normal' }}>{msg.message}</p>
                </div>
              ))}
            </div>
            
            <div style={{
              display: 'flex',
              padding: '12px 16px',
              borderTop: '1px solid rgba(255,85,0,0.2)',
              background: 'rgba(20,20,20,0.7)'
            }}>
              <input
                value={currentMessage}
                onChange={(e) => setCurrentMessage(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && sendChatMessage()}
                placeholder="Send a message..."
                style={{
                  flex: 1,
                  background: 'rgba(30,30,30,0.8)',
                  border: '1px solid rgba(255,85,0,0.3)',
                  borderRadius: '20px',
                  padding: '10px 16px',
                  color: 'white',
                  outline: 'none'
                }}
              />
              <button
                onClick={sendChatMessage}
                style={{
                  background: 'rgba(255,85,0,0.2)',
                  border: '1px solid rgba(255,85,0,0.5)',
                  borderRadius: '50%',
                  width: '40px',
                  height: '40px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginLeft: '10px',
                  color: '#FF5500',
                  cursor: 'pointer'
                }}
              >
                <Send size={18} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </StreamContainer>
  );
};

export default AllStreamers;
