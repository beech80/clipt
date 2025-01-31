import { supabase } from '@/lib/supabase';

export interface TwitchStreamInfo {
  id: string;
  user_id: string;
  user_name: string;
  game_name: string;
  title: string;
  viewer_count: number;
  started_at: string;
  thumbnail_url: string;
}

export const twitchService = {
  async linkTwitchAccount(code: string) {
    try {
      const { data, error } = await supabase.functions.invoke('twitch-auth', {
        method: 'POST',
        body: { code }
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Failed to link Twitch account:', error);
      throw error;
    }
  },

  async getStreamInfo(username: string): Promise<TwitchStreamInfo | null> {
    try {
      const { data, error } = await supabase.functions.invoke('twitch-stream-info', {
        method: 'POST',
        body: { username }
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Failed to get Twitch stream info:', error);
      throw error;
    }
  },

  async startTwitchStream(streamKey: string) {
    try {
      const { data, error } = await supabase.functions.invoke('twitch-stream-start', {
        method: 'POST',
        body: { streamKey }
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Failed to start Twitch stream:', error);
      throw error;
    }
  }
};