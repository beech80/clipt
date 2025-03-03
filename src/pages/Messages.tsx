import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Search, MessageSquare, Plus, Users } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase, createMessagesTable, checkTableExists } from "@/lib/supabase";
import { toast } from "sonner";

const Messages = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
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
        // Skip attempting to create tables - not needed for our simpler approach
        // Just log it and continue with the app
        console.log("Using direct messaging approach without tables");
      } catch (error) {
        console.error("Setup error:", error);
      }
    };
    
    setupMessagingTables();
  }, [user]);

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

  // Simplified direct messaging - we won't use database tables at all
  const startOrContinueChat = async (userId: string) => {
    if (!user) {
      toast.error("Please sign in to message users");
      navigate('/login');
      return;
    }

    try {
      console.log("Starting chat with user ID:", userId);
      console.log("Current user ID:", user.id);
      
      // Get the user's profile to display their information
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('username, avatar_url, display_name')
        .eq('id', userId)
        .single();
        
      if (profileError) {
        console.error("Error fetching user profile:", profileError);
        throw new Error("Couldn't find that user");
      }

      const recipientName = profile.username || profile.display_name || 'User';
      
      // We'll create a direct chat just using the user's ID
      // No need to create messages table or check for existing chat
      const chatId = `chat_${user.id}_${userId}`;
      
      // Initialize conversation with a welcome message
      const initialMessage = {
        id: Date.now().toString(),
        sender_id: user.id,
        recipient_id: userId,
        message: "Hi there!",
        created_at: new Date().toISOString(),
        read: false,
        sender_name: user.user_metadata?.username || 'You'
      };

      // Create a mock conversation to display
      setSelectedChat({
        id: chatId,
        type: 'direct',
        recipient_id: userId,
        recipient_name: recipientName,
        recipient_avatar: profile.avatar_url,
        messages: [initialMessage] // Include initial message
      });
      
      // Clear search results and dialog
      setSearchResults([]);
      setSearchTerm("");
      setShowNewChatDialog(false);
      toast.success(`Chat with ${recipientName} started!`);
      
    } catch (error) {
      console.error("Error with chat:", error);
      toast.error("Error with conversation: " + (error instanceof Error ? error.message : "Unknown error"));
    }
  };

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

  // Modified send message function to add messages to the local state 
  // This simulates sending messages in demo mode, but could be easily updated for real DB storage
  const sendMessage = async () => {
    if (!message.trim() || !selectedChat || !user) return;
    
    try {
      // Create a new message object
      const newMessage = {
        id: Date.now().toString(),
        sender_id: user.id,
        recipient_id: selectedChat.recipient_id,
        message: message.trim(),
        created_at: new Date().toISOString(),
        read: false,
        sender_name: user.user_metadata?.username || 'You'
      };
      
      // Add to local messages array
      setSelectedChat({
        ...selectedChat,
        messages: [...(selectedChat.messages || []), newMessage]
      });
      
      // Clear input
      setMessage("");
      
      // In a full implementation, we would save to the database like this:
      /*
      // Store message in database
      const { error } = await supabase
        .from('messages')
        .insert({
          sender_id: user.id,
          recipient_id: selectedChat.recipient_id,
          message: message.trim(),
          created_at: new Date().toISOString(),
          read: false
        });
        
      if (error) throw error;
      */
      
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Failed to send message");
    }
  };

  return (
    <div className="container mx-auto p-4 min-h-screen relative pb-[200px]">
      <div className="gameboy-header">
        <h1 className="gameboy-title">MESSAGES</h1>
      </div>

      <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-4 h-[calc(100vh-8rem)]">
        {/* Left sidebar - active chats */}
        <div className="bg-gaming-900 overflow-y-auto relative w-64">
        </div>

        {/* Right side - chat area */}
        <div className="gaming-card col-span-2 flex flex-col">
          {selectedChat ? (
            <>
              <div className="p-4 border-b border-gaming-700 flex items-center">
                <h2 className="text-xl font-semibold">
                  {selectedChat.recipient_name || 'Chat'}
                </h2>
              </div>
              
              {/* Messages area */}
              <div className="flex-1 overflow-y-auto p-4">
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
              onClick={handleCreateGroup}
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
