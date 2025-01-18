import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send } from "lucide-react";
import { toast } from "sonner";

interface Message {
  id: string;
  content: string;
  created_at: string;
  sender_id: string;
  sender: {
    username: string;
    avatar_url: string | null;
  };
}

interface GroupChatMessagesProps {
  groupId: string;
}

export function GroupChatMessages({ groupId }: GroupChatMessagesProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const { user } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!groupId) return;

    const fetchMessages = async () => {
      const { data, error } = await supabase
        .from('group_messages')
        .select(`
          *,
          sender:profiles!group_messages_sender_id_fkey(
            username,
            avatar_url
          )
        `)
        .eq('group_id', groupId)
        .order('created_at', { ascending: true });

      if (error) {
        toast.error("Failed to load messages");
        return;
      }

      setMessages(data);
    };

    fetchMessages();

    // Subscribe to new messages
    const subscription = supabase
      .channel(`group_messages:${groupId}`)
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public',
        table: 'group_messages',
        filter: `group_id=eq.${groupId}`
      }, () => {
        fetchMessages();
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [groupId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user) return;

    try {
      const { error } = await supabase
        .from('group_messages')
        .insert({
          content: newMessage,
          group_id: groupId,
          sender_id: user.id
        });

      if (error) throw error;
      setNewMessage("");
    } catch (error) {
      toast.error("Failed to send message");
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex items-start space-x-2 ${
              message.sender_id === user?.id ? 'flex-row-reverse space-x-reverse' : ''
            }`}
          >
            <Avatar className="h-8 w-8">
              <AvatarImage src={message.sender.avatar_url || undefined} />
              <AvatarFallback>
                {message.sender.username?.[0]?.toUpperCase() || '?'}
              </AvatarFallback>
            </Avatar>
            <div
              className={`flex flex-col ${
                message.sender_id === user?.id ? 'items-end' : 'items-start'
              }`}
            >
              <span className="text-sm text-muted-foreground">
                {message.sender.username}
              </span>
              <div
                className={`rounded-lg px-3 py-2 max-w-md ${
                  message.sender_id === user?.id
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted'
                }`}
              >
                {message.content}
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSendMessage} className="p-4 border-t">
        <div className="flex space-x-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
          />
          <Button type="submit" size="icon">
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </form>
    </div>
  );
}