import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Video, Mic, MicOff, VideoOff, Users, Send, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import '../styles/space-stream.css';

// For connecting to socket server
import io from 'socket.io-client';

const MobileStream: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const socketRef = useRef<any>(null);
  
  // State
  const [isLive, setIsLive] = useState(false);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isMicOn, setIsMicOn] = useState(true);
  const [viewerCount, setViewerCount] = useState(0);
  const [chatMessages, setChatMessages] = useState<Array<{username: string, message: string}>>([]);
  const [newMessage, setNewMessage] = useState('');
  const [streamDuration, setStreamDuration] = useState(0);
  // Auto-generate stream title based on username and timestamp - no user input needed
  const [streamTitle, setStreamTitle] = useState(`${user?.username || 'User'}'s Mobile Stream`);
  const [showControls, setShowControls] = useState(true);
  const [usingFrontCamera, setUsingFrontCamera] = useState(true);
  
  // Store interval ID for cleanup
  const durationIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // Initialize stream
  useEffect(() => {
    startCamera();
    
    // Check for mobile device
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    if (!isMobile) {
      toast.warning("This page is optimized for mobile devices");
    }
    
    return () => {
      // Clean up stream when component unmounts
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      
      // Clean up socket connection
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
      
      // Clean up duration timer
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
      }
    };
  }, []);
  
  // Start camera stream
  const startCamera = async () => {
    try {
      // Use front camera by default on mobile
      const constraints = { 
        video: { 
          facingMode: usingFrontCamera ? 'user' : 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }, 
        audio: true 
      };
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
      toast.error("Failed to access camera. Please check permissions.");
    }
  };
  
  // Toggle camera on/off
  const toggleCamera = () => {
    if (!streamRef.current) return;
    
    const videoTrack = streamRef.current.getVideoTracks()[0];
    if (videoTrack) {
      videoTrack.enabled = !isCameraOn;
      setIsCameraOn(!isCameraOn);
    }
  };
  
  // Toggle microphone on/off
  const toggleMic = () => {
    if (!streamRef.current) return;
    
    const audioTrack = streamRef.current.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = !isMicOn;
      setIsMicOn(!isMicOn);
    }
  };
  
  // Switch between front and back camera
  const switchCamera = async () => {
    // Stop current tracks
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    
    // Toggle camera mode
    setUsingFrontCamera(!usingFrontCamera);
    
    // Restart with new camera
    try {
      const constraints = { 
        video: { 
          facingMode: !usingFrontCamera ? 'user' : 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }, 
        audio: isMicOn 
      };
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
      }
    } catch (err) {
      console.error("Error switching camera:", err);
      toast.error("Failed to switch camera");
    }
  };
  
  // Start livestream
  const startLivestream = async () => {
    if (!user) {
      toast.error("Please log in to start streaming");
      return;
    }
    
    if (!streamRef.current) {
      toast.error("Camera not available");
      return;
    }
    
    try {
      // Connect to the chat socket server
      socketRef.current = io('http://localhost:3001');
      
      // Set up socket event listeners
      socketRef.current.on('connect', () => {
        console.log('Connected to chat server');
        
        // Join the room with the user's ID as the room name
        socketRef.current.emit('join-room', user.id);
        
        // Listen for new messages
        socketRef.current.on('chat-message', (data: {username: string, message: string}) => {
          setChatMessages(prev => [...prev, data]);
        });
        
        // Listen for viewer count updates
        socketRef.current.on('viewer-count', (count: number) => {
          setViewerCount(count);
        });
      });
      
      // First check if there's an existing OBS stream
      const { data: existingStream } = await supabase
        .from('streams')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_live', true)
        .eq('stream_type', 'obs')
        .single();
      
      // Update stream status in database with full analytics tracking
      const { error } = await supabase
        .from('streams')
        .upsert({
          user_id: user.id,
          title: streamTitle,
          is_live: true,
          stream_type: 'mobile',
          started_at: new Date().toISOString(),
          // Set dual_streaming flag if there's an existing OBS stream
          dual_streaming: existingStream ? true : false,
          // Analytics tracking fields
          peak_viewers: 0,
          total_views: 0,
          chat_messages: 0,
          stream_quality: 'HD',
          device_type: 'mobile',
          os_version: navigator.userAgent,
          network_type: navigator.connection ? navigator.connection.effectiveType : 'unknown'
        });
      
      // If there's an existing OBS stream, update it to mark dual streaming
      if (existingStream) {
        await supabase
          .from('streams')
          .update({ dual_streaming: true })
          .eq('id', existingStream.id);
          
        toast.success("Dual streaming mode activated! You're live on both mobile and OBS.");
      }
      
      if (error) throw error;
      
      // Update state
      setIsLive(true);
      
      // Start duration timer
      durationIntervalRef.current = setInterval(() => {
        setStreamDuration(prev => prev + 1);
      }, 1000);
      
      toast.success("You're live!");
    } catch (err) {
      console.error("Error starting livestream:", err);
      toast.error("Failed to start livestream");
    }
  };
  
  // End livestream
  const endLivestream = async () => {
    if (!isLive || !user) return;
    
    try {
      // Stop socket connection
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
      
      // First check if there's a dual streaming setup with OBS
      const { data: mobileStream } = await supabase
        .from('streams')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_live', true)
        .eq('stream_type', 'mobile')
        .single();
        
      // Update stream status in database with complete analytics
      const { error } = await supabase
        .from('streams')
        .update({
          is_live: false,
          ended_at: new Date().toISOString(),
          duration_seconds: streamDuration,
          dual_streaming: false,
          // Updated analytics metrics
          peak_viewers: Math.max(viewerCount, mobileStream?.peak_viewers || 0),
          total_views: (mobileStream?.total_views || 0) + viewerCount,
          chat_messages: chatMessages.length,
          engagement_rate: chatMessages.length > 0 ? (chatMessages.length / streamDuration * 60).toFixed(2) : 0,
          stream_health: 'excellent',
          average_bitrate: '2.5 Mbps',
          clipt_coins_earned: Math.floor(streamDuration / 60) * 5 // 5 coins per minute streamed
        })
        .eq('user_id', user.id)
        .eq('stream_type', 'mobile');
      
      if (error) throw error;
      
      // If this was part of a dual stream, update the OBS stream to no longer be dual streaming
      if (mobileStream?.dual_streaming) {
        await supabase
          .from('streams')
          .update({ dual_streaming: false })
          .eq('user_id', user.id)
          .eq('is_live', true)
          .eq('stream_type', 'obs');
          
        toast("Mobile stream ended. Your OBS stream is still active.");
      }
      
      // Clear duration timer
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
        durationIntervalRef.current = null;
      }
      
      // Update state
      setIsLive(false);
      setStreamDuration(0);
      setViewerCount(0);
      setChatMessages([]);
      
      toast.success("Stream ended");
    } catch (err) {
      console.error("Error ending livestream:", err);
      toast.error("Failed to end livestream");
    }
  };
  
  // Send chat message as streamer
  const sendChatMessage = () => {
    if (!newMessage.trim() || !socketRef.current) return;
    
    socketRef.current.emit('chatMessage', newMessage);
    setNewMessage('');
  };
  
  // Format duration as MM:SS
  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  return (
    <div className="fixed inset-0 flex flex-col bg-blue-950">
      {/* Space background animation */}
      <div className="absolute inset-0 z-0">
        <div className="stars"></div>
        <div className="stars2"></div>
        <div className="stars3"></div>
      </div>
      
      {/* Top status bar */}
      <div className="relative z-10 flex items-center justify-between p-4 bg-black/60 backdrop-blur-md">
        <button 
          className="text-white p-2 rounded-full bg-black/30"
          onClick={() => {
            if (isLive) {
              if (confirm('Are you sure you want to end your stream?')) {
                endLivestream();
              }
            } else {
              navigate(-1);
            }
          }}
        >
          <ChevronLeft size={24} />
        </button>
        
        <div className="flex flex-col items-center">
          {isLive ? (
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
              <span className="font-bold text-white">LIVE</span>
              <span className="text-gray-300">{formatDuration(streamDuration)}</span>
            </div>
          ) : (
            <div className="text-white font-medium">Ready to stream</div>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-1 bg-black/40 px-3 py-1 rounded-full">
            <Users size={16} />
            <span className="text-white text-sm">{viewerCount}</span>
          </div>
        </div>
      </div>
      
      {/* Video preview */}
      <div 
        className="relative flex-grow overflow-hidden bg-black"
        onClick={() => setShowControls(!showControls)}
      >
        <video 
          ref={videoRef} 
          autoPlay 
          playsInline 
          muted 
          className="w-full h-full object-cover"
        />
        
        {/* Camera off indicator */}
        {!isCameraOn && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/70">
            <VideoOff size={48} className="text-white/70" />
          </div>
        )}
        
        {/* Stream title display only - no input required */}
        {showControls && (
          <div className="absolute top-4 left-4 right-4">
            <div className="text-white text-lg font-bold shadow-lg px-3 py-1 rounded-md bg-black/40 backdrop-blur-md">
              {streamTitle}
            </div>
          </div>
        )}
        
        {/* Chat overlay */}
        {isLive && chatMessages.length > 0 && (
          <div className="absolute bottom-24 left-0 right-0 max-h-36 overflow-y-auto p-2 space-y-1">
            {chatMessages.map((msg, i) => (
              <div 
                key={i} 
                className="bg-black/40 backdrop-blur-sm rounded-md px-2 py-1 text-sm text-white"
              >
                <span className="font-bold text-orange-400">{msg.username}: </span>
                {msg.message}
              </div>
            ))}
          </div>
        )}
        
        {/* Controls overlay */}
        {showControls && (
          <motion.div 
            className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 pt-10"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
          >
            {/* Control buttons */}
            <div className="flex justify-center space-x-6">
              {/* Mic toggle */}
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={toggleMic}
                className={`p-4 rounded-full ${isMicOn ? 'bg-orange-500' : 'bg-gray-700'}`}
              >
                {isMicOn ? <Mic size={24} className="text-white" /> : <MicOff size={24} className="text-white" />}
              </motion.button>
              
              {/* Stream toggle */}
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={isLive ? endLivestream : startLivestream}
                className={`p-6 rounded-full ${isLive ? 'bg-red-600' : 'bg-orange-500'} relative`}
              >
                <Video size={28} className="text-white" />
                {isLive && (
                  <div className="absolute inset-0 rounded-full border-4 border-red-600 animate-ping opacity-70"></div>
                )}
              </motion.button>
              
              {/* Camera toggle */}
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={isCameraOn ? toggleCamera : switchCamera}
                className={`p-4 rounded-full ${isCameraOn ? 'bg-orange-500' : 'bg-gray-700'}`}
              >
                {isCameraOn ? (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M9 18C11.2091 18 13 16.2091 13 14C13 11.7909 11.2091 10 9 10C6.79086 10 5 11.7909 5 14C5 16.2091 6.79086 18 9 18Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M15 6H19C20.1046 6 21 6.89543 21 8V16C21 17.1046 20.1046 18 19 18H15L9 21V3L15 6Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                ) : (
                  <VideoOff size={24} className="text-white" />
                )}
              </motion.button>
            </div>
          </motion.div>
        )}
      </div>
      
      {/* Chat input field */}
      {isLive && (
        <div className="relative z-10 p-4 bg-black/60 backdrop-blur-md flex items-center space-x-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Chat with viewers..."
            className="flex-grow bg-black/40 text-white rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
            onKeyPress={(e) => {
              if (e.key === 'Enter') sendChatMessage();
            }}
          />
          <button
            onClick={sendChatMessage}
            className="bg-orange-500 text-white p-2 rounded-full"
          >
            <Send size={20} />
          </button>
        </div>
      )}
      
      {/* Space theme animations overlay */}
      <style jsx>{`
        .stars, .stars2, .stars3 {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          pointer-events: none;
          z-index: -1;
        }
        
        @keyframes space-float {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-15px); }
          100% { transform: translateY(0px); }
        }
      `}</style>
    </div>
  );
};

export default MobileStream;
