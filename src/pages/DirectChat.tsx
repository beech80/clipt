import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Avatar } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { Send } from 'lucide-react';
import { motion } from 'framer-motion';
import '../styles/direct-chat.css';
import '../styles/retro-game.css';

interface Message {
  id?: string;
  content: string;
  sender_id: string;
  timestamp: string;
  is_read?: boolean;
  pending?: boolean;
  failed?: boolean;
}

// For Supabase database type safety
interface DirectMessage {
  id?: string;
  sender_id: string;
  recipient_id: string;
  message?: string;
  content?: string;
  created_at: string;
  is_read?: boolean;
}

interface ChatUser {
  id: string;
  username?: string;
  avatar?: string;
}

const DirectChat = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const [recipient, setRecipient] = useState<ChatUser | null>(null);
  // Start with a blank chat - no pre-filled messages
  const [messages, setMessages] = useState<Message[]>([]);
  
  const [messageText, setMessageText] = useState('');
  const [loading, setLoading] = useState(false);

  // Fetch recipient data and existing messages
  useEffect(() => {
    const fetchRecipientAndMessages = async () => {
      if (!userId) return;
      
      try {
        setLoading(true);
        
        // Fetch recipient profile
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('id, username, avatar_url')
          .eq('id', userId)
          .single();
          
        if (profileError) {
          console.error("Error fetching recipient:", profileError);
          // Use placeholder data
          setRecipient({
            id: userId || 'user1',
            username: 'Cosmic User',
            avatar: 'https://api.dicebear.com/7.x/pixel-art/svg?seed=CosmicUser'
          });
        } else if (profileData) {
          setRecipient({
            id: profileData.id,
            username: profileData.username || 'Cosmic User',
            avatar: profileData.avatar_url || `https://api.dicebear.com/7.x/pixel-art/svg?seed=${profileData.username}`
          });
        }
        
        // Load message history
        await loadMessageHistory();
      } catch (error) {
        console.error("Error in fetchRecipientAndMessages:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchRecipientAndMessages();
  }, [userId, user?.id]);
  
  // Separate function to load message history for better organization and reusability
  const loadMessageHistory = async () => {
    if (!user?.id || !userId) return;
    
    try {
      console.log('Loading message history between', user.id, 'and', userId);
      
      // Using complex query to ensure we get all messages between these two users
      const { data: chatData, error: chatError } = await supabase
        .from('messages')
        .select('*')
        .or(`and(sender_id.eq.${user.id},recipient_id.eq.${userId}),and(sender_id.eq.${userId},recipient_id.eq.${user.id})`)
        .order('created_at', { ascending: true });
        
      if (chatError) {
        console.error("Error fetching chat messages:", chatError);
        toast.error("Couldn't load message history");
        return;
      }
        
      if (chatData && chatData.length > 0) {
        console.log('Found existing messages:', chatData.length, chatData);
        
        // Format messages for our UI
        const formattedMessages = chatData.map(msg => ({
          id: msg.id,
          content: msg.message || msg.content || '',
          sender_id: msg.sender_id === user.id ? 'me' : 'other',
          timestamp: msg.created_at,
          is_read: true
        }));
        
        setMessages(formattedMessages);
      } else {
        console.log('No existing messages found, starting fresh chat');
        setMessages([]);
      }
    } catch (error) {
      console.error("Error loading message history:", error);
    }
  };
    
    // Set up real-time subscription for new messages
    const setupMessageSubscription = async () => {
      if (!user?.id || !userId) return;
      
      console.log('Setting up real-time message subscription between', user.id, 'and', userId);
      
      // Subscribe to new messages between these users with a more precise filter
      const subscription = supabase
        .channel('direct-messages')
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `(sender_id.eq.${user.id},recipient_id.eq.${userId})`, 
        }, (payload) => {
          console.log('New outgoing message detected:', payload);
          handleNewMessage(payload);
        })
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `(sender_id.eq.${userId},recipient_id.eq.${user.id})`,
        }, (payload) => {
          console.log('New incoming message detected:', payload);
          handleNewMessage(payload);
        })
        .subscribe();
      
      // Cleanup subscription when component unmounts
      return () => {
        supabase.removeChannel(subscription);
      };
    };
    
    // Helper function to process new messages
    const handleNewMessage = (payload) => {
      if (!payload || !payload.new) return;
      
      const newMsg = payload.new;
      console.log('Processing new message:', newMsg);
      
      // Prevent duplicate messages
      if (messages.some(m => m.id === newMsg.id)) {
        console.log('Message already exists in the chat, ignoring');
        return;
      }
      
      // Add the new message to the chat
      const formattedMsg = {
        id: newMsg.id,
        content: newMsg.message || newMsg.content || '',
        sender_id: newMsg.sender_id === user.id ? 'me' : 'other',
        timestamp: newMsg.created_at,
        is_read: false
      };
      
      setMessages(prevMsgs => [...prevMsgs, formattedMsg]);
      
      // Play a sound or visual effect for new messages
      if (newMsg.sender_id !== user.id) {
        // Play sound or show notification for incoming messages
        try {
          // You could add a sound here
          // new Audio('/path-to-notification-sound.mp3').play();
          
          // Or show a toast
          toast.success(`New message from ${recipient?.username || 'Cosmic User'}`);
        } catch (err) {
          console.error('Error with notification:', err);
        }
      }
    };
    
    const subscription = setupMessageSubscription();
    return () => {
      // Cleanup subscription
      if (subscription && typeof subscription.then === 'function') {
        subscription.then(cleanup => cleanup && cleanup());
      }
    };
  }, [userId, user?.id, messages.length]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!messageText.trim() || !user?.id || !userId) {
      console.log('Cannot send message - missing data:', { messageText: !!messageText.trim(), userId: !!userId, currentUser: !!user?.id });
      return;
    }
    
    // Add optimistic update for immediate UI feedback
    const tempId = `temp-${Date.now()}`;
    const optimisticMessage = {
      id: tempId,
      content: messageText.trim(),
      sender_id: 'me',
      timestamp: new Date().toISOString(),
      is_read: false,
      pending: true // Mark as pending until confirmed by the server
    };
    
    // Update UI immediately
    setMessages(prevMessages => [...prevMessages, optimisticMessage]);
    const messageToBeSent = messageText.trim();
    setMessageText(''); // Clear input field
    
    try {
      console.log('Sending message to database:', {
        sender_id: user.id,
        recipient_id: userId,
        message: messageToBeSent
      });
      
      // Save to database with correct field structure for compatibility
      const { data, error } = await supabase
        .from('messages')
        .insert({
          content: messageToBeSent, // Using 'content' instead of 'message' for compatibility
          sender_id: user.id,
          receiver_id: userId, // Using 'receiver_id' instead of 'recipient_id' for compatibility
          created_at: new Date().toISOString(),
          read: false, // Using 'read' instead of 'is_read' for compatibility
          message_type: 'direct',
          chat_id: `chat-${user.id}-${userId}` // Adding chat_id for better organization
        })
        .select();
      
      if (error) {
        console.error('Error sending message:', error);
        toast.error('Failed to send message: ' + error.message);
        
        // Remove the optimistic message or mark it as failed
        setMessages(prevMessages => 
          prevMessages.map(msg => 
            msg.id === tempId 
              ? { ...msg, failed: true, pending: false }
              : msg
          )
        );
        return;
      }
      
      if (data && data.length > 0) {
        console.log('Message saved successfully to database:', data[0]);
        
        // Replace the optimistic message with the confirmed one from the server
        const confirmedMessage = {
          id: data[0].id,
          content: data[0].message || data[0].content || messageToBeSent,
          sender_id: 'me',
          timestamp: data[0].created_at,
          is_read: false,
          pending: false
        };
        
        setMessages(prevMessages => 
          prevMessages.map(msg => 
            msg.id === tempId ? confirmedMessage : msg
          )
        );
        
        // Force a refresh on the Messages list to update conversations
        try {
          // This will update the global state to show this conversation in the messages list
          const event = new CustomEvent('message-sent', { 
            detail: { 
              recipientId: userId,
              message: messageToBeSent 
            } 
          });
          window.dispatchEvent(event);
        } catch (refreshErr) {
          console.error('Error refreshing messages list:', refreshErr);
        }
      }
      
    } catch (err) {
      console.error('Exception sending message:', err);
      toast.error('Failed to send message: ' + (err.message || 'Unknown error'));
      
      // Mark message as failed
      setMessages(prevMessages => 
        prevMessages.map(msg => 
          msg.id === tempId 
            ? { ...msg, failed: true, pending: false }
            : msg
        )
      );
    }
  };

  const handleBack = () => {
    navigate('/messages');
  };
  
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Animation variants for messages
  const messageVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
  };

  return (
    <div className="retro-direct-chat-container">
      {/* Visual Effects */}
      <div className="absolute inset-0 pointer-events-none z-[1] cosmic-bg"></div>
      <div className="absolute inset-0 pointer-events-none z-[2] scanlines"></div>
      <div className="absolute inset-0 pointer-events-none z-[3] crt-effect"></div>
      
      {/* Header */}
      <div className="retro-direct-chat-header">
        <div className="retro-header-spacer"></div>
        <div className="retro-recipient-info">
          <span className="retro-glow">{recipient?.username || 'COSMIC USER'}</span>
        </div>
        <div className="retro-header-spacer"></div>
      </div>
      
      {/* Messages */}
      <div className="retro-direct-chat-messages">
        {loading ? (
          <div className="retro-loading">
            <div className="retro-pixel-box">
              <p className="retro-text retro-glow">ESTABLISHING CONNECTION...</p>
              <div className="loading-dots">
                <span className="dot"></span>
                <span className="dot"></span>
                <span className="dot"></span>
              </div>
            </div>
          </div>
        ) : messages.length === 0 ? (
          <div className="retro-empty-chat">
            <div className="retro-pixel-box">
              <p className="retro-text retro-glow">START NEW TRANSMISSION</p>
              <p className="retro-subtext">Send a message to initiate cosmic communication</p>
            </div>
          </div>
        ) : (
          <div className="retro-messages-list">
            {messages.map((message, index) => (
              <motion.div 
                key={message.id || index} 
                className={`retro-message-bubble ${message.sender_id === 'me' ? 'retro-sent' : 'retro-received'} ${
                  message.pending ? 'retro-pending' : ''
                } ${message.failed ? 'retro-failed' : ''}`}
                initial="hidden"
                animate="visible"
                variants={messageVariants}
              >
                {message.sender_id !== 'me' && (
                  <div className="retro-avatar-container">
                    <Avatar className="retro-avatar">
                      <img 
                        src={recipient?.avatar || 'https://api.dicebear.com/7.x/pixel-art/svg?seed=CosmicUser'} 
                        alt={recipient?.username || 'User'} 
                      />
                    </Avatar>
                  </div>
                )}
                <div className={`retro-message-content ${message.sender_id === 'me' ? 'retro-sent-content' : 'retro-received-content'}`}>
                  <div className="message-text">{message.content}</div>
                  {message.pending && (
                    <div className="message-status pending">
                      <span className="loading-dots">
                        <span>.</span><span>.</span><span>.</span>
                      </span>
                    </div>
                  )}
                  {message.failed && (
                    <div className="message-status failed">
                      <span className="failed-icon">!</span> Failed
                    </div>
                  )}
                  <div className="message-timestamp">{formatTime(message.timestamp)}</div>
                </div>
                {message.sender_id === 'me' && (
                  <div className="retro-avatar-container">
                    <Avatar className="retro-avatar">
                      <img 
                        src={user?.user_metadata?.avatar_url || 'https://api.dicebear.com/7.x/pixel-art/svg?seed=Me'} 
                        alt="Me" 
                      />
                    </Avatar>
                  </div>
                )}
              </motion.div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>
      
      {/* Input Area */}
      <div className="retro-direct-chat-input-area">
        <input
          type="text"
          className="retro-message-input retro-message-input-expanded"
          placeholder="TYPE YOUR COSMIC MESSAGE..."
          value={messageText}
          onChange={(e) => setMessageText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
        />
        <motion.button 
          className="retro-send-button"
          onClick={handleSendMessage}
          disabled={!messageText.trim()}
          whileHover={{ 
            scale: 1.05,
            boxShadow: "0 0 25px rgba(140, 68, 255, 0.9), 0 0 40px rgba(140, 68, 255, 0.4)"
          }}
          whileTap={{ 
            scale: 0.95,
            boxShadow: "0 0 10px rgba(140, 68, 255, 0.5), inset 0 0 15px rgba(0, 0, 0, 0.3)"
          }}
          transition={{
            type: "spring",
            stiffness: 500,
            damping: 15
          }}
        >
          <motion.div
            animate={{ rotate: [0, -5, 0, 5, 0] }}
            transition={{ 
              duration: 3, 
              repeat: Infinity, 
              ease: "easeInOut" 
            }}
          >
            <Send size={24} />
          </motion.div>
        </motion.button>
      </div>
    </div>
  );
};

export default DirectChat;
