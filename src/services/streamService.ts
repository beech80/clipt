import { supabase } from "@/lib/supabase";

export interface Stream {
  id: string;
  title: string;
  description: string;
  user_id: string;
  is_live: boolean;
  started_at: string | null;
  ended_at: string | null;
  stream_key: string;
  rtmp_url: string;
  stream_path: string;
  thumbnail_url: string | null;
  viewer_count: number;
  game_id: string | null;
  created_at: string;
}

interface CreateStreamParams {
  title: string;
  description: string;
  game_id?: string;
  thumbnail_url?: string;
}

export interface StreamResponse {
  data: any | null;
  error: Error | null;
}

/**
 * Create a new stream for the current user
 */
export const createStream = async (params: CreateStreamParams): Promise<StreamResponse> => {
  try {
    const { data: userData, error: userError } = await supabase.auth.getUser();
    
    if (userError) {
      throw new Error('You must be logged in to create a stream');
    }
    
    const { data, error } = await supabase
      .from('streams')
      .insert({
        user_id: userData.user.id,
        title: params.title,
        description: params.description,
        game_id: params.game_id || null,
        thumbnail_url: params.thumbnail_url || null,
        is_live: false
      })
      .select(`
        id, 
        title, 
        description, 
        user_id, 
        is_live, 
        started_at, 
        ended_at,
        stream_key,
        rtmp_url,
        stream_path,
        thumbnail_url,
        viewer_count,
        game_id,
        created_at
      `)
      .single();

    if (error) throw error;

    return { data, error: null };
  } catch (error) {
    console.error("Error creating stream:", error);
    return { data: null, error: error as Error };
  }
};

/**
 * Get a stream by ID
 */
export const getStreamById = async (streamId: string): Promise<StreamResponse> => {
  try {
    const { data, error } = await supabase
      .from('streams')
      .select(`
        id, 
        title, 
        description, 
        user_id,
        profiles:user_id(username, avatar_url),
        is_live, 
        started_at, 
        ended_at,
        stream_key,
        rtmp_url,
        stream_path,
        thumbnail_url,
        viewer_count,
        game_id,
        games:game_id(name, cover_url),
        created_at
      `)
      .eq('id', streamId)
      .single();

    if (error) throw error;

    return { data, error: null };
  } catch (error) {
    console.error("Error getting stream:", error);
    return { data: null, error: error as Error };
  }
};

/**
 * Get the current user's active stream
 */
export const getUserStream = async (): Promise<StreamResponse> => {
  try {
    const { data: userData, error: userError } = await supabase.auth.getUser();
    
    if (userError) {
      throw new Error('You must be logged in to get your stream');
    }

    // First check if there's an active stream
    const { data: activeStream, error: activeError } = await supabase
      .from('streams')
      .select(`
        id, 
        title, 
        description, 
        user_id, 
        is_live, 
        started_at, 
        ended_at,
        stream_key,
        rtmp_url,
        stream_path,
        thumbnail_url,
        viewer_count,
        game_id,
        games:game_id(name, cover_url),
        created_at
      `)
      .eq('user_id', userData.user.id)
      .eq('is_live', true)
      .maybeSingle();

    if (activeError) throw activeError;

    // If active stream exists, return it
    if (activeStream) {
      return { data: activeStream, error: null };
    }

    // Otherwise, get or create a default stream
    const { data: existingStream, error: existingError } = await supabase
      .from('streams')
      .select(`
        id, 
        title, 
        description, 
        user_id, 
        is_live, 
        started_at, 
        ended_at,
        stream_key,
        rtmp_url,
        stream_path,
        thumbnail_url,
        viewer_count,
        game_id,
        games:game_id(name, cover_url),
        created_at
      `)
      .eq('user_id', userData.user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existingError) throw existingError;

    // If a previous stream exists, return it
    if (existingStream) {
      return { data: existingStream, error: null };
    }

    // Otherwise, create a new stream
    return await createStream({
      title: `${userData.user.user_metadata?.username || 'User'}'s Stream`,
      description: 'Welcome to my Clipt stream!'
    });
  } catch (error) {
    console.error("Error getting user stream:", error);
    return { data: null, error: error as Error };
  }
};

/**
 * Start a stream
 */
export const startStream = async (streamId: string): Promise<StreamResponse> => {
  try {
    const { data, error } = await supabase
      .from('streams')
      .update({
        is_live: true,
        started_at: new Date().toISOString(),
        ended_at: null
      })
      .eq('id', streamId)
      .select()
      .single();

    if (error) throw error;

    return { data, error: null };
  } catch (error) {
    console.error("Error starting stream:", error);
    return { data: null, error: error as Error };
  }
};

/**
 * End a stream
 */
export const endStream = async (streamId: string): Promise<StreamResponse> => {
  try {
    const { data, error } = await supabase
      .from('streams')
      .update({
        is_live: false,
        ended_at: new Date().toISOString()
      })
      .eq('id', streamId)
      .select()
      .single();

    if (error) throw error;

    return { data, error: null };
  } catch (error) {
    console.error("Error ending stream:", error);
    return { data: null, error: error as Error };
  }
};

/**
 * Update stream metadata
 */
export const updateStream = async (streamId: string, updates: Partial<Stream>): Promise<StreamResponse> => {
  try {
    const { data, error } = await supabase
      .from('streams')
      .update(updates)
      .eq('id', streamId)
      .select()
      .single();

    if (error) throw error;

    return { data, error: null };
  } catch (error) {
    console.error("Error updating stream:", error);
    return { data: null, error: error as Error };
  }
};

/**
 * Regenerate stream key
 */
export const regenerateStreamKey = async (streamId: string): Promise<StreamResponse> => {
  try {
    const { data: userData, error: userError } = await supabase.auth.getUser();
    
    if (userError) {
      throw new Error('You must be logged in to regenerate a stream key');
    }

    // First, directly call the RPC function
    const { data: newKey, error: rpcError } = await supabase.rpc('generate_stream_key');
    
    if (rpcError) {
      console.error("Error calling RPC function:", rpcError);
      throw rpcError;
    }
    
    if (!newKey) {
      throw new Error('Failed to generate new stream key');
    }
    
    console.log("Successfully generated new key:", newKey);
    
    // Then update the stream with the new key
    const { data, error } = await supabase
      .from('streams')
      .update({ stream_key: newKey })
      .eq('id', streamId)
      .eq('user_id', userData.user.id) // Ensure user only updates own stream
      .select('id, stream_key')
      .single();

    if (error) {
      console.error("Error updating stream with new key:", error);
      throw error;
    }

    return { data: { stream_key: newKey }, error: null };
  } catch (error) {
    console.error("Error regenerating stream key:", error);
    return { data: null, error: error as Error };
  }
};

/**
 * Get active streams
 */
export const getActiveStreams = async (limit = 10, page = 0): Promise<StreamResponse> => {
  try {
    const offset = page * limit;
    
    const { data, error, count } = await supabase
      .from('streams')
      .select(`
        id, 
        title, 
        description, 
        user_id,
        profiles:user_id(username, avatar_url),
        is_live, 
        started_at,
        thumbnail_url,
        viewer_count,
        game_id,
        games:game_id(name, cover_url)
      `, { count: 'exact' })
      .eq('is_live', true)
      .order('viewer_count', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    return { 
      data: { 
        streams: data,
        total: count,
        page,
        limit,
        hasMore: (offset + limit) < (count || 0)
      }, 
      error: null 
    };
  } catch (error) {
    console.error("Error getting active streams:", error);
    return { data: null, error: error as Error };
  }
};
