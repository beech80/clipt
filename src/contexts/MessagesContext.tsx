import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Message, ChatUser } from '@/types/message';

interface MessagesContextType {
  messages: Message[];
  sendMessage: (content: string, receiverId: string) => Promise<void>;
  markAsRead: (messageId: string) => Promise<void>;
  selectedChat: string | null;
  setSelectedChat: (userId: string | null) => void;
  chats: ChatUser[];
  isLoading: boolean;
  handleSendMessage: (content: string) => void;
}

const MessagesContext = createContext<MessagesContextType | undefined>(undefined);

export const MessagesProvider = ({ children }: { children: React.ReactNode }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  const [chats, setChats] = useState<ChatUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    const fetchMessages = async () => {
      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          sender:profiles!messages_sender_id_fkey(id, username, avatar_url),
          receiver:profiles!messages_receiver_id_fkey(id, username, avatar_url)
        `)
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .order('created_at', { ascending: false });

      if (error) {
        toast.error('Failed to fetch messages');
        return;
      }

      const formattedMessages = data.map(msg => ({
        ...msg,
        sender: msg.sender as Message['sender'],
        receiver: msg.receiver as Message['receiver']
      }));

      setMessages(formattedMessages);
      setIsLoading(false);
    };

    fetchMessages();

    const subscription = supabase
      .channel('messages')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public',
        table: 'messages',
        filter: `sender_id=eq.${user.id},receiver_id=eq.${user.id}` 
      }, () => {
        fetchMessages();
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [user]);

  const sendMessage = async (content: string, receiverId: string) => {
    if (!user) return;

    const { error } = await supabase
      .from('messages')
      .insert({
        content,
        sender_id: user.id,
        receiver_id: receiverId,
      });

    if (error) {
      toast.error('Failed to send message');
    }
  };

  const markAsRead = async (messageId: string) => {
    const { error } = await supabase
      .from('messages')
      .update({ read: true })
      .eq('id', messageId);

    if (error) {
      toast.error('Failed to mark message as read');
    }
  };

  const handleSendMessage = (content: string) => {
    if (selectedChat) {
      sendMessage(content, selectedChat);
    }
  };

  return (
    <MessagesContext.Provider 
      value={{ 
        messages, 
        sendMessage, 
        markAsRead,
        selectedChat,
        setSelectedChat,
        chats,
        isLoading,
        handleSendMessage
      }}
    >
      {children}
    </MessagesContext.Provider>
  );
};

export const useMessages = () => {
  const context = useContext(MessagesContext);
  if (context === undefined) {
    throw new Error('useMessages must be used within a MessagesProvider');
  }
  return context;
};
