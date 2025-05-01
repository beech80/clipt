import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, MessageSquare, User, X } from 'lucide-react';
import { Trophy as TrophyIcon, DollarSign } from 'lucide-react';
import BackButton from '@/components/BackButton';

// Import the dark theme styles
import '../styles/dark-theme.css';

// Mock data for streamers
const MOCK_STREAMERS = [
  {
    id: 1,
    username: 'GamerPro99',
    game: 'Fortnite',
    title: 'Season 10 Grind - Top Player NA',
    viewers: 1243,
    avatarColor: '#8B5CF6',
    isLive: true
  },
  {
    id: 2,
    username: 'NinjaWarrior',
    game: 'Call of Duty: Warzone',
    title: 'Winning every game today! Join the squad!',
    viewers: 856,
    avatarColor: '#EC4899',
    isLive: true
  },
  {
    id: 3,
    username: 'QueenOfGames',
    game: 'League of Legends',
    title: 'Challenger rank push - Support main',
    viewers: 1892,
    avatarColor: '#10B981',
    isLive: true
  },
  {
    id: 4,
    username: 'SpeedRunner',
    game: 'Minecraft',
    title: 'Attempting new world record speedrun',
    viewers: 765,
    avatarColor: '#F59E0B',
    isLive: true
  },
  {
    id: 5,
    username: 'RetroGamerX',
    game: 'Super Mario 64',
    title: 'Classic speedruns - 70 star challenge',
    viewers: 432,
    avatarColor: '#3B82F6',
    isLive: true
  }
];

/**
 * MinimalDiscovery component
 * A dark, minimalist UI as shown in the reference image
 */
