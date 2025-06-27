import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MessageSquare, Send, User, ArrowLeft } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Message type definition
type Message = {
  id: number;
  userId: string;
  username: string;
  content: string;
  createdAt: string;
  avatarUrl: string;
};

// Member type definition
type Member = {
  userId: string;
  username: string;
  avatarUrl: string;
  isOnline: boolean;
};

// Simple Squad Chat Component with cosmic space theme
const SquadChat = () => {
  const navigate = useNavigate();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Essential state for simple squad chat
  const [messages, setMessages] = useState<Message[]>([
    // Demo messages with cosmic theme
    {
      id: 1,
      userId: 'squad_admin',
      username: 'SquadCommander',
      content: 'Welcome to the Cosmic Squad Chat! 🌌✨',
      createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
      avatarUrl: 'https://i.pravatar.cc/150?img=3'
    },
    {
      id: 2,
      userId: 'current_user',
      username: 'You',
      content: 'Thanks for inviting me to the squad!',
      createdAt: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
      avatarUrl: 'https://i.pravatar.cc/150?img=2'
    },
    {
      id: 3,
      userId: 'member1',
      username: 'StarGazer42',
      content: 'Hey everyone! Ready for today\'s mission?',
      createdAt: new Date(Date.now() - 1000 * 60 * 20).toISOString(),
      avatarUrl: 'https://i.pravatar.cc/150?img=5'
    },
    {
      id: 4,
      userId: 'member2',
      username: 'CosmicVoyager',
      content: 'I found some great loot on my last expedition!',
      createdAt: new Date(Date.now() - 1000 * 60 * 10).toISOString(),
      avatarUrl: 'https://i.pravatar.cc/150?img=8'
    },
    {
      id: 5,
      userId: 'squad_admin',
      username: 'SquadCommander',
      content: 'Remember: New galactic event starting tomorrow at 8pm!',
      createdAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
      avatarUrl: 'https://i.pravatar.cc/150?img=3'
    }
  ]);
  
  // Chat input state
  const [messageInput, setMessageInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // User info state
  const [currentUser] = useState({
    userId: 'current_user',
    username: 'You',
    avatarUrl: 'https://i.pravatar.cc/150?img=2'
  });
  
  // Squad members for online status display
  const [onlineMembers] = useState<Member[]>([
    { userId: 'squad_admin', username: 'SquadCommander', avatarUrl: 'https://i.pravatar.cc/150?img=3', isOnline: true },
    { userId: 'member1', username: 'StarGazer42', avatarUrl: 'https://i.pravatar.cc/150?img=5', isOnline: true },
    { userId: 'member2', username: 'CosmicVoyager', avatarUrl: 'https://i.pravatar.cc/150?img=8', isOnline: false },
    { userId: 'member3', username: 'NebulaDrifter', avatarUrl: 'https://i.pravatar.cc/150?img=9', isOnline: true },
    { userId: 'member4', username: 'AstroNinja', avatarUrl: 'https://i.pravatar.cc/150?img=11', isOnline: false }
  ]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Function to scroll chat to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  // Real-time chat connection with Supabase
  useEffect(() => {
    // Set up real-time subscription to Supabase
    const channel = supabase
      .channel('squad_messages')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'squad_messages'
      }, (payload: any) => {
        // Format and add the new message
        const newMessage: Message = {
          id: payload.new.id || Date.now(),
          userId: payload.new.user_id,
          username: payload.new.username,
          content: payload.new.content,
          createdAt: payload.new.created_at,
          avatarUrl: payload.new.avatar_url || `https://i.pravatar.cc/150?img=${Math.floor(Math.random() * 10) + 1}`
        };
        
        setMessages(prevMessages => [...prevMessages, newMessage]);
      })
      .subscribe();
      
    return () => {
      // Clean up the subscription
      supabase.removeChannel(channel);
    };
  }, []);
  
  // Send a new message
  const sendMessage = async () => {
    if (!messageInput.trim()) return;
    
    const newMessage: Message = {
      id: Date.now(),
      userId: currentUser.userId,
      username: currentUser.username,
      content: messageInput.trim(),
      createdAt: new Date().toISOString(),
      avatarUrl: currentUser.avatarUrl
    };
    
    // Add message optimistically to the UI
    setMessages(prev => [...prev, newMessage]);
    setMessageInput('');
    
    try {
      setIsLoading(true);
      // Save to Supabase (if connected)
      const { error } = await supabase.from('squad_messages').insert([
        {
          user_id: newMessage.userId,
          username: newMessage.username,
          content: newMessage.content,
          avatar_url: newMessage.avatarUrl
        }
      ]);
      
      if (error) throw error;
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle back navigation
  const handleBack = () => {
    navigate(-1);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f0224] to-[#1d0436] text-white flex flex-col">
      {/* Header */}
      <div className="border-b border-purple-500/30 bg-black/40 p-4 flex items-center justify-between">
        <div className="flex items-center">
          <button onClick={handleBack} className="mr-3 p-2 rounded-full hover:bg-purple-800/30">
            <ArrowLeft className="h-5 w-5 text-purple-300" />
          </button>
          <h1 className="text-xl font-bold">Squad Chat</h1>
        </div>
        <div className="flex items-center space-x-1">
          <span className="text-sm text-green-400">{onlineMembers.filter(m => m.isOnline).length} online</span>
        </div>
      </div>
      
      {/* Main content area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Member list - visible on larger screens */}
        <div className="hidden md:block w-64 border-r border-purple-500/30 bg-black/30 overflow-auto">
          <div className="p-4">
            <h2 className="text-purple-300 text-sm font-medium uppercase tracking-wider mb-4">Squad Members</h2>
            {onlineMembers.map(member => (
              <div key={member.userId} className="flex items-center mb-3 p-2 rounded-lg hover:bg-purple-900/20">
                <div className="relative">
                  <img 
                    src={member.avatarUrl} 
                    alt={member.username} 
                    className="w-8 h-8 rounded-full mr-2" 
                  />
                  <span 
                    className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border border-white ${member.isOnline ? 'bg-green-500' : 'bg-gray-500'}`}
                  />
                </div>
                <span className="ml-2">{member.username}</span>
              </div>
            ))}
          </div>
        </div>
        
        {/* Chat area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Messages container */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3" style={{backgroundImage: 'radial-gradient(circle at center, rgba(74, 20, 140, 0.1) 0%, transparent 80%)'}}>
            {/* Messages */}
            {messages.map((message) => (
              <motion.div 
                key={message.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className={`flex ${message.userId === currentUser.userId ? 'justify-end' : ''}`}
              >
                <div 
                  className={`max-w-[80%] ${message.userId === currentUser.userId
                    ? 'bg-purple-600 rounded-tl-2xl rounded-bl-2xl rounded-tr-2xl'
                    : 'bg-[#2a1654] rounded-tr-2xl rounded-br-2xl rounded-tl-2xl'} 
                    p-3 shadow`}
                >
                  {/* Message header with username and time */}
                  <div className="flex items-baseline mb-1">
                    {message.userId !== currentUser.userId && (
                      <div className="flex items-center">
                        <img 
                          src={message.avatarUrl} 
                          alt={message.username} 
                          className="w-5 h-5 rounded-full mr-2" 
                        />
                        <span className="text-xs font-medium text-purple-300">{message.username}</span>
                      </div>
                    )}
                    <span className="text-xs text-purple-200/50 ml-auto">
                      {new Date(message.createdAt).toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})}
                    </span>
                  </div>
                  
                  {/* Message content */}
                  <p className="text-sm text-white break-words">{message.content}</p>
                </div>
              </motion.div>
            ))}
            <div ref={messagesEndRef} />
          </div>
          
          {/* Message input */}
          <div className="border-t border-purple-500/30 bg-black/40 p-3">
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                onKeyPress={(e: React.KeyboardEvent<HTMLInputElement>) => e.key === 'Enter' && sendMessage()}
                placeholder="Type a message..."
                className="flex-1 rounded-full bg-black/50 border border-purple-500/30 text-white px-4 py-2 focus:outline-none focus:ring-1 focus:ring-purple-500"
              />
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={sendMessage}
                disabled={!messageInput.trim() || isLoading}
                className="p-2 rounded-full bg-gradient-to-r from-purple-600 to-purple-500 text-white disabled:opacity-50"
              >
                <Send className="h-5 w-5" />
              </motion.button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Animated stars in background */}
      <div className="stars-container fixed inset-0 pointer-events-none overflow-hidden z-0">
        {Array.from({ length: 30 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-white rounded-full z-0"
            style={{
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              opacity: Math.random() * 0.7 + 0.3
            }}
            animate={{
              opacity: [0.3, 0.8, 0.3],
              scale: [1, 1.2, 1]
            }}
            transition={{
              duration: Math.random() * 3 + 2,
              repeat: Infinity,
              repeatType: "reverse"
            }}
          />
        ))}
      </div>
    </div>
  );
};

export default SquadChat;
