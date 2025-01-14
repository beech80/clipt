import { useState, useEffect } from "react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { Message, ChatUser } from "@/types/message";
import { MessageList } from "@/components/messages/MessageList";
import { ChatList } from "@/components/messages/ChatList";
import { MessageInput } from "@/components/messages/MessageInput";

export default function Messages() {
  const { user } = useAuth();
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
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
            last_message: msg.content,
            unread_count: msg.sender_id !== user.id && !msg.read ? 1 : 0
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

      // Mark messages as read
      if (data && data.length > 0) {
        const { error: updateError } = await supabase
          .from('messages')
          .update({ read: true })
          .eq('sender_id', selectedChat)
          .eq('receiver_id', user.id)
          .eq('read', false);

        if (updateError) {
          console.error('Error marking messages as read:', updateError);
        }
      }
    };

    fetchMessages();
  }, [selectedChat, user]);

  const handleSendMessage = async (content: string) => {
    if (!user || !selectedChat) return;

    const newMessage = {
      content,
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
  };

  return (
    <div className="mx-auto max-w-4xl h-[calc(100vh-4rem)]">
      <div className="h-full border rounded-lg grid grid-cols-1 md:grid-cols-3 divide-x">
        <div className="p-4">
          <ChatList
            chats={chats}
            selectedChat={selectedChat}
            onSelectChat={setSelectedChat}
          />
        </div>

        <div className="col-span-2 flex flex-col h-full">
          {selectedChat ? (
            <>
              <MessageList messages={messages} />
              <MessageInput onSendMessage={handleSendMessage} />
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