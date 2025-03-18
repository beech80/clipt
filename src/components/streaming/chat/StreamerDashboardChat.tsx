import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from 'sonner';
import type { StreamChatMessage } from '@/types/chat';
import { Send, X, MessageSquare, Users, Settings, Trash, User, Shield, Crown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StreamerDashboardChatProps {
  streamId: string;
  isLive: boolean;
}

type MessageTypeFilter = 'all' | 'chat' | 'system' | 'mod';

export const StreamerDashboardChat = ({ streamId, isLive }: StreamerDashboardChatProps) => {
  const { user } = useAuth();
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<StreamChatMessage[]>([]);
  const [isExpanded, setIsExpanded] = useState(true);
  const [activeTab, setActiveTab] = useState<string>('chat');
  const [viewerCount, setViewerCount] = useState<number>(0);
  const [filter, setFilter] = useState<MessageTypeFilter>('all');
  const [bannedUsers, setBannedUsers] = useState<string[]>([]);
  const [moderators, setModerators] = useState<string[]>([]);
  const [pinnedMessage, setPinnedMessage] = useState<StreamChatMessage | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Simulate viewer count
    if (isLive) {
      const interval = setInterval(() => {
        setViewerCount(Math.floor(Math.random() * 10) + 1);
      }, 5000);
      return () => clearInterval(interval);
    } else {
      setViewerCount(0);
    }
  }, [isLive]);

  useEffect(() => {
    // Load initial messages
    const loadMessages = async () => {
      const { data, error } = await supabase
        .from('stream_chat')
        .select(`
          *,
          profiles:user_id (
            username,
            avatar_url
          )
        `)
        .eq('stream_id', streamId)
        .order('created_at', { ascending: true })
        .limit(100);

      if (error) {
        console.error('Failed to load chat messages:', error);
        return;
      }

      setMessages(data as StreamChatMessage[]);
    };

    // Simulate moderators list
    setModerators([user?.id || '']);

    loadMessages();

    // Subscribe to new messages
    const channel = supabase
      .channel(`stream_chat:${streamId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'stream_chat',
          filter: `stream_id=eq.${streamId}`
        },
        async (payload) => {
          if (payload.eventType === 'INSERT') {
            const { data: profile } = await supabase
              .from('profiles')
              .select('username, avatar_url')
              .eq('id', payload.new.user_id)
              .single();

            const newMessage: StreamChatMessage = {
              ...payload.new,
              profiles: profile
            };

            setMessages(prev => [...prev, newMessage]);
          } else if (payload.eventType === 'DELETE') {
            setMessages(prev => prev.filter(msg => msg.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [streamId, user?.id]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !user) return;

    try {
      const { error } = await supabase
        .from('stream_chat')
        .insert({
          stream_id: streamId,
          user_id: user.id,
          message: message.trim(),
          message_type: 'chat'
        });

      if (error) throw error;
      setMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    try {
      const { error } = await supabase
        .from('stream_chat')
        .delete()
        .eq('id', messageId);

      if (error) throw error;
      toast.success('Message deleted');
    } catch (error) {
      console.error('Error deleting message:', error);
      toast.error('Failed to delete message');
    }
  };

  const handleBanUser = (userId: string) => {
    setBannedUsers(prev => [...prev, userId]);
    toast.success('User banned from chat');
  };

  const handlePinMessage = (msg: StreamChatMessage) => {
    setPinnedMessage(msg);
    toast.success('Message pinned to chat');
  };

  const handleAddModerator = (userId: string) => {
    setModerators(prev => [...prev, userId]);
    toast.success('Moderator added');
  };

  const filteredMessages = messages.filter(msg => {
    if (bannedUsers.includes(msg.user_id)) return false;
    if (filter === 'all') return true;
    return msg.message_type === filter;
  });

  const isUserModerator = (userId: string) => {
    return moderators.includes(userId);
  };

  const getMessageTypeIcon = (type?: string) => {
    switch (type) {
      case 'system':
        return <Shield className="h-3 w-3 text-blue-500" />;
      case 'mod':
        return <Crown className="h-3 w-3 text-yellow-500" />;
      default:
        return null;
    }
  };

  if (!isExpanded) {
    return (
      <Button 
        className="rounded-full h-12 w-12 shadow-lg"
        onClick={() => setIsExpanded(true)}
      >
        <MessageSquare className="h-6 w-6" />
      </Button>
    );
  }

  return (
    <Card className="w-full h-full shadow-lg">
      <CardHeader className="py-2 px-3 border-b">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base font-medium">Stream Chat</CardTitle>
            <CardDescription className="text-xs">
              {isLive ? (
                <span className="flex items-center">
                  <span className="h-2 w-2 rounded-full bg-green-500 mr-1 animate-pulse"></span>
                  Live • {viewerCount} {viewerCount === 1 ? 'viewer' : 'viewers'}
                </span>
              ) : (
                <span className="flex items-center">
                  <span className="h-2 w-2 rounded-full bg-gray-500 mr-1"></span>
                  Offline
                </span>
              )}
            </CardDescription>
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-muted">
              <Settings className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-muted">
              <Users className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <Tabs defaultValue="chat" value={activeTab} onValueChange={setActiveTab} className="flex flex-col h-[calc(100%-48px)]">
        <TabsList className="px-3 pt-1 justify-start border-b rounded-none bg-transparent">
          <TabsTrigger value="chat" className="text-xs py-1">Chat</TabsTrigger>
          <TabsTrigger value="activity" className="text-xs py-1">Activity</TabsTrigger>
          <TabsTrigger value="settings" className="text-xs py-1">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="chat" className="flex-1 flex flex-col p-0 m-0 data-[state=active]:flex data-[state=inactive]:hidden h-full overflow-hidden">
          {pinnedMessage && (
            <div className="bg-muted/30 border-b px-3 py-2">
              <div className="flex items-center gap-1 mb-1">
                <Badge variant="outline" className="text-[10px] px-1 py-0 h-4 rounded text-amber-500 border-amber-500">
                  PINNED
                </Badge>
                <span className="text-[10px] text-muted-foreground">
                  by {pinnedMessage.profiles?.username}
                </span>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-4 w-4 ml-auto p-0 hover:bg-red-100 hover:text-red-500"
                  onClick={() => setPinnedMessage(null)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
              <p className="text-xs">{pinnedMessage.message}</p>
            </div>
          )}
          
          <div className="p-1 border-b flex items-center gap-1 bg-muted/20">
            <Button 
              variant={filter === 'all' ? "default" : "ghost"} 
              size="sm" 
              className="h-6 text-xs px-2"
              onClick={() => setFilter('all')}
            >
              All
            </Button>
            <Button 
              variant={filter === 'chat' ? "default" : "ghost"} 
              size="sm" 
              className="h-6 text-xs px-2"
              onClick={() => setFilter('chat')}
            >
              Chat
            </Button>
            <Button 
              variant={filter === 'system' ? "default" : "ghost"} 
              size="sm" 
              className="h-6 text-xs px-2"
              onClick={() => setFilter('system')}
            >
              System
            </Button>
            <Button 
              variant={filter === 'mod' ? "default" : "ghost"} 
              size="sm" 
              className="h-6 text-xs px-2"
              onClick={() => setFilter('mod')}
            >
              Mod
            </Button>
          </div>

          <ScrollArea className="flex-1 p-3">
            <div className="space-y-3">
              {filteredMessages.length === 0 ? (
                <div className="h-full flex items-center justify-center">
                  <p className="text-xs text-muted-foreground">No messages yet</p>
                </div>
              ) : (
                filteredMessages.map((msg) => (
                  <div 
                    key={msg.id} 
                    className={cn(
                      "group flex items-start gap-2 text-sm p-1 rounded hover:bg-muted/40 transition-colors",
                      msg.user_id === user?.id && "bg-muted/20"
                    )}
                  >
                    <Avatar className="h-6 w-6 rounded">
                      <AvatarImage src={msg.profiles?.avatar_url} />
                      <AvatarFallback className="text-xs">
                        {msg.profiles?.username?.[0]?.toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline gap-1">
                        <span className={cn(
                          "font-medium text-xs",
                          isUserModerator(msg.user_id) && "text-blue-500"
                        )}>
                          {msg.profiles?.username || 'Unknown'}
                          {isUserModerator(msg.user_id) && (
                            <Shield className="inline-block h-3 w-3 ml-1 text-blue-500" />
                          )}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          {new Date(msg.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </span>
                        {getMessageTypeIcon(msg.message_type)}
                      </div>
                      <p className="text-xs break-words">{msg.message}</p>
                    </div>
                    <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 self-start pt-1">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-5 w-5 p-0 hover:bg-amber-100 hover:text-amber-600"
                        onClick={() => handlePinMessage(msg)}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" x2="12" y1="17" y2="22"/><path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4h1v4.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24Z"/></svg>
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-5 w-5 p-0 hover:bg-red-100 hover:text-red-600"
                        onClick={() => handleDeleteMessage(msg.id)}
                      >
                        <Trash className="h-3 w-3" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-5 w-5 p-0 hover:bg-red-100 hover:text-red-600"
                        onClick={() => handleBanUser(msg.user_id)}
                      >
                        <User className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>

          <form onSubmit={handleSendMessage} className="p-2 border-t">
            <div className="flex items-center gap-2">
              <Input
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={isLive ? "Send a message..." : "Stream is offline"}
                disabled={!isLive || !user}
                className="h-8 text-sm"
              />
              <Button 
                type="submit" 
                size="sm" 
                className="h-8 whitespace-nowrap" 
                disabled={!isLive || !user || !message.trim()}
              >
                <Send className="h-4 w-4 mr-1" />
                Send
              </Button>
            </div>
          </form>
        </TabsContent>

        <TabsContent value="activity" className="p-3 overflow-auto">
          <h3 className="text-sm font-medium mb-2">Recent Activity</h3>
          <div className="space-y-2">
            <div className="bg-muted/30 p-2 rounded text-xs">
              <span className="font-medium">User1</span> followed
              <span className="text-[10px] text-muted-foreground block">2 minutes ago</span>
            </div>
            <div className="bg-muted/30 p-2 rounded text-xs">
              <span className="font-medium">User2</span> subscribed • Tier 1
              <span className="text-[10px] text-muted-foreground block">15 minutes ago</span>
            </div>
            <div className="bg-muted/30 p-2 rounded text-xs">
              <span className="font-medium">User3</span> donated $5
              <span className="text-[10px] text-muted-foreground block">35 minutes ago</span>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="settings" className="p-3 overflow-auto">
          <h3 className="text-sm font-medium mb-2">Chat Settings</h3>
          <div className="space-y-3">
            <div className="space-y-1">
              <h4 className="text-xs font-medium">Moderators</h4>
              <div className="flex flex-wrap gap-1">
                {moderators.map((modId, i) => (
                  <Badge key={i} variant="outline" className="text-xs">
                    {modId === user?.id ? 'You' : `Mod ${i+1}`}
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-3 w-3 ml-1 hover:bg-red-100 hover:text-red-600"
                    >
                      <X className="h-2 w-2" />
                    </Button>
                  </Badge>
                ))}
              </div>
            </div>
            
            <div className="space-y-1">
              <h4 className="text-xs font-medium">Banned Users</h4>
              <div className="flex flex-wrap gap-1">
                {bannedUsers.length === 0 ? (
                  <p className="text-xs text-muted-foreground">No banned users</p>
                ) : (
                  bannedUsers.map((userId, i) => (
                    <Badge key={i} variant="destructive" className="text-xs">
                      User {i+1}
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-3 w-3 ml-1 hover:bg-white/20"
                      >
                        <X className="h-2 w-2" />
                      </Button>
                    </Badge>
                  ))
                )}
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </Card>
  );
};
