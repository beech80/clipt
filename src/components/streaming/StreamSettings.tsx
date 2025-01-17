import { useStreamSettings } from "@/hooks/use-stream-settings";
import { StreamSettingsForm } from "./StreamSettingsForm";
import { Alert } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";

interface StreamSettingsProps {
  userId: string;
}

export const StreamSettings = ({ userId }: StreamSettingsProps) => {
  const { settings, setSettings, isLoading, saveSettings, error } = useStreamSettings(userId);

  if (error) {
    return (
      <Alert variant="destructive">
        <p>Failed to load stream settings. Please try again later.</p>
      </Alert>
    );
  }

  if (isLoading && !settings) {
    return (
      <div className="glass-card p-4 space-y-4">
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-3/4" />
        <Skeleton className="h-8 w-1/2" />
      </div>
    );
  }

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