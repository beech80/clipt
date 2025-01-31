import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { twitchService } from "@/services/twitchService";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Twitch } from "lucide-react";
import { useState } from "react";

export function TwitchIntegration() {
  const { toast } = useToast();
  const [isLinking, setIsLinking] = useState(false);

  const { data: streamInfo, isLoading } = useQuery({
    queryKey: ['twitch-stream-info'],
    queryFn: async () => {
      try {
        return await twitchService.getStreamInfo();
      } catch (error) {
        console.error('Failed to get Twitch stream info:', error);
        return null;
      }
    }
  });

  const handleTwitchLink = async () => {
    setIsLinking(true);
    try {
      await twitchService.linkTwitchAccount();
      toast({
        title: "Success",
        description: "Twitch account linked successfully!",
      });
    } catch (error) {
      console.error('Failed to link Twitch account:', error);
      toast({
        title: "Error",
        description: "Failed to link Twitch account. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLinking(false);
    }
  };

  return (
    <Card className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Twitch className="w-5 h-5 text-purple-500" />
          <h2 className="text-lg font-semibold">Twitch Integration</h2>
        </div>
        <Button
          onClick={handleTwitchLink}
          disabled={isLinking}
          variant="outline"
          className="bg-purple-500 text-white hover:bg-purple-600"
        >
          {isLinking ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Twitch className="w-4 h-4 mr-2" />
          )}
          Connect Twitch
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-4">
          <Loader2 className="w-6 h-6 animate-spin text-purple-500" />
        </div>
      ) : streamInfo ? (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="font-medium">Channel:</span>
            <span>{streamInfo.user_name}</span>
          </div>
          {streamInfo.game_name && (
            <div className="flex items-center gap-2">
              <span className="font-medium">Game:</span>
              <span>{streamInfo.game_name}</span>
            </div>
          )}
          {streamInfo.title && (
            <div className="flex items-center gap-2">
              <span className="font-medium">Title:</span>
              <span>{streamInfo.title}</span>
            </div>
          )}
          {streamInfo.viewer_count !== undefined && (
            <div className="flex items-center gap-2">
              <span className="font-medium">Viewers:</span>
              <span>{streamInfo.viewer_count}</span>
            </div>
          )}
        </div>
      ) : (
        <p className="text-muted-foreground text-sm">
          Connect your Twitch account to see your stream information
        </p>
      )}
    </Card>
  );
}