import { supabase } from "@/lib/supabase";

interface DVRSegment {
  id: string;
  segment_url: string;
  segment_duration: string;
  segment_index: number;
  created_at: string;
}

export const getDVRSegments = async (streamId: string): Promise<DVRSegment[]> => {
  const { data, error } = await supabase
    .from('stream_dvr_segments')
    .select('*')
    .eq('stream_id', streamId)
    .order('segment_index', { ascending: true });

  if (error) {
    console.error('Error fetching DVR segments:', error);
    return [];
  }

  return data || [];
};

export const getDVRPlaybackUrl = async (streamId: string, timestamp: number): Promise<string | null> => {
  const { data: segments } = await supabase
    .from('stream_dvr_segments')
    .select('*')
    .eq('stream_id', streamId)
    .order('segment_index', { ascending: true });

  if (!segments?.length) return null;

  // Find the segment that contains the requested timestamp
  let currentTime = 0;
  for (const segment of segments) {
    const duration = parseFloat(segment.segment_duration);
    if (currentTime <= timestamp && timestamp < currentTime + duration) {
      return segment.segment_url;
    }
    currentTime += duration;
  }

  return segments[0].segment_url; // Return first segment if timestamp not found
};