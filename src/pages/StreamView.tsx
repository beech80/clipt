import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { loadStripe } from '@stripe/stripe-js';
import { BackButton } from '@/components/ui/back-button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { EnhancedStreamPlayer } from '@/components/streaming/EnhancedStreamPlayer';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, Share2, Heart, MessageSquare, Gamepad2, Zap, Trophy, Users, Sword, Eye, Scissors, DollarSign, Bell, X } from 'lucide-react';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerClose } from '@/components/ui/drawer';
import PushNotificationTest from '@/components/PushNotificationTest';
import styled, { keyframes } from 'styled-components';

// Follow service for managing follow relationships
const followService = {
  follow: async (followerId: string, followeeId: string) => {
    const { error } = await supabase
      .from('follows')
      .insert({ follower_id: followerId, following_id: followeeId });
    
    if (error) throw error;
    return true;
  },
  
  unfollow: async (followerId: string, followeeId: string) => {
    const { error } = await supabase
      .from('follows')
      .delete()
      .match({ follower_id: followerId, following_id: followeeId });
    
    if (error) throw error;
    return true;
  }
};

interface StreamData {
  id: string;
  title: string;
  user_id: string;
  viewer_count: number;
  started_at: string;
  game_id?: string;
  game_name?: string;
  thumbnail_url?: string;
}

interface StreamerProfile {
  id: string;
  username: string;
  display_name?: string;
  avatar_url?: string;
  followers_count?: number;
  is_following?: boolean;
}

const scanline = keyframes`
  0% {
    transform: translateY(-100%);
  }
  100% {
    transform: translateY(100%);
  }
`;

const glitch = keyframes`
  0% {
    transform: translate(0);
  }
  20% {
    transform: translate(-2px, 2px);
  }
  40% {
    transform: translate(-2px, -2px);
  }
  60% {
    transform: translate(2px, 2px);
  }
  80% {
    transform: translate(2px, -2px);
  }
  100% {
    transform: translate(0);
  }
`;

const flicker = keyframes`
  0% { opacity: 0.97; }
  5% { opacity: 0.95; }
  10% { opacity: 0.9; }
  15% { opacity: 0.85; }
  20% { opacity: 0.95; }
  25% { opacity: 0.85; }
  30% { opacity: 0.9; }
  35% { opacity: 0.95; }
  40% { opacity: 0.85; }
  45% { opacity: 0.9; }
  50% { opacity: 0.95; }
  55% { opacity: 0.85; }
  60% { opacity: 0.9; }
  65% { opacity: 0.95; }
  70% { opacity: 0.9; }
  75% { opacity: 0.85; }
  100% { opacity: 0.97; }
  80% { opacity: 0.9; }
  85% { opacity: 0.95; }
  90% { opacity: 0.9; }
  95% { opacity: 0.85; }
  100% { opacity: 0.9; }
`;

const RetroContainer = styled.div`
  ::-webkit-scrollbar {
    display: none;
  }
  
  .hide-scrollbar {
    -ms-overflow-style: none;
    scrollbar-width: none;
    &::-webkit-scrollbar {
      display: none;
    }
  }
  background: #0C0C0C;
  min-height: 100vh;
  position: relative;
  overflow: hidden;
  padding: 20px;
  color: #fff;
  
  &:before {
    content: '';
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: radial-gradient(
      circle at 50% 50%,
      rgba(255, 85, 0, 0.03) 0%,
      transparent 70%
    );
    animation: ${scanline} 8s linear infinite;
    pointer-events: none;
    z-index: 1;
  }
  
  &::after {
    content: '';
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(18, 16, 16, 0.1);
    opacity: 0;
    animation: ${flicker} 0.3s infinite;
    pointer-events: none;
    z-index: 1;
  }
`;

