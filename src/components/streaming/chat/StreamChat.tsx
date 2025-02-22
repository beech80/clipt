
import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { StreamEmotes } from './StreamEmotes';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { toast } from 'sonner';
import type { StreamChatMessage } from '@/types/chat';
import { MoreHorizontal, Ban, Clock } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface StreamChatProps {
  streamId: string;
  isLive: boolean;
}

export const StreamChat = ({ streamId, isLive }: StreamChatProps) => {
  const { user } = useAuth();
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<StreamChatMessage[]>([]);
  const [isModerator, setIsModerator] = useState(false);
  const [isRateLimited, setIsRateLimited] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const messageTimeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    const checkModStatus = async () => {
      if (!user) return;
      
      const { data } = await supabase
        .from('stream_moderators')
        .select('*')
        .eq('stream_id', streamId)
        .eq('moderator_id', user.id)
        .single();
      
      setIsModerator(!!data);
    };

    checkModStatus();
  }, [user, streamId]);

  useEffect(() => {
    // Load initial messages
    const loadMessages = async () => {
      const { data, error } = await supabase
        .from('stream_chat')
        .select(`
          *,
          profiles:user_id (
            username,
            avatar_url
          )
        `)
        .eq('stream_id', streamId)
        .order('created_at', { ascending: true })
        .limit(50);

      if (error) {
        toast.error('Failed to load chat messages');
        return;
      }

      setMessages(data || []);
    };

    loadMessages();

    // Subscribe to new messages
    const channel = supabase
      .channel(`stream_chat:${streamId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'stream_chat',
          filter: `stream_id=eq.${streamId}`
        },
        async (payload) => {
          if (payload.eventType === 'INSERT') {
            const { data: profile } = await supabase
              .from('profiles')
              .select('username, avatar_url')
              .eq('id', payload.new.user_id)
              .single();

            setMessages(prev => [...prev, { ...payload.new, profiles: profile }]);
          } else if (payload.eventType === 'DELETE') {
            setMessages(prev => prev.filter(msg => msg.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [streamId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !user || isRateLimited) return;

    // Check rate limit
    const { data: rateLimited } = await supabase
      .rpc('check_chat_rate_limit', {
        p_user_id: user.id,
        p_stream_id: streamId
      });

    if (rateLimited) {
      setIsRateLimited(true);
      messageTimeoutRef.current = setTimeout(() => setIsRateLimited(false), 60000);
      toast.error('You are sending messages too quickly. Please wait a moment.');
      return;
    }

    // Check if user is timed out
    const { data: isTimedOut } = await supabase
      .rpc('is_user_timed_out', {
        p_user_id: user.id,
        p_stream_id: streamId
      });

    if (isTimedOut) {
      toast.error('You are currently timed out from chat');
      return;
    }

    // Filter message
    const { data: filteredMessage } = await supabase
      .rpc('filter_chat_message', {
        p_message: message.trim(),
        p_stream_id: streamId
      });

    if (filteredMessage?.is_blocked) {
      toast.error('Your message was blocked by chat filters');
      return;
    }

    const { error } = await supabase
      .from('stream_chat')
      .insert({
        stream_id: streamId,
        user_id: user.id,
        message: filteredMessage?.filtered_message || message.trim()
      });

    if (error) {
      toast.error('Failed to send message');
      return;
    }

    setMessage('');
  };

  const handleTimeout = async (userId: string, duration: number) => {
    if (!isModerator || !user) return;

    const { error } = await supabase
      .from('chat_timeouts')
      .insert({
        stream_id: streamId,
        user_id: userId,
        moderator_id: user.id,
        expires_at: new Date(Date.now() + duration * 1000).toISOString()
      });

    if (error) {
      toast.error('Failed to timeout user');
      return;
    }

    toast.success('User has been timed out');
  };

  const handleBan = async (userId: string) => {
    if (!isModerator || !user) return;

    const { error } = await supabase
      .from('chat_timeouts')
      .insert({
        stream_id: streamId,
        user_id: userId,
        moderator_id: user.id,
        expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString() // 1 year
      });

    if (error) {
      toast.error('Failed to ban user');
      return;
    }

    toast.success('User has been banned');
  };

  return (
    <div className="flex flex-col h-full">
      <ScrollArea ref={scrollRef} className="flex-1 p-4">
        <div className="space-y-4">
          {messages.map((msg) => (
            <div key={msg.id} className="flex items-start gap-2 group">
              <Avatar className="h-6 w-6">
                <AvatarImage src={msg.profiles?.avatar_url} />
                <AvatarFallback>
                  {msg.profiles?.username?.[0]?.toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-baseline gap-2">
                  <span className="text-sm font-medium">
                    {msg.profiles?.username}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(msg.created_at).toLocaleTimeString()}
                  </span>
                </div>
                <p className="text-sm">{msg.message}</p>
              </div>
              {isModerator && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100"
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleTimeout(msg.user_id, 300)}>
                      <Clock className="mr-2 h-4 w-4" />
                      Timeout 5m
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleTimeout(msg.user_id, 3600)}>
                      <Clock className="mr-2 h-4 w-4" />
                      Timeout 1h
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleBan(msg.user_id)}>
                      <Ban className="mr-2 h-4 w-4" />
                      Ban User
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          ))}
        </div>
      </ScrollArea>

      <form onSubmit={handleSendMessage} className="p-4 border-t">
        <div className="flex items-center gap-2">
          <StreamEmotes
            streamId={streamId}
            onSelectEmote={(emote) => setMessage(prev => `${prev} ${emote} `)}
          />
          <Input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={
              isRateLimited
                ? "Slow down! Wait a moment..."
                : isLive
                ? "Send a message..."
                : "Stream is offline"
            }
            disabled={!isLive || !user || isRateLimited}
          />
          <Button type="submit" disabled={!isLive || !user || isRateLimited}>
            Send
          </Button>
        </div>
      </form>
    </div>
  );
};
