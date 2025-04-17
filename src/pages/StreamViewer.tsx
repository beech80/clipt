import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, Heart, Share2, Users, MessageSquare, 
  Volume2, VolumeX, Maximize, Settings, Sparkles,
  ChevronDown, ChevronUp, Zap, Send, Smile, Gift,
  MoreHorizontal, Play, Pause, RefreshCw, X
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import RealtimeChat from '@/components/messages/RealtimeChat';
import { useAuth } from '@/contexts/AuthContext';
import '../styles/stream-viewer.css';

interface ChatMessage {
  id: string;
  userId: string;
  username: string;
  avatar: string;
  content: string;
  timestamp: Date;
  isHighlighted?: boolean;
}

interface StreamInfo {
  id: string;
  title: string;
  thumbnailUrl: string;
  viewerCount: number;
  streamerInfo: {
    id: string;
    username: string;
    displayName: string;
    avatarUrl: string;
    followers: number;
  };
  game?: string;
  tags?: string[];
}

const mockChatMessages: ChatMessage[] = [
  {
    id: '1',
    userId: 'user1',
    username: 'GamerPro99',
    avatar: 'https://api.dicebear.com/7.x/personas/svg?seed=GamerPro99',
    content: 'That was an amazing play! 🔥',
    timestamp: new Date(Date.now() - 15000),
  },
  {
    id: '2',
    userId: 'user2',
    username: 'StreamBeast',
    avatar: 'https://api.dicebear.com/7.x/personas/svg?seed=StreamBeast',
    content: 'How did you manage to pull that off??',
    timestamp: new Date(Date.now() - 30000),
  },
  {
    id: '3',
    userId: 'user3',
    username: 'EliteSniper',
    avatar: 'https://api.dicebear.com/7.x/personas/svg?seed=EliteSniper',
    content: 'I would have died there for sure',
    timestamp: new Date(Date.now() - 45000),
  },
  {
    id: '4',
    userId: 'user4',
    username: 'MidnightGamer',
    avatar: 'https://api.dicebear.com/7.x/personas/svg?seed=MidnightGamer',
    content: 'Can we get a tutorial on that move? 🙏',
    timestamp: new Date(Date.now() - 60000),
    isHighlighted: true,
  },
];

