import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Search, Users, MessageSquare, Plus } from "lucide-react";
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
      
      // We'll create a direct chat just using the user's ID
      // No need to create messages table or check for existing chat
      setSelectedChat({
        id: `chat_${user.id}_${userId}`,
        type: 'direct',
        recipient_id: userId,
        recipient_name: profile.username || profile.display_name || 'User',
        recipient_avatar: profile.avatar_url
      });
      
      // Clear search results and dialog
      setSearchResults([]);
      setSearchTerm("");
      setShowNewChatDialog(false);
      toast.success(`Chat with ${profile.username || profile.display_name || 'User'} started!`);
      
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
      .from('groups')
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
      .from('group_members')
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
      .from('group_members')
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

  // Modified send message function that uses local state instead of database
  const sendMessage = async () => {
    if (!message.trim() || !selectedChat || !user) return;
    
    try {
      // In this simplified approach, we can just show UI feedback
      toast.success("Message sent! (Demo mode)");
      
      // We could use local state to keep track of messages
      // but for now we'll just clear the input
      setMessage("");
      
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
            <div className="flex items-center justify-between p-4 border-b border-gray-700">
              <h1 className="text-2xl font-bold">Conversations</h1>
              <button 
                onClick={() => setShowNewChatDialog(true)}
                className="p-2 bg-primary text-white rounded-md"
                aria-label="New conversation"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
            
            {/* Create Group Chat button */}
            <div className="p-2">
              <button
                onClick={() => setShowNewChatDialog(true)}
                className="flex items-center justify-center gap-2 w-full p-3 bg-gray-800 hover:bg-gray-700 rounded-lg transition"
              >
                <Users className="h-4 w-4" />
                Create Group Chat
              </button>
            </div>
            
            {/* We're not displaying the active chat list per user request */}
            {/* Only showing the Create Group Chat button above */}
          </div>
        </div>

        {/* Right side - chat area */}
        <div className="gaming-card col-span-2 flex flex-col">
          {selectedChat ? (
            <>
              <div className="p-4 border-b border-gaming-700 flex items-center">
                <h2 className="text-xl font-semibold">
                  {selectedChat.name}
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
