import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Search, MessageSquare, Plus, Users, ArrowLeft } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase, checkTableExists } from "@/lib/supabase";
import { toast } from "sonner";
import { UserLink } from '@/components/user/UserLink';
import type { Tables } from '@/integrations/supabase/types';
import { directChatId, mergeMessageHistory } from '@/lib/message-history';
import { communityErrorMessage, communityTextWarning } from '@/lib/community-text';

type ChatProfile = Pick<Tables<'profiles'>, 'id' | 'username' | 'display_name' | 'avatar_url'>;
type DirectChat = {
  id: string;
  type: string;
  recipient_id: string;
  recipient_name: string;
  recipient_avatar?: string | null;
  last_message?: string | null;
  last_message_time?: string | null;
  messages?: (Tables<'messages'> & { sender_name?: string | null })[];
  historyLoading?: boolean;
  historyError?: boolean;
  hasOlder?: boolean;
  historyCursor?: Tables<'messages'>;
};

const Messages = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { userId } = useParams();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const historyRequests = useRef(new Set<string>());
  const prependScroll = useRef<{chatId:string;height:number;top:number} | null>(null);
  const lastScrolledMessage = useRef('');
  const [groupName, setGroupName] = useState("");
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [conversationFilter, setConversationFilter] = useState("");
  const [searchResults, setSearchResults] = useState<ChatProfile[]>([]);
  const searchRequest = useRef(0);
  const [userSearchLoading, setUserSearchLoading] = useState(false);
  const [userSearchError, setUserSearchError] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [activeChats, setActiveChats] = useState<DirectChat[]>([]);
  const [chatsLoading, setChatsLoading] = useState(true);
  const [chatsError, setChatsError] = useState(false);
  const [selectedChat, setSelectedChat] = useState<DirectChat | null>(null);
  const [message, setMessage] = useState("");
  const [sendError, setSendError] = useState('');
  const startRequest = useRef(0);
  const inboxRequest = useRef(0);
  const [showNewChatDialog, setShowNewChatDialog] = useState(false);
  const newChatOpener = useRef<HTMLElement | null>(null);
  const [showCreateGroupChat, setShowCreateGroupChat] = useState(false);

  useEffect(() => {
    startRequest.current += 1;
    setSelectedChat(null); setMessage(''); setSendError('');
    const setupMessagingTables = async () => {
      if (!user) return;
      
      console.log("Setting up messaging...");
      try {
        // Check if direct_messages table exists, create if needed
        await ensureMessagesTableExists();
      } catch (error) {
        console.error("Error setting up messaging tables:", error);
        toast.error("Error setting up messaging");
      }
    };
    
    // Set up messaging tables when component loads
    setupMessagingTables();
    
    // If userId is provided in URL, start conversation with that user
    if (userId && user) {
      // Initialize the chat with the specified user
      startOrContinueChat(userId);
    }
    return () => { startRequest.current += 1; inboxRequest.current += 1; };
  }, [user?.id, userId]);

  // Fetch active chats when component mounts
  useEffect(() => {
    if (user) {
      fetchActiveChats();
    }
  }, [user?.id]);

  const fetchActiveChats = async () => {
    const revision = ++inboxRequest.current;
    setChatsLoading(true);
    setChatsError(false);
    try {
      if (!user) return;
      
      // Fetch all messages where user is either sender or recipient
      const { data: messages, error } = await supabase
        .from('messages')
        .select('*, profiles!messages_sender_id_fkey(username, avatar_url, display_name)')
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      
      // Group messages by conversations (unique combinations of sender/recipient)
      const conversationsMap = new Map();
      
      messages.forEach(msg => {
        // Determine the other party in the conversation
        const otherUserId = msg.sender_id === user.id ? msg.receiver_id : msg.sender_id;
        
        // Create a unique ID for this conversation
        const chatId = directChatId(user.id, otherUserId);
        
        if (!conversationsMap.has(chatId)) {
          // Start tracking this conversation
          const otherUserProfile = msg.sender_id === user.id 
            ? null // Need to fetch this separately
            : msg.profiles;
            
          conversationsMap.set(chatId, {
            id: chatId,
            type: 'direct',
            participant_id: otherUserId,
            last_message: msg.content,
            last_message_time: msg.created_at,
            profile: otherUserProfile
          });
        }
      });
      
      // For conversations where we need to fetch the other user's profile
      const profilePromises = Array.from(conversationsMap.values())
        .filter(convo => !convo.profile)
        .map(async (convo) => {
          const { data, error } = await supabase
            .from('profiles')
            .select('username, avatar_url, display_name')
            .eq('id', convo.participant_id)
            .single();
            
          if (!error && data) {
            convo.profile = data;
          }
          return convo;
        });
        
      // Wait for all profile fetches to complete
      await Promise.all(profilePromises);
      
      // Map conversations to a more usable format
      const formattedConversations = Array.from(conversationsMap.values())
        .map(convo => ({
          id: convo.id,
          type: 'direct',
          recipient_id: convo.participant_id,
          recipient_name: convo.profile?.username || convo.profile?.display_name || 'User',
          recipient_avatar: convo.profile?.avatar_url,
          last_message: convo.last_message,
          last_message_time: convo.last_message_time
        }))
        .sort((a, b) => {
          // Safely compare dates
          const dateA = a.last_message_time ? new Date(a.last_message_time).getTime() : 0;
          const dateB = b.last_message_time ? new Date(b.last_message_time).getTime() : 0;
          return dateB - dateA;
        });
      
      if (revision === inboxRequest.current) setActiveChats(formattedConversations);
      
    } catch (error) {
      console.error("Error processing chats:", error);
      if (revision === inboxRequest.current) setChatsError(true);
    } finally {
      if (revision === inboxRequest.current) setChatsLoading(false);
    }
  };

  const handleSearch = async () => {
    setIsSearching(true);
    if (searchTerm.length < 1) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('id, username, avatar_url, display_name')
      .ilike('username', `%${searchTerm}%`)
      .limit(10);

    if (error) {
      toast.error("Error searching users");
      setIsSearching(false);
      return;
    }

    setSearchResults(data || []);
    setIsSearching(false);
  };

  const handleSearchUsers = async (term: string) => {
    const request = ++searchRequest.current;
    setSearchTerm(term);
    setSearchResults([]);
    setUserSearchError(false);
    setUserSearchLoading(Boolean(term.trim()));
    if (!term.trim() || !user) { setUserSearchLoading(false); return; }

    const { data, error } = await supabase
      .from('profiles')
      .select('id, username, avatar_url, display_name')
      .not('id', 'eq', user?.id)
      .ilike('username', `%${term}%`)
      .limit(10);

    if (request !== searchRequest.current) return;
    setUserSearchLoading(false);
    if (error) { setUserSearchError(true); return; }

    setSearchResults(data || []);
  };

  const sendingRef = useRef(false);
  const [isSending, setIsSending] = useState(false);
  const sendMessage = async () => {
    if (!message.trim() || !selectedChat || !user || sendingRef.current) return;
    if (message.trim().length > 4000) { toast.error('Messages must be 4000 characters or fewer'); return; }
    const warning = communityTextWarning(message);
    if (warning) { setSendError(warning); toast.error(warning); return; }
    const targetId = selectedChat.id;
    const revision = startRequest.current;
    const draft = message;
    sendingRef.current = true;
    setIsSending(true);
    setSendError('');
    try {
      const { data: savedMessage, error } = await supabase.from('messages').insert({
        sender_id: user.id,
        receiver_id: selectedChat.recipient_id,
        content: draft.trim(),
      }).select().single();
      if (error) throw error;
      if (!savedMessage) throw new Error('Message was not saved');
      if (revision !== startRequest.current) return;
      setSelectedChat(current => current?.id === targetId ? {
        ...current,
        messages: [...(current.messages || []).filter(item => item.id !== savedMessage.id), savedMessage],
      } : current);
      setMessage(current => current === draft ? '' : current);
      void fetchActiveChats();
    } catch (error) {
      if (revision !== startRequest.current) return;
      const explanation = communityErrorMessage(error, 'Message was not sent. Your draft has been kept; please try again.');
      setSendError(explanation);
      toast.error(explanation);
    } finally {
      sendingRef.current = false;
      setIsSending(false);
    }
  };

  // Function to fetch messages for a conversation
  const fetchMessages = async (chatId: string, recipientId: string, before?: Tables<'messages'>) => {
    if (!user || historyRequests.current.has(chatId)) return;
    historyRequests.current.add(chatId);
    setSelectedChat(current=>current?.id===chatId?{...current,historyLoading:true,historyError:false}:current);
    
    try {
      // Query messages where current user is either sender or recipient
      let request = supabase
        .from('messages')
        .select('*')
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .or(`sender_id.eq.${recipientId},receiver_id.eq.${recipientId}`)
        .order('created_at', { ascending: false })
        .order('id', { ascending: false })
        .limit(50);
      if(before) request=request.or(`created_at.lt.${before.created_at},and(created_at.eq.${before.created_at},id.lt.${before.id})`);
      const {data:messages,error}=await request.retry(false);
        
      if (error) {
        console.error("Error fetching messages:", error);
        throw error;
      }
      
      // Get profiles for message senders
      const senderIds = [...new Set(messages.map(m => m.sender_id))];
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, username, display_name')
        .in('id', senderIds);
        
      if (profilesError) {
        console.error("Error fetching profiles:", profilesError);
      }
      
      // Add sender_name to each message
      const messagesWithNames = messages.map(msg => {
        const sender = profiles?.find(p => p.id === msg.sender_id);
        return {
          ...msg,
          sender_name: sender ? (sender.username || sender.display_name) : 
                      (msg.sender_id === user.id ? 'You' : 'User')
        };
      });
      
      const viewport=messagesEndRef.current?.parentElement;
      if(before && viewport) prependScroll.current={chatId,height:viewport.scrollHeight,top:viewport.scrollTop};
      // Update selected chat with messages
      setSelectedChat(current => current?.id === chatId ? {
        ...current,
        // A request started before a send/realtime event must not erase a newer
        // confirmed message when its older snapshot finally resolves.
        messages: mergeMessageHistory(messagesWithNames,current.messages || []),
        historyLoading:false,historyError:false,
        hasOlder:messages.length===50,
        historyCursor:messages[messages.length-1],
      } : current);
      const unread=messages.filter(item=>item.receiver_id===user.id&&!item.read).map(item=>item.id);
      if(unread.length){
        const { error: readError } = await supabase.from('messages')
          .update({ read: true }).eq('receiver_id', user.id).in('id',unread).eq('read', false);
        if (readError) toast.error('Could not update read receipts.');
      }
      return messagesWithNames;
    } catch (error) {
      console.error("Error fetching messages:", error);
      toast.error("Failed to load messages");
      setSelectedChat(current=>current?.id===chatId?{...current,historyLoading:false,historyError:true}:current);
      return [];
    } finally {
      historyRequests.current.delete(chatId);
    }
  };

  // This function will be used to either start a new chat or continue an existing chat with a user
  const startOrContinueChat = async (targetUserId: string) => {
    if (!user) return;
    if (targetUserId === user.id) { toast.error('Choose another creator to message.'); return; }
    const revision = ++startRequest.current;

    try {
      // Fetch the profile of the target user
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('username, display_name, avatar_url')
        .eq('id', targetUserId)
        .single();

      if (error) {
        console.error("Error fetching user profile:", error);
        toast.error("Couldn't find this user");
        return;
      }

      const recipientName = profile.username || profile.display_name || 'User';
      
      // Check if direct_messages table exists, create if needed
      await ensureMessagesTableExists();
      
      // Generate chat ID
      if (revision !== startRequest.current) return;
      const chatId = directChatId(user.id, targetUserId);
      setMessage('');
      setSendError('');
      
      // Initialize chat with empty messages array for now
      setSelectedChat({
        id: chatId,
        type: 'direct',
        recipient_id: targetUserId,
        recipient_name: recipientName,
        recipient_avatar: profile.avatar_url,
        messages: [],historyLoading:true
      });
      
      // Fetch any existing messages
      fetchMessages(chatId, targetUserId);
      
      // Clear search results and dialog
      setSearchResults([]);
      setSearchTerm("");
      setShowNewChatDialog(false);
      
      // Focus on the message input field
      setTimeout(() => {
        const messageInput = document.querySelector('input[aria-label="Message"]') as HTMLInputElement;
        if (messageInput) {
          messageInput.focus();
        }
      }, 300);
    } catch (error) {
      console.error("Error starting chat:", error);
      toast.error("Error starting conversation");
    }
  };

  // Setup real-time messaging
  useEffect(() => {
    if (!user) return;
    
    // Subscribe to new messages
    const subscription = supabase
      .channel('direct_messages')
      .on<Tables<'messages'>>('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `receiver_id=eq.${user.id}`
      }, (payload) => {
        void fetchActiveChats();

        // If this message is for the current chat, add it to the messages
        if (selectedChat && 
            (payload.new.sender_id === selectedChat.recipient_id || 
             payload.new.receiver_id === selectedChat.recipient_id)) {
          
          // Get sender profile
          supabase
            .from('profiles')
            .select('username, display_name')
            .eq('id', payload.new.sender_id)
            .single()
            .then(({ data: profile }) => {
              const senderName = profile ? 
                                (profile.username || profile.display_name) : 
                                (payload.new.sender_id === user.id ? 'You' : 'User');
              
              // Add message to chat
              setSelectedChat(current => {
                if (!current || current.recipient_id !== payload.new.sender_id) return current;
                if (current.messages?.some(item => item.id === payload.new.id)) return current;
                return {
                  ...current,
                  messages: [...(current.messages || []), {
                    ...payload.new,
                    sender_name: senderName
                  }]
                };
              });
              void supabase.from('messages').update({read:true}).eq('id',payload.new.id)
                .eq('receiver_id',user.id).then(({error})=>{
                  if(error) toast.error('Could not update read receipts.');
                });
            });
        }
      })
      .on<Tables<'messages'>>('postgres_changes', {
        event:'UPDATE',schema:'public',table:'messages',filter:`sender_id=eq.${user.id}`,
      },payload=>{
        setSelectedChat(current=>current?.recipient_id===payload.new.receiver_id?{
          ...current,messages:current.messages?.map(item=>item.id===payload.new.id?{...item,read:item.read||payload.new.read}:item),
        }:current);
      })
      .subscribe(status => {
        // Reconcile messages arriving while the realtime channel was joining.
        if (status === 'SUBSCRIBED') {
          void fetchActiveChats();
          if (selectedChat) void fetchMessages(selectedChat.id, selectedChat.recipient_id);
        }
      });
      
    // Cleanup subscription on component unmount or when selected chat changes
    return () => {
      subscription.unsubscribe();
    };
  }, [user?.id, selectedChat?.recipient_id]);

  // Read-only availability check. Schema creation is never attempted in the browser.
  const ensureMessagesTableExists = async () => {
    await checkTableExists('messages');
  };

  // Function to scroll to the bottom of messages
  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      const viewport = messagesEndRef.current.parentElement;
      if (viewport) viewport.scrollTop = viewport.scrollHeight;
    }
  };

  // Auto-scroll when messages change
  useEffect(() => {
    const pending=prependScroll.current;
    if(pending){
      prependScroll.current=null;
      const viewport=messagesEndRef.current?.parentElement;
      if(viewport&&pending.chatId===selectedChat?.id){
        viewport.scrollTop=pending.top+viewport.scrollHeight-pending.height;
        return;
      }
    }
    const latest=selectedChat?.messages?.at(-1);
    const key=latest?`${selectedChat?.id}:${latest.id}`:'';
    if (latest && key!==lastScrolledMessage.current) {
      lastScrolledMessage.current=key;
      scrollToBottom();
    }
  }, [selectedChat?.id, selectedChat?.messages]);

  // Handle the creation of a new group chat
  const handleCreateGroup = async () => {
    if (!user || !groupName || selectedUsers.length === 0) return;
    
    try {
      throw new Error('Group creation is not connected yet. No group was created.');
      setGroupName("");
      setSelectedUsers([]);
      setShowCreateGroupChat(false);
    } catch (error) {
      console.error("Error creating group:", error);
      toast.error("Failed to create group");
    }
  };

  return (
    <div data-conversation-open={Boolean(selectedChat)} className="clipt-messages container mx-auto p-4 relative flex flex-col h-[calc(100dvh-160px-env(safe-area-inset-bottom,0px))] min-h-[200px]">
      <h1 className="clipt-messages-heading text-2xl font-bold text-foreground mb-6">Messages</h1>
      <div className="grid grid-cols-1 md:grid-cols-[minmax(240px,0.8fr)_minmax(0,1.6fr)] gap-4 flex-1 min-h-0">
        {/* Conversations section */}
        <div aria-label="Conversations" className={`clipt-inbox gaming-card p-4 flex-col overflow-y-auto min-h-0 ${selectedChat ? 'hidden md:flex' : 'flex'}`}>
          {(
            <>
              <div className="clipt-inbox-heading flex items-center justify-between mb-6">
                <h2 className="flex items-center gap-2 font-semibold"><MessageSquare aria-hidden="true" className="h-6 w-6" />Messages</h2>
                <Button 
                  variant="default" 
                  onClick={event => { newChatOpener.current = event.currentTarget; setShowNewChatDialog(true); }}
                  size="icon"
                  aria-label="Start new conversation"
                >
                  <Plus className="h-5 w-5" />
                </Button>
              </div>
              
              <Input aria-label="Search conversations" placeholder="Search messages…" value={conversationFilter} onChange={event => setConversationFilter(event.target.value)} className="mb-4" />
              <div className="space-y-4">
                {chatsLoading && <p role="status" className="text-muted-foreground">Loading conversations…</p>}
                {chatsError && <div role="alert" className="space-y-3">
                  <p>Unable to load conversations.</p>
                  <Button onClick={() => void fetchActiveChats()} disabled={chatsLoading}>Retry conversations</Button>
                </div>}
                {activeChats.length > 0 ? (
                  activeChats.filter(chat => `${chat.recipient_name} ${chat.last_message || ''}`.toLocaleLowerCase().includes(conversationFilter.toLocaleLowerCase())).map(chat => (
                    <Button 
                      key={chat.id}
                      variant="ghost"
                      aria-current={selectedChat?.id === chat.id ? 'true' : undefined}
                      className={`clipt-conversation-row h-auto min-h-16 p-4 hover:bg-gaming-700/30 rounded-lg w-full flex flex-col items-start ${selectedChat?.id === chat.id ? 'bg-violet-900/40 ring-1 ring-violet-400' : ''}`}
                      onClick={() => startOrContinueChat(chat.recipient_id)}
                    >
                      <div className="flex items-center gap-3 w-full mb-2">
                        <Avatar>
                          <AvatarImage src={chat.recipient_avatar} />
                          <AvatarFallback>{chat.recipient_name?.charAt(0).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-baseline justify-between">
                            <span className="text-base font-medium truncate">{chat.recipient_name}</span>
                            <span className="text-xs text-muted-foreground shrink-0 ml-2">
                              {chat.last_message_time ? new Date(chat.last_message_time).toLocaleString() : ''}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground truncate">
                            {chat.last_message || "No messages yet"}
                          </p>
                        </div>
                      </div>
                    </Button>
                  ))
                ) : (
                  !chatsLoading && !chatsError && <div className="flex flex-col items-center text-center gap-3 py-8">
                    <MessageSquare aria-hidden="true" className="h-12 w-12 text-violet-300" />
                    <h2 className="font-semibold">No conversations yet</h2>
                    <p className="text-sm text-muted-foreground">Find a creator to start a private conversation.</p>
                    <Button onClick={event => { newChatOpener.current = event.currentTarget; setShowNewChatDialog(true); }}>Find someone to message</Button>
                  </div>
                )}
              </div>
                {!chatsLoading && !chatsError && activeChats.length > 0 && conversationFilter && !activeChats.some(chat => `${chat.recipient_name} ${chat.last_message || ''}`.toLocaleLowerCase().includes(conversationFilter.toLocaleLowerCase())) && <p role="status" className="text-sm text-muted-foreground">No matching conversations.</p>}
            </>
          )}
        </div>
        {selectedChat ? (
            // Active chat section
            <div role="region" aria-label={`Conversation with ${selectedChat.recipient_name}`} className="clipt-dm-panel gaming-card p-4 flex flex-col h-full min-h-0 min-w-0">
              <div className="clipt-dm-heading flex items-center gap-3 pb-4 border-b mb-4">
                <Button variant="ghost" size="icon" aria-label="Back to conversations" onClick={() => { startRequest.current += 1; setSelectedChat(null); setMessage(''); setSendError(''); }}>
                  <ArrowLeft className="h-5 w-5" />
                </Button>
                <Avatar>
                  <AvatarImage src={selectedChat.recipient_avatar} />
                  <AvatarFallback>{selectedChat.recipient_name?.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 break-words [overflow-wrap:anywhere]">
                  <UserLink 
                    username={selectedChat.recipient_name} 
                    displayName={selectedChat.recipient_name} 
                    className="font-medium hover:underline cursor-pointer"
                  />
                </div>
              </div>
              
              <div className="clipt-dm-history flex-1 min-h-0 overflow-y-auto mb-4 space-y-4" aria-label="Conversation messages" role="log">
                {selectedChat.historyLoading && <p role="status">Loading messages…</p>}
                {selectedChat.historyError && <div role="alert"><p>Unable to load message history. Existing messages are unchanged.</p><Button onClick={()=>void fetchMessages(selectedChat.id,selectedChat.recipient_id,selectedChat.hasOlder?selectedChat.historyCursor:undefined)}>Retry message history</Button></div>}
                {selectedChat.hasOlder && !selectedChat.historyError && <Button disabled={selectedChat.historyLoading} onClick={()=>void fetchMessages(selectedChat.id,selectedChat.recipient_id,selectedChat.historyCursor)}>Load older messages</Button>}
                {selectedChat.messages && selectedChat.messages.length > 0 ? (
                  selectedChat.messages.map((msg, index) => (
                    <div 
                      key={msg.id}
                      className={`flex ${msg.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}
                    >
                      <div 
                        data-message-direction={msg.sender_id === user?.id ? 'outgoing' : 'incoming'}
                        className={`clipt-message-bubble max-w-[80%] p-3 rounded-lg ${
                          msg.sender_id === user?.id 
                            ? 'bg-primary text-primary-foreground rounded-br-none' 
                            : 'bg-muted rounded-bl-none'
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap break-words [overflow-wrap:anywhere]">{msg.content}</p>
                        <div className="text-xs mt-1 opacity-70 text-right">
                          {new Date(msg.created_at).toLocaleString()}
                          {msg.sender_id===user?.id && <span className="block">{msg.read?'Read':'Sent'}</span>}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  !selectedChat.historyLoading && !selectedChat.historyError && <div className="text-center py-12 text-muted-foreground">
                    <p>No messages yet. Say hello!</p>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
              
              <form onSubmit={(e) => {
                e.preventDefault();
                sendMessage();
              }} className="clipt-dm-composer mt-auto">
                <div className="flex gap-2">
                  <Input 
                    aria-label="Message"
                    maxLength={4000}
                    value={message} 
                    onChange={(e) => { setMessage(e.target.value); setSendError(''); }}
                    placeholder="Type a message..."
                    className="flex-1"
                  />
                  <Button type="submit" disabled={isSending || !message.trim()}>
                    Send
                  </Button>
                </div>
              </form>
              {sendError && <p role="alert" className="text-sm text-violet-200 mt-2">{sendError}</p>}
            </div>
          ) : <div className="gaming-card hidden md:flex flex-col items-center justify-center p-8 text-center gap-3"><MessageSquare aria-hidden="true" className="h-12 w-12 text-violet-300" /><h2 className="font-semibold">Your private conversations</h2><p className="text-sm text-muted-foreground">Select a conversation or find a creator to message.</p><Button onClick={event => { newChatOpener.current = event.currentTarget; setShowNewChatDialog(true); }}>Start a conversation</Button></div>}
      </div>

      {/* New Chat Dialog */}
      <Dialog open={showNewChatDialog} onOpenChange={setShowNewChatDialog}>
        <DialogContent className="clipt-message-picker" onCloseAutoFocus={event => {
          if (newChatOpener.current?.isConnected) { event.preventDefault(); newChatOpener.current.focus(); }
        }}>
          <DialogHeader>
            <DialogTitle>Start New Conversation</DialogTitle>
            <DialogDescription>Search real Clipt profiles and choose a private conversation.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <Input
              aria-label="Search creators to message"
              placeholder="Search for users..."
              value={searchTerm}
              onChange={(e) => handleSearchUsers(e.target.value)}
              autoFocus
            />
              {userSearchLoading && <p role="status">Searching creators…</p>}
              {userSearchError && <div role="alert"><p>Unable to search creators.</p><Button type="button" onClick={() => handleSearchUsers(searchTerm)}>Retry creator search</Button></div>}
              {searchResults.length > 0 ? (
              <div className="mt-2 max-h-[300px] overflow-y-auto space-y-2">
                {searchResults.map((user) => (
                  <button
                    type="button"
                    aria-label={`Message ${user.display_name || user.username}`}
                    key={user.id}
                    className="flex min-h-11 w-full items-center justify-between p-2 rounded bg-gaming-800 hover:bg-gaming-700 cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-purple-400"
                    onClick={() => startOrContinueChat(user.id)}
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <Avatar className="w-8 h-8 shrink-0">
                        <AvatarImage src={user.avatar_url || undefined} alt="" />
                        <AvatarFallback className="bg-purple-950 text-purple-100">
                          {user.username ? user.username.slice(0, 2).toUpperCase() : 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <span className="min-w-0 text-base font-medium [overflow-wrap:anywhere]">{user.display_name || user.username}</span>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
                searchTerm.trim().length > 0 && !userSearchLoading && !userSearchError && (
                <p className="text-center text-gray-400 py-2">No users found</p>
              )
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Create Group Chat Dialog */}
      <Dialog open={showCreateGroupChat} onOpenChange={setShowCreateGroupChat}>
        <DialogContent className="clipt-message-picker">
          <DialogHeader>
            <DialogTitle>Create Group Chat</DialogTitle>
            <DialogDescription>Choose the group name and its participants.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <Input
              placeholder="Group Name"
              aria-label="Group name"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
            />
            <div className="space-y-2">
              <Input
                placeholder="Search users to add..."
                aria-label="Search group participants"
                value={searchTerm}
                onChange={(e) => handleSearchUsers(e.target.value)}
              />
              {searchResults.length > 0 && (
                <div className="mt-2 space-y-2">
                  {searchResults.map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center justify-between p-2 rounded bg-gaming-800 hover:bg-gaming-700"
                    >
                      <UserLink 
                        username={user.username} 
                        displayName={user.display_name || user.username} 
                        className="text-base font-medium hover:underline cursor-pointer"
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          if (!selectedUsers.includes(user.id)) {
                            setSelectedUsers([...selectedUsers, user.id]);
                            toast.success(`Added ${user.username || user.display_name || 'User'} to group`);
                          }
                        }}
                        disabled={selectedUsers.includes(user.id)}
                      >
                        {selectedUsers.includes(user.id) ? 'Added' : 'Add'}
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            {selectedUsers.length > 0 && (
              <div className="mt-4">
                <h4 className="text-sm font-medium mb-2">Selected Users:</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedUsers.map((userId) => {
                    const user = searchResults.find(u => u.id === userId);
                    return (
                      <div
                        key={userId}
                        className="flex items-center gap-2 bg-gaming-800 rounded px-2 py-1"
                      >
                        <UserLink 
                          username={user?.username} 
                          displayName={user?.display_name || user?.username} 
                          className="text-base font-medium hover:underline cursor-pointer"
                        />
                        <button
                          type="button"
                          aria-label="Remove selected participant"
                          onClick={() => setSelectedUsers(selectedUsers.filter(id => id !== userId))}
                          className="min-h-11 min-w-11 text-red-500 hover:text-red-400"
                        >
                          ×
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            <Button
              onClick={() => handleCreateGroup()}
              disabled={!groupName || selectedUsers.length === 0}
              className="w-full mt-4"
            >
              Create Group
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Messages;
