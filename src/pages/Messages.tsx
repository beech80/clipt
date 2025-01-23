import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthContext";
import { ChatList } from "@/components/messages/ChatList";
import { MessageList } from "@/components/messages/MessageList";
import { MessageInput } from "@/components/messages/MessageInput";
import { ChatUser, Message } from "@/types/message";

export default function Messages() {
  const { user } = useAuth();
  const [selectedChat, setSelectedChat] = useState<string | null>(null);

  const { data: chats, isLoading: isLoadingChats } = useQuery({
    queryKey: ['chats', user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('messages')
        .select(`
          id,
          sender_id,
          receiver_id,
          content,
          created_at,
          sender:profiles!messages_sender_id_fkey (
            id,
            username,
            avatar_url
          ),
          receiver:profiles!messages_receiver_id_fkey (
            id,
            username,
            avatar_url
          )
        `)
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Transform the data into ChatUser format
      const chatUsers = new Map<string, ChatUser>();

      data.forEach(msg => {
        const otherUser = msg.sender_id === user.id ? msg.receiver : msg.sender;
        if (!otherUser) return;

        if (!chatUsers.has(otherUser.id)) {
          chatUsers.set(otherUser.id, {
            id: otherUser.id,
            username: otherUser.username,
            avatar_url: otherUser.avatar_url,
            last_message: msg.content,
            unread_count: 0 // You might want to calculate this
          });
        }
      });

      return Array.from(chatUsers.values());
    },
    enabled: !!user,
  });

  const { data: messages = [] } = useQuery({
    queryKey: ['messages', selectedChat],
    queryFn: async () => {
      if (!user || !selectedChat) return [];

      const { data, error } = await supabase
        .from('messages')
        .select(`
          id,
          content,
          created_at,
          sender_id,
          receiver_id
        `)
        .or(`and(sender_id.eq.${user.id},receiver_id.eq.${selectedChat}),and(sender_id.eq.${selectedChat},receiver_id.eq.${user.id})`)
        .order('created_at', { ascending: true });

      if (error) throw error;

      return data as Message[];
    },
    enabled: !!user && !!selectedChat,
  });

  if (!user) {
    return (
      <div className="container max-w-6xl mx-auto px-4 py-8">
        <Card className="p-6 text-center bg-card/50 backdrop-blur-sm border-border/50">
          <h2 className="text-xl font-semibold">Please sign in</h2>
          <p className="text-muted-foreground mt-2">
            You need to be signed in to view your messages.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="container max-w-6xl mx-auto px-4 py-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[calc(100vh-12rem)]">
        {/* Chat List */}
        <Card className="md:col-span-1 bg-card/50 backdrop-blur-sm border-border/50">
          <ScrollArea className="h-full">
            {isLoadingChats ? (
              <div className="p-4 space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-center space-x-4">
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-[150px]" />
                      <Skeleton className="h-4 w-[100px]" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <ChatList
                chats={chats || []}
                selectedChat={selectedChat}
                onSelectChat={setSelectedChat}
              />
            )}
          </ScrollArea>
        </Card>

        {/* Message Area */}
        <Card className="md:col-span-2 flex flex-col bg-card/50 backdrop-blur-sm border-border/50">
          {selectedChat ? (
            <>
              <ScrollArea className="flex-1 p-4">
                <MessageList messages={messages} />
              </ScrollArea>
              <div className="p-4 border-t border-border/50">
                <MessageInput onSendMessage={() => {}} />
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-full">
              <p className="text-muted-foreground">
                Select a chat to start messaging
              </p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}