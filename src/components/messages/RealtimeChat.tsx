import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { 
  sendMessage, 
  subscribeToMessages, 
  getMessages, 
  markMessageAsRead 
} from '@/lib/realtimeMessages';
import { cloudflareService } from '@/services/cloudflareService';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Send, 
  Image, 
  Mic, 
  X, 
  ChevronLeft, 
  MoreVertical, 
  Loader,
  AlertCircle,
  Video,
  Film,
  Camera,
  Star as StarIcon
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
  messageType?: 'text' | 'image' | 'video' | 'clip';
  isMine: boolean;
  clipData?: {
    duration?: number;
    streamer?: string;
    rating?: number;
    userRatings?: { [userId: string]: number };
    totalRatings?: number;
  };
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
  const [showClipAttach, setShowClipAttach] = useState(false);
  const [recentClips, setRecentClips] = useState<any[]>([]);
  const [selectedClip, setSelectedClip] = useState<any | null>(null);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [clipToRate, setClipToRate] = useState<Message | null>(null);
  const [currentRating, setCurrentRating] = useState(0);
  const [streamInfo, setStreamInfo] = useState<any | null>(null);
  const [streamConnected, setStreamConnected] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messageInputRef = useRef<HTMLInputElement>(null);

  // Fetch stream info and connect chat to streaming service
  useEffect(() => {
    const connectToStreamService = async () => {
      try {
        // Get stream info from the cloudflare service
        const info = await cloudflareService.getStreamInfo();
        setStreamInfo(info);
        
        // Set up connection to third-party chat service
        const streamId = info.streamKey.split('k')[1]; // Extract stream ID from key
        
        // Connect to third-party chat service
        // This would normally connect to a WebSocket or other real-time service
        // For now, we'll simulate a connection success
        setTimeout(() => {
          setStreamConnected(true);
          toast.success("Connected to live chat");
        }, 1000);
        
        console.log(`Connected to stream chat for stream ID: ${streamId}`);
      } catch (err) {
        console.error('Failed to connect to streaming service:', err);
        toast.error('Chat connection failed');
      }
    };
    
    connectToStreamService();
    
    // Clean up function
    return () => {
      // Disconnect from third-party services
      console.log('Disconnecting from stream chat service');
      setStreamConnected(false);
    };
  }, [partnerId]); // Reconnect if partner changes
  
  // Fetch recent clips for sharing
  useEffect(() => {
    // This would normally fetch from your backend
    // For now, we'll use space-themed mock data
    const fetchRecentClips = async () => {
      try {
        // Check if we're connected to stream service first
        if (!streamConnected && streamInfo) {
          toast({
            title: "Connecting to streaming service",
            description: "Please wait while we connect to the chat service..."
          });
        }
        
        // In a real implementation, you would fetch from your API
        // const response = await fetch(`/api/clips/recent?streamId=${streamInfo?.streamId}`);
        // const data = await response.json();
        
        // Space-themed mock clip data
        setRecentClips([
          {
            id: 'clip1',
            title: 'Cosmic Fleet Battle',
            thumbnailUrl: '/clips/cosmic-battle-thumb.jpg',
            duration: 45,
            streamer: 'CosmicGamer42',
            createdAt: new Date().toISOString(),
            rating: 4.8
          },
          {
            id: 'clip2',
            title: 'Stellar Nebula Discovery',
            thumbnailUrl: '/clips/stellar-discovery-thumb.jpg',
            duration: 60,
            streamer: 'NebulaQueen',
            createdAt: new Date(Date.now() - 3600000).toISOString(),
            rating: 5.0
          },
          {
            id: 'clip3',
            title: 'Galactic Core Exploration',
            thumbnailUrl: '/clips/galactic-core-thumb.jpg',
            duration: 30,
            streamer: 'AstralVoyager',
            createdAt: new Date(Date.now() - 7200000).toISOString(),
            rating: 4.2
          }
        ]);
      } catch (error) {
        console.error('Error fetching recent clips:', error);
        toast.error('Failed to load your recent clips');
      }
    };
    
    fetchRecentClips();
  }, []);

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

  // Function to handle rating clips shared in chat
  const handleRateClip = async (messageId: string, rating: number) => {
    if (!user) return;
    
    // Find the message
    const message = messages.find(m => m.id === messageId);
    if (!message) return;
    
    try {
      // Update local state first (optimistic update)
      setMessages(prev => prev.map(msg => {
        if (msg.id === messageId && msg.clipData) {
          const newUserRatings = { ...msg.clipData.userRatings, [user.id]: rating };
          const ratingValues = Object.values(newUserRatings);
          const newAvgRating = ratingValues.reduce((sum, r) => sum + r, 0) / ratingValues.length;
          
          return {
            ...msg,
            clipData: {
              ...msg.clipData,
              rating: parseFloat(newAvgRating.toFixed(1)),
              userRatings: newUserRatings,
              totalRatings: ratingValues.length
            }
          };
        }
        return msg;
      }));
      
      // In a real app, you would call your API to update the rating
      // await fetch(`/api/messages/${messageId}/rate`, {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ rating, userId: user.id })
      // });
      
      toast.success('Rating saved!');
    } catch (error) {
      console.error('Error rating clip:', error);
      toast.error('Failed to save rating');
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
                    {message.messageType === 'clip' ? (
                      <div className="clip-message">
                        <div className="flex items-center mb-2">
                          <Camera size={16} className="mr-2 text-orange-400" />
                          <span className="font-medium">Video Clip</span>
                        </div>
                        
                        <div className="bg-black bg-opacity-40 rounded-lg p-2 mb-2">
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-sm font-medium">{message.content}</span>
                            <span className="text-xs">{message.clipData?.duration}s</span>
                          </div>
                          
                          <div className="flex items-center text-xs text-gray-300">
                            <span>By {message.clipData?.streamer}</span>
                          </div>
                          
                          <div className="mt-2 flex justify-between items-center">
                            <div className="flex items-center">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                  key={star}
                                  onClick={() => message.isMine ? null : handleRateClip(message.id, star)}
                                  disabled={message.isMine || message.clipData?.userRatings?.[user?.id || '']}
                                  className={`mr-1 focus:outline-none ${message.isMine ? 'cursor-default' : 'cursor-pointer'}`}
                                >
                                  <StarIcon 
                                    size={14} 
                                    fill={star <= (message.clipData?.rating || 0) ? "#F59E0B" : "transparent"}
                                    stroke={star <= (message.clipData?.rating || 0) ? "#F59E0B" : "#9CA3AF"}
                                  />
                                </button>
                              ))}
                            </div>
                            <span className="text-xs">
                              {message.clipData?.rating?.toFixed(1) || '-'} 
                              {message.clipData?.totalRatings ? 
                                `(${message.clipData.totalRatings})` : ''}
                            </span>
                          </div>
                          
                          <div className="mt-2">
                            <button 
                              className="w-full bg-orange-600 hover:bg-orange-700 text-white text-xs py-1 px-2 rounded"
                              onClick={() => toast.success('Clip opened in player')}
                            >
                              Watch Clip
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      message.content
                    )}
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
        {selectedClip && (
          <div className="mb-2 p-2 bg-gaming-700 rounded-lg flex items-center justify-between">
            <div className="flex items-center">
              <Camera size={16} className="mr-2 text-orange-400" />
              <span className="text-sm text-white truncate">{selectedClip.title || 'Video clip'}</span>
              <span className="ml-2 text-xs text-gray-400">{selectedClip.duration}s</span>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="text-gray-400 hover:text-white"
              onClick={() => setSelectedClip(null)}
            >
              <X size={16} />
            </Button>
          </div>
        )}
        <div className="flex gap-2 items-center">
          {streamConnected && (
            <div className="absolute -top-6 left-0 right-0 flex justify-center">
              <span className="text-xs bg-green-900/70 text-green-300 px-3 py-1 rounded-t-md border-t border-l border-r border-green-700">
                <span className="inline-block h-2 w-2 rounded-full bg-green-400 mr-2 animate-pulse"></span>
                Live Chat Connected
              </span>
            </div>
          )}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="text-gray-400 hover:text-white hover:bg-gaming-700"
            onClick={() => setShowClipAttach(!showClipAttach)}
          >
            <Camera size={20} className={showClipAttach ? "text-orange-500" : ""} />
          </Button>
          
          <input
            ref={messageInputRef}
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder={selectedClip ? "Add a message (optional)..." : "Type a message..."}
            className="flex-1 bg-gaming-700 text-white rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
            disabled={sending || !user}
          />
          
          <Button
            type="submit"
            variant="ghost"
            size="icon"
            className="text-orange-500 hover:text-orange-400 hover:bg-gaming-700"
            disabled={(sending || (!newMessage.trim() && !selectedClip) || !user)}
          >
            {sending ? (
              <Loader size={20} className="animate-spin" />
            ) : (
              <Send size={20} />
            )}
          </Button>
        </div>
        
        {/* Clip Selection panel */}
        {showClipAttach && (
          <div className="mt-3 bg-gaming-900 rounded-lg p-3 border border-gaming-700">
            <h4 className="text-sm font-medium text-white mb-2 flex items-center">
              <Film size={16} className="mr-2 text-orange-400" />
              Your Recent Clips
            </h4>
            
            <div className="space-y-2 max-h-48 overflow-y-auto scrollbar-thin scrollbar-thumb-gaming-700 pr-1">
              {recentClips.length > 0 ? (
                recentClips.map(clip => (
                  <div 
                    key={clip.id} 
                    className={`p-2 rounded cursor-pointer flex items-center transition-colors ${selectedClip?.id === clip.id ? 'bg-orange-900/30 border border-orange-600/50' : 'bg-gaming-800 hover:bg-gaming-700 border border-transparent'}`}
                    onClick={() => setSelectedClip(clip)}
                  >
                    <div className="w-12 h-8 bg-black rounded flex-shrink-0 mr-3 flex items-center justify-center">
                      <Camera size={16} className="text-orange-500" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h5 className="text-sm font-medium text-white truncate">{clip.title}</h5>
                      <div className="flex items-center text-xs text-gray-400">
                        <span className="truncate">{clip.streamer}</span>
                        <span className="mx-1">•</span>
                        <span>{clip.duration}s</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center ml-2">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <StarIcon 
                          key={i} 
                          size={12} 
                          className="mr-0.5" 
                          fill={i < Math.floor(clip.rating) ? "#F59E0B" : "transparent"}
                          stroke={i < Math.floor(clip.rating) ? "#F59E0B" : "#9CA3AF"}
                        />
                      ))}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center text-gray-400 py-4">
                  <p className="mb-2">No clips available</p>
                  <Button 
                    variant="outline" 
                    className="text-xs"
                    onClick={() => toast.success('Recording new clip...')}
                  >
                    Record New Clip
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
      </form>
    </div>
  );
};

export default RealtimeChat;
