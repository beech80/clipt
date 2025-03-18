// schema-fix.ts - Functions to check and repair database schema issues
import { supabase } from '@/integrations/supabase/client';

/**
 * Checks for and auto-repairs schema issues related to streams table
 */
export async function checkAndRepairStreamsSchema() {
  try {
    console.log("Checking streams schema...");
    
    // First, check if the streams table exists at all
    const { data: tablesData, error: tablesError } = await supabase
      .from('pg_catalog.pg_tables')
      .select('tablename')
      .eq('schemaname', 'public')
      .eq('tablename', 'streams');
    
    if (tablesError) {
      console.error("Error checking for streams table:", tablesError);
      return { success: false, error: tablesError };
    }
    
    if (!tablesData || tablesData.length === 0) {
      console.error("Streams table does not exist!");
      return { success: false, error: "Streams table not found" };
    }
    
    // Now, check if the game_id column exists
    const { data: columnsData, error: columnsError } = await supabase
      .from('information_schema.columns')
      .select('column_name')
      .eq('table_schema', 'public')
      .eq('table_name', 'streams')
      .eq('column_name', 'game_id');
    
    if (columnsError) {
      console.error("Error checking for game_id column:", columnsError);
      return { success: false, error: columnsError };
    }
    
    const gameIdExists = columnsData && columnsData.length > 0;
    
    if (!gameIdExists) {
      console.log("Game ID column missing - attempting to create it");
      
      // If we're here, the game_id column doesn't exist, try to create it
      // We need to use RPC or a direct query to execute SQL
      try {
        // Add the column if it doesn't exist
        const { error: addColumnError } = await supabase.rpc('exec_sql', {
          sql: "ALTER TABLE public.streams ADD COLUMN IF NOT EXISTS game_id UUID REFERENCES games(id)"
        });
        
        if (addColumnError) {
          console.error("Error adding game_id column:", addColumnError);
          
          // Second approach: use supabase.sql() (if available)
          try {
            // @ts-ignore - This may or may not exist depending on the client version
            const { error: sqlError } = await supabase.sql(`
              ALTER TABLE public.streams ADD COLUMN IF NOT EXISTS game_id UUID REFERENCES games(id)
            `);
            
            if (sqlError) {
              console.error("Second attempt failed:", sqlError);
              return { success: false, error: sqlError };
            }
          } catch (err) {
            console.error("SQL execution not supported with this client:", err);
            return { success: false, error: err };
          }
        } else {
          console.log("Successfully added game_id column");
          return { success: true };
        }
      } catch (error) {
        console.error("Error executing SQL to add column:", error);
        return { success: false, error };
      }
    } else {
      console.log("game_id column exists, no repair needed");
      return { success: true };
    }
    
    return { success: true };
  } catch (error) {
    console.error("Unexpected error checking schema:", error);
    return { success: false, error };
  }
}

/**
 * Function to avoid game_id errors in stream creation
 * This provides a safer stream creation that works regardless of schema
 */
export async function createStreamSafely(userId: string, streamData: any) {
  // First, clean the input data to remove any fields that might not exist in the schema
  const safeStreamData = { ...streamData };
  
  // Initialize the base stream data that we know exists in the schema
  const baseStreamData = {
    user_id: userId,
    title: streamData.title || `Stream`,
    description: streamData.description || "Welcome to my stream!",
    is_live: false,
    stream_key: streamData.stream_key,
    rtmp_url: streamData.rtmp_url,
    viewer_count: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  
  try {
    // Attempt to create stream with the base data only
    const { data, error } = await supabase
      .from('streams')
      .insert(baseStreamData)
      .select()
      .single();
      
    if (error) {
      console.error("Error creating stream with base data:", error);
      return { success: false, error, stream: null };
    }
    
    console.log("Successfully created stream with base data:", data);
    return { success: true, stream: data };
  } catch (error) {
    console.error("Exception creating stream:", error);
    return { success: false, error, stream: null };
  }
}
