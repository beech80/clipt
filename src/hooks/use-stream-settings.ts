import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

interface StreamSettings {
  titleTemplate: string;
  descriptionTemplate: string;
  chatEnabled: boolean;
  chatFollowersOnly: boolean;
  chatSlowMode: number;
  notificationEnabled: boolean;
}

export const useStreamSettings = (userId: string) => {
  const queryClient = useQueryClient();
  const [settings, setSettings] = useState<StreamSettings>({
    titleTemplate: "",
    descriptionTemplate: "",
    chatEnabled: true,
    chatFollowersOnly: false,
    chatSlowMode: 0,
    notificationEnabled: true,
  });

  const { data, isLoading, error } = useQuery({
    queryKey: ['streamSettings', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("stream_settings")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();

      if (error) throw error;
      return data;
    }
  });

  const mutation = useMutation({
    mutationFn: async (newSettings: StreamSettings) => {
      const { error } = await supabase
        .from("stream_settings")
        .upsert({
          user_id: userId,
          stream_title_template: newSettings.titleTemplate,
          stream_description_template: newSettings.descriptionTemplate,
          chat_enabled: newSettings.chatEnabled,
          chat_followers_only: newSettings.chatFollowersOnly,
          chat_slow_mode: newSettings.chatSlowMode,
          notification_enabled: newSettings.notificationEnabled,
        })
        .select();

      if (error) throw error;
      return newSettings;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['streamSettings', userId] });
      toast.success("Settings saved successfully!");
    },
    onError: () => {
      toast.error("Failed to save settings");
    }
  });

  useEffect(() => {
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
  }, [data]);

  return {
    settings,
    setSettings,
    isLoading: isLoading || mutation.isPending,
    saveSettings: () => mutation.mutate(settings),
    error
  };
};