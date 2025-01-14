import { Gamepad2, Users, Share2 } from "lucide-react";

interface StreamInfoCardsProps {
  isLive: boolean;
  streamKey: string | null;
}

export const StreamInfoCards = ({ isLive, streamKey }: StreamInfoCardsProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <div className="glass-card p-4">
        <Gamepad2 className="h-6 w-6 mb-2 text-gaming-400" />
        <h3 className="font-semibold mb-1">Stream Info</h3>
        <p className="text-sm text-muted-foreground">
          {isLive ? 'Currently Live' : 'Not Streaming'}
        </p>
      </div>
      <div className="glass-card p-4">
        <Users className="h-6 w-6 mb-2 text-gaming-400" />
        <h3 className="font-semibold mb-1">Stream Settings</h3>
        <p className="text-sm text-muted-foreground">Configure your stream</p>
      </div>
      <div className="glass-card p-4">
        <Share2 className="h-6 w-6 mb-2 text-gaming-400" />
        <h3 className="font-semibold mb-1">Stream Key</h3>
        <p className="text-sm text-muted-foreground break-all">
          {streamKey ? 
            `${streamKey.substring(0, 8)}...` : 
            'Start stream to get key'}
        </p>
      </div>
    </div>
  );
};