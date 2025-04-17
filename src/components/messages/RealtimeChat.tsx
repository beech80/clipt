import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { 
  sendMessage, 
  subscribeToMessages, 
  getMessages, 
  markMessageAsRead 
} from '@/lib/realtimeMessages';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Send, 
  Image, 
  Mic, 
  X, 
  ChevronLeft, 
  MoreVertical, 
  Loader,
  AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { Subscription } from '@supabase/supabase-js';
import { Button } from '@/components/ui/button';
import { formatDistanceToNow } from 'date-fns';

interface Message {
  id: string;
  content: string;
  senderId: string;
  receiverId: string;
  createdAt: string;
  isRead: boolean;
  readAt?: string;
  attachmentUrl?: string;
  messageType?: 'text' | 'image' | 'video';
  isMine: boolean;
}

interface ChatPartner {
  id: string;
  username: string;
  displayName?: string;
  avatarUrl?: string;
}

interface RealtimeChatProps {
  partnerId: string;
  partnerInfo?: ChatPartner;
  onClose?: () => void;
  isFullPage?: boolean;
}

const RealtimeChat: React.FC<RealtimeChatProps> = ({ 
  partnerId, 
  partnerInfo, 
  onClose, 
  isFullPage = false 
}) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [partnerData, setPartnerData] = useState<ChatPartner | null>(partnerInfo || null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [lastReadMessageId, setLastReadMessageId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messageInputRef = useRef<HTMLInputElement>(null);

  // Fetch partner info if not provided
  useEffect(() => {
    const fetchPartnerInfo = async () => {
      if (partnerInfo) {
        setPartnerData(partnerInfo);
        return;
      }

      if (!partnerId) return;

      try {
        const response = await fetch(`/api/users/${partnerId}`);
        if (!response.ok) throw new Error('Failed to fetch user info');
        
        const data = await response.json();
        setPartnerData({
          id: data.id,
          username: data.username,
          displayName: data.display_name,
          avatarUrl: data.avatar_url
        });
      } catch (err) {
        console.error('Error fetching partner info:', err);
        setError('Could not load contact information');
      }
    };

    fetchPartnerInfo();
  }, [partnerId, partnerInfo]);

  // Load chat history and subscribe to new messages
  useEffect(() => {
    if (!user || !partnerId) return;

    const loadMessages = async () => {
      setLoading(true);
      try {
        const { success, messages, error } = await getMessages(user.id, partnerId);
        if (success && messages) {
          setMessages(messages);
        } else {
          console.error('Error loading messages:', error);
          setError('Could not load messages');
        }
      } catch (err) {
        console.error('Exception loading messages:', err);
        setError('Failed to load chat history');
      } finally {
        setLoading(false);
      }
    };

    // Subscribe to new messages
    const setupSubscription = () => {
      // Cleanup previous subscription if it exists
      if (subscription) {
        subscription.unsubscribe();
      }

      // Create new subscription
      const newSubscription = subscribeToMessages(user.id, (newMsg) => {
        // Add new message to chat if it's from this conversation
        if (newMsg.sender_id === partnerId) {
          const formattedMessage: Message = {
            id: newMsg.id,
            content: newMsg.content,
            senderId: newMsg.sender_id,
            receiverId: newMsg.receiver_id,
            createdAt: newMsg.created_at,
            isRead: newMsg.is_read,
            readAt: newMsg.read_at,
            attachmentUrl: newMsg.attachment_url,
            messageType: newMsg.message_type,
            isMine: false
          };

          setMessages(prev => [...prev, formattedMessage]);
          
          // Mark message as read
          markMessageAsRead(newMsg.id).catch(err => {
            console.error('Error marking message as read:', err);
          });
        }
      });

      setSubscription(newSubscription);
    };

    loadMessages();
    setupSubscription();

    // Cleanup on unmount
    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, [user, partnerId]);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Mark messages as read
  useEffect(() => {
    if (!user || !partnerId || !messages.length) return;

    const markUnreadMessages = async () => {
      const unreadMessages = messages.filter(msg => !msg.isRead && !msg.isMine);
      
      if (unreadMessages.length === 0) return;
      
      try {
        await Promise.all(
          unreadMessages.map(msg => markMessageAsRead(msg.id))
        );

        // Update local state to mark messages as read
        setMessages(prevMessages => 
          prevMessages.map(msg => 
            unreadMessages.some(unread => unread.id === msg.id)
              ? { ...msg, isRead: true, readAt: new Date().toISOString() }
              : msg
          )
        );

        // Set last read message
        if (unreadMessages.length > 0) {
          setLastReadMessageId(unreadMessages[unreadMessages.length - 1].id);
        }
      } catch (err) {
        console.error('Error marking messages as read:', err);
      }
    };
    
    markUnreadMessages();
  }, [messages, user, partnerId]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    if (!user || !partnerId) {
      toast.error('You must be logged in to send messages');
      return;
    }

    if (!newMessage.trim()) return;

    try {
      setSending(true);
      
      const messagePayload = {
        sender_id: user.id,
        receiver_id: partnerId,
        content: newMessage.trim(),
        message_type: 'text' as const
      };
      
      const { success, data, error } = await sendMessage(messagePayload);
      
      if (success) {
        // Add the sent message to the UI
        const sentMessage: Message = {
          id: data?.id || `local-${Date.now()}`,
          content: newMessage.trim(),
          senderId: user.id,
          receiverId: partnerId,
          createdAt: new Date().toISOString(),
          isRead: false,
          isMine: true
        };
        
        setMessages(prev => [...prev, sentMessage]);
        setNewMessage('');
        
        // Focus back on input
        if (messageInputRef.current) {
          messageInputRef.current.focus();
        }
      } else {
        toast.error('Failed to send message');
        console.error('Error sending message:', error);
      }
    } catch (err) {
      console.error('Exception sending message:', err);
      toast.error('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const formatTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return formatDistanceToNow(date, { addSuffix: true });
    } catch (err) {
      return 'Just now';
    }
  };

  return (
    <div 
      className={`flex flex-col bg-gaming-900 ${
        isFullPage 
          ? 'h-screen w-full' 
          : 'h-[500px] w-full max-w-md rounded-lg shadow-xl border border-gaming-700'
      }`}
    >
      {/* Chat header */}
      <div className="flex items-center p-3 bg-gaming-800 border-b border-gaming-700">
        {onClose && (
          <Button 
            variant="ghost" 
            size="icon"
            className="mr-2 text-white hover:bg-gaming-700"
            onClick={onClose}
          >
            <ChevronLeft size={20} />
          </Button>
        )}
        
        {partnerData ? (
          <div className="flex items-center flex-1">
            <div className="relative">
              <img 
                src={partnerData.avatarUrl || '/default-avatar.png'} 
                alt={partnerData.displayName || partnerData.username}
                className="w-10 h-10 rounded-full object-cover"
              />
              <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-gaming-800"></div>
            </div>
            <div className="ml-3">
              <h3 className="font-semibold text-white">
                {partnerData.displayName || partnerData.username}
              </h3>
              <p className="text-xs text-gray-400">Online</p>
            </div>
          </div>
        ) : (
          <div className="flex-1">
            <div className="h-10 w-40 bg-gaming-700 animate-pulse rounded"></div>
          </div>
        )}
        
        <Button 
          variant="ghost" 
          size="icon"
          className="text-white hover:bg-gaming-700"
        >
          <MoreVertical size={20} />
        </Button>
      </div>
      
      {/* Chat messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gaming-900 scrollbar-thin scrollbar-thumb-gaming-700">
        {loading ? (
          <div className="flex justify-center items-center h-full">
            <Loader className="animate-spin text-orange-500" size={30} />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-full text-red-400">
            <AlertCircle size={40} className="mb-2" />
            <p>{error}</p>
            <Button 
              variant="outline" 
              className="mt-4"
              onClick={() => window.location.reload()}
            >
              Try Again
            </Button>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <p className="text-center">No messages yet. Start a conversation!</p>
          </div>
        ) : (
          <>
            <AnimatePresence initial={false}>
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className={`flex ${message.isMine ? 'justify-end' : 'justify-start'}`}
                >
                  <div 
                    className={`max-w-[80%] rounded-2xl p-3 ${
                      message.isMine 
                        ? 'bg-purple-700 text-white rounded-tr-none' 
                        : 'bg-gaming-800 text-white rounded-tl-none'
                    }`}
                  >
                    {message.content}
                    <div 
                      className={`text-xs mt-1 ${
                        message.isMine ? 'text-orange-300' : 'text-gray-400'
                      }`}
                    >
                      {formatTime(message.createdAt)}
                      {message.isMine && message.isRead && (
                        <span className="ml-2 text-green-400">✓</span>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            <div ref={messagesEndRef} />
          </>
        )}
      </div>
      
      {/* Message input */}
      <form 
        onSubmit={handleSendMessage}
        className="p-3 border-t border-gaming-700 bg-gaming-800"
      >
        <div className="flex items-center space-x-2">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="text-gray-400 hover:text-white hover:bg-gaming-700"
          >
            <Image size={20} />
          </Button>
          
          <input
            ref={messageInputRef}
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 bg-gaming-700 text-white rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
            disabled={sending || !user}
          />
          
          <Button
            type="submit"
            variant="ghost"
            size="icon"
            className="text-orange-500 hover:text-orange-400 hover:bg-gaming-700"
            disabled={sending || !newMessage.trim() || !user}
          >
            {sending ? (
              <Loader size={20} className="animate-spin" />
            ) : (
              <Send size={20} />
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default RealtimeChat;
