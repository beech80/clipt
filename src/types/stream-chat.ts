import type { Tables } from '@/integrations/supabase/types';

export type StreamChatMessage = Tables<'stream_chat'> & {
  profiles?: Pick<Tables<'profiles'>, 'username' | 'avatar_url'> | null;
};
