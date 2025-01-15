import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Gamepad2, Users2, Share2 } from "lucide-react";
import { StreamControls } from "@/components/streaming/StreamControls";
import { StreamSettings } from "@/components/streaming/StreamSettings";
import { StreamPlayer } from "@/components/streaming/StreamPlayer";

const Streaming = () => {
  const { user } = useAuth();
  const [streamData, setStreamData] = useState({
    isLive: false,
    streamKey: null,
    streamUrl: null,
  });

  const handleStreamUpdate = (data: { 
    isLive: boolean; 
    streamKey: string | null; 
    streamUrl: string | null 
  }) => {
    setStreamData(data);
  };

  return (
    <div className="min-h-screen bg-[#1A1F2C] p-6">
      <h1 className="text-4xl font-bold text-gaming-400 mb-8">Start Streaming</h1>
      
      <div className="gaming-card min-h-[400px] mb-8 flex items-center justify-center">
        {!streamData.isLive ? (
          <StreamControls
            userId={user?.id}
            isLive={streamData.isLive}
            onStreamUpdate={handleStreamUpdate}
          />
        ) : (
          <StreamPlayer
            streamUrl={streamData.streamUrl}
            isLive={streamData.isLive}
          />
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="gaming-card hover:scale-105 transition-transform">
          <div className="flex items-center gap-3 mb-2">
            <Gamepad2 className="h-6 w-6 text-gaming-400" />
            <h2 className="text-xl font-semibold">Game Details</h2>
          </div>
          <p className="text-muted-foreground">Set your game and title</p>
        </div>

        <div className="gaming-card hover:scale-105 transition-transform">
          <div className="flex items-center gap-3 mb-2">
            <Users2 className="h-6 w-6 text-gaming-400" />
            <h2 className="text-xl font-semibold">Stream Settings</h2>
          </div>
          <p className="text-muted-foreground">Configure your stream</p>
        </div>

        <div className="gaming-card hover:scale-105 transition-transform">
          <div className="flex items-center gap-3 mb-2">
            <Share2 className="h-6 w-6 text-gaming-400" />
            <h2 className="text-xl font-semibold">Share Stream</h2>
          </div>
          <p className="text-muted-foreground">Get your stream link</p>
        </div>
      </div>

      {streamData.isLive && (
        <div className="gaming-card">
          <h2 className="text-xl font-semibold mb-4">Stream Preview</h2>
          <StreamPlayer
            streamUrl={streamData.streamUrl}
            isLive={streamData.isLive}
          />
        </div>
      )}
    </div>
  );
};

export default Streaming;