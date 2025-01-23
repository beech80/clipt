import { supabase } from "@/lib/supabase";

export const getDVRSegments = async (streamId: string) => {
  const { data: segments } = await supabase
    .from('stream_dvr_segments')
    .select('*')
    .eq('stream_id', streamId)
    .order('segment_index', { ascending: true });

  return segments;
};

export const getDVRPlaybackUrl = async (streamId: string, timestamp: number) => {
  const { data: segment } = await supabase
    .from('stream_dvr_segments')
    .select('*')
    .eq('stream_id', streamId)
    .lt('created_at', new Date(timestamp).toISOString())
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  return segment?.segment_url;
};