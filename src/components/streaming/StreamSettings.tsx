import { useStreamSettings } from "@/hooks/use-stream-settings";
import { StreamSettingsForm } from "./StreamSettingsForm";

interface StreamSettingsProps {
  userId: string;
}

export const StreamSettings = ({ userId }: StreamSettingsProps) => {
  const { settings, setSettings, isLoading, saveSettings } = useStreamSettings(userId);

  return (
    <div className="glass-card p-4">
      <StreamSettingsForm
        settings={settings}
        onSettingsChange={setSettings}
        onSave={saveSettings}
        isLoading={isLoading}
      />
    </div>
  );
};