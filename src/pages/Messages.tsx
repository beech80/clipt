import { useState, useEffect } from "react";
import { Send } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { Message, ChatUser } from "@/types/message";
import { MessageBubble } from "@/components/messages/MessageBubble";
import { ChatList } from "@/components/messages/ChatList";

export default function Messages() {
  const { user } = useAuth();
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [chats, setChats] = useState<ChatUser[]>([]);

  // Fetch chats (users with messages)
  useEffect(() => {
    if (!user) return;

    const fetchChats = async () => {
      const { data: messages, error } = await supabase
        .from('messages')
        .select(`
          content,
          sender_id,
          receiver_id,
          profiles!messages_sender_id_fkey (
            id,
            username,
            avatar_url
          )
        `)
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .order('created_at', { ascending: false });

      if (error) {
        toast.error("Failed to fetch chats");
        return;
      }

      // Process messages to get unique users
      const uniqueUsers = new Map<string, ChatUser>();
      messages?.forEach((msg) => {
        const otherUserId = msg.sender_id === user.id ? msg.receiver_id : msg.sender_id;
        const profile = msg.profiles;
        if (!uniqueUsers.has(otherUserId) && profile) {
          uniqueUsers.set(otherUserId, {
            id: profile.id,
            username: profile.username,
            avatar_url: profile.avatar_url,
            last_message: msg.content
          });
        }
      });

      setChats(Array.from(uniqueUsers.values()));
    };

    fetchChats();
  }, [user]);

  // Subscribe to new messages
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('messages_channel')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `receiver_id=eq.${user.id}`,
        },
        (payload) => {
          const newMessage = payload.new as Message;
          setMessages((prev) => [...prev, newMessage]);
          toast("New message received");
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  // Fetch messages for selected chat
  useEffect(() => {
    if (!selectedChat || !user) return;

    const fetchMessages = async () => {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .or(
          `and(sender_id.eq.${user.id},receiver_id.eq.${selectedChat}),` +
          `and(sender_id.eq.${selectedChat},receiver_id.eq.${user.id})`
        )
        .order('created_at', { ascending: true });

      if (error) {
        toast.error("Failed to fetch messages");
        return;
      }

      setMessages(data || []);
    };

    fetchMessages();
  }, [selectedChat, user]);

  const handleSendMessage = async () => {
    if (!message.trim() || !user || !selectedChat) return;

    const newMessage = {
      content: message,
      sender_id: user.id,
      receiver_id: selectedChat,
      read: false,
    };

    const { error } = await supabase
      .from('messages')
      .insert([newMessage]);

    if (error) {
      toast.error("Failed to send message");
      return;
    }

    setMessage("");
  };

  return (
    <div className="mx-auto max-w-4xl h-[calc(100vh-4rem)]">
      <div className="h-full border rounded-lg grid grid-cols-1 md:grid-cols-3 divide-x">
        {/* Chat List */}
        <div className="p-4">
          <ChatList
            chats={chats}
            selectedChat={selectedChat}
            onSelectChat={setSelectedChat}
          />
        </div>

        {/* Chat Area */}
        <div className="col-span-2 flex flex-col h-full">
          {selectedChat ? (
            <>
              <div className="flex-1 p-4 overflow-y-auto">
                {messages.map((msg) => (
                  <MessageBubble key={msg.id} message={msg} />
                ))}
              </div>
              <div className="p-4 border-t">
                <div className="flex gap-2">
                  <Input
                    placeholder="Type a message..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                  />
                  <Button onClick={handleSendMessage}>
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              Select a chat to start messaging
            </div>
          )}
        </div>
      </div>
    </div>
  );
}