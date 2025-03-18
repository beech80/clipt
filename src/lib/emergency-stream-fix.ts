// emergency-stream-fix.ts - Minimal approach for stream creation
import { supabase } from '@/integrations/supabase/client';

type MinimalStreamData = {
  id?: string;
  user_id: string;
  title?: string;
  stream_key?: string;
  is_live?: boolean;
  viewer_count?: number;
  [key: string]: any;
};

/**
 * Creates a stream entry with absolute minimal approach
 * This bypasses all schema issues by using a multi-step process
 */
export async function emergencyCreateStream(userId: string, title?: string): Promise<{ success: boolean; stream: MinimalStreamData | null; error?: any }> {
  console.log("Using absolute bare minimum stream creation approach");
  
  try {
    // Check if the user already has a stream
    const { data: existingStreams } = await supabase
      .from('streams')
      .select('id')
      .eq('user_id', userId);
    
    if (existingStreams && existingStreams.length > 0) {
      console.log("Stream already exists, fetching it");
      
      // Return the existing stream
      const { data: stream } = await supabase
        .from('streams')
        .select('*')
        .eq('id', existingStreams[0].id)
        .single();
      
      return { success: true, stream: stream || { id: existingStreams[0].id, user_id: userId } };
    }

    // STEP 1: Insert with only user_id field - the bare minimum
    console.log("Creating stream with only user_id");
    const { data, error } = await supabase
      .from('streams')
      .insert([{ user_id: userId }])
      .select('id');
    
    if (error || !data || data.length === 0) {
      console.error("Critical error creating stream:", error);
      return { success: false, stream: null, error: error || new Error("Failed to create stream") };
    }
    
    const streamId = data[0]?.id;
    if (!streamId) {
      return { success: false, stream: null, error: new Error("No ID returned from stream creation") };
    }
    
    // STEP 2: Return a minimal stream object without fetching
    const stream: MinimalStreamData = {
      id: streamId,
      user_id: userId,
      title: title || "My Stream",
      is_live: false,
      viewer_count: 0
    };
    
    return { success: true, stream };
  } catch (err) {
    console.error("Unhandled error creating stream:", err);
    return { success: false, stream: null, error: err };
  }
}
