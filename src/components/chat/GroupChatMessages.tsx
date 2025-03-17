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
      scrollToBottom();
    };

    fetchMessages();

    // Subscribe to new messages
    const channel = supabase
      .channel(`group_${groupId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'group_messages',
        filter: `group_id=eq.${groupId}`
      }, (payload) => {
        // Fetch sender info for the new message
        const fetchSenderInfo = async () => {
          const { data, error } = await supabase
            .from('profiles')
            .select('username, avatar_url')
            .eq('id', payload.new.sender_id)
            .single();

          if (!error && data) {
            const newMessage = {
              ...payload.new,
              sender: data
            };
            setMessages(prev => [...prev, newMessage]);
            scrollToBottom();
          }
        };

        fetchSenderInfo();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [groupId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newMessage.trim() || !user) return;

    const { error } = await supabase
      .from('group_messages')
      .insert({
        content: newMessage,
        group_id: groupId,
        sender_id: user.id
      });

    if (error) {
      toast.error("Failed to send message");
      return;
    }

    setNewMessage("");
  };

  return (
    <div className="flex flex-col h-full">
      {/* Chat header with group info */}
      <div className="bg-gaming-800 p-4 border-b border-gaming-700 flex items-center">
        <Avatar className="h-10 w-10 border border-gaming-600 mr-3">
          <AvatarImage src={undefined} />
          <AvatarFallback className="bg-gaming-700 text-blue-400">GC</AvatarFallback>
        </Avatar>
        <div>
          <h3 className="font-bold text-gaming-100">Game Chat</h3>
          <p className="text-xs text-gaming-400">{messages.length} messages</p>
        </div>
      </div>

      {/* Messages container */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gaming-850 scrollbar-thin scrollbar-thumb-gaming-700">
        {messages.map((message) => {
          const isSender = user && message.sender_id === user.id;
          
          return (
            <div 
              key={message.id} 
              className={`flex ${isSender ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`flex max-w-[80%] ${isSender ? 'flex-row-reverse' : 'flex-row'} items-end gap-2`}>
                {!isSender && (
                  <Avatar className="h-8 w-8 flex-shrink-0">
                    <AvatarImage src={message.sender?.avatar_url || undefined} />
                    <AvatarFallback className="bg-gaming-700 text-blue-400">
                      {message.sender?.username?.[0]?.toUpperCase() || '?'}
                    </AvatarFallback>
                  </Avatar>
                )}
                
                <div className={`group relative ${isSender ? 'bg-blue-600' : 'bg-gaming-700'} px-3 py-2 rounded-lg`}>
                  {!isSender && (
                    <p className="text-xs font-medium text-blue-400 mb-1">
                      {message.sender?.username || 'Unknown User'}
                    </p>
                  )}
                  <p className="text-sm break-words text-gaming-100">{message.content}</p>
                  <span className="text-xs text-gaming-400/70 mt-1 inline-block">
                    {new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  
                  <div className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    {isSender && (
                      <Button variant="ghost" size="icon" className="h-6 w-6 text-gaming-400 hover:text-gaming-100">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="none" stroke="currentColor" className="w-3 h-3">
                          <circle cx="8" cy="8" r="1.5" />
                          <circle cx="12" cy="8" r="1.5" />
                          <circle cx="4" cy="8" r="1.5" />
                        </svg>
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Message input */}
      <form onSubmit={sendMessage} className="p-3 bg-gaming-800 border-t border-gaming-700">
        <div className="flex gap-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="bg-gaming-700 border-gaming-600 focus:border-blue-500 text-gaming-100"
          />
          <Button 
            type="submit" 
            disabled={!newMessage.trim()}
            className="bg-blue-600 hover:bg-blue-700 transition-colors"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </form>
    </div>
  );
}