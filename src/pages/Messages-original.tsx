import * as React from "react";
import { useState, useEffect, useRef } from "react";

// Remove the global declaration as it's not working

import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { MessageSquare, Search, UserPlus, Send, Plus, Users, User, ArrowLeft, Zap, GamepadIcon, X, Heart, Camera, MoreVertical, Flag, Ban, Trash2, Settings, Smile } from "lucide-react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
// Removed User type import to avoid TypeScript errors
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
  RetroGamingButton as RetroButton,
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

// Other styled components
const RetroInput = styled.input`
  background-color: rgba(10, 10, 35, 0.6);
  border: 2px solid #ff5b17;
  border-radius: 4px;
  color: #ffffff;
  padding: 10px 15px;
  font-family: 'Press Start 2P', monospace;
  font-size: 14px;
  width: 100%;
  transition: all 0.3s ease;
  box-shadow: 0 0 8px rgba(255, 91, 23, 0.5);
  
  &:focus {
    outline: none;
    border-color: #ff8c00;
    box-shadow: 0 0 12px rgba(255, 140, 0, 0.7);
  }
  
  &::placeholder {
    color: rgba(255, 255, 255, 0.5);
  }
`;

// Other styled components remain the same

const Messages = () => {
  useGlobalScrollLock();
  
  // Define comprehensive interfaces to avoid TypeScript errors
interface ChatPreview {
  id: string;
  recipient_id?: string;
  recipient_username?: string;
  recipient_name?: string;
  recipient_avatar?: string;
  last_message?: string;
  last_message_time?: string;
  messages?: any[];
  type?: string;
  is_group_chat?: boolean;
  members?: string[];
}

interface SelectedChat extends ChatPreview {}

// Define AuthUser interface to prevent 'User is not defined' error
interface AuthUser {
  id: string;
  email?: string;
  user_metadata?: any;
  app_metadata?: any;
}

  // Define all state variables first to avoid initialization errors
  const { user: authUser } = useAuth();
  // Cast to our local AuthUser type to avoid 'User is not defined' error
  const user = authUser as AuthUser | null;
  const navigate = useNavigate();
  const { userId } = useParams();
  const location = useLocation();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [activeChats, setActiveChats] = useState<ChatPreview[]>([]);
  const [selectedChat, setSelectedChat] = useState<SelectedChat | null>(null);
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
  
  // Process URL query parameters for direct messaging
  useEffect(() => {
    // Get URL search parameters
    const searchParams = new URLSearchParams(location.search);
    const urlUserId = searchParams.get('userId');
    const urlUsername = searchParams.get('username');
    const urlDisplayName = searchParams.get('displayName');
    
    // If URL contains userId parameter, use it to start a chat
    if (urlUserId) {
      console.log('Starting chat with user from URL params:', urlUserId);
      console.log('Username:', urlUsername);
      console.log('DisplayName:', urlDisplayName);
      
      // This is critical - we need to make sure we don't rely on the component
      // being fully initialized, so we handle the URL params directly
      const initDirectMessageFromUrl = async () => {
        try {
          // Fetch profile data for this user
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', urlUserId)
            .single();
            
          if (profileError) {
            console.error("Error fetching user profile:", profileError);
            toast.error("Couldn't find this user");
            return;
          }
          
          if (profileData) {
            console.log('Found profile data for direct message:', profileData);
            
            // Create a new chat with this user
            const newChat = {
              id: `chat-${Date.now()}`,
              recipient_id: profileData.id,
              recipient_username: profileData.username || urlUsername || 'User',
              recipient_avatar: profileData.avatar_url,
              last_message: '',
              last_message_time: new Date().toISOString(),
              messages: []
            };
            
            // Force set the chat data
            setActiveChats(prev => {
              // Check if this chat already exists
              const existingChat = prev.find(chat => chat.recipient_id === urlUserId);
              if (existingChat) {
                // Select the existing chat
                setSelectedChat(existingChat);
                return prev;
              }
              // Add the new chat and select it
              setSelectedChat(newChat);
              return [newChat, ...prev];
            });
          }
        } catch (error) {
          console.error("Error initializing direct message from URL:", error);
          toast.error("Failed to start conversation");
        }
      };
      
      // Execute this immediately - don't wait
      initDirectMessageFromUrl();
    }
    
    // Also check localStorage as fallback
    const directMessageUserData = localStorage.getItem('directMessageUser');
    if (directMessageUserData && !urlUserId) {
      try {
        const dmUser = JSON.parse(directMessageUserData);
        console.log('Found direct message user in localStorage:', dmUser);
        
        // Clear localStorage item after reading it
        localStorage.removeItem('directMessageUser');
        
        if (dmUser && dmUser.id) {
          // Directly initiate a chat with this user
          startOrContinueChat(dmUser.id);
        }
      } catch (error) {
        console.error('Error parsing direct message user data:', error);
      }
    }
    const checkForDirectMessage = () => {
      const storedUser = localStorage.getItem('directMessageUser');
      if (storedUser) {
        try {
          const userData = JSON.parse(storedUser);
          // Set as direct message user
          setDirectMessageUser(userData);
          
          // Check if chat already exists
          const existingChat = activeChats.find(chat => 
            chat.recipient_id === userData.id
          );
          
          if (existingChat) {
            // Select existing chat
            setSelectedChat(existingChat);
          } else {
            // Create new chat with this user
            const newChat = {
              id: `chat-${Date.now()}`,
              recipient_id: userData.id,
              recipient_username: userData.username || 'User',
              recipient_avatar: userData.avatar_url,
              last_message: '',
              last_message_time: new Date().toISOString(),
              messages: []
            };
            
            // Add to active chats
            setActiveChats(prev => [newChat, ...prev]);
            setSelectedChat(newChat);
          }
          
          // Clear from localStorage
          localStorage.removeItem('directMessageUser');
        } catch (error) {
          console.error('Error parsing direct message user:', error);
        }
      }
    };
    
    // Check after active chats are loaded
    if (activeChats.length > 0) {
      checkForDirectMessage();
    }
  }, [activeChats]);
  
  // Handle direct messaging when userId is provided in URL
  useEffect(() => {
    const initDirectMessage = async () => {
      if (userId && user) {
        try {
          // Fetch user profile to get their details
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();
            
          if (profileError) {
            console.error("Error fetching user profile:", profileError);
            toast.error("Couldn't find this user");
            return;
          }
          
          if (profileData) {
            // Check if chat already exists
            const existingChat = activeChats.find(chat => chat.recipient_id === userId);
            
            if (existingChat) {
              // Select existing chat
              setSelectedChat(existingChat);
            } else {
              // Create new chat with this user
              const newChat = {
                id: `chat-${Date.now()}`,
                recipient_id: profileData.id,
                recipient_username: profileData.username || 'User',
                recipient_avatar: profileData.avatar_url,
                last_message: '',
                last_message_time: new Date().toISOString(),
                messages: []
              };
              
              setActiveChats(prev => [newChat, ...prev]);
              setSelectedChat(newChat);
            }
          }
        } catch (error) {
          console.error("Error starting direct message from URL:", error);
          toast.error("Failed to start conversation");
        }
      }
    };
    
    if (userId) {
      initDirectMessage();
    }
  }, [userId, user, activeChats]);
  
  // State variables have been moved to the top of the component to avoid initialization errors
  
  // Function to start or continue a chat with a user
  const startOrContinueChat = async (userId: string) => {
    if (!userId) {
      console.log('Missing userId in startOrContinueChat');
      return;
    }
    
    console.log('Starting or continuing chat with userId:', userId);
    
    // Check if chat already exists with this user
    const existingChat = activeChats.find(chat => 
      chat.recipient_id === userId ||
      (chat.is_group_chat && chat.members?.includes(userId))
    );
    
    if (existingChat) {
      console.log('Found existing chat:', existingChat);
      setSelectedChat(existingChat);
    } else {
      // Create new chat
      try {
        console.log('Creating new chat with user:', userId);
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single();
          
        if (profileError) {
          console.error("Error fetching user profile:", profileError);
          toast.error("Couldn't find this user");
          return;
        }
        
        if (profileData) {
          console.log('Found profile data:', profileData);
          
          // Create new chat with this user - using timestamp for unique ID
          const timestamp = Date.now();
          const newChat = {
            id: `chat-${timestamp}`,
            recipient_id: profileData.id,
            recipient_username: profileData.username || 'Anonymous',
            recipient_avatar: profileData.avatar_url,
            last_message: '',
            last_message_time: new Date().toISOString(),
            messages: []
          };
          
          console.log('Created new chat object:', newChat);
          
          // Update active chats and select the new chat using functional updates
          setActiveChats(prev => [newChat, ...prev]);
          setSelectedChat(newChat);
        }
      } catch (error) {
        console.error("Error starting chat:", error);
        toast.error("Couldn't start conversation");
      }
    }
  };
  
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
      // Completely rewritten implementation to avoid User type issues
      // This function creates a new chat without using any problematic types
      const createNewChatWithRecipient = async () => {
        try {
          // Get recipient profile safely
          const { data: profile } = await supabase
            .from('profiles')
            .select('username, display_name, avatar_url')
            .eq('id', recipientId)
            .single();
          
          if (profile) {
            // Create chat with timestamp-based ID to avoid User references
            const timestamp = Date.now();
            const newChatObj = {
              id: `chat_${timestamp}_${recipientId}`,
              type: 'direct',
              recipient_id: recipientId,
              recipient_name: profile.username || profile.display_name || 'Anonymous',
              recipient_avatar: profile.avatar_url,
              last_message: messageText,
              last_message_time: new Date().toISOString()
            };
            
            // Update state with the new chat
            setActiveChats(prevChats => [newChatObj, ...prevChats]);
          }
        } catch (error) {
          console.error('Error creating new chat:', error);
          toast.error('Could not create new conversation');
        }
      };
      
      // Execute the new function
      createNewChatWithRecipient();
    }
  };

  // Function to handle starting a new chat from the chat dialog
  const handleStartNewChat = async (userId: string) => {
    try {
      // Close the search dialog
      setShowNewChatDialog(false);

      // Find the user from search results
      const selectedUsers = searchResults.map((searchUser) => searchUser.id);
      const targetUser = searchResults.find((searchUser) => selectedUsers.includes(userId));
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

  // Retro game-style navigation between pages
  const handleChatSelect = (chat: any) => {
    setSelectedChat(chat);
    navigate(`/messages/chat/${chat.id}`);
  };
  
  // Handle direct navigation to chat from URL
  useEffect(() => {
    const pathParts = location.pathname.split('/');
    if (pathParts.length >= 4 && pathParts[2] === 'chat') {
      const chatId = pathParts[3];
      const foundChat = activeChats.find(chat => chat.id === chatId);
      if (foundChat) {
        setSelectedChat(foundChat);
      }
    }
  }, [location.pathname, activeChats]);
  
  // Determine which page to show based on URL path
  const isMessagesListPage = !location.pathname.includes('/messages/chat/');
  
  // CSS for retro game styling
  useEffect(() => {
    // Add retro styling CSS
    const style = document.createElement('style');
    style.textContent = `
      .scanlines {
        background: linear-gradient(transparent 0%, rgba(0, 0, 0, 0.1) 50%, transparent 51%, transparent 100%);
        background-size: 100% 4px;
        pointer-events: none;
      }
      .crt-effect {
        background: radial-gradient(ellipse at center, rgba(10, 10, 30, 0) 0%, rgba(10, 10, 30, 0.8) 100%);
        pointer-events: none;
      }
      .pixel-border {
        box-shadow: 0 0 0 2px #00ffff, 0 0 0 4px #0000ff;
        image-rendering: pixelated;
      }
      .glow-text {
        text-shadow: 0 0 5px #4ff4fd, 0 0 10px #4ff4fd, 0 0 15px #4ff4fd;
      }
      .retro-btn {
        transition: all 0.2s;
        border: 2px solid #00ffff;
      }
      .retro-btn:hover {
        transform: scale(1.05);
        box-shadow: 0 0 15px rgba(0, 255, 255, 0.7);
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);
  
  // Add retro game UI CSS
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      .scanlines {
        background: linear-gradient(transparent 0%, rgba(0, 0, 0, 0.1) 50%, transparent 51%, transparent 100%);
        background-size: 100% 4px;
      }
      .retro-glow {
        text-shadow: 0 0 5px #4ff4fd, 0 0 10px #4ff4fd;
      }
      .retro-btn {
        border: 2px solid #00ffff;
        box-shadow: 0 0 10px rgba(0, 255, 255, 0.3);
        transition: all 0.2s;
      }
      .retro-btn:hover {
        box-shadow: 0 0 15px rgba(0, 255, 255, 0.7);
      }
      .pixel-border {
        box-shadow: 0 0 0 4px rgba(0, 255, 255, 0.3);
      }
      .crt-effect {
        background: radial-gradient(ellipse at center, transparent 0%, rgba(10, 10, 30, 0.8) 100%);
        pointer-events: none;
      }
      .cosmic-bg {
        background-image: url('https://images.unsplash.com/photo-1534796636912-3b95b3ab5986?ixlib=rb-1.2.1&auto=format&fit=crop&w=1351&q=80');
        background-size: cover;
        background-position: center;
        opacity: 0.2;
      }
    `;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  // Determine if we're on the messages list or chat page based on URL path
  const isMessagesListPage = !selectedChat || location.pathname === '/messages' || location.pathname === '/messages/';
  const isChatPage = !!selectedChat && location.pathname.includes('/messages/chat/');
  
  return (
    <>
      {/* Messages List Page */}
      {isMessagesListPage && (
        <div className="fixed inset-0 flex justify-center items-center bg-[rgb(5,7,20)] z-[9000]">
          <div className="relative max-w-md w-full h-[85vh] rounded-3xl overflow-hidden flex flex-col bg-gradient-to-b from-blue-900/95 to-indigo-900/95 shadow-2xl shadow-blue-900/50 border-4 border-cyan-500/70">
            {/* Visual Effects */}
            <RetroNoiseOverlay opacity={0.05} />
            <div className="absolute inset-0 pointer-events-none z-[5] cosmic-bg"></div>
            <div className="absolute inset-0 pointer-events-none z-[7] scanlines opacity-20"></div>
            <div className="absolute inset-0 pointer-events-none z-[8] crt-effect"></div>
            
            {/* Header */}
            <div className="p-4 flex justify-between items-center border-b-4 border-cyan-600/70 bg-gradient-to-r from-indigo-900/90 to-blue-900/90">
              <h1 className="text-xl font-bold text-cyan-300 tracking-wider retro-glow">COSMIC MESSAGES</h1>
              <button 
                onClick={() => setShowNewChatDialog(true)}
                className="bg-cyan-600 hover:bg-cyan-500 text-white p-2 rounded-md transition-all retro-btn"
              >
                <Plus className="h-5 w-5" />
              </button>
            </div>
            
            {/* Search */}
            <div className="p-3 border-b-2 border-cyan-600/40 bg-indigo-900/50">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-cyan-300 h-4 w-4" />
                <input 
                  type="text" 
                  placeholder="SEARCH TRANSMISSIONS" 
                  className="bg-indigo-950/90 border-2 border-cyan-600/70 text-cyan-100 w-full pl-10 pr-4 py-2 rounded-md focus:outline-none focus:ring-1 focus:ring-cyan-500/50"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            
            {/* Chats List */}
            <div className="flex-1 overflow-y-auto p-2 bg-indigo-950/70">
              {loadingChats ? (
                <div className="flex justify-center items-center h-full">
                  <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-cyan-500 shadow-lg shadow-cyan-500/50"></div>
                </div>
              ) : errorState ? (
                <div className="flex flex-col justify-center items-center h-full p-4 border-2 border-red-500/50 rounded-lg m-4 bg-red-900/20">
                  <p className="text-red-400 font-bold">SYSTEM ERROR</p>
                  <p className="text-red-300 mb-4">{errorState}</p>
                  <button 
                    className="mt-2 px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-md border-2 border-red-400 retro-btn"
                    onClick={() => window.location.reload()}
                  >
                    RETRY CONNECTION
                  </button>
                </div>
              ) : activeChats.length === 0 ? (
                <div className="flex flex-col justify-center items-center h-full border-2 border-cyan-500/30 rounded-lg m-4 p-6 bg-indigo-900/30">
                  <p className="text-cyan-300 font-bold mb-2">NO ACTIVE TRANSMISSIONS</p>
                  <p className="text-cyan-200/70 text-center mb-4">Begin a new cosmic communication channel</p>
                  <button 
                    className="mt-2 px-6 py-3 bg-cyan-600 hover:bg-cyan-500 text-white rounded-md border-2 border-cyan-400/50 retro-btn"
                    onClick={() => setShowNewChatDialog(true)}
                  >
                    INITIATE NEW TRANSMISSION
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  {activeChats.map((chat) => (
                    <div 
                      key={chat.id}
                      className="p-4 border-2 border-cyan-600/30 bg-indigo-900/50 cursor-pointer hover:bg-indigo-800/70 rounded-lg transition-all duration-200 mb-2"
                      onClick={() => handleChatSelect(chat)}
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="h-12 w-12 border-2 border-cyan-500/50">
                          <AvatarImage 
                            src={chat.recipient_avatar || `https://api.dicebear.com/7.x/pixel-art/svg?seed=${chat.recipient_username}`} 
                            alt={chat.recipient_username} 
                          />
                          <AvatarFallback className="bg-indigo-900 text-cyan-300">
                            {chat.recipient_username?.charAt(0).toUpperCase() || '?'}
                          </AvatarFallback>
                        </Avatar>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-baseline">
                            <h3 className="font-bold text-cyan-300 truncate retro-glow">
                              {chat.recipient_username}
                            </h3>
                            <span className="text-xs text-cyan-200/60 whitespace-nowrap">
                              {chat.last_message_time ? new Date(chat.last_message_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : ''}
                            </span>
                          </div>
                          <p className="text-sm text-cyan-100/80 truncate mt-1">
                            {chat.last_message || 'No messages yet'}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* Individual Chat View Page */}
      {isChatPage && selectedChat && (
        <div className="fixed inset-0 flex justify-center items-center bg-[rgb(5,7,20)] z-[9000]">
          <div className="relative max-w-md w-full h-[85vh] rounded-3xl overflow-hidden flex flex-col bg-gradient-to-b from-blue-900/95 to-indigo-900/95 shadow-2xl shadow-blue-900/50 border-4 border-cyan-500/70">
            {/* Visual Effects */}
            <RetroNoiseOverlay opacity={0.05} />
            <div className="absolute inset-0 pointer-events-none z-[5] cosmic-bg"></div>
            <div className="absolute inset-0 pointer-events-none z-[7] scanlines opacity-20"></div>
            <div className="absolute inset-0 pointer-events-none z-[8] crt-effect"></div>
            
            {/* Chat Header */}
            <div className="p-4 flex justify-between items-center border-b-4 border-cyan-600/70 bg-gradient-to-r from-indigo-900/90 to-blue-900/90">
              <button 
                onClick={() => {
                  setSelectedChat(null);
                  navigate('/messages');
                }}
                className="bg-indigo-800/60 hover:bg-indigo-700 text-cyan-300 p-2 rounded-md mr-2 retro-btn"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <div className="flex items-center flex-1">
                <Avatar className="h-9 w-9 mr-2 border-2 border-cyan-500/50">
                  <AvatarImage 
                    src={selectedChat.recipient_avatar || `https://api.dicebear.com/7.x/pixel-art/svg?seed=${selectedChat.recipient_username}`} 
                    alt={selectedChat.recipient_username} 
                  />
                  <AvatarFallback className="bg-indigo-900 text-cyan-300">
                    {selectedChat.recipient_username?.charAt(0).toUpperCase() || '?'}
                  </AvatarFallback>
                </Avatar>
                <h1 className="text-lg font-bold text-cyan-300 truncate retro-glow">{selectedChat.recipient_username}</h1>
              </div>
              <button className="text-cyan-300 hover:text-cyan-100 p-2 rounded-full">
                <Settings className="h-5 w-5" />
              </button>
            </div>
            
            {/* Messages Container */}
            <div className="flex-1 overflow-y-auto p-3 bg-indigo-950/70">
              {loadingChat ? (
                <div className="flex justify-center items-center h-full">
                  <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-cyan-500 shadow-lg shadow-cyan-500/50"></div>
                </div>
              ) : selectedChat?.messages && selectedChat.messages.length > 0 ? (
                <div className="space-y-4">
                  {selectedChat.messages.map((msg, index) => (
                    <div 
                      key={msg.id || index} 
                      className={`flex ${msg.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}
                    >
                      <div 
                        className={`max-w-[75%] px-4 py-3 rounded-2xl ${msg.sender_id === user?.id 
                          ? 'bg-cyan-600/80 border-2 border-cyan-500/50 text-white' 
                          : 'bg-indigo-800/70 border-2 border-indigo-700/50 text-gray-100'}`}
                      >
                        <p className="text-sm">{msg.message}</p>
                        <p className="text-xs mt-1 opacity-70 text-right">
                          {new Date(msg.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col justify-center items-center h-full border-2 border-cyan-500/30 rounded-lg m-4 p-6 bg-indigo-900/30">
                  <p className="text-cyan-300 font-bold mb-2">NO ACTIVE TRANSMISSIONS</p>
                  <p className="text-cyan-200/70 text-center mb-4">Begin a new cosmic communication channel</p>
                </div>
              )}
            </div>
            
            {/* Message Input */}
            <div className="p-3 border-t-2 border-cyan-600/40 bg-indigo-900/70">
              {isTyping && (
                <div className="mb-2 ml-2">
                  <TypingIndicator />                  
                </div>
              )}
              <div className="flex gap-2 items-end">
                <button className="text-cyan-300 hover:text-cyan-100 p-2">
                  <Smile className="h-5 w-5" />
                </button>
                <div className="flex-1 relative">
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    placeholder="TYPE A COSMIC MESSAGE..."
                    className="w-full px-4 py-3 bg-indigo-950/90 border-2 border-cyan-600/70 text-cyan-100 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                    rows={1}
                  />
                </div>
                <button 
                  onClick={handleSendMessage}
                  disabled={!message.trim()}
                  className={`p-3 rounded-full ${message.trim() ? 'bg-cyan-600 hover:bg-cyan-500 retro-btn' : 'bg-indigo-800/50 cursor-not-allowed opacity-50'}`}
                >
                  <Send className="h-5 w-5 text-white" />
                </button>
              </div>
            </div>
          </div>
          {/* CHAT DETAIL VIEW */}
          <motion.div 
            className="absolute inset-0 flex flex-col bg-gradient-to-b from-indigo-900 to-blue-900"
            animate={{ x: showChatList ? '100%' : 0 }}
            transition={{ type: 'tween', duration: 0.3 }}
          >
            {selectedChat ? (
              <>
                {/* Chat Header */}
                <div className="p-4 flex items-center gap-3 border-b border-blue-800/30 bg-blue-950/60 backdrop-blur-sm">
                  <button 
                    onClick={handleBackToList}
                    className="text-blue-300 hover:text-white transition-colors"
                  >
                    <ArrowLeft className="h-5 w-5" />
                  </button>
                  
                  <Avatar className="h-9 w-9 border border-blue-500/30">
                    <AvatarImage src={selectedChat.recipient_avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${selectedChat.recipient_username}`} />
                    <AvatarFallback className="bg-blue-900">{selectedChat.recipient_username?.charAt(0).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1">
                    <h2 className="font-medium text-white">{selectedChat.recipient_username}</h2>
                    <p className="text-xs text-blue-300/70">
                      {selectedChat.is_group_chat ? `${selectedChat.members?.length || 0} members` : 'Online'}
                    </p>
                  </div>
                  
                  <button className="text-blue-300 hover:text-white transition-colors">
                    <MoreVertical className="h-5 w-5" />
                  </button>
                </div>
                
                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {selectedChat.messages && selectedChat.messages.length > 0 ? (
                    selectedChat.messages.map((msg) => (
                      <div 
                        key={msg.id}
                        className={`flex ${msg.sender_id === user?.id ? 'justify-end' : 'justify-start'} items-end gap-2`}
                      >
                        {msg.sender_id !== user?.id && (
                          <Avatar className="h-8 w-8 flex-shrink-0">
                            <AvatarImage src={selectedChat.recipient_avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${selectedChat.recipient_username}`} />
                            <AvatarFallback className="bg-blue-900">{selectedChat.recipient_username?.charAt(0).toUpperCase()}</AvatarFallback>
                          </Avatar>
                        )}
                        
                        <div 
                          className={`max-w-[75%] px-4 py-2 rounded-2xl shadow-sm ${msg.sender_id === user?.id 
                            ? 'bg-blue-500 text-white rounded-br-none' 
                            : 'bg-white text-gray-800 rounded-bl-none'}`}
                        >
                          <p>{msg.message}</p>
                          <div className={`text-xs mt-1 ${msg.sender_id === user?.id ? 'text-blue-100/70' : 'text-gray-500'}`}>
                            {new Date(msg.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-center">
                      <div className="bg-blue-900/40 p-6 rounded-full mb-4">
                        <MessageSquare className="h-12 w-12 text-blue-400" />
                      </div>
                      <h3 className="text-lg text-white mb-2">Start a new conversation</h3>
                      <p className="text-blue-300/70 max-w-md">Send your first message to {selectedChat.recipient_username}</p>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
                
                {/* Message Input */}
                <div className="p-3 border-t border-blue-800/30 bg-blue-900/40 backdrop-blur-sm">
                  <div className="flex items-center gap-2">
                    <button className="text-blue-300 p-2 hover:text-white transition-colors">
                      <Smile className="h-5 w-5" />
                    </button>
                    <input
                      type="text"
                      placeholder="Message"
                      className="flex-1 bg-blue-900/40 text-white border border-blue-700/30 rounded-full px-4 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500/50"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleMessageSent()}
                    />
                    <button 
                      onClick={handleMessageSent}
                      disabled={!message.trim()}
                      className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-900 disabled:opacity-50 text-white p-2 rounded-full transition-all"
                    >
                      <Send className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-6">
                <div className="bg-blue-900/40 p-8 rounded-full mb-6">
                  <MessageSquare className="h-16 w-16 text-blue-400" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-4">Select a Conversation</h2>
                <p className="text-blue-300/80 max-w-md mb-8">Please select a chat from the list or create a new message</p>
                <button 
                  onClick={handleBackToList}
                  className="px-6 py-3 bg-blue-700 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2"
                >
                  <ArrowLeft className="h-5 w-5" />
                  Back to Messages
                </button>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </>
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
                    key={user?.id}
                    className="flex items-center gap-3 p-2 cursor-pointer hover:bg-gaming-800 rounded transition-colors"
                    onClick={() => {
                      handleStartNewChat(user?.id);
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
                      key={user?.id}
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
                          if (!selectedUsers.includes(user?.id)) {
                            setSelectedUsers([...selectedUsers, user?.id]);
                            toast.success(`Added ${user.username || user.display_name || 'User'} to group`);
                          }
                        }}
                        disabled={selectedUsers.includes(user?.id)}
                        className="cyber-sm"
                      >
                        {selectedUsers.includes(user?.id) ? 'Added' : 'Add'}
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
