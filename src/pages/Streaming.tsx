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
import { AnalyticsDashboard } from "@/components/analytics/AnalyticsDashboard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery } from "@tanstack/react-query";

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

  const { data: stream } = useQuery({
    queryKey: ['stream', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('streams')
        .select('*')
        .eq('user_id', user?.id)
        .single();

      if (error) throw error;
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

  if (!user) return null;

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {isConfiguring ? (
        <StreamForm 
          title=""
          description=""
          onTitleChange={() => {}}
          onDescriptionChange={() => {}}
        />
      ) : (
        <Tabs defaultValue="stream" className="space-y-8">
          <TabsList>
            <TabsTrigger value="stream">Stream</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="stream">
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
                <StreamChat 
                  streamId={stream?.id || ''} 
                  isLive={stream?.is_live || false} 
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

          <TabsContent value="analytics">
            {stream?.id && <AnalyticsDashboard streamId={stream.id} />}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};

export default Streaming;