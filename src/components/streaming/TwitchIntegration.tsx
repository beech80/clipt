import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { twitchService } from "@/services/twitchService";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Twitch } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

export function TwitchIntegration() {
  const { toast } = useToast();
  const [isLinking, setIsLinking] = useState(false);

  const { data: streamInfo, isLoading } = useQuery({
    queryKey: ['twitch-stream-info'],
    queryFn: async () => {
      try {
        return await twitchService.getStreamInfo("beechhouseprod");
      } catch (error) {
        console.error('Failed to get Twitch stream info:', error);
        return null;
      }
    }
  });

  const handleTwitchLink = async () => {
    setIsLinking(true);
    try {
      // Generate OAuth URL with required scopes
      const redirectUri = `${window.location.origin}/twitch-callback`;
      const scopes = ['user:read:email', 'channel:read:stream_key'];
      
      const { data: { clientId }, error } = await supabase.functions.invoke('twitch-auth', {
        method: 'GET',
        body: { action: 'get-client-id' }
      });

      if (error) throw error;

      const authUrl = `https://id.twitch.tv/oauth2/authorize?` +
        `client_id=${clientId}&` +
        `redirect_uri=${encodeURIComponent(redirectUri)}&` +
        `response_type=code&` +
        `scope=${encodeURIComponent(scopes.join(' '))}`;

      // Store current URL to return after auth
      localStorage.setItem('twitch_auth_return_path', window.location.pathname);
      
      // Redirect to Twitch auth
      window.location.href = authUrl;
    } catch (error) {
      console.error('Failed to initiate Twitch auth:', error);
      toast({
        title: "Error",
        description: "Failed to connect Twitch account. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLinking(false);
    }
  };

  // Handle OAuth callback
  useEffect(() => {
    const handleAuthCallback = async () => {
      const params = new URLSearchParams(window.location.search);
      const code = params.get('code');
      
      if (code) {
        try {
          await twitchService.linkTwitchAccount(code);
          toast({
            title: "Success",
            description: "Twitch account linked successfully!",
          });
          
          // Return to previous page
          const returnPath = localStorage.getItem('twitch_auth_return_path') || '/';
          localStorage.removeItem('twitch_auth_return_path');
          window.location.href = returnPath;
        } catch (error) {
          console.error('Failed to complete Twitch auth:', error);
          toast({
            title: "Error",
            description: "Failed to connect Twitch account. Please try again.",
            variant: "destructive",
          });
        }
      }
    };

    handleAuthCallback();
  }, [toast]);

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