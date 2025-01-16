import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Settings } from "lucide-react";

interface StreamSettingsFormProps {
  settings: {
    titleTemplate: string;
    descriptionTemplate: string;
    chatEnabled: boolean;
    chatFollowersOnly: boolean;
    chatSlowMode: number;
    notificationEnabled: boolean;
  };
  onSettingsChange: (settings: any) => void;
  onSave: () => void;
  isLoading: boolean;
}

export const StreamSettingsForm = ({
  settings,
  onSettingsChange,
  onSave,
  isLoading,
}: StreamSettingsFormProps) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold">Stream Settings</h3>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={onSave}
          disabled={isLoading}
        >
          <Settings className="h-4 w-4 mr-2" />
          Save Settings
        </Button>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label>Stream Title Template</Label>
          <Input
            placeholder="My Awesome Stream"
            value={settings.titleTemplate}
            onChange={(e) => onSettingsChange({ ...settings, titleTemplate: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label>Stream Description Template</Label>
          <Textarea
            placeholder="Welcome to my stream!"
            value={settings.descriptionTemplate}
            onChange={(e) => onSettingsChange({ ...settings, descriptionTemplate: e.target.value })}
          />
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>Enable Chat</Label>
            <Switch
              checked={settings.chatEnabled}
              onCheckedChange={(checked) => onSettingsChange({ ...settings, chatEnabled: checked })}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label>Followers-only Chat</Label>
            <Switch
              checked={settings.chatFollowersOnly}
              onCheckedChange={(checked) => onSettingsChange({ ...settings, chatFollowersOnly: checked })}
            />
          </div>

          <div className="space-y-2">
            <Label>Chat Slow Mode (seconds)</Label>
            <Input
              type="number"
              min="0"
              value={settings.chatSlowMode}
              onChange={(e) => onSettingsChange({ ...settings, chatSlowMode: parseInt(e.target.value) || 0 })}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label>Enable Stream Notifications</Label>
            <Switch
              checked={settings.notificationEnabled}
              onCheckedChange={(checked) => onSettingsChange({ ...settings, notificationEnabled: checked })}
            />
          </div>
        </div>
      </div>
    </div>
  );
};