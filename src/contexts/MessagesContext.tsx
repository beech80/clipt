
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
    let cancelled = false;
    setMessages([]);
    setChats([]);
    setSelectedChat(null);
    setIsLoading(Boolean(user));
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
        .order('created_at', { ascending: false })
        .order('id', { ascending: false })
        .limit(100);

      if (cancelled) return;
      if (error) {
        setIsLoading(false);
        toast.error('Failed to fetch messages');
        return;
      }

      const formattedMessages = data.map(msg => ({
        ...msg,
        sender: msg.sender as Message['sender'],
        receiver: msg.receiver as Message['receiver']
      }));

      setMessages(formattedMessages);
      const conversations = new Map<string, ChatUser>();
      for (const message of formattedMessages) {
        const incoming = message.receiver_id === user.id;
        const otherId = incoming ? message.sender_id : message.receiver_id;
        if (!otherId) continue;
        const profile = incoming ? message.sender : message.receiver;
        const existing = conversations.get(otherId);
        if (existing) {
          existing.unread_count += incoming && !message.read ? 1 : 0;
        } else {
          conversations.set(otherId, {
            id: otherId, username: profile?.username ?? null, avatar_url: profile?.avatar_url ?? null,
            last_message: message.content, unread_count: incoming && !message.read ? 1 : 0,
          });
        }
      }
      setChats([...conversations.values()]);
      setIsLoading(false);
    };

    fetchMessages();

    const subscription = supabase
      .channel('messages')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public',
        table: 'messages',
        filter: `sender_id=eq.${user.id}`
      }, () => {
        fetchMessages();
      })
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'messages',
        filter: `receiver_id=eq.${user.id}`,
      }, () => { void fetchMessages(); })
      .subscribe();

    return () => {
      cancelled = true;
      void supabase.removeChannel(subscription);
    };
  }, [user]);

  const sendMessage = async (content: string, receiverId: string) => {
    if (!user) throw new Error('Please sign in to send messages');
    if (!content.trim() || content.length > 4000) throw new Error('Messages must contain 1–4000 characters');

    const { error } = await supabase
      .from('messages')
      .insert({
        content: content.trim(),
        sender_id: user.id,
        receiver_id: receiverId,
      });

    if (error) {
      toast.error('Failed to send message');
      throw error;
    }
  };

  const markAsRead = async (messageId: string) => {
    if (!user) throw new Error('Please sign in');
    const { error } = await supabase
      .from('messages')
      .update({ read: true })
      .eq('id', messageId)
      .eq('receiver_id', user.id);

    if (error) {
      toast.error('Failed to mark message as read');
    }
  };

  const handleSendMessage = (content: string) => {
    if (selectedChat) {
      void sendMessage(content, selectedChat).catch(() => {});
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
