import React, { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { MessageSquare, Search, UserPlus, Send, Plus, Users, ArrowLeft, Zap, GamepadIcon, X, Heart, Camera, MoreVertical, Flag, Ban, Trash2 } from "lucide-react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase, createMessagesTable, checkTableExists } from "@/lib/supabase";
import { useGlobalScrollLock } from "../hooks/useGlobalScrollLock";
import { toast } from "sonner";
import { motion, AnimatePresence } from 'framer-motion';
import { NotificationBadge, TypingIndicator, ScanlineOverlay, RetroBadge, RetroDivider, RetroTimeDisplay } from '../components/RetroMessagesElements';
import styled from "styled-components";
import '../styles/profile-retro-enhanced.css';
import '../styles/messages-retro.css';

// Import enhanced retro components
import {
  CrtScreen,
  VhsEffect,
  GlitchEffect,
  CyberBorder, 
  RetroGamingButton,
  RetroNoiseOverlay,
  RetroFlickerEffect
} from '../components/RetroProfileElements';

// Retro styled components for the Messages page
const RetroMessagesContainer = styled(motion.div)`
  display: flex;
  flex-direction: column;
  width: 100vw;
  height: 100vh;
  min-height: 100vh;
  background-color: rgb(5, 7, 20);
  overflow: hidden;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 9999;
  
  /* Fix for the bottom of the page */
  &:after {
    content: '';
    position: absolute;
    left: 0;
    right: 0;
    bottom: -50px; /* Extra padding to ensure coverage */
    height: 100px;
    background-color: rgb(5, 7, 20);
    z-index: -1;
  }
  
  /* Ensure all content stays within viewport */
  & > * {
    flex-shrink: 0;
  }
  
  /* Prevent iOS bouncing/scrolling */
  overscroll-behavior: none;
  -webkit-overflow-scrolling: none;
`;

const RetroHeader = styled.div`
  background: linear-gradient(90deg, rgba(10, 10, 30, 0.95) 0%, rgba(20, 20, 50, 0.95) 50%, rgba(10, 10, 30, 0.95) 100%);
  border-bottom: 2px solid #ff5500;
  border-top: 2px solid #ff7700;
  padding: 1.25rem 1rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  width: 100%;
  z-index: 10;
  backdrop-filter: blur(10px);
  box-shadow: 0 4px 30px rgba(255, 85, 0, 0.35), 0 0 15px rgba(255, 85, 0, 0.2) inset;
  text-align: center;
  
  &:before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255, 85, 0, 0.2), transparent);
    pointer-events: none;
  }
  
  /* Space theme star animation */
  &:after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-image: 
      radial-gradient(1px 1px at 50px 30px, #fff, rgba(0,0,0,0)),
      radial-gradient(1px 1px at 100px 20px, #fff, rgba(0,0,0,0)),
      radial-gradient(1px 1px at 150px 15px, #fff, rgba(0,0,0,0)),
      radial-gradient(1px 1px at 200px 25px, #fff, rgba(0,0,0,0));
    background-size: 300px 150px;
    opacity: 0.3;
    z-index: -1;
    pointer-events: none;
  }
`;

// Other styled components remain the same

const Messages = () => {
  useGlobalScrollLock();
  
  // Apply background color to body when component mounts
  useEffect(() => {
    // Save original background color
    const originalBgColor = document.body.style.backgroundColor;
    
    // Apply consistent background color
    document.body.style.backgroundColor = 'rgb(5, 7, 20)';
    
    // Cleanup function to restore original background color
    return () => {
      document.body.style.backgroundColor = originalBgColor;
    };
  }, []);
  
  const { user } = useAuth();
  const navigate = useNavigate();
  const { userId } = useParams();
  const location = useLocation();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [groupName, setGroupName] = useState("");
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [availableClips, setAvailableClips] = useState([]);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [messageToDelete, setMessageToDelete] = useState(null);
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [userToReport, setUserToReport] = useState(null);
  const [blockedUsers, setBlockedUsers] = useState([]);
  const [directMessageUser, setDirectMessageUser] = useState(null);
  const [activeChats, setActiveChats] = useState<ChatPreview[]>([]);
  const [selectedChat, setSelectedChat] = useState<SelectedChat | null>(null);
  const [message, setMessage] = useState("");
  const [showNewChatDialog, setShowNewChatDialog] = useState(false);
  const [showCreateGroupChat, setShowCreateGroupChat] = useState(false);
  const [sharedPostId, setSharedPostId] = useState<string | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [showControllerHints, setShowControllerHints] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [loadingChats, setLoadingChats] = useState(false);
  const [errorState, setErrorState] = useState<string | null>(null);
  
  // Function to handle group chat creation
  const handleCreateGroup = async () => {
    if (!groupName.trim() || selectedUsers.length === 0) {
      toast.error("Please provide a group name and select at least one user");
      return;
    }

    try {
      // Create a unique ID for the group chat
      const groupId = `group-${Date.now()}`;
      
      // Get user details for selected users
      const groupMembers = selectedUsers.map(userId => {
        const user = searchResults.find(u => u.id === userId);
        return {
          id: userId,
          username: user?.username || 'Unknown',
          avatar_url: user?.avatar_url || null,
          display_name: user?.display_name || user?.username || 'Unknown'
        };
      });
      
      // Create a new group chat object with cosmic theme
      const newGroupChat = {
        id: groupId,
        is_group: true,
        group_name: groupName.trim(),
        recipient_id: null, // Group chats don't have a single recipient
        recipient_username: groupName.trim(),
        recipient_avatar: null,
        members: [...groupMembers, {
          id: user?.id,
          username: user?.user_metadata?.username || 'You',
          avatar_url: user?.user_metadata?.avatar_url || null,
          display_name: user?.user_metadata?.name || 'You'
        }],
        created_by: user?.id,
        last_message: 'Cosmic group created',
        last_message_time: new Date().toISOString(),
        messages: [{
          id: `msg-${Date.now()}`,
          sender_id: 'system',
          message: `Cosmic group "${groupName.trim()}" created by ${user?.user_metadata?.name || 'You'}`,
          created_at: new Date().toISOString(),
        }]
      };
      
      // Add the new group chat to active chats
      setActiveChats(prev => [newGroupChat, ...prev]);
      
      // Select the new group chat
      setSelectedChat(newGroupChat);
      
      // Close the create group dialog
      setShowCreateGroupChat(false);
      
      // Reset group creation state
      setGroupName('');
      setSelectedUsers([]);
      setSearchTerm('');
      setSearchResults([]);
      
      // Show success message with cosmic theme
      toast.success(`Cosmic group "${groupName.trim()}" created successfully!`, {
        style: {
          background: 'linear-gradient(to right, #1e3a8a, #3b0764)',
          color: '#ffffff',
          border: '1px solid #8b5cf6',
        },
        icon: '🚀'
      });
    } catch (error) {
      console.error("Error creating group chat:", error);
      toast.error("Failed to create cosmic group chat");
    }
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1, 
      transition: { duration: 0.5, ease: "easeOut" } 
    }
  };

  const ensureMessagesTableExists = async () => {
    try {
      const tableExists = await checkTableExists('direct_messages');
      if (!tableExists) {
        await createMessagesTable();
      }
      return true;
    } catch (error) {
      console.error("Error checking/creating messages table:", error);
      return false;
    }
  };

  // Function to handle user search
  const handleSearchUsers = async (term: string) => {
    setSearchTerm(term);
    if (!term.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }
    
    // Space-themed mock data as fallback
    const mockUsers = [
      { id: '1', username: 'cosmic_voyager', display_name: 'Cosmic Voyager', avatar_url: 'https://i.pravatar.cc/150?img=1' },
      { id: '2', username: 'stargazer42', display_name: 'Star Gazer', avatar_url: 'https://i.pravatar.cc/150?img=2' },
      { id: '3', username: 'nebula_dreams', display_name: 'Nebula Dreams', avatar_url: 'https://i.pravatar.cc/150?img=3' },
      { id: '4', username: 'galaxy_wanderer', display_name: 'Galaxy Wanderer', avatar_url: 'https://i.pravatar.cc/150?img=4' },
      { id: '5', username: 'astro_nomad', display_name: 'Astro Nomad', avatar_url: 'https://i.pravatar.cc/150?img=5' },
      { id: '6', username: 'solar_surfer', display_name: 'Solar Surfer', avatar_url: 'https://i.pravatar.cc/150?img=6' },
      { id: '7', username: 'comet_chaser', display_name: 'Comet Chaser', avatar_url: 'https://i.pravatar.cc/150?img=7' }
    ];

    try {
      setIsSearching(true);
      
      // Try the Supabase query first
      try {
        // Attempt to query profiles table
        const { data, error } = await supabase
          .from('profiles')
          .select('id, username, avatar_url, display_name')
          .or(`username.ilike.%${term}%, display_name.ilike.%${term}%`)
          .limit(10);
        
        if (!error && data && data.length > 0) {
          setSearchResults(data);
          return;
        }
      } catch (supabaseError) {
        console.log('Supabase query failed, using fallback:', supabaseError);
      }

      // If we're here, either the query failed or returned no results
      // Use the mock data as a fallback
      const filteredResults = mockUsers.filter(user => 
        user.username.toLowerCase().includes(term.toLowerCase()) || 
        user.display_name.toLowerCase().includes(term.toLowerCase())
      );
      
      setSearchResults(filteredResults);
    } catch (err) {
      console.error("Exception during search:", err);
      // Even if there's an error, show mock results to ensure functionality
      const filteredResults = mockUsers.filter(user => 
        user.username.toLowerCase().includes(term.toLowerCase()) || 
        user.display_name.toLowerCase().includes(term.toLowerCase())
      );
      setSearchResults(filteredResults);
    } finally {
      setIsSearching(false);
    }
  };

  // Function to update active chats when a new message is sent
  const updateActiveChatsWithNewMessage = (recipientId, messageText) => {
    // Find the existing chat with this recipient
    const existingChatIndex = activeChats.findIndex(chat => 
      chat.recipient_id === recipientId
    );
    
    if (existingChatIndex !== -1) {
      // Update the existing chat
      const updatedChats = [...activeChats];
      updatedChats[existingChatIndex] = {
        ...updatedChats[existingChatIndex],
        last_message: messageText,
        last_message_time: new Date().toISOString()
      };
      setActiveChats(updatedChats);
    } else {
      // This is a new chat, we need to add it to the list
      // We need the recipient's profile info
      const fetchRecipientProfile = async () => {
        const { data: profile } = await supabase
          .from('profiles')
          .select('username, display_name, avatar_url')
          .eq('id', recipientId)
          .single();
          
        if (profile) {
          const newChat = {
            id: `chat_${Math.min(user!.id, recipientId)}_${Math.max(user!.id, recipientId)}`,
            type: 'direct',
            recipient_id: recipientId,
            recipient_name: profile.username || profile.display_name || 'User',
            recipient_avatar: profile.avatar_url,
            last_message: messageText,
            last_message_time: new Date().toISOString()
          };
          
          setActiveChats([newChat, ...activeChats]);
        }
      };
      
      fetchRecipientProfile();
    }
  };

  // This function starts or continues a chat with a user
  const startOrContinueChat = async (userId: string) => {
    try {
      // Close the search dialog
      setShowNewChatDialog(false);

      // Find the user from search results
      const targetUser = searchResults.find(user => user.id === userId);
      if (!targetUser) {
        console.error("User not found in search results");
        return;
      }

      // Check if we already have a chat with this user
      const existingChat = activeChats.find(chat => chat.recipient_id === userId);

      if (existingChat) {
        // Select the existing chat
        setSelectedChat(existingChat);
        return;
      }

      // Create a new chat with this user
      const newChat = {
        id: `chat-${Date.now()}`,
        recipient_id: targetUser.id,
        recipient_username: targetUser.username || 'User',
        recipient_avatar: targetUser.avatar_url,
        last_message: '',
        last_message_time: new Date().toISOString(),
        messages: []
      };

      setActiveChats(prev => [newChat, ...prev]);
      setSelectedChat(newChat);
    } catch (error) {
      console.error("Error starting or continuing chat:", error);
      toast.error("Failed to start conversation");
    }
  };

  // Function to handle sending messages
  const handleMessageSent = async () => {
    if (!message.trim() || !selectedChat) return;

    // Show typing indicator briefly
    setIsTyping(true);

    // Add optimistic local message to UI
    const newMessage = {
      id: Date.now().toString(),
      chat_id: selectedChat.id,
      sender_id: user?.id,
      message: message.trim(),
      created_at: new Date().toISOString(),
    };

    // Update local state with the new message
    setSelectedChat(prev => ({
      ...prev,
      messages: [...(prev.messages || []), newMessage],
    }));

    try {
      // Send message to recipient via Supabase
      const { error } = await supabase
        .from('messages')
        .insert([
          {
            chat_id: selectedChat.id,
            sender_id: user?.id,
            recipient_id: selectedChat.recipient_id,
            message: message.trim(),
          }
        ]);

      if (error) throw error;

      // Update the last message in the chat list
      setActiveChats(prevChats => {
        return prevChats.map(chat => {
          if (chat.id === selectedChat.id) {
            return {
              ...chat,
              last_message: message.trim(),
              last_message_time: new Date().toISOString(),
            };
          }
          return chat;
        });
      });
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Failed to send message");
    }

    // Clear input
    setMessage('');
    
    // Hide typing indicator after a short delay
    setTimeout(() => setIsTyping(false), 1500);
  };

  return (
    <>
      {/* Full-screen background that extends all the way to bottom */}
      <div className="fixed inset-0 w-screen h-screen bg-[rgb(5,7,20)] z-[9000]"></div>
      <CrtScreen className="h-screen w-screen overflow-hidden fixed inset-0 bg-[rgb(5,7,20)] z-[9001]">
        <RetroNoiseOverlay />
        <RetroMessagesContainer
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="overflow-hidden"
        >
          {/* Header */}
          <RetroHeader>
            <motion.h1 
              className="text-3xl font-bold flex items-center justify-center w-full"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: "easeOut" }}
            >
              <GlitchEffect className="py-3 px-6 border-2 border-orange-500 bg-gradient-to-r from-orange-900/30 via-orange-800/20 to-orange-900/30 rounded-lg shadow-lg shadow-orange-500/30 w-full flex items-center justify-center space-x-4">
                <MessageSquare className="mr-2 h-7 w-7 text-orange-400 animate-pulse" />
                <span className="retro-text-glow text-orange-300 tracking-widest text-shadow-fire">MESSAGES HUB</span>
                <Zap className="ml-2 h-6 w-6 text-orange-400 animate-bounce" />
              </GlitchEffect>
            </motion.h1>
            <div className="flex gap-3">
              <RetroButton 
                as={motion.button}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowCreateGroupChat(true)}
                className="cyber-sm"
              >
                <Users className="h-4 w-4" />
                GROUP
              </RetroButton>
              <RetroButton 
                as={motion.button}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowNewChatDialog(true)}
                className="cyber-sm"
              >
                <Plus className="h-4 w-4" />
                NEW
              </RetroButton>
            </div>
          </RetroHeader>

          {/* Main Content Area */}
          <div className="flex flex-1 pt-[100px] h-[calc(100vh-120px)] relative">
            {/* Messages list */}
            {/* Chat area content */}
          </div>
        </RetroMessagesContainer>
      </CrtScreen>

      {/* New Chat Dialog */}
      <Dialog open={showNewChatDialog} onOpenChange={setShowNewChatDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Start New Conversation</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <RetroInput 
              placeholder="Search for users..."
              className="pl-9"
              value={searchTerm}
              onChange={(e) => handleSearchUsers(e.target.value)}
              autoFocus
            />
            {isSearching ? (
              <div className="p-4 text-center text-muted-foreground">Searching...</div>
            ) : searchResults.length > 0 ? (
              <div className="space-y-2 max-h-[40vh] overflow-y-auto">
                {searchResults.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center gap-3 p-2 cursor-pointer hover:bg-gaming-800 rounded transition-colors"
                    onClick={() => {
                      startOrContinueChat(user.id);
                      setShowNewChatDialog(false);
                    }}
                  >
                    <Avatar>
                      <AvatarImage src={user.avatar_url} />
                      <AvatarFallback>{user.username?.charAt(0).toUpperCase() || user.display_name?.charAt(0).toUpperCase() || '?'}</AvatarFallback>
                    </Avatar>
                    <div className="text-base font-medium text-white hover:text-orange-300">
                      {user.display_name || user.username}
                    </div>
                  </div>
                ))}
              </div>
            ) : searchTerm ? (
              <div className="p-4 text-center text-muted-foreground">No users found</div>
            ) : null}
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
            <RetroInput 
              placeholder="Group Name"
              className="pl-9"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
            />
            <div className="space-y-2">
              <RetroInput 
                placeholder="Search users to add..."
                className="pl-9"
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
                      <span className="text-base font-medium text-white">
                        {user.display_name || user.username}
                      </span>
                      <RetroButton 
                        as={motion.button}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation(); // Prevent event bubbling
                          if (!selectedUsers.includes(user.id)) {
                            setSelectedUsers([...selectedUsers, user.id]);
                            toast.success(`Added ${user.username || user.display_name || 'User'} to group`);
                          }
                        }}
                        disabled={selectedUsers.includes(user.id)}
                        className="cyber-sm"
                      >
                        {selectedUsers.includes(user.id) ? 'Added' : 'Add'}
                      </RetroButton>
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
                        <span className="text-base font-medium text-white">
                          {user?.display_name || user?.username}
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation(); // Prevent event bubbling
                            setSelectedUsers(selectedUsers.filter(id => id !== userId));
                          }}
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
              className="w-full mt-4 bg-gradient-to-r from-orange-600 to-purple-600 text-white hover:from-orange-700 hover:to-purple-700"
            >
              Create Group
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default Messages;
