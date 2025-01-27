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

  // Sample post data for UI layout
  const samplePost = {
    id: "sample-1",
    content: "Sample gaming clip",
    image_url: null,
    video_url: null,
    created_at: new Date().toISOString(),
    user_id: "sample-user",
    profiles: {
      username: "GamerDemo",
      avatar_url: null
    },
    likes_count: 42,
    clip_votes: [{ count: 15 }]
  };

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
            {/* Show 3 sample posts for layout visualization */}
            {[1, 2, 3].map((i) => (
              <div key={`sample-${i}`} className="snap-start">
                <PostItem post={{
                  ...samplePost,
                  id: `sample-${i}`,
                  content: `Sample Gaming Clip ${i}`
                }} />
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