const Discovery: React.FC = () => {
  const navigate = useNavigate();
  const [showDonateModal, setShowDonateModal] = useState(false);
  const [recording, setRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(60); // Default to 60 seconds (1 minute)
  const [recordedClip, setRecordedClip] = useState<string | null>(null);
  const [streamers, setStreamers] = useState(MOCK_STREAMERS);
  const [currentStreamerIndex, setCurrentStreamerIndex] = useState(0);
  const [chatMessages, setChatMessages] = useState<Array<{username: string; message: string; color: string}>>([]);
  const [chatInput, setChatInput] = useState('');
  const chatRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const [showControls, setShowControls] = useState(true);
  const [showClipOptions, setShowClipOptions] = useState(false);
  const [showChat, setShowChat] = useState(false);
  
  // Current streamer being viewed
  const currentStreamer = streamers[currentStreamerIndex];
  
  // Navigation functions for the orange buttons
  const goToSearch = () => {
    console.log('Navigating to search page');
    navigate('/search'); // Navigate to search page for users and games
  };

  const goToLiveStreams = () => {
    console.log('Navigating to modern streaming page');
    navigate('/streaming/modern');
  };
  
  // Navigation functions for bottom bar buttons
  const goBack = () => {
    console.log('Going back');
    window.history.back();
  };
  
  const goToFollow = () => {
    console.log('Going to follow page');
    navigate('/follow');
  };
  
  const goToHome = () => {
    console.log('Going to home page');
    navigate('/');
  };
  
  // Focus the chat input field
  const focusChat = () => {
    const chatInput = document.getElementById('chat-input');
    if (chatInput) {
      chatInput.focus();
    }
  };
  
  // Opens donation popup
  const openDonate = () => {
    console.log('Opening donation popup');
    setShowDonateModal(true);
  };
  
  // Go to next streamer
  const goToNextStreamer = () => {
    const nextIndex = (currentStreamerIndex + 1) % streamers.length;
    setCurrentStreamerIndex(nextIndex);
    console.log(`Switching to streamer: ${streamers[nextIndex].username}`);
    // Clear chat when switching streamers
    setChatMessages([]);
  };
  
  // Go to previous streamer
  const goToPreviousStreamer = () => {
    const prevIndex = (currentStreamerIndex - 1 + streamers.length) % streamers.length;
    setCurrentStreamerIndex(prevIndex);
    console.log(`Switching to streamer: ${streamers[prevIndex].username}`);
    // Clear chat when switching streamers
    setChatMessages([]);
  };
  
  // Send a chat message
  const sendChatMessage = () => {
    if (chatInput.trim()) {
      const randomColor = CHAT_COLORS[Math.floor(Math.random() * CHAT_COLORS.length)];
      const newMessage = {
        username: `User${Math.floor(Math.random() * 1000)}`,
        message: chatInput.trim(),
        color: randomColor
      };
      
      setChatMessages([...chatMessages, newMessage]);
      setChatInput('');
      
      // Auto-scroll to latest message
      setTimeout(() => {
        if (chatRef.current) {
          chatRef.current.scrollTop = chatRef.current.scrollHeight;
        }
      }, 100);
    }
  };
  
  // Handle Enter key in chat input
  const handleChatKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendChatMessage();
    }
  };
  
  // Record stream for selected time
  const recordStream = () => {
    console.log(`Recording ${recordingTime} seconds of stream`);
    setRecording(true);
    
    // Simulate recording process
    setTimeout(() => {
      setRecording(false);
      setRecordedClip(`${currentStreamer.username}_clip_${Date.now()}.mp4`);
      console.log(`Recorded ${recordingTime} seconds from ${currentStreamer.username}'s stream`);
    }, 1500);
  };
  
  // Update recording time
  const setClipDuration = (seconds: number) => {
    setRecordingTime(seconds);
    console.log(`Clip duration set to ${seconds} seconds`);
  };

  // Hide controls after 5 seconds of inactivity
  useEffect(() => {
    // Initial delay to hide controls
    const timer = setTimeout(() => {
      setShowControls(false);
    }, 5000);

    // Setup event listeners for clicks/taps
    const handleUserActivity = () => {
      setShowControls(true);
      clearTimeout(timer);
      
      // Reset the timer when user interacts
      const newTimer = setTimeout(() => {
        if (!showChat && !showClipOptions) {
          setShowControls(false);
        }
      }, 5000);
      
      return () => clearTimeout(newTimer);
    };

    // Add event listeners
    document.addEventListener('click', handleUserActivity);
    document.addEventListener('touchstart', handleUserActivity);

    // Cleanup
    return () => {
      clearTimeout(timer);
      document.removeEventListener('click', handleUserActivity);
      document.removeEventListener('touchstart', handleUserActivity);
    };
  }, [showChat, showClipOptions]);
  
  // Add custom CSS for animations
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      .controls-transition {
        transition: opacity 0.3s ease, transform 0.3s ease;
      }
      
      .chat-slide-up {
        transition: transform 0.3s ease;
      }
      
      .clip-options-fade {
        transition: opacity 0.3s ease, transform 0.3s ease;
      }
      
      .orange-glow {
        box-shadow: 0 0 15px 5px rgba(249, 115, 22, 0.7);
        animation: pulse 2s infinite;
      }
      
      .cool-button {
        background: linear-gradient(45deg, #6b46c1, #3b82f6) !important;
        border: 1px solid rgba(255, 255, 255, 0.3) !important;
        box-shadow: 0 0 15px rgba(79, 70, 229, 0.5) !important;
        transition: all 0.3s ease !important;
        transform-origin: center !important;
      }
      
      .cool-button:hover {
        transform: translateY(-2px) !important;
        box-shadow: 0 0 20px rgba(79, 70, 229, 0.8) !important;
        background: linear-gradient(45deg, #7c3aed, #2563eb) !important;
      }
      
      .cool-button:active {
        transform: scale(0.98) !important;
      }
      
      .cool-text {
        background: linear-gradient(90deg, #f0f0f0, #ffffff, #f0f0f0);
        background-size: 200% auto;
        background-clip: text;
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        animation: shine 3s linear infinite;
      }
      
      @keyframes shine {
        to { background-position: 200% center; }
      }
      
      @keyframes pulse {
        0% { box-shadow: 0 0 15px 5px rgba(249, 115, 22, 0.7); }
        50% { box-shadow: 0 0 20px 8px rgba(249, 115, 22, 0.9); }
        100% { box-shadow: 0 0 15px 5px rgba(249, 115, 22, 0.7); }
      }
    `;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);
  return (
    <div className="discovery-container bg-black text-white min-h-screen overflow-hidden">
      {/* Black header with prominent orange buttons in top right */}
      <div className="discovery-header fixed top-0 left-0 right-0 z-10 bg-black">
        <div className="flex justify-between items-center px-4 py-3">
          {/* Left side with back button */}
          <div>
            <BackButton />
          </div>
          
          {/* Center text - intentionally empty */}
          <div className="text-center"></div>
          
          {/* Right side with buttons */}
          <div className="flex space-x-3 mr-1">
            {/* GoToLiveStreams button - Cool TV style */}
          <button 
            className="flex flex-col items-center justify-center text-white" 
            onClick={goToLiveStreams}
            aria-label="View Stream"
            style={{ backgroundColor: 'transparent', margin: '0 2px', padding: '8px 4px' }}
          >
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M23 7L16 12L23 17V7Z" fill="white"/>
              <rect x="1" y="5" width="15" height="14" rx="2" fill="white"/>
            </svg>
            <small className="text-white mt-1">Stream</small>
          </button>
            
            {/* Search button - search streamers */}
            <button 
              onClick={goToSearch}
              className="flex flex-col items-center justify-center cursor-pointer"
              style={{ backgroundColor: 'transparent' }}
              aria-label="Search Streamers"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="11" cy="11" r="8" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M21 21L16.65 16.65" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <small className="text-white mt-1">Search</small>
            </button>
          </div>
        </div>
      </div>
      
      {/* Empty main content area - matching the screenshot */}
      <div className="pt-16 pb-56 px-2 flex items-center justify-center h-screen" onClick={() => setShowClipOptions(false)}>
        {/* Content area is empty on purpose */}
      </div>

      {/* Clip options - appears when CLIPT button is clicked */}
      {showClipOptions && (
        <div className="fixed bottom-24 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-70 rounded-lg p-4 clip-options-fade">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-white font-bold">Clip Duration</h3>
            <button 
              onClick={() => setShowClipOptions(false)}
              className="text-gray-400 hover:text-white focus:outline-none"
            >
              <X size={18} />
            </button>
          </div>
          <div className="flex space-x-2">
            <button 
              onClick={() => {
                setClipDuration(15);
                setShowClipOptions(false);
                recordStream();
              }} 
              className={`px-3 py-2 rounded ${recordingTime === 15 ? 'bg-purple-600 text-white' : 'bg-gray-800 text-gray-200'}`}
            >
              15s
            </button>
            <button 
              onClick={() => {
                setClipDuration(30);
                setShowClipOptions(false);
                recordStream();
              }} 
              className={`px-3 py-2 rounded ${recordingTime === 30 ? 'bg-purple-600 text-white' : 'bg-gray-800 text-gray-200'}`}
            >
              30s
            </button>
            <button 
              onClick={() => {
                setClipDuration(60);
                setShowClipOptions(false);
                recordStream();
              }} 
              className={`px-3 py-2 rounded ${recordingTime === 60 ? 'bg-purple-600 text-white' : 'bg-gray-800 text-gray-200'}`}
            >
              60s
            </button>
          </div>
        </div>
      )}

      {/* Chat area - slides up from bottom when chat button is clicked */}
      <div 
        ref={chatContainerRef}
        className={`fixed bottom-0 left-0 right-0 bg-black bg-opacity-90 border-t border-gray-800 chat-slide-up z-20 ${showChat ? 'transform translate-y-0' : 'transform translate-y-full'}`}
        style={{ height: '60vh' }}
      >
        <div className="flex justify-between items-center border-b border-gray-800 p-3">
          <h3 className="text-white font-bold">Live Chat</h3>
          <button 
            onClick={() => setShowChat(false)}
            className="text-gray-400 hover:text-white focus:outline-none"
          >
            <X size={18} />
          </button>
        </div>
        
        {/* Chat messages */}
        <div className="h-[calc(60vh-110px)] overflow-y-auto p-3" ref={chatRef}>
          {chatMessages.length > 0 ? (
            <div className="space-y-3">
              {chatMessages.map((msg, index) => (
                <div key={index} className="flex items-start">
                  <div className="h-8 w-8 rounded-full flex-shrink-0 mr-2" style={{ backgroundColor: msg.color }}></div>
                  <div>
                    <span className="text-sm font-semibold" style={{ color: msg.color }}>{msg.username}: </span>
                    <span className="text-white text-sm">{msg.message}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-gray-500 py-4 text-sm">
              Chat is empty. Be the first to say something!
            </div>
          )}
        </div>
        
        {/* Chat input */}
        <div className="flex border-t border-gray-800 p-3">
          <input
            id="chat-input"
            type="text"
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            onKeyDown={handleChatKeyDown}
            placeholder="Type your message..."
            className="flex-1 bg-gray-800 text-white rounded-l px-3 py-2 focus:outline-none"
          />
          <button 
            onClick={sendChatMessage}
            className="bg-purple-600 text-white px-4 py-2 rounded-r hover:bg-purple-700"
          >
            Send
          </button>
        </div>
      </div>

      {/* Bottom Navigation Bar - no background, auto-hides */}
      <div 
        className={`fixed bottom-0 left-0 right-0 flex justify-between items-center py-2 controls-transition z-10 ${showChat ? 'hidden' : showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
      >
        {/* Left arrow - previous streamer */}
        <button 
          className="flex flex-col items-center justify-center text-white px-2" 
          onClick={goToPreviousStreamer}
          style={{ backgroundColor: 'transparent', margin: '0 2px', padding: '8px 4px' }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M15 18L9 12L15 6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <small>Previous</small>
        </button>

        {/* Follow button */}
        <button 
          className="flex flex-col items-center justify-center text-white px-2" 
          onClick={goToFollow}
          style={{ backgroundColor: 'transparent', margin: '0 2px', padding: '8px 4px' }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <circle cx="9" cy="7" r="4" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M19 8v6m3-3h-6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <small>Follow</small>
        </button>

        {/* Center CLIPT button - shows clip duration options */}
        <div className="flex justify-center items-center relative -top-5">
          <button 
            className="flex items-center justify-center h-16 w-16"  
            style={{ 
              backgroundColor: 'transparent',
              position: 'relative'
            }}
            aria-label="CLIPT Button - Show clip options"
            onClick={() => setShowClipOptions(true)}
            disabled={recording}
          >
            {recording && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="animate-ping absolute h-8 w-8 rounded-full bg-red-500 opacity-75"></div>
                <div className="relative h-4 w-4 rounded-full bg-red-600"></div>
              </div>
            )}
            {/* Scissors icon for CLIPT */}
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M6 9C7.65685 9 9 7.65685 9 6C9 4.34315 7.65685 3 6 3C4.34315 3 3 4.34315 3 6C3 7.65685 4.34315 9 6 9Z" fill="white"/>
              <path d="M6 21C7.65685 21 9 19.6569 9 18C9 16.3431 7.65685 15 6 15C4.34315 15 3 16.3431 3 18C3 19.6569 4.34315 21 6 21Z" fill="white"/>
              <path d="M20 4L8.12 15.88M14.47 14.48L20 20M8.12 8.12L12 12" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <small className="absolute -bottom-5 text-white font-bold">CLIPT</small>
        </div>

        {/* Chat message button - open chat window */}
        <button 
          className="flex flex-col items-center justify-center text-white px-2" 
          onClick={() => setShowChat(true)}
          style={{ backgroundColor: 'transparent', margin: '0 2px', padding: '8px 4px' }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M21 15C21 15.5304 20.7893 16.0391 20.4142 16.4142C20.0391 16.7893 19.5304 17 19 17H7L3 21V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H19C19.5304 3 20.0391 3.21071 20.4142 3.58579C20.7893 3.96086 21 4.46957 21 5V15Z" fill="white"/>
          </svg>
          <small>Chat</small>
        </button>
        
        {/* Donate/Dollar sign - opens donation popup */}
        <button 
          className="flex flex-col items-center justify-center text-white px-2" 
          onClick={openDonate}
          style={{ backgroundColor: 'transparent', margin: '0 2px', padding: '8px 4px' }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2V22M17 5H9.5C8.57174 5 7.6815 5.36875 7.02513 6.02513C6.36875 6.6815 6 7.57174 6 8.5C6 9.42826 6.36875 10.3185 7.02513 10.9749C7.6815 11.6313 8.57174 12 9.5 12H14.5C15.4283 12 16.3185 12.3687 16.9749 13.0251C17.6313 13.6815 18 14.5717 18 15.5C18 16.4283 17.6313 17.3185 16.9749 17.9749C16.3185 18.6313 15.4283 19 14.5 19H6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <small>Donate</small>
        </button>
        
        {/* Right arrow - next streamer */}
        <button 
          className="flex flex-col items-center justify-center text-white px-2" 
          onClick={goToNextStreamer}
          style={{ backgroundColor: 'transparent', margin: '0 2px', padding: '8px 4px' }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M9 6L15 12L9 18" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <small>Next</small>
        </button>
      </div>
      
      {/* Removed chat modal as it's now integrated at the bottom */}
      
      {/* Donation Modal */}
      {showDonateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50">
          <div className="bg-gray-900 border border-yellow-500 rounded-lg p-4 max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-white">Support the Streamer</h2>
              <button 
                onClick={() => setShowDonateModal(false)}
                className="text-white hover:text-gray-300"
              >
                ✕
              </button>
            </div>
            <div className="space-y-4">
              <div className="flex justify-center">
                <div className="h-20 w-20 rounded-full bg-gradient-to-r from-yellow-400 to-yellow-600 flex items-center justify-center">
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 2V22M17 5H9.5C8.57174 5 7.6815 5.36875 7.02513 6.02513C6.36875 6.6815 6 7.57174 6 8.5C6 9.42826 6.36875 10.3185 7.02513 10.9749C7.6815 11.6313 8.57174 12 9.5 12H14.5C15.4283 12 16.3185 12.3687 16.9749 13.0251C17.6313 13.6815 18 14.5717 18 15.5C18 16.4283 17.6313 17.3185 16.9749 17.9749C16.3185 18.6313 15.4283 19 14.5 19H6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <button className="bg-gray-800 hover:bg-gray-700 text-white rounded p-2 flex flex-col items-center">
                  <span className="text-yellow-400 font-bold">$5</span>
                  <span className="text-xs">High Five</span>
                </button>
                <button className="bg-gray-800 hover:bg-gray-700 text-white rounded p-2 flex flex-col items-center">
                  <span className="text-yellow-400 font-bold">$10</span>
                  <span className="text-xs">Thanks!</span>
                </button>
                <button className="bg-gray-800 hover:bg-gray-700 text-white rounded p-2 flex flex-col items-center">
                  <span className="text-yellow-400 font-bold">$20</span>
                  <span className="text-xs">Awesome</span>
                </button>
                <button className="bg-gray-800 hover:bg-gray-700 text-white rounded p-2 flex flex-col items-center">
                  <span className="text-yellow-400 font-bold">$50</span>
                  <span className="text-xs">Super Fan</span>
                </button>
                <button className="bg-gray-800 hover:bg-gray-700 text-white rounded p-2 flex flex-col items-center">
                  <span className="text-yellow-400 font-bold">$100</span>
                  <span className="text-xs">Legend</span>
                </button>
                <button className="bg-gray-800 hover:bg-gray-700 text-white rounded p-2 flex flex-col items-center">
                  <span className="text-yellow-400">Custom</span>
                </button>
              </div>
              <div>
                <label className="block text-gray-400 mb-1 text-sm">Message (optional)</label>
                <textarea className="w-full rounded px-3 py-2 bg-gray-800 text-white border-0 focus:outline-none h-20" placeholder="Add a message to your donation"></textarea>
              </div>
              <button className="w-full bg-yellow-600 hover:bg-yellow-700 text-white font-bold py-2 px-4 rounded">
                Send Donation
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Recorded Clip Notification */}
      {recordedClip && (
        <div className="fixed bottom-20 right-4 bg-gray-900 border border-purple-500 rounded-lg p-4 shadow-lg">
          <div className="flex items-center space-x-3">
            <div className="bg-purple-600 rounded-full p-2">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M6 9C7.65685 9 9 7.65685 9 6C9 4.34315 7.65685 3 6 3C4.34315 3 3 4.34315 3 6C3 7.65685 4.34315 9 6 9Z" fill="white"/>
                <path d="M6 21C7.65685 21 9 19.6569 9 18C9 16.3431 7.65685 15 6 15C4.34315 15 3 16.3431 3 18C3 19.6569 4.34315 21 6 21Z" fill="white"/>
                <path d="M20 4L8.12 15.88M14.47 14.48L20 20M8.12 8.12L12 12" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div>
              <p className="text-white font-semibold">Clip Recorded!</p>
              <p className="text-gray-400 text-sm">{recordedClip}</p>
            </div>
            <button 
              onClick={() => setRecordedClip(null)}
              className="text-gray-400 hover:text-white"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Discovery;
