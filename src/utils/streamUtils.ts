import { supabase } from "@/lib/supabase";

export const generateStreamKey = async () => {
  const { data, error } = await supabase.rpc('generate_stream_key');
  if (error) throw error;
  return data;
};

export const startStream = async (userId: string, title: string, description: string) => {
  const { data: existingStream } = await supabase
    .from("streams")
    .select("id, stream_key")
    .eq("user_id", userId)
    .maybeSingle();

  if (existingStream) {
    const { error } = await supabase
      .from("streams")
      .update({
        title,
        description,
        is_live: true,
        started_at: new Date().toISOString(),
      })
      .eq("id", existingStream.id);

    if (error) throw error;
    return { isLive: true, streamKey: existingStream.stream_key };
  }

  const { data, error } = await supabase
    .from("streams")
    .insert({
      user_id: userId,
      title,
      description,
      is_live: true,
      started_at: new Date().toISOString(),
      stream_key: await generateStreamKey(),
    })
    .select()
    .single();

  if (error) throw error;
  return { isLive: true, streamKey: data.stream_key };
};

export const endStream = async (userId: string) => {
  const { error } = await supabase
    .from("streams")
    .update({
      is_live: false,
      ended_at: new Date().toISOString(),
    })
    .eq("user_id", userId);

  if (error) throw error;
  return { isLive: false, streamKey: null };
};