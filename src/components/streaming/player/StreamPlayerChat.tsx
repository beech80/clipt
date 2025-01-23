import React, { useEffect, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface StreamPlayerChatProps {
  streamId: string;
  viewerCount: number;
  onViewerCountChange: (count: number) => void;
}

export function StreamPlayerChat({
  streamId,
  viewerCount,
  onViewerCountChange
}: StreamPlayerChatProps) {
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const { user } = useAuth();
  const chatRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Fetch existing messages
    const fetchMessages = async () => {
      const { data, error } = await supabase
        .from('stream_chat')
        .select(`
          *,
          profiles:user_id(username, avatar_url)
        `)
        .eq('stream_id', streamId)
        .order('created_at', { ascending: true });

      if (error) {
        toast.error('Failed to load chat messages');
        return;
      }

      setMessages(data || []);
    };

    fetchMessages();

    // Subscribe to new messages
    const channel = supabase
      .channel(`stream_chat:${streamId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'stream_chat',
        filter: `stream_id=eq.${streamId}`
      }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setMessages(prev => [...prev, payload.new]);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [streamId]);

  useEffect(() => {
    // Auto-scroll to bottom when new messages arrive
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error('You must be logged in to chat');
      return;
    }

    if (!newMessage.trim()) return;

    const { error } = await supabase
      .from('stream_chat')
      .insert({
        stream_id: streamId,
        user_id: user.id,
        message: newMessage.trim()
      });

    if (error) {
      toast.error('Failed to send message');
      return;
    }

    setNewMessage('');
  };

  return (
    <div className="absolute right-0 top-0 h-full w-80 bg-background/95 border-l border-border">
      <div className="flex flex-col h-full">
        <div className="p-4 border-b">
          <h3 className="font-semibold">Stream Chat</h3>
          <p className="text-sm text-muted-foreground">
            {viewerCount} {viewerCount === 1 ? 'viewer' : 'viewers'}
          </p>
        </div>

        <ScrollArea className="flex-1 p-4" ref={chatRef}>
          <div className="space-y-4">
            {messages.map((message) => (
              <div key={message.id} className="flex items-start gap-2">
                <div className="rounded-full w-8 h-8 bg-muted flex items-center justify-center">
                  {message.profiles?.username?.[0]?.toUpperCase() || '?'}
                </div>
                <div>
                  <p className="text-sm font-medium">{message.profiles?.username}</p>
                  <p className="text-sm text-muted-foreground">{message.message}</p>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        <form onSubmit={handleSendMessage} className="p-4 border-t">
          <div className="flex gap-2">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Send a message..."
              className="flex-1"
            />
            <Button type="submit" size="icon">
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}