import React from 'react';
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
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
      image_url: null,
      video_url: "https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4", // Sample video
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
      image_url: null,
      video_url: "https://storage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4", // Sample video
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
      image_url: null,
      video_url: "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4", // Sample video
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
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="gaming-cartridge mb-6 p-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold gaming-gradient">Gaming Clipts</h1>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
              <span className="text-sm text-gaming-400">LIVE</span>
            </div>
          </div>
        </div>

        {/* Create Clipt Button */}
        <Button 
          onClick={() => navigate('/clip-editor/new')}
          className="gaming-button gap-2 bg-gaming-400/10 hover:bg-gaming-400/20 mb-6 w-full sm:w-auto"
        >
          <Plus className="h-4 w-4" />
          Create Clipt
        </Button>

        {/* Posts Container */}
        <div className={`relative ${isMobile ? 'h-[calc(100vh-120px)]' : 'h-[calc(100vh-200px)]'} 
                      overflow-y-auto snap-y snap-mandatory scroll-smooth touch-none overscroll-none post-container`}>
          <div className="space-y-4 pb-6">
            {samplePosts.map((post) => (
              <div key={post.id} className="snap-start">
                <PostItem post={post} />
              </div>
            ))}
          </div>
        </div>
      </div>

      <GameBoyControls currentPostId="sample-1" />
    </div>
  );
};

export default Clipts;