const RetroTitle = styled.h1`
  font-size: 2.5rem;
  font-weight: bold;
  text-align: center;
  margin-bottom: 2rem;
  color: #FF5500;
  text-shadow: 0 0 10px rgba(255, 85, 0, 0.5);
  position: relative;
  animation: ${glitch} 3s infinite;
  
  &:before,
  &:after {
    content: attr(data-text);
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    clip: rect(0, 900px, 0, 0);
  }

  &:before {
    text-shadow: -2px 0 #0ff;
    animation: ${glitch} 3s infinite;
    animation-delay: -1s;
  }

  &:after {
    text-shadow: 2px 0 #f0f;
    animation: ${glitch} 3s infinite;
    animation-delay: -2s;
  }
  font-family: 'Press Start 2P', system-ui;
`;

const StreamView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [stream, setStream] = useState<StreamData | null>(null);
  const [streamer, setStreamer] = useState<StreamerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [followLoading, setFollowLoading] = useState(false);
  const [showAchievement, setShowAchievement] = useState(false);
  const [showBoostModal, setShowBoostModal] = useState(false);
  const [selectedBoost, setSelectedBoost] = useState<string | null>(null);
  const [tokenBalance, setTokenBalance] = useState(200);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isDonateModalOpen, setIsDonateModalOpen] = useState(false);
  const [donationAmount, setDonationAmount] = useState<string>('5');
  const [donationMessage, setDonationMessage] = useState<string>('');
  const [isCliptModalOpen, setIsCliptModalOpen] = useState(false);
  const [clipDuration, setClipDuration] = useState<string>('30');
  const [notificationDrawerOpen, setNotificationDrawerOpen] = useState(false);

  useEffect(() => {
    const fetchStreamData = async () => {
      try {
        setLoading(true);
        
        if (!id) {
          toast.error('Stream ID not provided');
          navigate('/discovery');
          return;
        }
        
        // DEMO MODE: Create fake stream data since this is a demo
        // In a real application, you would fetch from the database
        const demoStreamData = {
          id: id,
          title: 'LIVE GAMING STREAM - Playing the latest hits!',
          user_id: id,
          viewer_count: Math.floor(Math.random() * 50000) + 5000,
          started_at: new Date().toISOString(),
          game_name: 'Fortnite',
          thumbnail_url: '/demo-thumbnail.jpg'
        };
        
        setStream(demoStreamData);

        // DEMO MODE: Create fake streamer profile data
        // Map common streamer IDs to proper data
        const streamerMap: Record<string, any> = {
          'ninja_123': {
            name: 'Ninja',
            avatar: 'https://static-cdn.jtvnw.net/jtv_user_pictures/ninja-profile_image-0c9e41f5c0bf1585-300x300.png',
          },
          'pokimane_456': {
            name: 'Pokimane',
            avatar: 'https://static-cdn.jtvnw.net/jtv_user_pictures/pokimane-profile_image-5e0c8c07cd69e392-300x300.png',
          },
          'drdisrespect_789': {
            name: 'DrDisrespect',
            avatar: 'https://static-cdn.jtvnw.net/jtv_user_pictures/drdisrespect-profile_image-abc1fc67d2ea1ae1-300x300.png',
          },
          'shroud_101': {
            name: 'Shroud',
            avatar: 'https://static-cdn.jtvnw.net/jtv_user_pictures/shroud-profile_image-8e82d2e9bd839842-300x300.png',
          },
          'tfue_202': {
            name: 'Tfue',
            avatar: 'https://static-cdn.jtvnw.net/jtv_user_pictures/tfue-profile_image-b39c3b7f89736d77-300x300.png',
          },
          'thegrefg_303': {
            name: 'TheGrefg',
            avatar: 'https://static-cdn.jtvnw.net/jtv_user_pictures/thegrefg-profile_image-2c3bbc8cd193eae3-300x300.png',
          },
          'markiplier_404': {
            name: 'Markiplier',
            avatar: 'https://static-cdn.jtvnw.net/jtv_user_pictures/markiplier-profile_image-f258c5b7fc43d960-300x300.png',
          },
          'xqc_505': {
            name: 'xQc',
            avatar: 'https://static-cdn.jtvnw.net/jtv_user_pictures/xqc-profile_image-9298dca608632101-300x300.jpeg',
          },
          'default': {
            name: 'Streamer',
            avatar: 'https://static-cdn.jtvnw.net/jtv_user_pictures/asmongold-profile_image-f7ddcbd0332f5d28-300x300.png',
          }
        };
        
        const streamerInfo = streamerMap[id] || streamerMap['default'];
        
        // Create streamer profile with demo data
        setStreamer({
          id: id,
          username: streamerInfo.name.toLowerCase(),
          display_name: streamerInfo.name,
          avatar_url: streamerInfo.avatar,
          followers_count: Math.floor(Math.random() * 500000) + 10000,
          is_following: Math.random() > 0.5
        });

      } catch (error) {
        console.error('Error setting up demo data:', error);
        // Create minimal demo data even if there's an error
        setStream({
          id: id || 'demo_stream',
          title: 'Demo Stream',
          user_id: id || 'demo_user',
          viewer_count: 1234,
          started_at: new Date().toISOString(),
        });
        
        setStreamer({
          id: id || 'demo_user',
          username: 'streamer',
          display_name: 'Demo Streamer',
          avatar_url: 'https://static-cdn.jtvnw.net/jtv_user_pictures/asmongold-profile_image-f7ddcbd0332f5d28-300x300.png',
          followers_count: 5000,
          is_following: false
        });
      } finally {
        setLoading(false);
      }
    };

    fetchStreamData();

    // In a real app, we would set up real-time listeners here
    // But for the demo, we'll skip that
  }, [id, user, navigate]);

  const handleFollowToggle = async () => {
    if (!user || !streamer) return;
    
    try {
      setFollowLoading(true);
      
      if (streamer.is_following) {
        await followService.unfollow(user.id, streamer.id);
        setStreamer(prev => prev ? {
          ...prev,
          is_following: false,
          followers_count: (prev.followers_count || 0) - 1
        } : null);
        toast.success(`Unfollowed @${streamer.username}`);
      } else {
        await followService.follow(user.id, streamer.id);
        setStreamer(prev => prev ? {
          ...prev,
          is_following: true,
          followers_count: (prev.followers_count || 0) + 1
        } : null);
        toast.success(`Following @${streamer.username}`);
      }
      
    } catch (error) {
      console.error('Error toggling follow:', error);
      toast.error('Failed to update follow status');
    } finally {
      setFollowLoading(false);
    }
  };

  const handleShareStream = () => {
    setIsShareModalOpen(true);
  };
  
  const handleShareVia = (platform: string) => {
    const url = window.location.href;
    const streamTitle = stream?.title || 'Live Stream';
    const streamerName = streamer?.display_name || streamer?.username || 'Streamer';
    const text = `Check out ${streamerName}'s stream: ${streamTitle}`;
    
    let shareUrl = '';
    
    switch(platform) {
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`;
        break;
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
        break;
      case 'reddit':
        shareUrl = `https://www.reddit.com/submit?url=${encodeURIComponent(url)}&title=${encodeURIComponent(text)}`;
        break;
      case 'discord':
        shareUrl = `https://discord.com/channels/@me`; // Discord doesn't have a direct share URL, this would open Discord
        navigator.clipboard.writeText(`${text} ${url}`);
        toast.success('Stream link copied for Discord!');
        break;
      case 'copy':
        navigator.clipboard.writeText(url);
        toast.success('Stream URL copied to clipboard');
        break;
      case 'sms':
        shareUrl = `sms:?body=${encodeURIComponent(`${text} ${url}`)}`;  
        break;
      default:
        navigator.clipboard.writeText(url);
        toast.success('Stream URL copied to clipboard');
    }
    
    if (shareUrl && platform !== 'copy' && platform !== 'discord') {
      window.open(shareUrl, '_blank');
    }
    
    setIsShareModalOpen(false);
  };

  const handleMessageStreamer = () => {
    if (!streamer) return;
    navigate(`/messages?user=${streamer.id}`);
  };

  const handleDonate = () => {
    if (!streamer) return;
    setIsDonateModalOpen(true);
  };
  
  const submitDonation = async () => {
    if (!streamer) return;
    
    const amount = parseFloat(donationAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error('Please enter a valid donation amount');
      return;
    }
    
    try {
      // Show loading state
      toast.loading('Processing donation...');
      
      // Call our backend API to create a Stripe checkout session
      const response = await fetch('/api/create-donation-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: amount * 100, // Convert to cents for Stripe
          streamerName: streamer.display_name || streamer.username,
          streamerId: streamer.id,
          message: donationMessage
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to process donation');
      }

      const { sessionId } = await response.json();
      
      // Load Stripe and redirect to checkout
      const stripe = await loadStripe(import.meta.env.VITE_STRIPE_PUB);
      if (!stripe) throw new Error('Failed to load Stripe');
      
      const result = await stripe.redirectToCheckout({ sessionId });
      
      if (result.error) {
        throw new Error(result.error.message);
      }
      
      // Close modal
      setIsDonateModalOpen(false);
      
      // Reset donation form (this will only happen if the redirect fails)
      setDonationAmount('5');
      setDonationMessage('');
      
    } catch (error) {
      toast.dismiss();
      toast.error(`Donation failed: ${error.message}`);
      console.error('Donation error:', error);
    }
  };

  const handleCliptStream = () => {
    if (!streamer) return;
    setIsCliptModalOpen(true);
  };
  
  const createClip = () => {
    if (!streamer) return;
    
    const duration = parseInt(clipDuration);
    if (isNaN(duration) || duration <= 0 || duration > 60) {
      toast.error('Please enter a valid clip duration between 1-60 seconds');
      return;
    }
    
    // Create visual effect for clipping
    const videoElement = document.querySelector('video');
    if (videoElement) {
      // Flash effect
      const flashElement = document.createElement('div');
      flashElement.className = 'absolute inset-0 bg-white z-50';
      flashElement.style.opacity = '0.8';
      videoElement.parentElement?.appendChild(flashElement);
      
      // Animate flash and remove
      setTimeout(() => {
        flashElement.style.transition = 'opacity 0.5s';
        flashElement.style.opacity = '0';
        setTimeout(() => videoElement.parentElement?.removeChild(flashElement), 500);
      }, 100);
      
      // Show clip created message
      toast.success(`${duration}-second clip created! Saved to your library.`);
      
      // Add clip notification
      const clipNotification = document.createElement('div');
      clipNotification.className = 'fixed top-20 right-4 bg-black/80 border border-orange-500/30 text-white px-4 py-3 rounded-lg shadow-lg z-50';
      clipNotification.innerHTML = `
        <div class="flex items-center gap-2">
          <span class="text-orange-500"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 6H9a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h7l4-4V8a2 2 0 0 0-2-2Z"/><path d="M15 13h3"/></svg></span>
          <div>
            <p class="font-bold">Clip Created!</p>
            <p class="text-sm">${duration}-second clip from ${streamer?.display_name || streamer?.username}'s stream</p>
          </div>
        </div>
      `;
      document.body.appendChild(clipNotification);
      
      // Remove notification after delay
      setTimeout(() => {
        clipNotification.style.transition = 'opacity 0.5s, transform 0.5s';
        clipNotification.style.opacity = '0';
        clipNotification.style.transform = 'translateX(100%)';
        setTimeout(() => document.body.removeChild(clipNotification), 500);
      }, 4000);
      
      setIsCliptModalOpen(false);
    }
  };

  if (loading) {
    return (
      <RetroContainer className="flex items-center justify-center">
        <Loader2 className="h-12 w-12 text-orange-500 animate-spin" />
        <p className="mt-4 text-orange-500/70">Loading stream...</p>
      </RetroContainer>
    );
  }

  return (
    <RetroContainer>
      {/* Header */}
      <div className="relative mb-4 overflow-hidden">
        <RetroTitle 
          data-text={streamer?.display_name || streamer?.username || 'LIVE STREAM'}
          onClick={() => streamer?.id && navigate(`/profile/${streamer.id}`)}
          className="cursor-pointer hover:text-orange-400 transition-colors"
        >
          {streamer?.display_name || streamer?.username || 'Streamer'}
        </RetroTitle>
        <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_50%_50%,rgba(255,85,0,0.1),transparent_70%)] animate-pulse" />
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto">
        {loading ? (
          <div className="h-80 flex flex-col items-center justify-center">
            <Loader2 className="h-12 w-12 text-orange-500 animate-spin" />
            <p className="mt-4 text-orange-500/70">Loading stream...</p>
          </div>
        ) : (
          <>
            {/* Stream Title */}
            <div className="mb-4 text-center">
              <h2 className="text-white text-md font-bold px-4 py-2 bg-black/60 rounded-lg border-l-4 border-orange-500/30 shadow-[0_0_15px_rgba(255,85,0,0.2)]">
                {stream?.title || 'Live Stream'}
              </h2>
            </div>

            {/* Stream Player - Full Screen */}
            <div className="relative rounded-lg overflow-hidden border-2 border-orange-500/30 shadow-[0_0_25px_rgba(255,85,0,0.15)]" style={{ height: 'calc(100vh - 220px)' }}>
              {/* Video Element */}
              <video 
                className="w-full h-full object-cover" 
                autoPlay 
                loop 
                muted
                playsInline
              >
                <source src="https://assets.mixkit.co/videos/preview/mixkit-person-playing-a-game-on-a-video-game-console-3434-large.mp4" type="video/mp4" />
                Your browser does not support the video tag.
              </video>
              
              {/* LIVE Indicator */}
              <div className="absolute top-4 right-4 bg-red-500 px-2 py-1 rounded-full text-xs font-bold animate-pulse">LIVE</div>
              
              {/* Scanlines Effect */}
              <div className="absolute inset-0 bg-[linear-gradient(to_bottom,transparent_50%,rgba(0,0,0,0.1)_50%)] bg-[length:100%_4px] pointer-events-none opacity-20"></div>
              
              {/* Bottom Glow */}
              <div className="absolute bottom-0 w-full h-[1px] bg-gradient-to-r from-transparent via-orange-500/60 to-transparent" />
            </div>
            
            {/* Footer Controls - Same as Discovery Page */}
             <div className="mt-4 flex justify-center gap-3 mb-6 flex-wrap">
          <Button 
            className="bg-orange-500/20 border-orange-500/30 text-orange-500 hover:bg-orange-500/30 flex items-center gap-1"
            onClick={() => navigate('/game-menu')}
          >
            <Gamepad2 className="h-4 w-4" />
            Game Menu
          </Button>
              <Button
                variant="outline"
                size="sm"
                className="bg-orange-500/20 border-orange-500/30 text-orange-500 hover:bg-orange-500/30 flex items-center gap-1"
                onClick={handleFollowToggle}
                disabled={followLoading}
              >
                {followLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Heart className="h-4 w-4" fill={streamer?.is_following ? "#FF5500" : "none"} />
                )}
                {streamer?.is_following ? 'Following' : 'Follow'}
              </Button>
              
              {!isChatOpen && (
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-orange-500/20 border-orange-500/30 text-orange-500 hover:bg-orange-500/30 flex items-center gap-1"
                  onClick={() => setIsChatOpen(true)}
                >
                  <MessageSquare className="h-4 w-4" />
                  Chat
                </Button>
              )}
              
              <Button
                variant="outline"
                size="sm"
                className="bg-orange-500/20 border-orange-500/30 text-orange-500 hover:bg-orange-500/30 flex items-center gap-1"
                onClick={handleDonate}
              >
                <DollarSign className="h-4 w-4" />
                Donate
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                className="bg-orange-500/20 border-orange-500/30 text-orange-500 hover:bg-orange-500/30 flex items-center gap-1"
                onClick={handleCliptStream}
              >
                <Scissors className="h-4 w-4" />
                Clipt
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                className="bg-orange-500/20 border-orange-500/30 text-orange-500 hover:bg-orange-500/30 flex items-center gap-1"
                onClick={handleShareStream}
              >
                <Share2 className="h-4 w-4" />
                Share
              </Button>

              <Button
                variant="outline"
                size="sm"
                className="bg-purple-500/20 border-purple-500/30 text-purple-500 hover:bg-purple-500/30 flex items-center gap-1"
                onClick={() => setShowBoostModal(true)}
              >
                <Zap className="h-4 w-4" />
                Boost
              </Button>
              <div className="stream-actions">
                <Button
                  variant={streamer?.is_following ? "outline" : "default"}
                  size="sm"
                  disabled={followLoading}
                  onClick={handleFollowToggle}
                  className="retro-button follow-button"
                >
                  {followLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  {streamer?.is_following ? "Following" : "Follow"}
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setNotificationDrawerOpen(true)}
                  className="retro-button notification-button ml-2"
                  title="Enable stream notifications"
                >
                  <Bell className="h-4 w-4" />
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleShareStream}
                  className="retro-button share-button"
                >
                  <Share2 className="mr-2 h-4 w-4" />
                  Share
                </Button>
              </div>
            </div>
            
            {/* Chat Panel */}
            {isChatOpen && (
              <div className="mt-6 w-full bg-black/90 border-2 border-orange-500/50 rounded-lg overflow-hidden">
                <div className="relative">
                  {/* Chat Header */}
                  <div className="flex justify-between items-center p-2 border-b border-orange-500/30">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="h-4 w-4 text-orange-500" />
                      <h3 className="font-medium text-orange-500">Live Chat</h3>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-6 w-6 p-0 text-orange-500 hover:bg-orange-500/10"
                      onClick={() => setIsChatOpen(false)}
                    >
                      <span className="sr-only">Close</span>
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                    </Button>
                  </div>
                  
                  {/* Chat Messages */}
                  <div className="h-64 overflow-y-auto p-4 hide-scrollbar">
                    <div className="space-y-3">
                      {/* Demo Messages */}
                      <div className="flex items-start gap-2">
                        <div 
                          className="w-6 h-6 rounded-full bg-purple-500 flex-shrink-0 overflow-hidden cursor-pointer hover:ring-2 hover:ring-purple-400 transition-all" 
                          onClick={() => navigate(`/profile/gamerx32`)}
                        >
                          <img src="https://randomuser.me/api/portraits/men/32.jpg" alt="User" className="w-full h-full object-cover" />
                        </div>
                        <div>
                          <p 
                            className="text-xs text-purple-400 font-medium cursor-pointer hover:underline" 
                            onClick={() => navigate(`/profile/gamerx32`)}
                          >GamerX32</p>
                          <p className="text-sm text-white">This stream is 🔥! How long have you been playing this game?</p>
                        </div>
                      </div>
                      
                      <div className="flex items-start gap-2">
                        <div 
                          className="w-6 h-6 rounded-full bg-green-500 flex-shrink-0 overflow-hidden cursor-pointer hover:ring-2 hover:ring-green-400 transition-all" 
                          onClick={() => navigate(`/profile/streamqueen`)}
                        >
                          <img src="https://randomuser.me/api/portraits/women/44.jpg" alt="User" className="w-full h-full object-cover" />
                        </div>
                        <div>
                          <p 
                            className="text-xs text-green-400 font-medium cursor-pointer hover:underline" 
                            onClick={() => navigate(`/profile/streamqueen`)}
                          >StreamQueen</p>
                          <p className="text-sm text-white">Just subscribed! Can't wait to see more content!</p>
                        </div>
                      </div>
                      
                      <div className="flex items-start gap-2">
                        <div 
                          className="w-6 h-6 rounded-full bg-blue-500 flex-shrink-0 overflow-hidden cursor-pointer hover:ring-2 hover:ring-blue-400 transition-all" 
                          onClick={() => navigate(`/profile/progamer99`)}
                        >
                          <img src="https://randomuser.me/api/portraits/men/67.jpg" alt="User" className="w-full h-full object-cover" />
                        </div>
                        <div>
                          <p 
                            className="text-xs text-blue-400 font-medium cursor-pointer hover:underline" 
                            onClick={() => navigate(`/profile/progamer99`)}
                          >ProGamer99</p>
                          <p className="text-sm text-white">Try using the new strategy from yesterday's tournament!</p>
                        </div>
                      </div>
                      
                      <div className="flex items-start gap-2">
                        <div 
                          className="w-6 h-6 rounded-full bg-yellow-500 flex-shrink-0 overflow-hidden cursor-pointer hover:ring-2 hover:ring-yellow-400 transition-all" 
                          onClick={() => navigate(`/profile/gamedevartist`)}
                        >
                          <img src="https://randomuser.me/api/portraits/women/22.jpg" alt="User" className="w-full h-full object-cover" />
                        </div>
                        <div>
                          <p 
                            className="text-xs text-yellow-400 font-medium cursor-pointer hover:underline" 
                            onClick={() => navigate(`/profile/gamedevartist`)}
                          >GameDevArtist</p>
                          <p className="text-sm text-white">The graphics in this game are amazing! What settings are you using?</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Chat Input */}
                  <div className="absolute bottom-0 left-0 right-0 p-2 border-t border-orange-500/30">
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        placeholder="Type a message..." 
                        className="flex-1 bg-black/50 border border-orange-500/30 rounded-md px-3 py-1 text-sm text-white focus:outline-none focus:border-orange-500/70"
                      />
                      <Button
                        size="sm"
                        className="bg-orange-500/20 hover:bg-orange-500/30 text-orange-500"
                      >
                        Send
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Donation Modal */}
            {isDonateModalOpen && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setIsDonateModalOpen(false)}>
                <div className="bg-black border border-orange-500 rounded-lg p-4 w-80" onClick={(e) => e.stopPropagation()}>
                  <h3 className="text-white font-bold mb-4 text-center">Support {streamer?.display_name || streamer?.username}</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="donation-amount" className="block text-sm font-medium text-orange-500 mb-1">Donation Amount ($)</label>
                      <div className="relative">
                        <span className="absolute inset-y-0 left-3 flex items-center text-white">$</span>
                        <input
                          id="donation-amount"
                          type="number"
                          min="1"
                          max="1000"
                          value={donationAmount}
                          onChange={(e) => setDonationAmount(e.target.value)}
                          className="w-full bg-black/50 border border-orange-500/30 rounded-md pl-8 pr-3 py-2 text-white focus:outline-none focus:border-orange-500/70"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label htmlFor="donation-message" className="block text-sm font-medium text-orange-500 mb-1">Message (Optional)</label>
                      <textarea
                        id="donation-message"
                        value={donationMessage}
                        onChange={(e) => setDonationMessage(e.target.value)}
                        placeholder="Add a message to your donation"
                        className="w-full bg-black/50 border border-orange-500/30 rounded-md px-3 py-2 text-white focus:outline-none focus:border-orange-500/70 h-20 resize-none"
                      />
                    </div>
                    
                    <div className="flex justify-center gap-3 mt-4">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="text-orange-500 hover:bg-orange-500/10"
                        onClick={() => setIsDonateModalOpen(false)}
                      >
                        Cancel
                      </Button>
                      
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="bg-orange-500/20 border-orange-500/30 text-orange-500 hover:bg-orange-500/30"
                        onClick={submitDonation}
                        disabled={parseFloat(donationAmount) <= 0}
                      >
                        Donate
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Clip Modal */}
            {isCliptModalOpen && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setIsCliptModalOpen(false)}>
                <div className="bg-black border border-orange-500 rounded-lg p-4 w-80" onClick={(e) => e.stopPropagation()}>
                  <h3 className="text-white font-bold mb-4 text-center">Create Clip</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="clip-duration" className="block text-sm font-medium text-orange-500 mb-1">Clip Duration (seconds)</label>
                      <div className="relative">
                        <input
                          id="clip-duration"
                          type="number"
                          min="1"
                          max="60"
                          value={clipDuration}
                          onChange={(e) => setClipDuration(e.target.value)}
                          className="w-full bg-black/50 border border-orange-500/30 rounded-md px-3 py-2 text-white focus:outline-none focus:border-orange-500/70"
                        />
                      </div>
                      <p className="text-xs text-orange-500/70 mt-1">Choose duration between 1-60 seconds</p>
                    </div>
                    
                    <div className="flex justify-center gap-3 mt-4">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="text-orange-500 hover:bg-orange-500/10"
                        onClick={() => setIsCliptModalOpen(false)}
                      >
                        Cancel
                      </Button>
                      
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="bg-orange-500/20 border-orange-500/30 text-orange-500 hover:bg-orange-500/30"
                        onClick={createClip}
                      >
                        Create Clip
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Share Modal */}
            {isShareModalOpen && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setIsShareModalOpen(false)}>
                <div className="bg-black border border-orange-500 rounded-lg p-4 w-80" onClick={(e) => e.stopPropagation()}>
                  <h3 className="text-white font-bold mb-4 text-center">Share Stream</h3>
                  
                  <div className="grid grid-cols-3 gap-4">
                    <button 
                      className="flex flex-col items-center gap-1 p-2 hover:bg-orange-500/10 rounded-lg transition-colors"
                      onClick={() => handleShareVia('twitter')}
                    >
                      <div className="w-8 h-8 rounded-full bg-blue-400 flex items-center justify-center text-white">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"/></svg>
                      </div>
                      <span className="text-xs text-white">Twitter</span>
                    </button>
                    
                    <button 
                      className="flex flex-col items-center gap-1 p-2 hover:bg-orange-500/10 rounded-lg transition-colors"
                      onClick={() => handleShareVia('facebook')}
                    >
                      <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
                      </div>
                      <span className="text-xs text-white">Facebook</span>
                    </button>
                    
                    <button 
                      className="flex flex-col items-center gap-1 p-2 hover:bg-orange-500/10 rounded-lg transition-colors"
                      onClick={() => handleShareVia('reddit')}
                    >
                      <div className="w-8 h-8 rounded-full bg-orange-600 flex items-center justify-center text-white">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M16 12a4 4 0 0 0-8 0"/><path d="M9 8a1 1 0 1 0 0-2 1 1 0 0 0 0 2z"/><path d="M15 8a1 1 0 1 0 0-2 1 1 0 0 0 0 2z"/><path d="M9 12s1-1 3-1 3 1 3 1"/></svg>
                      </div>
                      <span className="text-xs text-white">Reddit</span>
                    </button>
                    
                    <button 
                      className="flex flex-col items-center gap-1 p-2 hover:bg-orange-500/10 rounded-lg transition-colors"
                      onClick={() => handleShareVia('discord')}
                    >
                      <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 17a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v.088M16 17a2 2 0 0 0 2 2h3a2 2 0 0 0 2-2v-8a2 2 0 0 0-2-2h-3a2 2 0 0 0-2 2v.088"/><path d="M12 17V9" /><path d="M22 12H2" /></svg>
                      </div>
                      <span className="text-xs text-white">Discord</span>
                    </button>
                    
                    <button 
                      className="flex flex-col items-center gap-1 p-2 hover:bg-orange-500/10 rounded-lg transition-colors"
                      onClick={() => handleShareVia('sms')}
                    >
                      <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center text-white">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2"/><path d="M21 11V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h4"/><line x1="7" y1="19" x2="11" y2="19"/></svg>
                      </div>
                      <span className="text-xs text-white">Text</span>
                    </button>
                    
                    <button 
                      className="flex flex-col items-center gap-1 p-2 hover:bg-orange-500/10 rounded-lg transition-colors"
                      onClick={() => handleShareVia('copy')}
                    >
                      <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center text-white">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
                      </div>
                      <span className="text-xs text-white">Copy Link</span>
                    </button>
                  </div>
                  
                  <div className="mt-4 flex justify-center">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      className="text-white hover:bg-orange-500/10"
                      onClick={() => setIsShareModalOpen(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </RetroContainer>
  );
};

export default StreamView;
