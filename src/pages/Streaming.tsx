import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { StreamForm } from "@/components/streaming/StreamForm";
import { StreamPreview } from "@/components/streaming/StreamPreview";
import { StreamControls } from "@/components/streaming/StreamControls";
import { StreamInfoCards } from "@/components/streaming/StreamInfoCards";
import { StreamSettingsForm } from "@/components/streaming/StreamSettingsForm";
import { StreamHealthMonitor } from "@/components/streaming/StreamHealthMonitor";
import { useStreamSettings } from "@/hooks/use-stream-settings";

const Streaming = () => {
  const { user } = useAuth();
  const [isPreviewActive, setIsPreviewActive] = useState(false);
  const { settings, setSettings, isLoading, saveSettings } = useStreamSettings(user?.id);

  if (!user) return null;

  return (
    <div className="container mx-auto space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-6">
          <StreamPreview
            streamUrl={settings?.stream_url}
            isPreviewActive={isPreviewActive}
            onTogglePreview={() => setIsPreviewActive(!isPreviewActive)}
          />
          <StreamForm />
          <StreamControls />
        </div>
        
        <div className="space-y-6">
          <StreamInfoCards />
          <StreamHealthMonitor />
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