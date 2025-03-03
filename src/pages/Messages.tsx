import React from "react";
import { Button } from "@/components/ui/button";
import { Search, Users, MessageSquare, Plus } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

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

  // Fetch active chats when component mounts
  useEffect(() => {
    if (user) {
      fetchActiveChats();
    }
  }, [user]);

  const fetchActiveChats = async () => {
    try {
      // First get direct messages
      const { data: directChats, error: directError } = await supabase
        .from('direct_messages')
        .select(`
          id,
          sender_id,
          recipient_id,
          created_at,
          sender:sender_id (username, avatar_url),
          recipient:recipient_id (username, avatar_url)
        `)
        .or(`sender_id.eq.${user?.id},recipient_id.eq.${user?.id}`)
        .order('created_at', { ascending: false });

      if (directError) throw directError;

      // Get group chats the user is a member of
      const { data: groupChats, error: groupError } = await supabase
        .from('group_chat_members')
        .select(`
          group_id,
          group_chats (
            id,
            name,
            created_at
          )
        `)
        .eq('user_id', user?.id);

      if (groupError) throw groupError;

      // Combine and format the chats
      const formattedDirectChats = (directChats || []).map(chat => {
        const isUserSender = chat.sender_id === user?.id;
        const otherUser = isUserSender ? chat.recipient : chat.sender;
        
        return {
          id: chat.id,
          type: 'direct',
          name: otherUser.username,
          avatar_url: otherUser.avatar_url,
          last_message_at: chat.created_at,
          other_user_id: isUserSender ? chat.recipient_id : chat.sender_id
        };
      });

      const formattedGroupChats = (groupChats || []).map(membership => ({
        id: membership.group_chats.id,
        type: 'group',
        name: membership.group_chats.name,
        avatar_url: null, // Default group avatar
        last_message_at: membership.group_chats.created_at
      }));

      // Combine and sort by most recent
      const allChats = [...formattedDirectChats, ...formattedGroupChats]
        .sort((a, b) => new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime());

      setActiveChats(allChats);
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

  const startOrContinueChat = async (userId: string) => {
    if (!user) {
      toast.error("Please sign in to message users");
      navigate('/login');
      return;
    }

    try {
      // Check if a chat already exists - using a different approach
      const { data: existingChatsAsSender, error: senderError } = await supabase
        .from('direct_messages')
        .select('id')
        .eq('sender_id', user.id)
        .eq('recipient_id', userId)
        .limit(1);

      if (senderError) throw new Error(senderError.message);

      const { data: existingChatsAsRecipient, error: recipientError } = await supabase
        .from('direct_messages')
        .select('id')
        .eq('sender_id', userId)
        .eq('recipient_id', user.id)
        .limit(1);

      if (recipientError) throw new Error(recipientError.message);

      // Combine results
      const existingChats = [
        ...(existingChatsAsSender || []),
        ...(existingChatsAsRecipient || [])
      ];

      if (existingChats.length > 0) {
        // Chat exists - load it
        setSelectedChat({
          id: existingChats[0].id,
          type: 'direct',
          recipient_id: userId
        });
        
        // Refresh active chats
        fetchActiveChats();
        toast.success("Conversation loaded");
      } else {
        // Create a new chat
        const { data: newChat, error: createError } = await supabase
          .from('direct_messages')
          .insert({
            sender_id: user.id,
            recipient_id: userId,
            message: "Hi there!", // Initial message
            created_at: new Date().toISOString()
          })
          .select()
          .single();

        if (createError) throw new Error(createError.message);

        setSelectedChat({
          id: newChat.id,
          type: 'direct',
          recipient_id: userId
        });
        
        // Refresh active chats
        fetchActiveChats();
        toast.success("Conversation started!");
      }
      
      // Clear search results and dialog
      setSearchResults([]);
      setSearchTerm("");
      setShowNewChatDialog(false);
    } catch (error) {
      console.error("Error with chat:", error);
      toast.error("Error with conversation: " + (error instanceof Error ? error.message : "Unknown error"));
    }
  };

  const handleCreateGroup = async () => {
    if (!groupName.trim() || selectedUsers.length === 0) {
      toast.error("Please enter a group name and select at least one user");
      return;
    }

    const { data: groupData, error: groupError } = await supabase
      .from('group_chats')
      .insert({
        name: groupName,
        created_by: user?.id,
      })
      .select()
      .single();

    if (groupError) {
      toast.error("Error creating group chat");
      return;
    }

    const { error: memberError } = await supabase
      .from('group_chat_members')
      .insert({
        group_id: groupData.id,
        user_id: user?.id,
        role: 'admin'
      });

    if (memberError) {
      toast.error("Error adding you as group admin");
      return;
    }

    // Create invites for selected users
    const invites = selectedUsers.map(userId => ({
      group_id: groupData.id,
      user_id: userId,
      role: 'member'
    }));

    const { error: membersError } = await supabase
      .from('group_chat_members')
      .insert(invites);

    if (membersError) {
      toast.error("Error adding members");
      return;
    }

    toast.success("Group chat created!");
    setGroupName("");
    setSelectedUsers([]);
    setSearchResults([]);
    fetchActiveChats();
  };

  const sendMessage = async () => {
    if (!message.trim() || !selectedChat || !user) return;
    
    try {
      if (selectedChat.type === 'direct') {
        // Send direct message
        const { error } = await supabase
          .from('direct_messages')
          .insert({
            sender_id: user.id,
            recipient_id: selectedChat.recipient_id || selectedChat.other_user_id,
            message: message,
            created_at: new Date().toISOString()
          });
          
        if (error) throw error;
      } else if (selectedChat.type === 'group') {
        // Send group message
        const { error } = await supabase
          .from('group_messages')
          .insert({
            group_id: selectedChat.id,
            sender_id: user.id,
            message: message,
            created_at: new Date().toISOString()
          });
          
        if (error) throw error;
      }
      
      // Clear the message input
      setMessage("");
      toast.success("Message sent!");
      
      // Refresh the chat list to show the most recent chat at top
      fetchActiveChats();
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
        <div className="gaming-card overflow-y-auto relative">
          <div className="sticky top-0 bg-gaming-800 p-4 z-10 flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold">Conversations</h2>
              <Button 
                variant="outline" 
                size="icon"
                onClick={() => setShowNewChatDialog(true)}
                className="h-8 w-8"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
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
                                <span>{user.username.slice(0, 2).toUpperCase()}</span>
                              </div>
                            )}
                            <span>{user.display_name || user.username}</span>
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
            <Dialog>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full"
                >
                  <Users className="h-4 w-4 mr-2" />
                  Create Group Chat
                </Button>
              </DialogTrigger>
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
                            <span>{user.username}</span>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                if (!selectedUsers.includes(user.id)) {
                                  setSelectedUsers([...selectedUsers, user.id]);
                                  toast.success(`Added ${user.username} to group`);
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
                              <span>{user?.username}</span>
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
          
          {/* Active Chats List */}
          <div className="p-2">
            {activeChats.length > 0 ? (
              <div className="space-y-2">
                {activeChats.map((chat) => (
                  <div
                    key={chat.id}
                    className={`flex items-center p-3 rounded ${
                      selectedChat?.id === chat.id 
                        ? 'bg-gaming-600' 
                        : 'bg-gaming-800 hover:bg-gaming-700'
                    } cursor-pointer transition-colors`}
                    onClick={() => setSelectedChat(chat)}
                  >
                    <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center text-gray-700 mr-3">
                      {chat.avatar_url ? (
                        <img src={chat.avatar_url} alt={chat.name} className="h-10 w-10 rounded-full object-cover" />
                      ) : (
                        <span>{chat.name.slice(0, 2).toUpperCase()}</span>
                      )}
                    </div>
                    <div>
                      <h3 className="font-medium">{chat.name}</h3>
                      <p className="text-sm text-gray-400">
                        {chat.type === 'group' ? 'Group chat' : 'Direct message'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center p-4 text-gray-400">
                No active conversations. Start a new chat!
              </div>
            )}
          </div>
        </div>

        {/* Right side - chat area */}
        <div className="gaming-card col-span-2 flex flex-col">
          {selectedChat ? (
            <>
              <div className="p-4 border-b border-gaming-700 flex items-center">
                <h2 className="text-xl font-semibold">
                  {activeChats.find(c => c.id === selectedChat.id)?.name || 'Chat'}
                </h2>
              </div>
              
              <div className="flex-1 p-4 overflow-y-auto">
                {/* Placeholder for chat messages */}
                <div className="text-center text-gray-400 py-8">
                  <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-40" />
                  <p>Messages will appear here</p>
                  <p className="text-sm">Send your first message below</p>
                </div>
              </div>
              
              <div className="p-4 border-t border-gaming-700 flex gap-2">
                <Input
                  placeholder="Type a message..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="flex-1"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      sendMessage();
                    }
                  }}
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
    </div>
  );
};

export default Messages;
