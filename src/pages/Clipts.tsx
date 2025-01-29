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
      {/* Modern Navigation Bar */}
      <div className="fixed top-0 left-0 right-0 h-16 bg-black/40 backdrop-blur-md z-50 
                    border-b border-white/10 shadow-lg flex items-center justify-center px-6">
        <button 
          className="relative overflow-hidden bg-gaming-700/50 hover:bg-gaming-600/50 
                    text-white px-6 py-2 rounded-lg transition-all duration-300
                    border border-gaming-400/30 hover:border-gaming-400/50
                    shadow-[0_0_15px_rgba(99,102,241,0.3)]
                    hover:shadow-[0_0_20px_rgba(99,102,241,0.5)]"
        >
          <span className="text-sm font-bold tracking-wider">CLIPTS</span>
        </button>
      </div>

      {/* Posts Container */}
      <div className={`relative ${isMobile ? 'h-[calc(100vh-120px)]' : 'h-[calc(100vh-200px)]'} 
                    mt-16 overflow-y-auto snap-y snap-mandatory scroll-smooth touch-none overscroll-none post-container`}>
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
