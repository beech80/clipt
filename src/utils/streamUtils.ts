
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

export const generateStreamKey = () => {
  return Array.from(crypto.getRandomValues(new Uint8Array(16)))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
};

export const startStream = async (userId: string, title: string, description?: string) => {
  const streamKey = generateStreamKey();
  const streamUrl = `rtmp://stream.lovable.dev/live/${streamKey}`;

  const { error } = await supabase
    .from('streams')
    .upsert({
      user_id: userId,
      title: title || 'Untitled Stream',
      description,
      is_live: true,
      started_at: new Date().toISOString(),
      stream_key: streamKey,
      stream_url: streamUrl
    })
    .select()
    .single();

  if (error) {
    toast.error('Failed to start stream');
    throw error;
  }

  toast.success('Stream started!');
  return { streamKey, streamUrl };
};

export const endStream = async (streamId: string) => {
  const { error } = await supabase
    .from('streams')
    .update({
      is_live: false,
      ended_at: new Date().toISOString()
    })
    .eq('id', streamId);

  if (error) {
    toast.error('Failed to end stream');
    throw error;
  }

  toast.success('Stream ended');
};
