import React, { useEffect, useRef, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Gift, MessageSquare, Video, Volume2, VolumeX, Users, Trophy, Zap, Heart, Share2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import Hls from 'hls.js';
import { generatePlaybackUrl } from '@/config/streamingConfig';
import { motion, AnimatePresence } from 'framer-motion';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';

interface StreamMessage {
  id: string;
  message: string;
  user_id: string;
  created_at: string;
  profiles: {
    username: string | null;
    avatar_url: string | null;
  };
}

interface StreamGift {
  id: string;
  amount: number;
  sender_id: string;
  message?: string;
  created_at: string;
  profiles: {
    username: string;
    avatar_url: string | null;
  };
}

interface EnhancedStreamPlayerProps {
  streamId: string;
  onClipCreate?: (startTime: number, endTime: number) => void;
  // Cloudflare specific properties
  cfStreamKey?: string;
  cfAccountId?: string;
  quality?: 'auto' | '1080p' | '720p' | '480p' | '360p';
  isCloudflareStream?: boolean;
}

export const EnhancedStreamPlayer = ({ 
  streamId, 
  onClipCreate,
  cfStreamKey,
  cfAccountId,
  quality = 'auto',
  isCloudflareStream = true
}: EnhancedStreamPlayerProps) => {
  const { user } = useAuth();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [message, setMessage] = useState('');
  const [giftAmount, setGiftAmount] = useState<number>(5);
  const [giftMessage, setGiftMessage] = useState('');
  const [viewerCount, setViewerCount] = useState(0);
  const [isClipping, setIsClipping] = useState(false);
  const clipStartTimeRef = useRef<number>(0);

  // Fetch stream details
  const { data: stream } = useQuery({
    queryKey: ['stream', streamId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('streams')
        .select('*')
        .eq('id', streamId)
        .single();

      if (error) throw error;
      return data;
    }
  });

  // Fetch chat messages
  const { data: messages } = useQuery({
    queryKey: ['stream-chat', streamId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('stream_chat')
        .select(`
          id,
          message,
          user_id,
          created_at,
          profiles:user_id (
            username,
            avatar_url
          )
        `)
        .eq('stream_id', streamId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data as unknown as StreamMessage[];
    },
    refetchInterval: 1000
  });

  // Fetch gifts
  const { data: gifts } = useQuery({
    queryKey: ['stream-gifts', streamId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('stream_gifts')
        .select(`
          id,
          amount,
          sender_id,
          message,
          created_at,
          profiles:sender_id (username, avatar_url)
        `)
        .eq('stream_id', streamId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as StreamGift[];
    },
    refetchInterval: 1000
  });

  // Initialize HLS player with Cloudflare Stream optimizations
  useEffect(() => {
    if (!videoRef.current) return;
    
    let streamUrl = stream?.stream_url;
    
    // If using Cloudflare Stream, generate URL from streamId
    if (isCloudflareStream) {
      // Generate Cloudflare Stream URL
      streamUrl = generatePlaybackUrl(streamId);
      
      // Apply quality selection if specified
      if (quality !== 'auto') {
        streamUrl = streamUrl.replace('/manifest/video.m3u8', `/manifest/video-${quality}.m3u8`);
      }
      
      console.log('Using Cloudflare Stream URL:', streamUrl);
    } else if (!streamUrl) {
      // No stream URL available
      return;
    }

    // Check if HLS.js is supported in this browser
    if (Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        // Cloudflare specific optimizations
        maxBufferLength: 30,
        maxMaxBufferLength: 60,
        startLevel: -1, // Auto level selection
        abrEwmaDefaultEstimate: 500000, // Start with a 500kbps estimate
        abrEwmaFastLive: 3.0,
        abrEwmaSlowLive: 9.0,
        liveSyncDurationCount: 3, // Live sync window (in segments)
        liveMaxLatencyDurationCount: 10,
        liveDurationInfinity: true,
      });

      // Handle HLS errors
      hls.on(Hls.Events.ERROR, (event, data) => {
        if (data.fatal) {
          switch(data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              console.error('HLS network error', data);
              hls.startLoad(); // Try to recover on network errors
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              console.error('HLS media error', data);
              hls.recoverMediaError(); // Try to recover media errors
              break;
            default:
              // Cannot recover from this error
              console.error('Fatal HLS error:', data);
              hls.destroy();
              break;
          }
        }
      });

      // Load the stream
      hls.loadSource(streamUrl);
      hls.attachMedia(videoRef.current);
      
      // Handle successful loading
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        // Try to play when manifest is loaded
        if (videoRef.current) {
          videoRef.current.play().catch(e => {
            console.warn('Auto-play prevented:', e);
            // Most browsers require user interaction - mute to try again
            if (videoRef.current) {
              videoRef.current.muted = true;
              videoRef.current.play().catch(err => console.error('Still cannot play:', err));
            }
          });
        }
      });

      return () => {
        hls.destroy();
      };
    }
    // For browsers that have built-in HLS support (Safari)
    else if (videoRef.current.canPlayType('application/vnd.apple.mpegurl')) {
      videoRef.current.src = streamUrl;
      videoRef.current.addEventListener('loadedmetadata', () => {
        videoRef.current?.play().catch(e => console.warn('Auto-play prevented:', e));
      });
      
      return () => {
        if (videoRef.current) videoRef.current.src = '';
      };
    } else {
      console.error('HLS playback not supported in this browser');
    }
  }, [streamId, stream?.stream_url, isCloudflareStream, quality]);

  // Subscribe to viewer count updates
  useEffect(() => {
    const channel = supabase
      .channel('stream-stats')
      .on('presence', { event: 'sync' }, () => {
        const presenceState = channel.presenceState();
        setViewerCount(Object.keys(presenceState).length);
      })
      .subscribe(async (status) => {
        if (status !== 'SUBSCRIBED') return;
        
        await channel.track({ user_id: user?.id });
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [streamId, user?.id]);

  // Send chat message
  const sendMessage = async () => {
    if (!user || !message.trim()) return;

    const { error } = await supabase
      .from('stream_chat')
      .insert({
        stream_id: streamId,
        user_id: user.id,
        message: message.trim()
      });

    if (error) {
      toast.error('Failed to send message');
      return;
    }

    setMessage('');
  };

  // Send gift
  const sendGift = async () => {
    if (!user) {
      toast.error('Please log in to send gifts');
      return;
    }

    const randomGiftId = crypto.randomUUID();
    const { error } = await supabase
      .from('stream_gifts')
      .insert({
        gift_id: randomGiftId,
        stream_id: streamId,
        sender_id: user.id,
        amount: giftAmount,
        message: giftMessage
      });

    if (error) {
      toast.error('Failed to send gift');
      return;
    }

    toast.success('Gift sent successfully!');
    setGiftMessage('');
  };

  // Handle clip creation
  const handleClipClick = () => {
    if (!videoRef.current) return;

    if (!isClipping) {
      clipStartTimeRef.current = videoRef.current.currentTime;
      setIsClipping(true);
      toast.info('Recording clip start point...');
    } else {
      const clipEndTime = videoRef.current.currentTime;
      setIsClipping(false);
      onClipCreate?.(clipStartTimeRef.current, clipEndTime);
      toast.success('Clip created!');
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <div className="md:col-span-3 space-y-4">
        {/* Video Player */}
        <div className="relative rounded-xl overflow-hidden w-full aspect-video bg-black">
          {/* Cloudflare Stream watermark */}
          {isCloudflareStream && (
            <div className="absolute top-2 left-2 z-10 text-xs flex items-center bg-black/30 px-2 py-1 rounded-md backdrop-blur-sm">
              <img 
                src="https://www.cloudflare.com/favicon.ico" 
                alt="Cloudflare" 
                className="w-4 h-4 mr-1" 
              />
              <span className="text-white opacity-70">Secured by Cloudflare</span>
            </div>
          )}
          
          <video
            ref={videoRef}
            className="w-full h-full"
            controls
            playsInline
            autoPlay
            controlsList="nodownload"
            poster={stream?.thumbnail_url || undefined}
          />

          {/* Video overlay controls */}
          <motion.div 
            className="absolute top-4 right-4 bg-black/70 backdrop-blur-sm px-4 py-2 rounded-full text-white font-bold text-sm border border-purple-500/50 shadow-[0_0_8px_rgba(120,0,255,0.5)]"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-orange-400" />
              <span className="text-orange-300">{viewerCount}</span>
            </div>
          </motion.div>

          {/* Custom Stream Controls */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 z-20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Button 
                  variant="ghost" 
                  size="icon"
                  className="text-white hover:bg-white/20 rounded-full h-10 w-10"
                  onClick={() => {
                    if (videoRef.current) {
                      videoRef.current.paused ? videoRef.current.play() : videoRef.current.pause();
                    }
                  }}
                >
                  <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                    {videoRef.current?.paused ? 
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg> : 
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg>
                    }
                  </motion.div>
                </Button>

                <div className="flex items-center gap-2 relative group w-32">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-white hover:bg-white/20 rounded-full h-8 w-8"
                    onClick={() => {
                      if (videoRef.current) {
                        videoRef.current.muted = !videoRef.current.muted;
                      }
                    }}
                  >
                    {videoRef.current?.muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                  </Button>
                  <div className="w-24 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Slider
                      className="h-2"
                      defaultValue={[100]}
                      max={100}
                      step={1}
                      onChange={(value) => {
                        if (videoRef.current) {
                          videoRef.current.volume = value[0] / 100;
                        }
                      }}
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button
                    variant="ghost"
                    onClick={handleClipClick}
                    className="gap-2 bg-purple-600/80 hover:bg-purple-700/80 text-white border border-purple-400/30 shadow-[0_0_10px_rgba(120,0,255,0.3)]"
                  >
                    <Video className="w-4 h-4" />
                    {isClipping ? 'Finish Clip' : 'Create Clip'}
                  </Button>
                </motion.div>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button
                    variant="ghost"
                    className="gap-2 bg-red-600/80 hover:bg-red-700/80 text-white border border-red-400/30 shadow-[0_0_10px_rgba(255,0,0,0.3)]"
                    onClick={() => {
                      navigator.clipboard.writeText(window.location.href);
                      toast.success('Stream link copied!');
                    }}
                  >
                    <Share2 className="w-4 h-4" />
                    Share
                  </Button>
                </motion.div>
              </div>
            </div>
          </div>
        </div>

        {/* Stream Info Cards */}
        <div className="grid grid-cols-3 gap-2">
          <motion.div 
            className="bg-gradient-to-br from-purple-900/40 to-black p-3 rounded-lg border border-purple-500/30 shadow-[0_0_10px_rgba(120,0,255,0.2)]"
            whileHover={{ scale: 1.02 }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="flex items-center justify-between">
              <div className="text-xs text-gray-400">VIEWERS</div>
              <Users className="w-4 h-4 text-orange-400" />
            </div>
            <div className="text-2xl font-bold text-white mt-1">{viewerCount}</div>
          </motion.div>

          <motion.div 
            className="bg-gradient-to-br from-blue-900/40 to-black p-3 rounded-lg border border-blue-500/30 shadow-[0_0_10px_rgba(0,120,255,0.2)]"
            whileHover={{ scale: 1.02 }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="flex items-center justify-between">
              <div className="text-xs text-gray-400">GIFTS</div>
              <Gift className="w-4 h-4 text-blue-400" />
            </div>
            <div className="text-2xl font-bold text-white mt-1">
              ${gifts?.reduce((sum, gift) => sum + gift.amount, 0) || 0}
            </div>
          </motion.div>

          <motion.div 
            className="bg-gradient-to-br from-red-900/40 to-black p-3 rounded-lg border border-red-500/30 shadow-[0_0_10px_rgba(255,0,120,0.2)]"
            whileHover={{ scale: 1.02 }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className="flex items-center justify-between">
              <div className="text-xs text-gray-400">STREAM TIME</div>
              <Zap className="w-4 h-4 text-red-400" />
            </div>
            <div className="text-2xl font-bold text-white mt-1">
              {stream?.started_at ? 
                Math.floor((Date.now() - new Date(stream.started_at).getTime()) / 60000) + ' min' : '0 min'}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Chat and Gifts Section */}
      <div className="space-y-4">
        {/* Chat */}
        <motion.div 
          className="bg-gradient-to-br from-purple-900/30 to-black border border-purple-500/30 rounded-lg shadow-[0_0_15px_rgba(120,0,255,0.3)] p-4 h-[400px] flex flex-col"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex items-center gap-2 mb-3 border-b border-purple-500/30 pb-2">
            <MessageSquare className="w-4 h-4 text-orange-400" />
            <h3 className="font-bold text-white text-lg">LIVE CHAT</h3>
            <div className="ml-auto flex items-center gap-1 text-xs text-green-400 bg-green-900/30 px-2 py-0.5 rounded-full">
              <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></span>
              LIVE
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-purple-700 scrollbar-track-transparent pr-1 space-y-3 mb-3">
            <AnimatePresence initial={false}>
              {messages?.map((msg) => (
                <motion.div 
                  key={msg.id} 
                  className="relative hover:bg-white/5 p-2 rounded group"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="flex items-start gap-2">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={msg.profiles.avatar_url || ''} />
                      <AvatarFallback className="bg-purple-800 text-white text-xs">
                        {msg.profiles.username?.charAt(0).toUpperCase() || '?'}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center gap-1">
                        <span className="font-bold text-white">{msg.profiles.username}</span>
                        <span className="text-xs text-gray-400">{new Date(msg.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                      </div>
                      <div className="text-gray-200 mt-1">{msg.message}</div>
                    </div>
                  </div>
                  <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="icon" className="h-6 w-6 text-gray-400 hover:text-white">
                      <Heart className="h-3 w-3" />
                    </Button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          <div className="flex gap-2 relative">
            <Input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Send a message..."
              onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
              className="bg-black/50 border-purple-500/30 focus:border-purple-500 text-white"
            />
            <Button 
              onClick={sendMessage}
              className="bg-purple-600 hover:bg-purple-700 text-white shadow-[0_0_8px_rgba(120,0,255,0.3)]"
            >
              Send
            </Button>
          </div>
        </motion.div>

        {/* Gifts */}
        <motion.div 
          className="bg-gradient-to-br from-blue-900/30 to-black border border-blue-500/30 rounded-lg shadow-[0_0_15px_rgba(0,120,255,0.3)] p-4"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="flex items-center gap-2 mb-4 border-b border-blue-500/30 pb-2">
            <Gift className="w-4 h-4 text-blue-400" />
            <h3 className="font-bold text-white text-lg">SUPPORT STREAMER</h3>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-4 gap-2">
              {[5, 10, 20, 50].map((amount) => (
                <motion.button
                  key={amount}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={`py-2 rounded-lg font-bold ${giftAmount === amount ? 'bg-blue-600 text-white' : 'bg-black/50 text-blue-400 border border-blue-500/30'}`}
                  onClick={() => setGiftAmount(amount)}
                >
                  ${amount}
                </motion.button>
              ))}
            </div>
            
            <Input
              type="number"
              min="1"
              value={giftAmount}
              onChange={(e) => setGiftAmount(Number(e.target.value))}
              placeholder="Custom amount"
              className="bg-black/50 border-blue-500/30 focus:border-blue-500 text-white"
            />
            <Input
              value={giftMessage}
              onChange={(e) => setGiftMessage(e.target.value)}
              placeholder="Add a message (optional)"
              className="bg-black/50 border-blue-500/30 focus:border-blue-500 text-white"
            />
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Button 
                onClick={sendGift} 
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold shadow-[0_0_15px_rgba(0,120,255,0.4)]"
              >
                <Gift className="w-4 h-4 mr-2" />
                Send ${giftAmount} Gift
              </Button>
            </motion.div>
          </div>

          <div className="mt-6">
            <div className="text-white font-bold mb-2 text-sm flex items-center gap-2">
              <Zap className="w-4 h-4 text-yellow-400" />
              RECENT SUPPORTERS
            </div>
            <div className="space-y-3 mt-2 max-h-[200px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-blue-700 scrollbar-track-transparent">
              {gifts?.slice(0, 5).map((gift) => (
                <motion.div 
                  key={gift.id} 
                  className="bg-blue-900/20 border border-blue-500/20 rounded-lg p-3 hover:border-blue-500/50 transition-colors"
                  whileHover={{ x: 2 }}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <div className="flex items-center gap-2">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={gift.avatar_url || ''} />
                      <AvatarFallback className="bg-blue-800 text-white text-xs">
                        {gift.username?.charAt(0).toUpperCase() || '?'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="font-bold text-white text-sm">{gift.username}</div>
                      <div className="text-blue-300 font-bold">${gift.amount}</div>
                    </div>
                    <Badge className="bg-blue-600/50 text-white border-none">
                      <Trophy className="w-3 h-3 mr-1" />
                      MVP
                    </Badge>
                  </div>
                  {gift.message && (
                    <div className="mt-2 text-sm text-gray-300 italic ml-10">"{gift.message}"</div>
                  )}
                </motion.div>
              ))}
              {(!gifts || gifts.length === 0) && (
                <div className="text-center text-gray-400 text-sm py-4">Be the first supporter!</div>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};
