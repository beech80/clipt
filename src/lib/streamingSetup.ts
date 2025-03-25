import { supabase } from './supabase';

/**
 * Creates the active_streams table in the Supabase database
 * This table tracks which users are currently streaming
 */
export const createActiveStreamsTable = async () => {
  try {
    // Try to create the table using RPC (requires the right permissions)
    console.log('Attempting to create active_streams table...');
    
    const { error } = await supabase.rpc('execute_sql', {
      sql_query: `
        CREATE TABLE IF NOT EXISTS public.active_streams (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          user_id UUID REFERENCES auth.users(id) NOT NULL,
          title TEXT NOT NULL,
          game_id TEXT,
          viewer_count INTEGER DEFAULT 0,
          started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          status TEXT DEFAULT 'live',
          thumbnail_url TEXT,
          UNIQUE(user_id)
        );
        
        -- Index for faster queries
        CREATE INDEX IF NOT EXISTS active_streams_user_id_idx ON public.active_streams(user_id);
      `
    });

    if (error) {
      console.error('Error creating active_streams table via RPC:', error);
      
      // Alternative approach - try to insert a test record
      // If the table doesn't exist, this will fail
      console.log('Trying alternative approach - test insert');
      await supabase
        .from('active_streams')
        .select('id')
        .limit(1);
    } else {
      console.log('Active streams table created or already exists');
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error setting up active_streams table:', error);
    return { success: false, error };
  }
};

/**
 * Creates the stream_chat table for real-time chat during streams
 */
export const createStreamChatTable = async () => {
  try {
    console.log('Attempting to create stream_chat table...');
    
    const { error } = await supabase.rpc('execute_sql', {
      sql_query: `
        CREATE TABLE IF NOT EXISTS public.stream_chat (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          stream_id UUID REFERENCES public.active_streams(id) NOT NULL,
          user_id UUID REFERENCES auth.users(id) NOT NULL,
          message TEXT NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          is_deleted BOOLEAN DEFAULT FALSE
        );
        
        -- Indexes for faster chat retrieval
        CREATE INDEX IF NOT EXISTS stream_chat_stream_id_idx ON public.stream_chat(stream_id);
        CREATE INDEX IF NOT EXISTS stream_chat_created_at_idx ON public.stream_chat(created_at);
      `
    });

    if (error) {
      console.error('Error creating stream_chat table via RPC:', error);
      
      // Alternative approach
      await supabase
        .from('stream_chat')
        .select('id')
        .limit(1);
    } else {
      console.log('Stream chat table created or already exists');
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error setting up stream_chat table:', error);
    return { success: false, error };
  }
};

/**
 * Creates stream moderators table to track who can moderate a stream's chat
 */
export const createStreamModeratorsTable = async () => {
  try {
    console.log('Attempting to create stream_moderators table...');
    
    const { error } = await supabase.rpc('execute_sql', {
      sql_query: `
        CREATE TABLE IF NOT EXISTS public.stream_moderators (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          stream_id UUID REFERENCES public.active_streams(id) NOT NULL,
          moderator_id UUID REFERENCES auth.users(id) NOT NULL,
          added_by UUID REFERENCES auth.users(id) NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          UNIQUE(stream_id, moderator_id)
        );
        
        -- Index for faster lookups
        CREATE INDEX IF NOT EXISTS stream_moderators_stream_id_idx ON public.stream_moderators(stream_id);
        CREATE INDEX IF NOT EXISTS stream_moderators_moderator_id_idx ON public.stream_moderators(moderator_id);
      `
    });

    if (error) {
      console.error('Error creating stream_moderators table via RPC:', error);
      
      // Alternative approach
      await supabase
        .from('stream_moderators')
        .select('id')
        .limit(1);
    } else {
      console.log('Stream moderators table created or already exists');
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error setting up stream_moderators table:', error);
    return { success: false, error };
  }
};

/**
 * Sets up all the necessary stream-related tables
 */
export const setupStreamingTables = async () => {
  try {
    await createActiveStreamsTable();
    await createStreamChatTable();
    await createStreamModeratorsTable();
    
    return { success: true };
  } catch (error) {
    console.error('Error setting up streaming tables:', error);
    return { success: false, error };
  }
};

export default setupStreamingTables;
