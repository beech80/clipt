import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, MessageCircle, ChevronLeft, ChevronRight, DollarSign, UserPlus, Scissors } from 'lucide-react';
import { toast } from 'sonner';
import '../styles/gameboy-controller.css';
import '../styles/remove-rainbow-buttons.css';
import NavigationBar from '@/components/NavigationBar';

const DiscoveryBasic = () => {
  const navigate = useNavigate();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showChat, setShowChat] = useState(false);
  
  // Sample streamers with mock data
  const streamers = [
    {
      id: '1',
      name: 'ProGamer123',
      game: 'Fortnite',
      viewers: 5420,
      avatar: 'https://randomuser.me/api/portraits/men/32.jpg',
      videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-gamer-playing-in-a-dark-gaming-setup-44592-large.mp4'
    },
    {
      id: '2',
      name: 'StreamQueen',
      game: 'Valorant',
      viewers: 3250,
      avatar: 'https://randomuser.me/api/portraits/women/44.jpg',
      videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-typing-on-neon-keyboard-close-up-42766-large.mp4'
    },
    {
      id: '3',
      name: 'GameMaster99',
      game: 'League of Legends',
      viewers: 2870,
      avatar: 'https://randomuser.me/api/portraits/men/22.jpg',
      videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-hand-playing-video-game-with-controller-44592-large.mp4'
    }
  ];

  const currentStreamer = streamers[currentIndex];

  // Navigation handlers
  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % streamers.length);
    setShowChat(false);
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + streamers.length) % streamers.length);
    setShowChat(false);
  };

  return (
    <div className="discovery-container">
      {/* Video Player */}
      <div className="video-container">
        <video
          src={currentStreamer.videoUrl}
          className="streamer-video"
          autoPlay
          loop
          muted
          playsInline
        />
        
        {/* Streamer Info */}
        <div className="streamer-info">
          <img 
            src={currentStreamer.avatar} 
            alt={currentStreamer.name} 
            className="streamer-avatar"
          />
          <div>
            <h3>{currentStreamer.name}</h3>
            <p>{currentStreamer.game} · {currentStreamer.viewers.toLocaleString()} viewers</p>
          </div>
        </div>
        
        {/* Xbox-Style GameBoy Controller */}
        <div className="gameboy-controller">
          <div className="controller-right">
            <div className="action-pad">
              {/* Chat/Comment button */}
              <button 
                className="action-btn comment" 
                onClick={() => {
                  setShowChat(!showChat);
                  toast.success(showChat ? "Chat closed" : "Chat opened");
                }}
              >
                <MessageCircle className="h-4 w-4" />
              </button>
              
              {/* Donate button */}
              <button 
                className="action-btn donate" 
                onClick={() => {
                  toast.success("Donation feature coming soon!");
                }}
              >
                <DollarSign className="h-4 w-4" />
              </button>
              
              {/* Follow button */}
              <button 
                className="action-btn follow" 
                onClick={() => {
                  toast.success("Following streamer!");
                }}
              >
                <UserPlus className="h-4 w-4" />
              </button>
              
              {/* Clipt button */}
              <button 
                className="action-btn clipt" 
                onClick={() => {
                  toast.success("Clip created!");
                }}
              >
                <Scissors className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
        
        {/* Main content area */}
        <div className="content-area">
          {/* Navigation buttons */}
          <button 
            className="nav-button prev"
            onClick={handlePrev}
            aria-label="Previous streamer"
          >
            <ChevronLeft className="h-8 w-8" />
          </button>
          
          <button 
            className="nav-button next"
            onClick={handleNext}
            aria-label="Next streamer"
          >
            <ChevronRight className="h-8 w-8" />
          </button>
        </div>
      </div>
      
      {/* Add the navigation bar */}
      <NavigationBar />
    </div>
  );
};

export default DiscoveryBasic;
