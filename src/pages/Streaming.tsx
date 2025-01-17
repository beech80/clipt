import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { StreamForm } from "@/components/streaming/StreamForm";
import { StreamPreview } from "@/components/streaming/StreamPreview";
import { StreamChat } from "@/components/streaming/StreamChat";
import { StreamControls } from "@/components/streaming/StreamControls";
import { StreamHealthMonitor } from "@/components/streaming/StreamHealthMonitor";
import { StreamInfoCards } from "@/components/streaming/StreamInfoCards";
import { StreamSettingsForm } from "@/components/streaming/StreamSettingsForm";
import { StreamContentSettings } from "@/components/streaming/StreamContentSettings";
import { StreamModeration } from "@/components/streaming/StreamModeration";
import { AnalyticsDashboard } from "@/components/analytics/AnalyticsDashboard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

const defaultSettings = {
  titleTemplate: "",
  descriptionTemplate: "",
  chatEnabled: true,
  chatFollowersOnly: false,
  chatSlowMode: 0,
  notificationEnabled: true,
};

const Streaming = () => {
  const { user } = useAuth();
  const [isConfiguring, setIsConfiguring] = useState(false);
  const [streamState, setStreamState] = useState({
    isLive: false,
    streamKey: null,
    streamUrl: null,
  });
  const [settings, setSettings] = useState(defaultSettings);
  const [isLoading, setIsLoading] = useState(false);

  const { data: stream, error } = useQuery({
    queryKey: ['stream', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from('streams')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        toast.error("Failed to load stream data");
        throw error;
      }
      return data;
    },
    enabled: !!user?.id
  });

  useEffect(() => {
    if (!stream) {
      setIsConfiguring(true);
    }
  }, [stream]);

  const handleStreamUpdate = (data: { isLive: boolean; streamKey: string | null; streamUrl: string | null }) => {
    setStreamState(data);
  };

  const handleSettingsChange = (newSettings: typeof settings) => {
    setSettings(newSettings);
  };

  const handleSettingsSave = async () => {
    setIsLoading(true);
    try {
      // Save settings logic here
      setIsLoading(false);
    } catch (error) {
      console.error('Failed to save settings:', error);
      setIsLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="p-8 text-center">
          <h2 className="text-2xl font-bold mb-4">Sign in to Start Streaming</h2>
          <p className="text-muted-foreground">
            You need to be signed in to access streaming features.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {isConfiguring ? (
        <div className="max-w-2xl mx-auto">
          <Card className="p-6">
            <h2 className="text-2xl font-bold mb-6">Configure Your Stream</h2>
            <StreamForm 
              title=""
              description=""
              onTitleChange={() => {}}
              onDescriptionChange={() => {}}
            />
          </Card>
        </div>
      ) : (
        <Tabs defaultValue="stream" className="space-y-8">
          <TabsList className="grid w-full grid-cols-3 lg:w-[600px]">
            <TabsTrigger value="stream">Stream</TabsTrigger>
            <TabsTrigger value="moderation">Moderation</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="stream" className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-6">
                <StreamPreview 
                  streamUrl={stream?.stream_url} 
                  isLive={stream?.is_live || false}
                />
                <StreamControls 
                  userId={user.id}
                  isLive={streamState.isLive}
                  onStreamUpdate={handleStreamUpdate}
                />
                <StreamHealthMonitor 
                  streamId={stream?.id || ''}
                />
              </div>
              
              <div className="space-y-6">
                <StreamInfoCards 
                  isLive={streamState.isLive}
                  streamKey={streamState.streamKey}
                  streamUrl={streamState.streamUrl}
                  viewerCount={stream?.viewer_count}
                  startedAt={stream?.started_at}
                  healthStatus={stream?.health_status}
                  bitrate={stream?.current_bitrate}
                  fps={stream?.current_fps}
                  resolution={stream?.stream_resolution}
                />
                {stream?.id && (
                  <StreamContentSettings streamId={stream.id} />
                )}
                <StreamChat 
                  streamId={stream?.id || ''} 
                  isLive={stream?.is_live || false}
                  chatEnabled={stream?.chat_enabled ?? true}
                />
                <StreamSettingsForm 
                  settings={settings}
                  onSettingsChange={handleSettingsChange}
                  onSave={handleSettingsSave}
                  isLoading={isLoading}
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="moderation">
            {stream?.id && <StreamModeration streamId={stream.id} />}
          </TabsContent>

          <TabsContent value="analytics">
            {stream?.id && <AnalyticsDashboard streamId={stream.id} />}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};

export default Streaming;