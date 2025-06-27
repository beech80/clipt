import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MessageSquare, Send, User, Heart, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Message and member type definitions
type Message = {
  id: string;
  userId: string;
  content: string;
  username: string;
  avatarUrl: string;
  timestamp: number;
  likes: string[];
  replyTo?: {
    id: string;
    username: string;
    content: string;
  };
  mentions?: string[];
};

type Member = {
  userId: string;
  username: string;
  avatarUrl: string;
  isOnline: boolean;
};

// SquadChat component
const SquadChat: React.FC = () => {
  const navigate = useNavigate();
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  
  // Current user - would normally come from auth context
  const currentUser = {
    userId: 'user123',
    username: 'CosmicVoyager',
    avatarUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=cosmic',
  };
  
  // Sample squad members
  const [onlineMembers, setOnlineMembers] = useState<Member[]>([
    { userId: 'user123', username: 'CosmicVoyager', avatarUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=cosmic', isOnline: true },
    { userId: 'user456', username: 'StarDust', avatarUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=stardust', isOnline: true },
    { userId: 'user789', username: 'NebulaNinja', avatarUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=nebula', isOnline: false },
    { userId: 'user101', username: 'GalaxyGlider', avatarUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=galaxy', isOnline: true },
    { userId: 'user202', username: 'SolarFlare', avatarUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=solar', isOnline: false },
  ]);

  // Chat state
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [replyToMessage, setReplyToMessage] = useState<Message | null>(null);
  const [mentioning, setMentioning] = useState(false);
  const [mentionSearch, setMentionSearch] = useState('');
  const [mentionFilteredMembers, setMentionFilteredMembers] = useState<Member[]>([]);
  
  // Load initial messages
  useEffect(() => {
    // Simulated message loading with sample data
    const sampleMessages: Message[] = [
      {
        id: '1',
        userId: 'user456',
        content: 'Welcome to the cosmic realm, everyone! 🌌✨',
        username: 'StarDust',
        avatarUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=stardust',
        timestamp: Date.now() - 3600000,
        likes: ['user123'],
      },
      {
        id: '2',
        userId: 'user789',
        content: 'The stars are especially bright tonight!',
        username: 'NebulaNinja',
        avatarUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=nebula',
        timestamp: Date.now() - 1800000,
        likes: [],
      },
      {
        id: '3',
        userId: 'user123',
        content: 'Just warped in from the Andromeda sector. What did I miss?',
        username: 'CosmicVoyager',
        avatarUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=cosmic',
        timestamp: Date.now() - 900000,
        likes: ['user456', 'user789'],
      },
    ];
    
    setMessages(sampleMessages);
  }, []);

  // Auto-scroll to the latest message
  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Handle input changes and detect mentions
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setInputValue(value);
    
    // Check for mention
    const lastAtSymbolIndex = value.lastIndexOf('@');
    if (lastAtSymbolIndex !== -1 && lastAtSymbolIndex > value.lastIndexOf(' ')) {
      setMentioning(true);
      const searchText = value.slice(lastAtSymbolIndex + 1);
      setMentionSearch(searchText);
      
      // Filter members based on mention search
      const filtered = onlineMembers.filter(
        member => member.username.toLowerCase().includes(searchText.toLowerCase())
      );
      setMentionFilteredMembers(filtered);
    } else {
      setMentioning(false);
    }
  };

  // Handle selecting a mention
  const handleSelectMention = (member: Member) => {
    const lastAtSymbolIndex = inputValue.lastIndexOf('@');
    const newValue = inputValue.slice(0, lastAtSymbolIndex) + `@${member.username} `;
    setInputValue(newValue);
    setMentioning(false);
    
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  // Generate unique message ID
  const generateId = () => {
    return Date.now().toString() + Math.random().toString().slice(2, 8);
  };

  // Send message function
  const sendMessage = async () => {
    if (!inputValue.trim()) return;
    
    const trimmedContent = inputValue.trim();
    
    // Check for mentions
    const mentions: string[] = [];
    const mentionRegex = /@(\w+)/g;
    let match;
    
    while ((match = mentionRegex.exec(trimmedContent)) !== null) {
      const mentionUsername = match[1];
      const mentionedMember = onlineMembers.find(
        member => member.username.toLowerCase() === mentionUsername.toLowerCase()
      );
      
      if (mentionedMember) {
        mentions.push(mentionedMember.userId);
      }
    }
    
    // Create message object
    const newMessage: Message = {
      id: generateId(),
      userId: currentUser.userId,
      content: trimmedContent,
      username: currentUser.username,
      avatarUrl: currentUser.avatarUrl,
      timestamp: Date.now(),
      likes: [],
      ...(replyToMessage && {
        replyTo: {
          id: replyToMessage.id,
          username: replyToMessage.username,
          content: replyToMessage.content
        }
      }),
      ...(mentions.length > 0 && { mentions })
    };
    
    // Optimistically update UI
    setMessages([...messages, newMessage]);
    setInputValue('');
    setReplyToMessage(null);
    
    // TODO: In a real app, would send to backend
    // For now, just simulate success with optimistic UI update
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      toast.success('Message sent!', {
        className: 'bg-black/80 border border-purple-500/30',
      });
    } catch (error) {
      console.error('Error sending message:', error);
      // Handle error - could remove the optimistic update
      toast.error('Failed to send message, please try again');
    }
  };

  // Handle like/unlike message
  const handleLikeMessage = async (messageId: string) => {
    setMessages(prevMessages => {
      return prevMessages.map(msg => {
        if (msg.id === messageId) {
          const userLiked = msg.likes.includes(currentUser.userId);
          const newLikes = userLiked
            ? msg.likes.filter(id => id !== currentUser.userId)
            : [...msg.likes, currentUser.userId];
          
          return { ...msg, likes: newLikes };
        }
        return msg;
      });
    });
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 300));
    } catch (error) {
      console.error('Error updating like:', error);
      // Revert optimistic update on failure
      toast.error('Failed to update like');
    }
  };

  // Handle reply to message
  const handleReplyToMessage = (message: Message) => {
    setReplyToMessage(message);
    
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  // Cancel reply
  const cancelReply = () => {
    setReplyToMessage(null);
  };

  // Handle Enter key press to send message
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Back button handler
  const handleBack = () => {
    navigate(-1);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f0224] to-[#1d0436] text-white flex flex-col">
      {/* All animations in a single style tag for simplicity */}
      <style dangerouslySetInnerHTML={{ __html: `
        .message-delivered {
          animation: fadeInScale 0.3s ease forwards;
        }
        
        @keyframes fadeInScale {
          0% { opacity: 0.7; transform: scale(0.97); }
          100% { opacity: 1; transform: scale(1); }
        }
        
        .like-pulse {
          animation: likePulse 0.6s cubic-bezier(0.16, 1, 0.3, 1);
        }
        
        @keyframes likePulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.35); filter: drop-shadow(0 0 8px rgba(217, 70, 239, 0.8)); }
          100% { transform: scale(1); }
        }

        .message-bubble {
          background: linear-gradient(135deg, rgba(34, 10, 90, 0.8), rgba(15, 3, 50, 0.8));
          border: 1px solid rgba(139, 92, 246, 0.3);
          border-radius: 1rem;
        }

        .message-bubble.sent {
          background: linear-gradient(135deg, rgba(59, 7, 100, 0.8), rgba(28, 8, 80, 0.8));
          border: 1px solid rgba(167, 139, 250, 0.4);
        }

        .scrollable-content::-webkit-scrollbar {
          width: 6px;
          background-color: rgba(5, 1, 15, 0.5);
        }

        .scrollable-content::-webkit-scrollbar-thumb {
          background: rgba(139, 92, 246, 0.3);
          border-radius: 10px;
        }

        .scrollable-content::-webkit-scrollbar-thumb:hover {
          background: rgba(139, 92, 246, 0.5);
        }

        .chat-input {
          background: rgba(10, 3, 30, 0.8);
          border: 1px solid rgba(139, 92, 246, 0.3);
          transition: all 0.3s ease;
        }

        .chat-input:focus {
          border-color: rgba(139, 92, 246, 0.6);
          box-shadow: 0 0 10px rgba(139, 92, 246, 0.2);
        }
      ` }} />
      
      {/* Header - Centered and cosmic */}
      <div className="sticky top-0 z-10 bg-black/80 backdrop-blur-md border-b border-purple-500/30 p-4 relative">
        <div className="flex flex-col items-center justify-center">
          <motion.h1
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ 
              opacity: 1, 
              scale: 1, 
              textShadow: [
                '0 0 5px rgba(139, 92, 246, 0.5)',
                '0 0 15px rgba(139, 92, 246, 0.6)',
                '0 0 5px rgba(139, 92, 246, 0.5)'
              ]
            }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="text-xl font-bold text-center text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-fuchsia-400"
          >
            Squad Chat
          </motion.h1>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.7 }}
            transition={{ delay: 0.3 }}
            className="text-xs text-purple-400/80 text-center mt-1"
          >
            GalaxyGlider's Streaming Squad
          </motion.div>
          
          {/* Online members indicator */}
          <div className="flex items-center mt-2">
            <div className="flex -space-x-2 mr-2">
              {onlineMembers.slice(0, 5).map(member => (
                <motion.img
                  key={member.userId}
                  initial={{ scale: 0.9, opacity: 0.7 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.3 }}
                  src={member.avatarUrl}
                  alt={member.username}
                  className="w-6 h-6 rounded-full border-2 border-purple-900"
                />
              ))}
            </div>
            <span className="text-sm text-purple-300 ml-1 flex items-center">
              <span className="w-2 h-2 bg-green-500 rounded-full mr-1 animate-pulse"></span>
              {onlineMembers.filter(m => m.isOnline).length} online
            </span>
          </div>
        </div>
      </div>
      
      {/* Main content area */}
      <div className="flex flex-1 overflow-hidden">
        
        {/* Messages container - scrollable with fixed height */}
        <div 
          className="flex-1 overflow-y-auto py-4 px-4 space-y-4 scrollable-content" 
          style={{ height: 'calc(100vh - 140px)', paddingBottom: '100px' }}
          ref={messagesContainerRef}
        >
          {/* Messages */}
          {messages.map((message) => (
            <motion.div 
              key={message.id}
              id={`msg-${message.id}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className={`flex ${message.userId === currentUser.userId ? 'justify-end' : ''}`}
            >
              <div className="max-w-[85%] flex flex-col">
                {/* Reply reference if applicable */}
                {message.replyTo && (
                  <div 
                    className="text-xs text-purple-300 mb-1 ml-2 flex items-center" 
                    onClick={() => {
                      const replyElement = document.getElementById(`msg-${message.replyTo?.id}`);
                      if (replyElement) {
                        replyElement.scrollIntoView({ behavior: 'smooth' });
                        replyElement.classList.add('highlight-pulse');
                        setTimeout(() => {
                          replyElement.classList.remove('highlight-pulse');
                        }, 2000);
                      }
                    }}
                  >
                    <MessageSquare size={12} className="mr-1 text-purple-400" /> 
                    <span>Replying to <span className="text-fuchsia-400">{message.replyTo.username}</span>:</span>
                  </div>
                )}
                
                {/* Message bubble */}
                <div className="flex items-start gap-2">
                  {/* Avatar for received messages */}
                  {message.userId !== currentUser.userId && (
                    <img 
                      src={message.avatarUrl} 
                      alt={message.username} 
                      className="w-8 h-8 rounded-full border-2 border-purple-900 mt-1"
                    />
                  )}
                  
                  <div className="flex flex-col">
                    {/* User name for received messages */}
                    {message.userId !== currentUser.userId && (
                      <span className="text-xs text-purple-300 ml-1 mb-1">{message.username}</span>
                    )}
                    
                    <div 
                      className={`message-bubble px-4 py-2 break-words shadow-lg ${message.userId === currentUser.userId ? 'sent' : ''}`}
                    >
                      {/* Message content with mention highlighting */}
                      <div className="text-sm">
                        {message.content.split(/(@\w+)/).map((part, i) => {
                          if (part.match(/@\w+/)) {
                            const username = part.substring(1);
                            const member = onlineMembers.find(
                              m => m.username.toLowerCase() === username.toLowerCase()
                            );
                            return member ? (
                              <span key={i} className="text-fuchsia-400 font-medium">{part}</span>
                            ) : part;
                          }
                          return part;
                        })}
                      </div>
                    </div>
                    
                    {/* Message footer with timestamp and actions */}
                    <div className="flex items-center mt-1 text-xs text-purple-400/70 px-1">
                      <span>
                        {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      
                      <div className="ml-auto flex items-center gap-3">
                        {/* Reply button */}
                        <button 
                          onClick={() => handleReplyToMessage(message)}
                          className="opacity-60 hover:opacity-100 transition-opacity"
                        >
                          <MessageSquare size={14} />
                        </button>
                        
                        {/* Like button */}
                        <button 
                          onClick={() => handleLikeMessage(message.id)}
                          className={`flex items-center ${message.likes.includes(currentUser.userId) ? 'text-pink-500' : 'opacity-60 hover:opacity-100'} transition-all`}
                        >
                          <Heart 
                            size={14} 
                            fill={message.likes.includes(currentUser.userId) ? "currentColor" : "none"}
                            className={message.likes.includes(currentUser.userId) ? 'like-pulse' : ''}
                          />
                          {message.likes.length > 0 && (
                            <span className="ml-1">{message.likes.length}</span>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
          
          <div ref={bottomRef} />
        </div>
      </div>
      
      {/* Message input area - fixed at bottom */}
      <div className="sticky bottom-0 bg-black/70 backdrop-blur-md border-t border-purple-500/20 p-4 w-full">
        {/* Reply indicator */}
        {replyToMessage && (
          <div className="bg-purple-900/20 p-2 rounded-lg mb-2 flex items-center justify-between">
            <div className="flex items-center">
              <MessageSquare size={14} className="mr-2 text-purple-400" />
              <span className="text-xs text-purple-300">Replying to <span className="text-fuchsia-400">{replyToMessage.username}</span>:</span>
              <span className="text-xs text-gray-400 ml-2 truncate max-w-[150px] sm:max-w-[300px]">{replyToMessage.content}</span>
            </div>
            <button onClick={cancelReply} className="text-purple-400 hover:text-purple-300">
              <X size={16} />
            </button>
          </div>
        )}
        
        {/* Input form */}
        <div className="relative">
          <textarea
            ref={inputRef}
            value={inputValue}
            onChange={handleInputChange}
            onKeyDown={handleKeyPress}
            placeholder="Send a cosmic message..."
            className="w-full px-4 py-3 pr-12 rounded-xl chat-input text-white text-sm focus:outline-none resize-none"
            rows={2}
          />
          
          <button
            onClick={sendMessage}
            disabled={!inputValue.trim()}
            className="absolute right-2 bottom-2 p-2 rounded-full bg-purple-600 bg-opacity-40 hover:bg-opacity-60 text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Send size={18} />
          </button>
          
          {/* Mention suggestions */}
          {mentioning && mentionFilteredMembers.length > 0 && (
            <div className="absolute bottom-full mb-1 w-full max-h-[150px] overflow-y-auto bg-black/90 border border-purple-500/30 rounded-lg shadow-xl">
              {mentionFilteredMembers.map(member => (
                <div
                  key={member.userId}
                  onClick={() => handleSelectMention(member)}
                  className="flex items-center gap-2 p-2 hover:bg-purple-900/20 cursor-pointer transition-colors"
                >
                  <img src={member.avatarUrl} alt={member.username} className="w-6 h-6 rounded-full" />
                  <span className="text-sm text-purple-200">{member.username}</span>
                  <span className="ml-auto w-2 h-2 rounded-full mr-1 bg-green-500 animate-pulse"></span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SquadChat;
