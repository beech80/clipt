import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

interface StreamSettings {
  titleTemplate: string;
  descriptionTemplate: string;
  chatEnabled: boolean;
  chatFollowersOnly: boolean;
  chatSlowMode: number;
  notificationEnabled: boolean;
}

export const useStreamSettings = (userId: string) => {
  const [isLoading, setIsLoading] = useState(false);
  const [settings, setSettings] = useState<StreamSettings>({
    titleTemplate: "",
    descriptionTemplate: "",
    chatEnabled: true,
    chatFollowersOnly: false,
    chatSlowMode: 0,
    notificationEnabled: true,
  });

  const loadSettings = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from("stream_settings")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();

      if (error) throw error;

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
    } finally {
      setIsLoading(false);
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

  useEffect(() => {
    if (userId) {
      loadSettings();
    }
  }, [userId]);

  return {
    settings,
    setSettings,
    isLoading,
    saveSettings,
  };
};