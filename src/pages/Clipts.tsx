import React from 'react';
import { Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";
import GameBoyControls from "@/components/GameBoyControls";
import PostItem from "@/components/PostItem";

const Clipts = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  // Sample posts with videos for demonstration
  const samplePosts = [
    {
      id: "sample-1",
      content: "Check out this amazing gaming moment!",
      image_url: "/lovable-uploads/de4393f2-b28b-408e-b6b1-db014cbc978e.png", // Using the uploaded image
      video_url: "https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
      created_at: new Date().toISOString(),
      user_id: "sample-user",
      profiles: {
        username: "ProGamer123",
        avatar_url: null
      },
      likes_count: 1234,
      clip_votes: [{ count: 42 }]
    },
    {
      id: "sample-2",
      content: "Epic win in the last second!",
      image_url: "/lovable-uploads/de4393f2-b28b-408e-b6b1-db014cbc978e.png",
      video_url: "https://storage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
      created_at: new Date().toISOString(),
      user_id: "sample-user2",
      profiles: {
        username: "GameMaster",
        avatar_url: null
      },
      likes_count: 856,
      clip_votes: [{ count: 31 }]
    },
    {
      id: "sample-3",
      content: "Unbelievable gameplay sequence!",
      image_url: "/lovable-uploads/de4393f2-b28b-408e-b6b1-db014cbc978e.png",
      video_url: "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
      created_at: new Date().toISOString(),
      user_id: "sample-user3",
      profiles: {
        username: "EpicStreamer",
        avatar_url: null
      },
      likes_count: 2431,
      clip_votes: [{ count: 89 }]
    }
  ];

  return (
    <div className="min-h-screen bg-[#1A1F2C]">
      {/* Top Navigation Bar */}
      <div className="fixed top-0 left-0 right-0 h-14 bg-gaming-800/95 backdrop-blur-sm z-50 border-b-2 border-gaming-400 
                    shadow-[0_4px_15px_rgba(99,102,241,0.2)] flex items-center justify-between px-4">
        <button 
          onClick={() => navigate('/clip-editor/new')}
          className="gaming-button text-gaming-400 hover:text-gaming-300 flex items-center gap-2 
                    bg-gaming-900/50 border-gaming-400 hover:border-gaming-300 px-4 py-1.5 
                    transition-all duration-300"
        >
          <Plus className="h-4 w-4" />
          <span className="text-sm font-bold tracking-wider">POST</span>
        </button>

        <button 
          className="gaming-button text-gaming-400 hover:text-gaming-300 
                    bg-gaming-900/50 border-gaming-400 hover:border-gaming-300 px-6 py-1.5
                    transition-all duration-300"
        >
          <span className="text-sm font-bold tracking-wider">CLIPTS</span>
        </button>

        <button 
          onClick={() => navigate('/')}
          className="gaming-button text-gaming-400 hover:text-gaming-300 
                    bg-gaming-900/50 border-gaming-400 hover:border-gaming-300 px-4 py-1.5
                    transition-all duration-300"
        >
          <span className="text-sm font-bold tracking-wider">SQUADS</span>
        </button>
      </div>

      {/* Posts Container */}
      <div className={`relative ${isMobile ? 'h-[calc(100vh-120px)]' : 'h-[calc(100vh-200px)]'} 
                    mt-14 overflow-y-auto snap-y snap-mandatory scroll-smooth touch-none overscroll-none post-container`}>
        <div className="space-y-4 pb-6">
          {samplePosts.map((post) => (
            <div key={post.id} className="snap-start">
              <PostItem post={post} />
            </div>
          ))}
        </div>
      </div>

      <GameBoyControls currentPostId="sample-1" />
    </div>
  );
};

export default Clipts;