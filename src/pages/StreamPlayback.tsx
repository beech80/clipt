import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Eye, Calendar, User, Star, MessageSquare, Share2 } from 'lucide-react';
import { motion } from 'framer-motion';
import '@/styles/stream-playback.css';

const StreamPlayback = () => {
  const { streamId } = useParams();
  const navigate = useNavigate();
  const [stream, setStream] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate fetching stream data
    const fetchStream = async () => {
      setLoading(true);
      
      // For demo, we'll create mock data based on the streamId
      setTimeout(() => {
        const mockStreams = {
          's12345': {
            id: 's12345',
            title: 'Cosmic Exploration',
            date: 'May 28, 2025',
            duration: '1:24:35',
            views: '2.4K',
            streamer: {
              name: 'CosmicStreamer',
              avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=cosmic'
            },
            videoUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
            thumbnail: 'https://placehold.co/1280x720/121212/00BFFF?text=Space+Stream'
          },
          's67890': {
            id: 's67890',
            title: 'Galaxy Conquest',
            date: 'May 25, 2025',
            duration: '2:10:15',
            views: '3.8K',
            streamer: {
              name: 'StarDweller',
              avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=galaxy'
            },
            videoUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
            thumbnail: 'https://placehold.co/1280x720/121212/FF4500?text=Dual+Stream'
          },
          's24680': {
            id: 's24680',
            title: 'Space Station Tour',
            date: 'May 22, 2025',
            duration: '0:45:22',
            views: '1.2K',
            streamer: {
              name: 'AstroExplorer',
              avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=astro'
            },
            videoUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
            thumbnail: 'https://placehold.co/1280x720/121212/9932CC?text=Mobile+Stream'
          }
        };
        
        const streamData = mockStreams[streamId as keyof typeof mockStreams];
        setStream(streamData || {
          id: 'unknown',
          title: 'Unknown Stream',
          date: 'Unknown Date',
          duration: '0:00',
          views: '0',
          streamer: {
            name: 'Unknown',
            avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=unknown'
          },
          videoUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
          thumbnail: 'https://placehold.co/1280x720/121212/FF0000?text=Unknown+Stream'
        });
        setLoading(false);
      }, 1000);
    };
    
    fetchStream();
  }, [streamId]);

  const handleBack = () => {
    navigate(-1);
  };

  if (loading) {
    return (
      <div className="stream-playback-loading">
        <div className="stream-loading-animation">
          <div className="stream-loading-circle"></div>
          <div className="stream-loading-text">Loading Stream...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="stream-playback-container">
      <div className="stream-playback-header">
        <motion.button 
          className="back-button"
          onClick={handleBack}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <ArrowLeft className="back-icon" />
          <span>Back</span>
        </motion.button>
        <h1 className="stream-title">{stream.title}</h1>
        <div className="stream-date">
          <Calendar className="date-icon" />
          <span>{stream.date}</span>
        </div>
      </div>
      
      <div className="stream-video-container">
        <video 
          controls 
          autoPlay 
          className="stream-video-player"
          src={stream.videoUrl}
          poster={stream.thumbnail}
        />
      </div>
      
      <div className="stream-info-container">
        <div className="streamer-info">
          <img src={stream.streamer.avatar} alt="Streamer Avatar" className="streamer-avatar" />
          <div className="streamer-details">
            <h2 className="streamer-name">{stream.streamer.name}</h2>
            <div className="stream-stats">
              <div className="stat">
                <Eye className="stat-icon" />
                <span>{stream.views} views</span>
              </div>
              <div className="stat">
                <Star className="stat-icon" />
                <span>Subscribe</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="stream-actions">
          <motion.button 
            className="action-button"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <MessageSquare className="action-icon" />
            <span>Chat</span>
          </motion.button>
          
          <motion.button 
            className="action-button"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Share2 className="action-icon" />
            <span>Share</span>
          </motion.button>
        </div>
      </div>
    </div>
  );
};

export default StreamPlayback;
