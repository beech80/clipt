import { useEffect, useState } from 'react';
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { supabase } from '@/lib/supabase';
import { Send } from 'lucide-react';

interface StreamChatProps {
  streamId: string;
  isLive: boolean;
}

export const StreamChat = ({ streamId, isLive }: StreamChatProps) => {
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');

  useEffect(() => {
    // Subscribe to new chat messages
    const channel = supabase
      .channel('stream-chat')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'stream_chat',
          filter: `stream_id=eq.${streamId}`
        },
        (payload) => {
          setMessages((current) => [...current, payload.new]);
        }
      )
      .subscribe();

    // Load existing messages
    loadMessages();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [streamId]);

  const loadMessages = async () => {
    const { data, error } = await supabase
      .from('stream_chat')
      .select('*, profiles(username)')
      .eq('stream_id', streamId)
      .order('created_at', { ascending: true })
      .limit(50);

    if (error) {
      console.error('Error loading messages:', error);
      return;
    }

    setMessages(data || []);
  };

  const sendMessage = async () => {
    if (!newMessage.trim()) return;

    const { error } = await supabase
      .from('stream_chat')
      .insert({
        stream_id: streamId,
        message: newMessage,
      });

    if (error) {
      console.error('Error sending message:', error);
      return;
    }

    setNewMessage('');
  };

  return (
    <Card className="flex flex-col h-full">
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.map((msg) => (
            <div key={msg.id} className="flex flex-col">
              <span className="text-sm font-medium">
                {msg.profiles?.username || 'Anonymous'}
              </span>
              <p className="text-sm">{msg.message}</p>
            </div>
          ))}
        </div>
      </ScrollArea>
      
      <div className="p-4 border-t">
        <div className="flex gap-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            disabled={!isLive}
            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
          />
          <Button 
            onClick={sendMessage}
            disabled={!isLive}
            size="icon"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
};