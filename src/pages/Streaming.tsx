import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { StreamPreview } from "@/components/streaming/StreamPreview";
import { StreamControls } from "@/components/streaming/StreamControls";
import { StreamInfoCards } from "@/components/streaming/StreamInfoCards";
import { StreamHealthMonitor } from "@/components/streaming/StreamHealthMonitor";
import { StreamSettingsForm } from "@/components/streaming/StreamSettingsForm";
import { QualitySettingsForm } from "@/components/streaming/QualitySettingsForm";
import { useStreamSettings } from "@/hooks/use-stream-settings";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Streaming = () => {
  const { user } = useAuth();
  const [isPreviewActive, setIsPreviewActive] = useState(false);
  const { settings, setSettings, isLoading, saveSettings } = useStreamSettings(user?.id || '');
  
  const [streamState, setStreamState] = useState({
    isLive: false,
    streamKey: null as string | null,
    streamUrl: null as string | null,
    streamId: null as string | null,
    title: '',
    description: '',
    viewerCount: 0,
    startedAt: null as string | null,
    healthStatus: 'unknown',
    bitrate: 0,
    fps: 0,
    resolution: ''
  });

  const handleStreamUpdate = (data: { 
    isLive: boolean; 
    streamKey: string | null; 
    streamUrl: string | null;
    streamId?: string | null;
  }) => {
    setStreamState(prev => ({
      ...prev,
      ...data
    }));
  };

  if (!user) return null;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-6">
          <StreamPreview
            streamUrl={streamState.streamUrl}
            isPreviewActive={isPreviewActive}
            onTogglePreview={() => setIsPreviewActive(!isPreviewActive)}
          />
          <StreamControls
            userId={user.id}
            isLive={streamState.isLive}
            onStreamUpdate={handleStreamUpdate}
          />
        </div>
        
        <div className="space-y-6">
          <StreamInfoCards
            isLive={streamState.isLive}
            streamKey={streamState.streamKey}
            streamUrl={streamState.streamUrl}
            viewerCount={streamState.viewerCount}
            startedAt={streamState.startedAt}
            healthStatus={streamState.healthStatus}
            bitrate={streamState.bitrate}
            fps={streamState.fps}
            resolution={streamState.resolution}
          />
          
          <Tabs defaultValue="health" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="health">Health</TabsTrigger>
              <TabsTrigger value="quality">Quality</TabsTrigger>
            </TabsList>
            <TabsContent value="health">
              {streamState.streamId && (
                <StreamHealthMonitor
                  streamId={streamState.streamId}
                />
              )}
            </TabsContent>
            <TabsContent value="quality">
              {streamState.streamId && (
                <QualitySettingsForm
                  streamId={streamState.streamId}
                  currentBitrate={streamState.bitrate}
                  currentFps={streamState.fps}
                  currentResolution={streamState.resolution}
                />
              )}
            </TabsContent>
          </Tabs>

          <StreamSettingsForm
            settings={settings}
            onSettingsChange={setSettings}
            onSave={saveSettings}
            isLoading={isLoading}
          />
        </div>
      </div>
    </div>
  );
};

export default Streaming;