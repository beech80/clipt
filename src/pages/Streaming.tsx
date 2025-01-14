import { useState, useEffect } from "react";
import { Gamepad2, Users, Share2, Video, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

const Streaming = () => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [streamData, setStreamData] = useState<{
    title: string;
    description: string;
    isLive: boolean;
    streamKey: string | null;
  }>({
    title: "",
    description: "",
    isLive: false,
    streamKey: null,
  });

  useEffect(() => {
    if (user) {
      loadStreamData();
    }
  }, [user]);

  const loadStreamData = async () => {
    try {
      const { data: stream, error } = await supabase
        .from("streams")
        .select("*")
        .eq("user_id", user?.id)
        .single();

      if (error) throw error;

      if (stream) {
        setStreamData({
          title: stream.title,
          description: stream.description || "",
          isLive: stream.is_live,
          streamKey: stream.stream_key,
        });
      }
    } catch (error) {
      console.error("Error loading stream data:", error);
    }
  };

  const handleStartStream = async () => {
    if (!streamData.title) {
      toast.error("Please set a stream title first");
      return;
    }

    setIsLoading(true);
    try {
      let streamId;
      const { data: existingStream } = await supabase
        .from("streams")
        .select("id")
        .eq("user_id", user?.id)
        .single();

      if (existingStream) {
        const { error } = await supabase
          .from("streams")
          .update({
            title: streamData.title,
            description: streamData.description,
            is_live: true,
            started_at: new Date().toISOString(),
          })
          .eq("id", existingStream.id);

        if (error) throw error;
        streamId = existingStream.id;
      } else {
        const { data, error } = await supabase
          .from("streams")
          .insert({
            user_id: user?.id,
            title: streamData.title,
            description: streamData.description,
            is_live: true,
            started_at: new Date().toISOString(),
          })
          .select()
          .single();

        if (error) throw error;
        streamId = data.id;
      }

      setStreamData(prev => ({ ...prev, isLive: true }));
      toast.success("Stream started successfully!");
    } catch (error) {
      console.error("Error starting stream:", error);
      toast.error("Failed to start stream");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEndStream = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from("streams")
        .update({
          is_live: false,
          ended_at: new Date().toISOString(),
        })
        .eq("user_id", user?.id);

      if (error) throw error;

      setStreamData(prev => ({ ...prev, isLive: false }));
      toast.success("Stream ended successfully!");
    } catch (error) {
      console.error("Error ending stream:", error);
      toast.error("Failed to end stream");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div className="gaming-card">
        <h1 className="gaming-gradient text-3xl font-bold tracking-tight mb-4">Stream Manager</h1>
        
        <div className="space-y-4 mb-6">
          <div>
            <Input
              placeholder="Stream Title"
              value={streamData.title}
              onChange={(e) => setStreamData(prev => ({ ...prev, title: e.target.value }))}
              className="mb-2"
            />
            <Textarea
              placeholder="Stream Description"
              value={streamData.description}
              onChange={(e) => setStreamData(prev => ({ ...prev, description: e.target.value }))}
              className="h-24"
            />
          </div>

          <Button 
            onClick={streamData.isLive ? handleEndStream : handleStartStream}
            className={`w-full ${streamData.isLive ? 'bg-red-500 hover:bg-red-600' : 'gaming-button'}`}
            disabled={isLoading}
          >
            <Video className="h-4 w-4 mr-2" />
            {streamData.isLive ? 'End Stream' : 'Start Stream'}
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="glass-card p-4">
            <Gamepad2 className="h-6 w-6 mb-2 text-gaming-400" />
            <h3 className="font-semibold mb-1">Stream Info</h3>
            <p className="text-sm text-muted-foreground">
              {streamData.isLive ? 'Currently Live' : 'Not Streaming'}
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
              {streamData.streamKey ? 
                `${streamData.streamKey.substring(0, 8)}...` : 
                'Start stream to get key'}
            </p>
          </div>
        </div>

        <div className="glass-card p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Stream Preview</h3>
            <Button variant="outline" size="sm">
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Button>
          </div>
          <div className="aspect-video w-full bg-gaming-900/50 rounded-lg">
            <div className="flex items-center justify-center h-full text-muted-foreground">
              {streamData.isLive ? 
                'Live Preview' : 
                'Preview will appear here when streaming'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Streaming;