const StreamViewer: React.FC = () => {
  const { streamerId } = useParams<{ streamerId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const videoRef = useRef<HTMLVideoElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(80);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showChat, setShowChat] = useState(true);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(mockChatMessages);
  const [newMessage, setNewMessage] = useState('');
  const [isLiked, setIsLiked] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [streamInfo, setStreamInfo] = useState<StreamInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [streamQuality, setStreamQuality] = useState('1080p');
  const [availableQualities, setAvailableQualities] = useState(['1080p', '720p', '480p', '360p']);
  const [isBuffering, setIsBuffering] = useState(false);

  // Simulated stream data
  useEffect(() => {
    const fetchStreamData = async () => {
      // In a real app, we would fetch this data from the API
      setTimeout(() => {
        setStreamInfo({
          id: 'stream123',
          title: 'Epic Gaming Session | Late Night Ranked Matches',
          thumbnailUrl: 'https://placehold.co/1920x1080/300a24/FF4C4C?text=LIVE+STREAM',
          viewerCount: 1284,
          streamerInfo: {
            id: streamerId || 'streamer123',
            username: 'pro_gamer_x',
            displayName: 'Pro Gamer X',
            avatarUrl: 'https://api.dicebear.com/7.x/personas/svg?seed=pro_gamer_x',
            followers: 24600,
          },
          game: 'Cyberspace 2077',
          tags: ['FPS', 'Competitive', 'Ranked', 'Commentary'],
        });
        setIsLoading(false);
      }, 1000);
    };

    fetchStreamData();
  }, [streamerId]);

  // Auto-scroll chat to bottom
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatMessages]);

  // Handle video playback
  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  // Handle volume change
  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    setVolume(value);
    if (videoRef.current) {
      videoRef.current.volume = value / 100;
    }
    if (value === 0) {
      setIsMuted(true);
    } else {
      setIsMuted(false);
    }
  };

  // Toggle mute
  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  // Toggle fullscreen
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
        setIsFullscreen(false);
      }
    }
  };

  // Send a chat message
  const sendChatMessage = () => {
    if (!newMessage.trim()) return;

    const newChatMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      userId: user?.id || 'guest',
      username: user?.user_metadata?.full_name || 'Guest User',
      avatar: user?.user_metadata?.avatar_url || `https://api.dicebear.com/7.x/personas/svg?seed=${Date.now()}`,
      content: newMessage,
      timestamp: new Date(),
    };

    setChatMessages([...chatMessages, newChatMessage]);
    setNewMessage('');
  };

  // Toggle like
  const toggleLike = () => {
    setIsLiked(!isLiked);
    toast.success(isLiked ? 'Removed from liked streams' : 'Added to liked streams');
  };

  // Toggle follow
  const toggleFollow = () => {
    setIsFollowing(!isFollowing);
    toast.success(isFollowing ? 'Unfollowed streamer' : 'Now following streamer');
  };

  // Handle quality change
  const changeQuality = (quality: string) => {
    setStreamQuality(quality);
    setShowSettings(false);

    // Simulate buffering when changing quality
    setIsBuffering(true);
    setTimeout(() => {
      setIsBuffering(false);
    }, 1500);
  };

  if (isLoading) {
    return (
      <div className="stream-viewer-loading bg-gaming-950 text-white min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="loading-spinner mb-4"></div>
          <h2 className="text-xl font-bold mb-2">Loading Stream</h2>
          <p className="text-gray-400">Connecting to the live stream...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="stream-viewer-container bg-gaming-950 text-white min-h-screen flex flex-col">
      {/* Cyber grid background */}
      <div className="cyber-grid-background"></div>
      
      {/* Header with navigation */}
      <header className="stream-header px-4 py-3 relative z-10 backdrop-blur-sm bg-black/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => navigate(-1)}
              className="mr-2 hover:bg-purple-900/20"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="font-bold text-xl truncate max-w-[200px] sm:max-w-[300px] md:max-w-none">
              {streamInfo?.streamerInfo.displayName}
            </h1>
            {isFollowing ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleFollow}
                className="ml-2 bg-purple-600 hover:bg-purple-700 text-white text-xs"
              >
                Following
              </Button>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleFollow}
                className="ml-2 bg-purple-900/50 hover:bg-purple-600 text-white text-xs border border-purple-700"
              >
                Follow
              </Button>
            )}
          </div>
          <div className="flex items-center">
            <div className="mr-3 flex items-center text-sm">
              <Users className="h-4 w-4 mr-1 text-red-400" />
              <span className="live-count">{streamInfo?.viewerCount.toLocaleString()}</span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowChat(!showChat)}
              className={`mr-2 ${showChat ? 'text-cyan-400' : 'text-gray-500'}`}
            >
              <MessageSquare className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main content area with video and chat */}
      <div className="stream-content-area flex flex-1 relative overflow-hidden">
        {/* Video player section */}
        <div className={`video-section relative ${showChat ? 'w-full md:w-3/4' : 'w-full'} h-full transition-all`}>
          {/* Video element */}
          <div className="video-container relative w-full aspect-video bg-black">
            {/* Use image as placeholder, in a real app this would be a video stream */}
            <img 
              src={streamInfo?.thumbnailUrl || 'https://placehold.co/1920x1080/300a24/FF4C4C?text=LIVE+STREAM'}
              alt="Live Stream"
              className="w-full h-full object-cover"
            />
            
            {/* Video overlay for controls */}
            <div className="video-overlay absolute inset-0 flex flex-col justify-between p-4 opacity-0 hover:opacity-100 transition-opacity">
              {/* Top controls */}
              <div className="top-controls flex justify-between">
                <div className="flex items-center">
                  <span className="bg-red-600 text-white text-xs px-2 py-0.5 rounded-sm mr-2 animate-pulse flex items-center">
                    <span className="live-dot mr-1"></span>
                    LIVE
                  </span>
                  {streamInfo?.game && (
                    <span className="bg-purple-700/80 text-white text-xs px-2 py-0.5 rounded-sm">
                      {streamInfo.game}
                    </span>
                  )}
                </div>
                <div className="quality-indicator text-xs bg-black/60 px-2 py-0.5 rounded-sm">
                  {streamQuality}
                </div>
              </div>
              
              {/* Center play/pause button */}
              <div className="center-controls flex justify-center items-center">
                {isBuffering ? (
                  <div className="buffering-indicator">
                    <RefreshCw className="h-10 w-10 animate-spin text-white/80" />
                    <span className="text-sm mt-2">Buffering...</span>
                  </div>
                ) : (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={togglePlay}
                    className="w-16 h-16 rounded-full bg-black/50 hover:bg-purple-700/80 transition-all"
                  >
                    {isPlaying ? (
                      <Pause className="h-8 w-8" />
                    ) : (
                      <Play className="h-8 w-8" />
                    )}
                  </Button>
                )}
              </div>
              
              {/* Bottom controls */}
              <div className="bottom-controls flex items-center justify-between">
                <div className="flex items-center">
                  <Button variant="ghost" size="icon" onClick={toggleMute} className="mr-2">
                    {isMuted ? (
                      <VolumeX className="h-5 w-5" />
                    ) : (
                      <Volume2 className="h-5 w-5" />
                    )}
                  </Button>
                  <div className="volume-slider w-20 hidden sm:block">
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={volume}
                      onChange={handleVolumeChange}
                      className="w-full accent-purple-500"
                    />
                  </div>
                </div>
                <div className="flex items-center">
                  <div className="relative">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setShowSettings(!showSettings)}
                      className="mr-2"
                    >
                      <Settings className="h-5 w-5" />
                    </Button>
                    {showSettings && (
                      <div className="settings-menu absolute bottom-full right-0 mb-2 bg-black/90 rounded-md p-2 w-40">
                        <div className="mb-2 pb-2 border-b border-gray-800">
                          <p className="text-xs text-gray-400 mb-1">Quality</p>
                          {availableQualities.map((quality) => (
                            <Button
                              key={quality}
                              variant="ghost"
                              size="sm"
                              onClick={() => changeQuality(quality)}
                              className={`w-full justify-start text-left text-sm mb-1 ${
                                streamQuality === quality ? 'bg-purple-900/50' : ''
                              }`}
                            >
                              {quality}
                            </Button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  <Button variant="ghost" size="icon" onClick={toggleFullscreen}>
                    <Maximize className="h-5 w-5" />
                  </Button>
                </div>
              </div>
            </div>
            
            {/* Buffering overlay */}
            {isBuffering && (
              <div className="buffering-overlay absolute inset-0 flex items-center justify-center bg-black/50">
                <div className="text-center">
                  <RefreshCw className="h-12 w-12 animate-spin mx-auto mb-2" />
                  <p>Loading {streamQuality} quality...</p>
                </div>
              </div>
            )}
          </div>

          {/* Stream info section */}
          <div className="stream-info p-4 bg-gaming-900/80 backdrop-blur-sm">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h2 className="text-xl font-bold mb-1">{streamInfo?.title}</h2>
                <div className="flex items-center text-sm text-gray-300 mb-2">
                  <Avatar className="h-8 w-8 mr-2 ring-2 ring-purple-600">
                    <AvatarImage src={streamInfo?.streamerInfo.avatarUrl} alt={streamInfo?.streamerInfo.displayName} />
                    <AvatarFallback>{streamInfo?.streamerInfo.displayName.substring(0, 2)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{streamInfo?.streamerInfo.displayName}</p>
                    <p className="text-xs">{streamInfo?.streamerInfo.followers.toLocaleString()} followers</p>
                  </div>
                </div>
                {streamInfo?.tags && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {streamInfo.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="bg-gaming-800 text-gray-300 text-xs px-2 py-0.5 rounded-full border border-gaming-700"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex space-x-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleLike}
                  className={`${isLiked ? 'text-red-500' : 'text-gray-400'}`}
                >
                  <Heart className={`h-5 w-5 ${isLiked ? 'fill-red-500' : ''}`} />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-gray-400 hover:text-cyan-400"
                >
                  <Share2 className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Chat section */}
        <AnimatePresence>
          {showChat && (
            <motion.div
              className="chat-section bg-gaming-900/80 backdrop-blur-sm border-l border-purple-900/50 w-full md:w-1/4 flex flex-col"
              initial={{ x: '100%', opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: '100%', opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <div className="chat-header p-3 border-b border-purple-900/50 flex items-center justify-between">
                <h3 className="font-medium">Live Chat</h3>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => setShowChat(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {/* Chat messages */}
              <div
                ref={chatContainerRef}
                className="chat-messages flex-1 overflow-y-auto p-3 space-y-3"
              >
                {chatMessages.map((message) => (
                  <div
                    key={message.id}
                    className={`chat-message ${message.isHighlighted ? 'bg-purple-900/30 border border-purple-600/50 p-2 rounded-md' : ''}`}
                  >
                    <div className="flex items-start">
                      <Avatar className="h-6 w-6 mr-2">
                        <AvatarImage src={message.avatar} alt={message.username} />
                        <AvatarFallback>{message.username.substring(0, 2)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-baseline">
                          <span className="font-medium text-sm mr-2 text-cyan-400">{message.username}</span>
                          <span className="text-xs text-gray-500">
                            {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-sm break-words">{message.content}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Chat input */}
              <div className="chat-input p-3 border-t border-purple-900/50">
                <div className="flex">
                  <Input
                    type="text"
                    placeholder="Send a message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && sendChatMessage()}
                    className="flex-1 bg-gaming-800 border-gray-700 focus-visible:ring-purple-500"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={sendChatMessage}
                    className="ml-2 bg-purple-700 hover:bg-purple-600"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex justify-between mt-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs text-gray-400 hover:text-white"
                  >
                    <Smile className="h-4 w-4 mr-1" />
                    <span className="hidden sm:inline">Emotes</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs text-gray-400 hover:text-white"
                  >
                    <Gift className="h-4 w-4 mr-1" />
                    <span className="hidden sm:inline">Gift Sub</span>
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Neon glow effects */}
      <div className="neon-corner-tl"></div>
      <div className="neon-corner-br"></div>
    </div>
  );
};

export default StreamViewer;
