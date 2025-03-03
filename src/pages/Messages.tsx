import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Search, MessageSquare, Plus, Users, ArrowLeft } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase, createMessagesTable, checkTableExists } from "@/lib/supabase";
import { toast } from "sonner";

const Messages = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { userId } = useParams();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [groupName, setGroupName] = useState("");
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [activeChats, setActiveChats] = useState<any[]>([]);
  const [selectedChat, setSelectedChat] = useState<any>(null);
  const [message, setMessage] = useState("");
  const [showNewChatDialog, setShowNewChatDialog] = useState(false);
  const [showCreateGroupChat, setShowCreateGroupChat] = useState(false);

  useEffect(() => {
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
  }, [user, userId]);

  // Fetch active chats when component mounts
  useEffect(() => {
    if (user) {
      fetchActiveChats();
    }
  }, [user]);

  const fetchActiveChats = async () => {
    try {
      // Clear active chats - only keeping Create Group Chat button
      setActiveChats([]);
      console.log("Cleared conversation list as requested");
    } catch (error) {
      console.error("Error fetching chats:", error);
      toast.error("Error loading conversations");
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
    setSearchTerm(term);
    if (term.length < 1) {
      setSearchResults([]);
      return;
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('id, username, avatar_url, display_name')
      .not('id', 'eq', user?.id)
      .ilike('username', `%${term}%`)
      .limit(10);

    if (error) {
      toast.error("Error searching users");
      return;
    }

    setSearchResults(data || []);
  };

  // Modified send message function with fallback to demo mode if database fails
  const sendMessage = async () => {
    if (!message.trim() || !selectedChat || !user) return;
    
    try {
      // Create a new message object
      const newMessage = {
        sender_id: user.id,
        recipient_id: selectedChat.recipient_id,
        message: message.trim(),
        created_at: new Date().toISOString(),
        read: false
      };
      
      console.log("Attempting to send message:", newMessage);
      
      // Try to store message in database
      const { data: savedMessage, error } = await supabase
        .from('direct_messages')
        .insert(newMessage)
        .select()
        .single();
        
      if (error) {
        console.error("Error saving message to database:", error);
        
        // Fallback to demo mode if database fails
        console.log("Falling back to demo mode for messaging");
        
        // Create a local message object with an ID
        const localMessage = {
          id: Date.now().toString(),
          ...newMessage,
          sender_name: user.user_metadata?.username || 'You'
        };
        
        // Add to local messages array
        setSelectedChat({
          ...selectedChat,
          messages: [...(selectedChat.messages || []), localMessage]
        });
        
        // Show user that we're in demo mode
        toast.success("Message sent (Demo mode)");
      } else {
        // Database save successful
        console.log("Message saved to database:", savedMessage);
        
        // Add to local messages array with database ID
        setSelectedChat({
          ...selectedChat,
          messages: [...(selectedChat.messages || []), {
            ...savedMessage,
            sender_name: user.user_metadata?.username || 'You'
          }]
        });
      }
      
      // Clear input in either case
      setMessage("");
      
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Failed to send message");
    }
  };

  // Function to fetch messages for a conversation
  const fetchMessages = async (chatId: string, recipientId: string) => {
    if (!user) return;
    
    try {
      // Query messages where current user is either sender or recipient
      const { data: messages, error } = await supabase
        .from('direct_messages')
        .select('*')
        .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`)
        .or(`sender_id.eq.${recipientId},recipient_id.eq.${recipientId}`)
        .order('created_at', { ascending: true });
        
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
      
      // Update selected chat with messages
      if (selectedChat && selectedChat.id === chatId) {
        setSelectedChat({
          ...selectedChat,
          messages: messagesWithNames
        });
      }
      
      return messagesWithNames;
    } catch (error) {
      console.error("Error fetching messages:", error);
      toast.error("Failed to load messages");
      return [];
    }
  };

  // This function will be used to either start a new chat or continue an existing chat with a user
  const startOrContinueChat = async (targetUserId: string) => {
    if (!user) return;

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
      const chatId = `chat_${user.id}_${targetUserId}`;
      
      // Initialize chat with empty messages array for now
      setSelectedChat({
        id: chatId,
        type: 'direct',
        recipient_id: targetUserId,
        recipient_name: recipientName,
        recipient_avatar: profile.avatar_url,
        messages: []
      });
      
      // Fetch any existing messages
      fetchMessages(chatId, targetUserId);
      
      // Clear search results and dialog
      setSearchResults([]);
      setSearchTerm("");
      setShowNewChatDialog(false);
      
      // Focus on the message input field
      setTimeout(() => {
        const messageInput = document.querySelector('input[placeholder="Type your message..."]') as HTMLInputElement;
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
    if (!user || !selectedChat) return;
    
    // Subscribe to new messages
    const subscription = supabase
      .channel('direct_messages')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'direct_messages',
        filter: `recipient_id=eq.${user.id}`
      }, (payload) => {
        console.log('New message received:', payload);
        
        // If this message is for the current chat, add it to the messages
        if (selectedChat && 
            (payload.new.sender_id === selectedChat.recipient_id || 
             payload.new.recipient_id === selectedChat.recipient_id)) {
          
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
                if (!current) return null;
                return {
                  ...current,
                  messages: [...(current.messages || []), {
                    ...payload.new,
                    sender_name: senderName
                  }]
                };
              });
            });
        }
      })
      .subscribe();
      
    // Cleanup subscription on component unmount or when selected chat changes
    return () => {
      subscription.unsubscribe();
    };
  }, [user, selectedChat]);

  // Ensure messages table exists
  const ensureMessagesTableExists = async () => {
    try {
      // Check if direct_messages table exists, create if needed
      const tableExists = await checkTableExists('direct_messages');
      if (!tableExists) {
        console.log("Creating direct_messages table...");
        await createMessagesTable();
      }
    } catch (error) {
      console.error("Error ensuring messages table exists:", error);
    }
  };

  // Function to scroll to the bottom of messages
  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Auto-scroll when messages change
  useEffect(() => {
    if (selectedChat?.messages?.length) {
      scrollToBottom();
    }
  }, [selectedChat?.messages]);

  // Auto-scroll when a message is sent
  useEffect(() => {
    const handleMessageSent = () => {
      setTimeout(scrollToBottom, 100);
    };

    if (message === '' && selectedChat?.messages?.length) {
      handleMessageSent();
    }
  }, [message, selectedChat?.messages]);

  // Handle the creation of a new group chat
  const handleCreateGroup = async () => {
    if (!user || !groupName || selectedUsers.length === 0) return;
    
    try {
      toast.success(`Created group '${groupName}' (Demo mode)`);
      setGroupName("");
      setSelectedUsers([]);
      setShowCreateGroupChat(false);
    } catch (error) {
      console.error("Error creating group:", error);
      toast.error("Failed to create group");
    }
  };

  return (
    <div className="container mx-auto p-4 min-h-screen relative pb-[280px]">
      <div className="gameboy-header">
        <h1 className="gameboy-title">MESSAGES</h1>
      </div>

      <div className="mt-20 grid grid-cols-1 md:grid-cols-1 gap-4 h-[calc(100vh-8rem)]">
        {/* Left sidebar removed as requested */}

        {/* Right side - chat area */}
        <div className="gaming-card p-4 flex flex-col h-full">
          {selectedChat ? (
            <>
              <div className="p-4 border-b border-gaming-700 flex items-center">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="mr-2" 
                  onClick={() => {
                    setSelectedChat(null);
                    // Clear URL parameters if they exist
                    if (userId) {
                      navigate('/messages');
                    }
                  }}
                >
                  <ArrowLeft className="h-5 w-5" />
                </Button>
                <h2 className="text-xl font-semibold">
                  {selectedChat.recipient_name || 'Chat'}
                </h2>
              </div>
              
              {/* Messages area */}
              <div className="flex-1 overflow-y-auto p-4 max-h-[calc(65vh)]" style={{ scrollbarWidth: 'thin' }}>
                {/* Display the initial "Hi there!" message or any messages */}
                {selectedChat.messages && selectedChat.messages.length > 0 ? (
                  <div className="space-y-4">
                    {selectedChat.messages.map(msg => (
                      <div key={msg.id} className={`flex ${msg.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[70%] p-3 rounded-lg ${
                          msg.sender_id === user?.id 
                            ? 'bg-primary text-white rounded-tr-none' 
                            : 'bg-gaming-700 text-white rounded-tl-none'
                        }`}>
                          <p>{msg.message}</p>
                          <p className="text-xs opacity-70 mt-1">
                            {msg.sender_id === user?.id ? 'You' : selectedChat.recipient_name}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-gray-400">No messages yet</p>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
              
              <div className="p-4 border-t border-gaming-700 flex gap-2">
                <Input
                  placeholder="Type your message..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                  className="flex-1"
                />
                <Button onClick={sendMessage}>Send</Button>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center p-8">
                <MessageSquare className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                <h3 className="text-xl font-semibold mb-2">No conversation selected</h3>
                <p className="text-gray-400 mb-4">
                  Select a chat from the sidebar or start a new conversation
                </p>
                <Button 
                  onClick={() => setShowNewChatDialog(true)}
                  className="mx-auto"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Start New Conversation
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* New Chat Dialog */}
      <Dialog open={showNewChatDialog} onOpenChange={setShowNewChatDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Start New Conversation</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <Input
              placeholder="Search for users..."
              value={searchTerm}
              onChange={(e) => handleSearchUsers(e.target.value)}
              autoFocus
            />
            {searchResults.length > 0 ? (
              <div className="mt-2 max-h-[300px] overflow-y-auto space-y-2">
                {searchResults.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between p-2 rounded bg-gaming-800 hover:bg-gaming-700 cursor-pointer"
                    onClick={() => startOrContinueChat(user.id)}
                  >
                    <div className="flex items-center gap-3">
                      {user.avatar_url ? (
                        <img
                          src={user.avatar_url}
                          alt={user.username}
                          className="w-8 h-8 rounded-full"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-gray-700">
                          <span>{user.username ? user.username.slice(0, 2).toUpperCase() : 'U'}</span>
                        </div>
                      )}
                      <span>{user.display_name || user.username || 'User'}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              searchTerm.length > 0 && (
                <p className="text-center text-gray-400 py-2">No users found</p>
              )
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Create Group Chat Dialog */}
      <Dialog open={showCreateGroupChat} onOpenChange={setShowCreateGroupChat}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Group Chat</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <Input
              placeholder="Group Name"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
            />
            <div className="space-y-2">
              <Input
                placeholder="Search users to add..."
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
                      <span>{user.username || user.display_name || 'User'}</span>
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
                        <span>{user?.username || user?.display_name || 'User'}</span>
                        <button
                          onClick={() => setSelectedUsers(selectedUsers.filter(id => id !== userId))}
                          className="text-red-500 hover:text-red-400"
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
