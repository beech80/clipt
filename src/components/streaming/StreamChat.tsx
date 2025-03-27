import { useEffect, useState } from 'react';
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { supabase } from '@/lib/supabase';
import { Send, Star } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { ChatHighlights } from './chat/ChatHighlights';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface StreamChatProps {
  streamId: string;
  isLive: boolean;
}

export const StreamChat = ({ streamId, isLive }: StreamChatProps) => {
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isModerator, setIsModerator] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    // Check if user is moderator
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

    // Load existing messages
    const loadMessages = async () => {
      const { data, error } = await supabase
        .from('stream_chat')
        .select(`
          *,
          profiles(username, avatar_url)
        `)
        .eq('stream_id', streamId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error loading messages:', error);
        return;
      }

      setMessages(data || []);
    };

    loadMessages();

    // Subscribe to new messages
    const subscription = supabase
      .channel(`stream_chat:${streamId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'stream_chat',
        filter: `stream_id=eq.${streamId}`,
      }, () => {
        loadMessages();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [streamId, user]);

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

  const highlightMessage = async (messageId: string) => {
    try {
      const { error } = await supabase
        .from('chat_highlights')
        .insert({
          stream_id: streamId,
          message_id: messageId,
          created_by: user?.id
        });

      if (error) throw error;
      toast.success('Message highlighted');
    } catch (error) {
      toast.error('Failed to highlight message');
    }
  };

  return (
    <Card className="flex flex-col h-[400px] max-h-[400px] overflow-hidden">
      <Tabs defaultValue="chat" className="flex-1">
        <TabsList className="w-full">
          <TabsTrigger value="chat" className="flex-1">Chat</TabsTrigger>
          <TabsTrigger value="activity" className="flex-1">Activity</TabsTrigger>
          <TabsTrigger value="settings" className="flex-1">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="chat" className="flex-1 relative h-[300px]">
          <ScrollArea className="flex-1 p-4 h-full">
            <div className="space-y-4">
              {messages.length > 0 ? (
                messages.map((msg) => (
                  <div key={msg.id} className="flex flex-col">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">
                        {msg.profiles?.username || 'Anonymous'}
                      </span>
                      {isModerator && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => highlightMessage(msg.id)}
                        >
                          <Star className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    <p className="text-sm">{msg.message}</p>
                  </div>
                ))
              ) : (
                <div className="text-center py-6 text-muted-foreground">
                  <p>No messages yet</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="activity" className="h-[300px]">
          <ScrollArea className="h-full p-4">
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground text-center">Recent activity will appear here</p>
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="settings" className="h-[300px]">
          <ScrollArea className="h-full p-4">
            <div className="space-y-4">
              <h4 className="text-sm font-medium">Chat Settings</h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Font Size</span>
                  <select className="bg-background border border-border rounded px-2 py-1 text-sm">
                    <option>Small</option>
                    <option selected>Medium</option>
                    <option>Large</option>
                  </select>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Timestamps</span>
                  <div className="flex items-center h-4">
                    <input type="checkbox" className="h-4 w-4" id="timestamps" />
                  </div>
                </div>
              </div>
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
      
      <div className="p-2 pt-0 border-t">
        <div className="flex gap-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            disabled={!isLive}
            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
            className="text-sm"
          />
          <Button 
            onClick={sendMessage}
            disabled={!isLive}
            size="icon"
            className="shrink-0"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
};