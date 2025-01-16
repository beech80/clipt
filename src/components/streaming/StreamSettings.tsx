import { useState, useEffect } from "react";
import { Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";

interface StreamSettingsProps {
  userId: string;
}

export const StreamSettings = ({ userId }: StreamSettingsProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [settings, setSettings] = useState({
    titleTemplate: "",
    descriptionTemplate: "",
    chatEnabled: true,
    chatFollowersOnly: false,
    chatSlowMode: 0,
    notificationEnabled: true,
  });

  useEffect(() => {
    if (userId) {
      loadSettings();
    }
  }, [userId]);

  const loadSettings = async () => {
    try {
      const { data, error } = await supabase
        .from("stream_settings")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();

      if (error) {
        console.error("Error loading settings:", error);
        toast.error("Failed to load stream settings");
        return;
      }

      if (data) {
        setSettings({
          titleTemplate: data.stream_title_template || "",
          descriptionTemplate: data.stream_description_template || "",
          chatEnabled: data.chat_enabled ?? true,
          chatFollowersOnly: data.chat_followers_only ?? false,
          chatSlowMode: data.chat_slow_mode ?? 0,
          notificationEnabled: data.notification_enabled ?? true,
        });
      }
    } catch (error) {
      console.error("Error loading settings:", error);
      toast.error("Failed to load stream settings");
    }
  };

  const saveSettings = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from("stream_settings")
        .upsert({
          user_id: userId,
          stream_title_template: settings.titleTemplate,
          stream_description_template: settings.descriptionTemplate,
          chat_enabled: settings.chatEnabled,
          chat_followers_only: settings.chatFollowersOnly,
          chat_slow_mode: settings.chatSlowMode,
          notification_enabled: settings.notificationEnabled,
        })
        .select();

      if (error) throw error;
      toast.success("Settings saved successfully!");
    } catch (error) {
      console.error("Error saving settings:", error);
      toast.error("Failed to save settings");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="glass-card p-4 space-y-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold">Stream Settings</h3>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={saveSettings}
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
            onChange={(e) => setSettings(prev => ({ ...prev, titleTemplate: e.target.value }))}
          />
        </div>

        <div className="space-y-2">
          <Label>Stream Description Template</Label>
          <Textarea
            placeholder="Welcome to my stream!"
            value={settings.descriptionTemplate}
            onChange={(e) => setSettings(prev => ({ ...prev, descriptionTemplate: e.target.value }))}
          />
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>Enable Chat</Label>
            <Switch
              checked={settings.chatEnabled}
              onCheckedChange={(checked) => setSettings(prev => ({ ...prev, chatEnabled: checked }))}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label>Followers-only Chat</Label>
            <Switch
              checked={settings.chatFollowersOnly}
              onCheckedChange={(checked) => setSettings(prev => ({ ...prev, chatFollowersOnly: checked }))}
            />
          </div>

          <div className="space-y-2">
            <Label>Chat Slow Mode (seconds)</Label>
            <Input
              type="number"
              min="0"
              value={settings.chatSlowMode}
              onChange={(e) => setSettings(prev => ({ ...prev, chatSlowMode: parseInt(e.target.value) || 0 }))}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label>Enable Stream Notifications</Label>
            <Switch
              checked={settings.notificationEnabled}
              onCheckedChange={(checked) => setSettings(prev => ({ ...prev, notificationEnabled: checked }))}
            />
          </div>
        </div>
      </div>
    </div>
  );
};