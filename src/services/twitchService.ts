import { supabase } from "@/lib/supabase";

export const twitchService = {
  async getStreamInfo(username: string) {
    try {
      const { data, error } = await supabase.functions.invoke('twitch-auth', {
        method: 'POST',
        body: { action: 'get-stream-info', username }
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error getting stream info:', error);
      throw error;
    }
  },

  async linkTwitchAccount(code: string) {
    try {
      const { data, error } = await supabase.functions.invoke('twitch-auth', {
        method: 'POST',
        body: { action: 'link-account', code }
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error linking Twitch account:', error);
      throw error;
    }
  }
};