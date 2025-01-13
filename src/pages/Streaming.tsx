import { Gamepad2, Users, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const Streaming = () => {
  const handleStartStream = () => {
    // In a real app, this would connect to a streaming service
    toast.info("Streaming feature coming soon! This is just a UI demo.");
  };

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div className="gaming-card">
        <h1 className="gaming-gradient text-3xl font-bold tracking-tight mb-4">Start Streaming</h1>
        
        <div className="aspect-video w-full bg-gaming-900/50 rounded-lg mb-6 relative group">
          <div className="absolute inset-0 flex items-center justify-center">
            <Button 
              onClick={handleStartStream}
              className="gaming-button group-hover:scale-105 transition-transform"
            >
              Start Stream
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="glass-card p-4">
            <Gamepad2 className="h-6 w-6 mb-2 text-gaming-400" />
            <h3 className="font-semibold mb-1">Game Details</h3>
            <p className="text-sm text-muted-foreground">Set your game and title</p>
          </div>
          <div className="glass-card p-4">
            <Users className="h-6 w-6 mb-2 text-gaming-400" />
            <h3 className="font-semibold mb-1">Stream Settings</h3>
            <p className="text-sm text-muted-foreground">Configure your stream</p>
          </div>
          <div className="glass-card p-4">
            <Share2 className="h-6 w-6 mb-2 text-gaming-400" />
            <h3 className="font-semibold mb-1">Share Stream</h3>
            <p className="text-sm text-muted-foreground">Get your stream link</p>
          </div>
        </div>

        <div className="glass-card p-4">
          <h3 className="font-semibold mb-4">Stream Preview</h3>
          <div className="aspect-video w-full bg-gaming-900/50 rounded-lg">
            <div className="flex items-center justify-center h-full text-muted-foreground">
              Preview will appear here when streaming
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Streaming;