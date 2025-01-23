import { supabase } from "@/lib/supabase";

interface DVRSegment {
  id: string;
  segment_url: string;
  segment_duration: string;
  segment_index: number;
  created_at: string;
  stream_id: string;
  cdn_edge_location: string | null;
  cdn_performance_metrics: Record<string, any>;
  storage_status: string;
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

  return (data as DVRSegment[]) || [];
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
  for (const segment of segments as DVRSegment[]) {
    // Parse the interval string to get duration in seconds
    const durationStr = segment.segment_duration.replace(/\s*\w+\s*/g, ''); // Remove units (e.g., "seconds")
    const duration = parseFloat(durationStr);
    
    if (currentTime <= timestamp && timestamp < currentTime + duration) {
      return segment.segment_url;
    }
    currentTime += duration;
  }

  return (segments as DVRSegment[])[0].segment_url; // Return first segment if timestamp not found
};