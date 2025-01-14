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
  const [isLoading, setIsLoading] = useState(true);

  // Fetch chats (users with messages)
  useEffect(() => {
    if (!user) return;

    const fetchChats = async () => {
      try {
        const { data: messages, error } = await supabase
          .from('messages')
          .select(`
            id,
            content,
            created_at,
            read,
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

        if (error) throw error;

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
          } else if (uniqueUsers.has(otherUserId) && msg.sender_id !== user.id && !msg.read) {
            const existing = uniqueUsers.get(otherUserId);
            if (existing) {
              existing.unread_count = (existing.unread_count || 0) + 1;
            }
          }
        });

        setChats(Array.from(uniqueUsers.values()));
      } catch (error) {
        console.error('Error fetching chats:', error);
        toast.error("Failed to fetch chats");
      } finally {
        setIsLoading(false);
      }
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
          
          // Update unread count in chat list
          setChats((prevChats) => {
            return prevChats.map((chat) => {
              if (chat.id === newMessage.sender_id) {
                return {
                  ...chat,
                  last_message: newMessage.content,
                  unread_count: (chat.unread_count || 0) + 1,
                };
              }
              return chat;
            });
          });
          
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
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('messages')
          .select('*')
          .or(
            `and(sender_id.eq.${user.id},receiver_id.eq.${selectedChat}),` +
            `and(sender_id.eq.${selectedChat},receiver_id.eq.${user.id})`
          )
          .order('created_at', { ascending: true });

        if (error) throw error;

        setMessages(data || []);

        // Mark messages as read
        if (data && data.length > 0) {
          const { error: updateError } = await supabase
            .from('messages')
            .update({ read: true })
            .eq('sender_id', selectedChat)
            .eq('receiver_id', user.id)
            .eq('read', false);

          if (updateError) throw updateError;

          // Update unread count in chat list
          setChats((prevChats) => {
            return prevChats.map((chat) => {
              if (chat.id === selectedChat) {
                return { ...chat, unread_count: 0 };
              }
              return chat;
            });
          });
        }
      } catch (error) {
        console.error('Error fetching messages:', error);
        toast.error("Failed to fetch messages");
      } finally {
        setIsLoading(false);
      }
    };

    fetchMessages();
  }, [selectedChat, user]);

  const handleSendMessage = async (content: string) => {
    if (!user || !selectedChat) return;

    try {
      const newMessage = {
        content,
        sender_id: user.id,
        receiver_id: selectedChat,
        read: false,
      };

      const { error } = await supabase
        .from('messages')
        .insert([newMessage]);

      if (error) throw error;

      // Update last message in chat list
      setChats((prevChats) => {
        return prevChats.map((chat) => {
          if (chat.id === selectedChat) {
            return { ...chat, last_message: content };
          }
          return chat;
        });
      });
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error("Failed to send message");
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
          {isLoading ? (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              Loading messages...
            </div>
          ) : selectedChat ? (
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