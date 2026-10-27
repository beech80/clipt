
import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { useStreamChatMessages } from '@/hooks/useStreamChatMessages';
import { parseChatFilterResult } from '@/lib/chat-data';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { StreamEmotes } from './StreamEmotes';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { toast } from 'sonner';
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
  const { messages, error: chatError, isLoading, refetch } = useStreamChatMessages(streamId);
  const [isSending, setIsSending] = useState(false);
  const [isModerator, setIsModerator] = useState(false);
  const [isRateLimited, setIsRateLimited] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const messageTimeoutRef = useRef<NodeJS.Timeout>();
  const sendingRef = useRef(false);
  useEffect(() => () => clearTimeout(messageTimeoutRef.current), []);

  useEffect(() => {
    let disposed = false;
    const checkModStatus = async () => {
      setIsModerator(false);
      if (!user) return;
      
      const { data } = await supabase
        .from('stream_moderators')
        .select('*')
        .eq('stream_id', streamId)
        .eq('moderator_id', user.id)
        .single();
      
      if (!disposed) setIsModerator(!!data);
    };

    checkModStatus();
    return () => { disposed = true; };
  }, [user, streamId]);


  useEffect(() => {
    if (scrollRef.current) {
      const viewport = scrollRef.current.querySelector<HTMLElement>('[data-radix-scroll-area-viewport]');
      if (viewport) viewport.scrollTop = viewport.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !user || !isLive || isRateLimited || sendingRef.current) return;
    if (message.trim().length > 2000) { toast.error('Messages must be at most 2000 characters.'); return; }
    sendingRef.current = true;
    setIsSending(true);
    const draft = message;

    try {
      // Check rate limit
      const { data: rateLimited, error: rateLimitError } = await supabase.rpc(
        'check_chat_rate_limit',
        {
          p_user_id: user.id,
          p_stream_id: streamId
        }
      );

      if (rateLimitError) throw rateLimitError;

      if (rateLimited) {
        setIsRateLimited(true);
        messageTimeoutRef.current = setTimeout(() => setIsRateLimited(false), 60000);
        toast.error('You are sending messages too quickly. Please wait a moment.');
        return;
      }

      // Check if user is timed out
      const { data: isTimedOut, error: timeoutError } = await supabase.rpc(
        'is_user_timed_out',
        {
          p_user_id: user.id,
          p_stream_id: streamId
        }
      );

      if (timeoutError) throw timeoutError;

      if (isTimedOut) {
        toast.error('You are currently timed out from chat');
        return;
      }

      // Filter message
      const { data: filteredMessages, error: filterError } = await supabase.rpc(
        'filter_chat_message',
        {
          p_message: message.trim(),
          p_stream_id: streamId
        }
      );

      if (filterError) throw filterError;
      const filteredMessage = parseChatFilterResult(filteredMessages);

      if (filteredMessage.blocked) {
        toast.error('Your message was blocked by chat filters');
        return;
      }

      const { error: sendError } = await supabase
        .from('stream_chat')
        .insert({
          stream_id: streamId,
          user_id: user.id,
          message: filteredMessage.message
        });

      if (sendError) throw sendError;

      setMessage(current => current === draft ? '' : current);
    } catch {
      toast.error('Message was not sent. Your draft is preserved; please retry.');
    } finally {
      sendingRef.current = false;
      setIsSending(false);
    }
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
    <section className="clipt-live-chat gaming-card flex flex-col min-w-0" aria-label="Live chat">
      <h2 className="border-b border-purple-500/40 p-3 text-center font-semibold text-purple-100">Live Chat</h2>
      {chatError && <div role="alert" className="p-3"><p>{chatError}</p><Button onClick={refetch} variant="outline">Retry chat</Button></div>}
      {isLoading && <p role="status" className="p-3">Loading live chat…</p>}
      {!isLoading && !chatError && messages.length === 0 && <p className="p-4 text-sm text-purple-200">No chat messages yet.</p>}
      <ScrollArea ref={scrollRef} className="flex-1 min-h-0 p-4">
        <div className="space-y-4">
          {messages.map((msg) => (
            <div key={msg.id} className="flex items-start gap-2 group">
              <Avatar className="h-6 w-6">
                <AvatarImage src={msg.profiles?.avatar_url} />
                <AvatarFallback>
                  {msg.profiles?.username?.[0]?.toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-baseline gap-2">
                  <span className="text-sm font-medium">
                    {msg.profiles?.username}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(msg.created_at).toLocaleTimeString()}
                  </span>
                </div>
                <p className="text-sm [overflow-wrap:anywhere]">{msg.message}</p>
              </div>
              {isModerator && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      aria-label={`Moderate message from ${msg.profiles?.username || 'user'}`}
                      className="h-11 w-11 shrink-0 p-0"
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

      <form onSubmit={handleSendMessage} className="p-3 border-t border-purple-500/40">
        <div className="flex flex-wrap items-center gap-2">
          <StreamEmotes
            streamId={streamId}
            onSelectEmote={(emote) => setMessage(prev => `${prev} ${emote} `)}
          />
          <Input
            data-live-chat-input
            className="min-w-0 flex-1"
            aria-label="Chat message"
            maxLength={2000}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={
              isRateLimited
                ? "Slow down! Wait a moment..."
                : isLive
                ? "Send a message..."
                : "Stream is offline"
            }
            disabled={!isLive || !user || isRateLimited || isSending}
          />
          <Button type="submit" disabled={!isLive || !user || isRateLimited || isSending || !message.trim()}>
            {isSending ? 'Sending…' : 'Send'}
          </Button>
        </div>
      </form>
    </section>
  );
};
