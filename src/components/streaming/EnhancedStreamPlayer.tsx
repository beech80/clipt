
import React, { useEffect, useRef, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Gift, MessageSquare, Video } from 'lucide-react';
import { Card } from '@/components/ui/card';
import Hls from 'hls.js';

interface StreamMessage {
  id: string;
  content: string;
  user_id: string;
  created_at: string;
  profiles: {
    username: string;
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
}

export const EnhancedStreamPlayer = ({ streamId, onClipCreate }: EnhancedStreamPlayerProps) => {
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
          content,
          user_id,
          created_at,
          profiles (username, avatar_url)
        `)
        .eq('stream_id', streamId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data as StreamMessage[];
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

  // Initialize HLS player
  useEffect(() => {
    if (!stream?.stream_url || !videoRef.current) return;

    const hls = new Hls({
      enableWorker: true,
      lowLatencyMode: true,
    });

    hls.loadSource(stream.stream_url);
    hls.attachMedia(videoRef.current);

    return () => {
      hls.destroy();
    };
  }, [stream?.stream_url]);

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
        content: message.trim()
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

    const { error } = await supabase
      .from('stream_gifts')
      .insert({
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
        <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden">
          <video
            ref={videoRef}
            className="w-full h-full"
            controls
            playsInline
          />
          <div className="absolute top-4 right-4 bg-black/80 px-3 py-1 rounded-full text-white text-sm">
            {viewerCount} viewers
          </div>
        </div>

        {/* Stream Controls */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleClipClick}
            className="gap-2"
          >
            <Video className="w-4 h-4" />
            {isClipping ? 'Finish Clip' : 'Create Clip'}
          </Button>
        </div>
      </div>

      {/* Chat and Gifts Section */}
      <div className="space-y-4">
        {/* Chat */}
        <Card className="p-4 h-[400px] flex flex-col">
          <div className="flex items-center gap-2 mb-2">
            <MessageSquare className="w-4 h-4" />
            <h3 className="font-semibold">Live Chat</h3>
          </div>
          
          <div className="flex-1 overflow-y-auto space-y-2 mb-4">
            {messages?.map((msg) => (
              <div key={msg.id} className="text-sm">
                <span className="font-semibold">{msg.profiles.username}: </span>
                <span>{msg.content}</span>
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            <Input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Send a message..."
              onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
            />
            <Button onClick={sendMessage}>Send</Button>
          </div>
        </Card>

        {/* Gifts */}
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-4">
            <Gift className="w-4 h-4" />
            <h3 className="font-semibold">Send a Gift</h3>
          </div>

          <div className="space-y-4">
            <Input
              type="number"
              min="1"
              value={giftAmount}
              onChange={(e) => setGiftAmount(Number(e.target.value))}
              placeholder="Amount"
            />
            <Input
              value={giftMessage}
              onChange={(e) => setGiftMessage(e.target.value)}
              placeholder="Add a message (optional)"
            />
            <Button onClick={sendGift} className="w-full">
              Send ${giftAmount} Gift
            </Button>
          </div>

          <div className="mt-4 space-y-2">
            {gifts?.slice(0, 5).map((gift) => (
              <div key={gift.id} className="text-sm">
                <span className="font-semibold">{gift.profiles.username}</span>
                <span className="text-purple-400"> sent ${gift.amount}</span>
                {gift.message && (
                  <p className="text-muted-foreground">{gift.message}</p>
                )}
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};
