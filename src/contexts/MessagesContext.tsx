import React, { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { Message, ChatUser } from "@/types/message";
import { toast } from "@/hooks/use-toast";

interface MessagesContextType {
  selectedChat: string | null;
  setSelectedChat: (chatId: string | null) => void;
  messages: Message[];
  chats: ChatUser[];
  isLoading: boolean;
  handleSendMessage: (content: string) => Promise<void>;
}

const MessagesContext = createContext<MessagesContextType | undefined>(undefined);

export function MessagesProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [chats, setChats] = useState<ChatUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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
        toast({
          title: "Error",
          description: "Failed to fetch chats. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchChats();
  }, [user]);

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

        if (data && data.length > 0) {
          await supabase
            .from('messages')
            .update({ read: true })
            .eq('sender_id', selectedChat)
            .eq('receiver_id', user.id)
            .eq('read', false);

          setChats((prevChats) =>
            prevChats.map((chat) =>
              chat.id === selectedChat ? { ...chat, unread_count: 0 } : chat
            )
          );
        }
      } catch (error) {
        console.error('Error fetching messages:', error);
        toast({
          title: "Error",
          description: "Failed to fetch messages. Please try again.",
          variant: "destructive",
        });
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

      const { error, data } = await supabase
        .from('messages')
        .insert([newMessage])
        .select()
        .single();

      if (error) throw error;

      if (data) {
        setMessages((prev) => [...prev, data]);
        setChats((prevChats) =>
          prevChats.map((chat) =>
            chat.id === selectedChat ? { ...chat, last_message: content } : chat
          )
        );
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <MessagesContext.Provider
      value={{
        selectedChat,
        setSelectedChat,
        messages,
        chats,
        isLoading,
        handleSendMessage,
      }}
    >
      {children}
    </MessagesContext.Provider>
  );
}

export const useMessages = () => {
  const context = useContext(MessagesContext);
  if (context === undefined) {
    throw new Error("useMessages must be used within a MessagesProvider");
  }
  return context;
};