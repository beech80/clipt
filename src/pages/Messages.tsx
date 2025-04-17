import React, { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { MessageSquare, Search, UserPlus, Send, Plus, Users, ArrowLeft, Zap, GamepadIcon, X, Heart } from "lucide-react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase, createMessagesTable, checkTableExists } from "@/lib/supabase";
import { toast } from "sonner";
import { UserLink } from '@/components/user/UserLink';
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
  height: 100vh;
  background-color: #050714;
  color: #e0f2ff;
  overflow: hidden;
  position: relative;
`;

const RetroHeader = styled.div`
  background-color: rgba(10, 12, 32, 0.8);
  border-bottom: 2px solid #2e1f8b;
  padding: 0.75rem 1rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 10;
  backdrop-filter: blur(10px);
  box-shadow: 0 4px 30px rgba(92, 179, 255, 0.15);
  text-align: center;
`;

const RetroChatsList = styled.div`
  border-right: 2px solid #2e1f8b;
  overflow-y: auto;
  flex: 0 0 300px;
  background-color: rgba(5, 7, 20, 0.7);
  height: 100%;
  scrollbar-width: thin;
  scrollbar-color: #5c23b8 #0f142e;
  
  &::-webkit-scrollbar {
    width: 8px;
  }
  
  &::-webkit-scrollbar-track {
    background: #0f142e;
  }
  
  &::-webkit-scrollbar-thumb {
    background-color: #5c23b8;
    border-radius: 8px;
  }
`;

const RetroChatBox = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  height: 100%;
  background: rgba(5, 7, 20, 0.3);
`;

const RetroChatItem = styled(motion.div)`
  padding: 0.75rem 1rem;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  border-bottom: 1px solid #1f1b4a;
  background: linear-gradient(90deg, rgba(23, 23, 37, 0.4) 0%, rgba(16, 15, 40, 0.4) 100%);
  transition: all 0.3s ease;
  
  &:hover {
    background: linear-gradient(90deg, rgba(44, 39, 95, 0.4) 0%, rgba(39, 34, 89, 0.4) 100%);
  }
  
  &.active {
    background: linear-gradient(90deg, rgba(54, 48, 121, 0.6) 0%, rgba(39, 34, 89, 0.6) 100%);
    box-shadow: inset 0 0 10px rgba(128, 81, 255, 0.3);
    border-left: 4px solid #8051ff;
  }
  
  &:before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 1px;
    background: linear-gradient(90deg, transparent, rgba(128, 81, 255, 0.3), transparent);
  }
`;

const RetroMessage = styled(motion.div)`
  padding: 0.75rem 1rem;
  margin-bottom: 0.5rem;
  border-radius: 8px;
  max-width: 70%;
  line-height: 1.4;
  position: relative;
  overflow: hidden;
  
  &.sent {
    background: linear-gradient(135deg, #2e1f8b 0%, #3a189c 100%);
    align-self: flex-end;
    margin-left: auto;
    margin-right: 1rem;
    box-shadow: 0 4px 15px rgba(46, 31, 139, 0.4);
    border-bottom-right-radius: 0;
  }
  
  &.received {
    background: linear-gradient(135deg, #29124e 0%, #3d2273 100%);
    align-self: flex-start;
    margin-left: 1rem;
    box-shadow: 0 4px 15px rgba(41, 18, 78, 0.4);
    border-bottom-left-radius: 0;
  }
`;

const RetroInput = styled.input`
  background: rgba(15, 20, 46, 0.6);
  border: 1px solid #3d2273;
  color: #e0f2ff;
  padding: 0.75rem 1rem;
  border-radius: 8px;
  width: 100%;
  outline: none;
  font-family: 'IBM Plex Mono', monospace;
  transition: all 0.3s ease;
  
  &:focus {
    border-color: #8051ff;
    box-shadow: 0 0 15px rgba(128, 81, 255, 0.4);
  }
`;

const RetroButton = styled(motion.button)`
  padding: 0.6rem 1.2rem;
  border-radius: 8px;
  background: linear-gradient(135deg, #8051ff 0%, #5327ce 100%);
  color: white;
  font-weight: bold;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-family: 'Press Start 2P', cursive;
  font-size: 0.7rem;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
  box-shadow: 0 4px 15px rgba(128, 81, 255, 0.4), inset 0 -2px 5px rgba(0, 0, 0, 0.2);
  transition: all 0.2s ease;
  
  &:hover {
    background: linear-gradient(135deg, #9269ff 0%, #6a3ef8 100%);
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(128, 81, 255, 0.5), inset 0 -2px 5px rgba(0, 0, 0, 0.2);
  }
  
  &:active {
    transform: translateY(1px);
    box-shadow: 0 2px 10px rgba(128, 81, 255, 0.3), inset 0 -1px 2px rgba(0, 0, 0, 0.2);
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
  
  svg {
    margin-right: 0.5rem;
  }
`;

const Messages = () => {
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
  const [activeChats, setActiveChats] = useState<any[]>([]);
  const [selectedChat, setSelectedChat] = useState<any>(null);
  const [message, setMessage] = useState("");
  const [showNewChatDialog, setShowNewChatDialog] = useState(false);
  const [showCreateGroupChat, setShowCreateGroupChat] = useState(false);
  const [sharedPostId, setSharedPostId] = useState<string | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [showControllerHints, setShowControllerHints] = useState(true);

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        duration: 0.6,
        when: "beforeChildren",
        staggerChildren: 0.1
      }
    }
  };
  
  const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.3 } }
  };
  
  const messageVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3 } }
  };

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

  // Check for shared post in URL parameters
  useEffect(() => {
    // Extract query parameters
    const queryParams = new URLSearchParams(location.search);
    const shareParam = queryParams.get('share');
    
    if (shareParam) {
      console.log("Found shared post ID:", shareParam);
      setSharedPostId(shareParam);
      
      // Auto open the new chat dialog if we have a post to share
      if (!userId) {
        setShowNewChatDialog(true);
      } else if (selectedChat) {
        // If we already have a chat selected, prepare message with shared post
        const shareUrl = `${window.location.origin}/post/${shareParam}`;
        setMessage(`Check out this Clipt: ${shareUrl}`);
      }
    }
  }, [location.search, userId, selectedChat]);

  // Fetch active chats when component mounts
  useEffect(() => {
    if (user) {
      fetchActiveChats();
    }
  }, [user]);

  const fetchActiveChats = async () => {
    try {
      if (!user) return;
      
      // Fetch all messages where user is either sender or recipient
      const { data: messages, error } = await supabase
        .from('direct_messages')
        .select('*, profiles!direct_messages_sender_id_fkey(username, avatar_url, display_name)')
        .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`)
        .order('created_at', { ascending: false });
        
      if (error) {
        console.error("Error fetching messages:", error);
        toast.error("Error loading conversations");
        return;
      }
      
      // Group messages by conversations (unique combinations of sender/recipient)
      const conversationsMap = new Map();
      
      messages.forEach(msg => {
        // Determine the other party in the conversation
        const otherUserId = msg.sender_id === user.id ? msg.recipient_id : msg.recipient_id;
        
        // Create a unique ID for this conversation
        const chatId = `chat_${Math.min(user.id, otherUserId)}_${Math.max(user.id, otherUserId)}`;
        
        if (!conversationsMap.has(chatId)) {
          // Start tracking this conversation
          const otherUserProfile = msg.sender_id === user.id 
            ? null // Need to fetch this separately
            : msg.profiles;
            
          conversationsMap.set(chatId, {
            id: chatId,
            type: 'direct',
            participant_id: otherUserId,
            last_message: msg.message,
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
      const formattedConversations = conversationsMap.values()
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
      
      setActiveChats(formattedConversations);
      
    } catch (error) {
      console.error("Error processing chats:", error);
      toast.error("Error loading conversations");
    }
  };

  const handleSearch = async (term: string) => {
    setSearchTerm(term);
    
    if (term.trim() === '') {
      setIsSearching(false);
      // Reset to original chat list
      fetchActiveChats();
      return;
    }
    
    setIsSearching(true);
    
    // Basic client-side search
    setTimeout(() => {
      const filteredChats = activeChats.filter(
        chat => 
          chat.recipient_name?.toLowerCase().includes(term.toLowerCase()) ||
          (chat.last_message && chat.last_message.toLowerCase().includes(term.toLowerCase()))
      );
      
      // Only update if we're still searching the same term
      if (searchTerm === term) {
        setActiveChats(filteredChats);
        setIsSearching(false);
      }
    }, 300); // Small delay for better UX
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

  // Modified send message function with improved error handling and retry logic
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
      
      // First make sure messages table exists
      await ensureMessagesTableExists();
      
      // Try to store message in database
      const { data: savedMessage, error } = await supabase
        .from('direct_messages')
        .insert(newMessage)
        .select()
        .single();
        
      if (error) {
        console.error("Error saving message to database:", error);
        
        // Try a second time with a simpler approach (no return value)
        const { error: retryError } = await supabase
          .from('direct_messages')
          .insert(newMessage);
          
        if (retryError) {
          console.error("Retry also failed:", retryError);
          
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
          
          // Update the active chats list to show this conversation has a new message
          updateActiveChatsWithNewMessage(selectedChat.recipient_id, message.trim());
          
          // Show user that we're in demo mode
          toast.success("Message sent (Demo mode)");
        } else {
          // The second attempt worked but we don't have the returned data
          // Create a message object with local data
          const localMessage = {
            id: `local_${Date.now()}`,
            ...newMessage,
            sender_name: user.user_metadata?.username || 'You'
          };
          
          // Add to local messages array
          setSelectedChat({
            ...selectedChat,
            messages: [...(selectedChat.messages || []), localMessage]
          });
          
          // Update the active chats list
          updateActiveChatsWithNewMessage(selectedChat.recipient_id, message.trim());
        }
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
        
        // Update the active chats list
        updateActiveChatsWithNewMessage(selectedChat.recipient_id, message.trim());
      }
      
      // Clear input in either case
      setMessage("");
      
      // Scroll to the bottom to show the new message
      setTimeout(scrollToBottom, 100);
      
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Failed to send message");
    }
  };
  
  // Helper function to update the active chats list with a new message
  const updateActiveChatsWithNewMessage = (recipientId: string, messageText: string) => {
    // Check if this chat is already in the active chats list
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
      const chatId = `chat_${Math.min(user.id, targetUserId)}_${Math.max(user.id, targetUserId)}`;
      
      // Check if we already have a chat with this user
      const existingChatIndex = activeChats.findIndex(chat => 
        chat.recipient_id === targetUserId
      );
      
      if (existingChatIndex !== -1) {
        // We already have a chat with this user, select it
        setSelectedChat(activeChats[existingChatIndex]);
      } else {
        // This is a new chat, add it to the list
        const newChat = {
          id: chatId,
          type: 'direct',
          recipient_id: targetUserId,
          recipient_name: recipientName,
          recipient_avatar: profile.avatar_url,
          last_message: '',
          last_message_time: null
        };
        
        setActiveChats([newChat, ...activeChats]);
        setSelectedChat(newChat);
      }
      
      // Fetch messages for this chat
      fetchMessages(chatId, targetUserId);
      
    } catch (error) {
      console.error("Error starting or continuing chat:", error);
      toast.error("Failed to start conversation");
    }
  };

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
    <div className="h-screen">
      <CrtScreen className="h-full">
        <RetroNoiseOverlay />
        <RetroMessagesContainer
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Header */}
          <RetroHeader>
            <motion.h1 
              className="text-xl font-bold flex items-center"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <GlitchEffect>
                <MessageSquare className="mr-2 h-5 w-5 text-cyan-400" />
                <span className="retro-text-glow text-cyan-300">MESSAGES</span>
                <Zap className="ml-2 h-4 w-4 text-yellow-400" />
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
          {/* Main content */}
          <div className="flex h-full pt-16 pb-20 relative">
            {/* Chats sidebar */}
            <RetroChatsList>
              {/* Search input */}
              <div className="p-4 border-b border-indigo-900 bg-gradient-to-r from-indigo-950/30 to-purple-950/30">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-indigo-400 h-4 w-4" />
                  <RetroInput 
                    placeholder="Search messages..."
                    className="pl-9"
                    value={searchTerm}
                    onChange={(e) => handleSearch(e.target.value)}
                  />
                </div>
              </div>
              
              {/* Chats list */}
              <motion.div variants={containerVariants}>
                {isSearching ? (
                  <div className="p-4 text-center text-indigo-500">Searching<span className="loading-dots">...</span></div>
                ) : activeChats.length > 0 ? (
                  activeChats.map((chat, index) => (
                    <RetroChatItem
                      key={chat.id}
                      className={selectedChat?.id === chat.id ? 'active' : ''}
                      variants={itemVariants}
                      custom={index}
                      onClick={() => {
                        setSelectedChat(chat);
                        // If using a shared post ID, automatically prepare a message
                        if (sharedPostId && chat) {
                          const shareUrl = `${window.location.origin}/post/${sharedPostId}`;
                          setMessage(`Check out this Clipt: ${shareUrl}`);
                        }
                      }}
                      whileHover={{ x: 4 }}
                    >   
                      {/* Show notification badge for unread messages */}
                      {chat.unread_count > 0 && <NotificationBadge />}
                      <div className="flex items-center gap-3">
                        <Avatar className="cyber-border-sm border-2 border-indigo-700/50">
                          <AvatarImage src={chat.recipient_avatar} />
                          <AvatarFallback className="bg-indigo-900">{chat.recipient_name?.charAt(0).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 overflow-hidden">
                          <div className="flex items-baseline justify-between">
                            <div className="font-bold text-cyan-300 glitch-text-sm" data-text={chat.recipient_name}>{chat.recipient_name}</div>
                            <span className="text-xs text-purple-400">
                              {chat.last_message_time ? new Date(chat.last_message_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : ''}
                            </span>
                          </div>
                          <p className="text-sm text-purple-200 truncate mt-1 opacity-80">
                            {chat.last_message || "No messages yet"}
                          </p>
                        </div>
                      </div>
                    </RetroChatItem>
                  ))
                ) : (
                  <div className="text-center py-12 text-purple-300 cyber-text">
                    <p>No messages yet</p>
                    <p className="mt-2 text-sm text-purple-400">Start a conversation by clicking NEW</p>

                  </div>
                )}
              </motion.div>
            </RetroChatsList>
            {/* Chat interface */}
            <RetroChatBox>
              {/* Empty state when no chat is selected */}
              {!selectedChat ? (
                <div className="flex flex-col items-center justify-center h-full px-4">
                  <GlitchEffect>
                    <MessageSquare className="w-20 h-20 mb-6 text-purple-500" />
                  </GlitchEffect>
                  <motion.h2 
                    className="text-2xl font-bold mb-3 retro-text-glow text-cyan-300"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    <RetroFlickerEffect>YOUR MESSAGES</RetroFlickerEffect>
                  </motion.h2>
                  <p className="text-purple-300 text-center mb-8 cyber-text">Select a conversation or start a new one</p>
                  <RetroButton
                    as={motion.button}
                    onClick={() => setShowNewChatDialog(true)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Plus className="mr-2 h-4 w-4" /> NEW MESSAGE
                  </RetroButton>
                  

                </div>
              ) : (
                <>
                  {/* Chat header with recipient info */}
                  <div className="p-3 border-b border-indigo-900/50 bg-gradient-to-r from-indigo-950/50 to-purple-950/50 flex items-center">
                    <RetroButton 
                      as={motion.button}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setSelectedChat(null)}
                      className="mr-3 cyber-xs"
                    >
                      <ArrowLeft className="h-4 w-4" />
                    </RetroButton>
                    <Avatar className="cyber-border-sm border-2 border-indigo-700/50">
                      <AvatarImage src={selectedChat.recipient_avatar} />
                      <AvatarFallback className="bg-indigo-900">{selectedChat.recipient_name?.charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="ml-3">
                      <div className="font-bold text-cyan-300 glitch-text-sm" data-text={selectedChat.recipient_name}>{selectedChat.recipient_name}</div>
                    </div>
                  </div>

                  {/* Messages list */}
                  <div className="flex-grow overflow-y-auto p-4 pt-3 pb-4 scrollbar-thin scrollbar-thumb-indigo-700 scrollbar-track-indigo-950/30">
                    <AnimatePresence>
                      {selectedChat.messages && selectedChat.messages.length > 0 ? (
                        selectedChat.messages.map((msg, index) => (
                          <motion.div 
                            key={index} 
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05, duration: 0.3 }}
                            className={`flex mb-3 ${msg.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}
                            whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
                          >
                            <RetroMessage 
                              className={msg.sender_id === user?.id ? 'sent' : 'received'}
                              variants={messageVariants}
                            >
                              <p className={index === selectedChat.messages.length - 1 && msg.sender_id === user?.id ? 'typing-animation' : ''}>{msg.message}</p>
                              <div className="text-xs mt-2 opacity-70 text-right">
                                {new Date(msg.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} 
                              </div>
                            </RetroMessage>
                          </motion.div>
                        ))
                      ) : (
                        <div className="text-center py-12">
                          <RetroFlickerEffect>
                            <p className="text-purple-300 cyber-text">No messages yet</p>
                            <p className="mt-2 text-sm text-purple-400">Be the first to say hello!</p>
                          </RetroFlickerEffect>
                        </div>
                      )}
                    </AnimatePresence>
                    {isTyping && (
                      <div className="flex justify-start mb-3">
                        <TypingIndicator isTyping={isTyping} />
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Message input form */}
                  <div className="flex items-center p-4 bg-indigo-950/30 border-t border-indigo-900/50 message-input-container cyber-border-inner">
                    <RetroInput
                      placeholder="Type a message..."
                      className="flex-1 mr-3"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleMessageSent();
                        }
                      }}
                    />
                    <RetroButton 
                      as={motion.button}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleMessageSent}
                      disabled={!message.trim()}
                      className="cyber-sm"
                    >
                      <Send className="h-4 w-4 mr-1" />
                      SEND
                    </RetroButton>
                  </div>
                </>
              )}
            </RetroChatBox>
              
              {/* Scanline overlay effect */}
              <ScanlineOverlay />
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
                      <UserLink 
                        username={user.username} 
                        displayName={user.display_name || user.username} 
                        className="text-base font-medium hover:underline cursor-pointer"
                      />
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
                      <UserLink 
                        username={user.username} 
                        displayName={user.display_name || user.username} 
                        className="text-base font-medium hover:underline cursor-pointer"
                      />
                      <RetroButton 
                        as={motion.button}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        size="sm"
                        variant="outline"
                        onClick={() => {
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
                        <UserLink 
                          username={user?.username} 
                          displayName={user?.display_name || user?.username} 
                          className="text-base font-medium hover:underline cursor-pointer"
                        />
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
                    onClick={() => startOrContinueChat(user.id)}
                  >
                    <Avatar>
                      <AvatarImage src={user.avatar_url} />
                      <AvatarFallback>{user.username?.charAt(0).toUpperCase() || user.display_name?.charAt(0).toUpperCase() || '?'}</AvatarFallback>
                    </Avatar>
                    <UserLink 
                      username={user.username} 
                      displayName={user.display_name || user.username} 
                      className="text-base font-medium hover:underline cursor-pointer"
                    />
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
                      <UserLink 
                        username={user.username} 
                        displayName={user.display_name || user.username} 
                        className="text-base font-medium hover:underline cursor-pointer"
                      />
                      <RetroButton 
                        as={motion.button}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        size="sm"
                        variant="outline"
                        onClick={() => {
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
                        <UserLink 
                          username={user?.username} 
                          displayName={user?.display_name || user?.username} 
                          className="text-base font-medium hover:underline cursor-pointer"
                        />
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
