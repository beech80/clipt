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
  
  try {
    // Try to fetch a single stream first to see the actual columns that exist
    const { data: sampleStream, error: sampleError } = await supabase
      .from('streams')
      .select('*')
      .limit(1);
    
    // Determine what fields actually exist in the database
    const existingFields = sampleStream && sampleStream.length > 0 
      ? Object.keys(sampleStream[0]) 
      : ['user_id', 'title', 'stream_key']; // Absolute minimum fields
    
    // Create a minimal stream object with only fields that we know exist
    const minimalStreamData: Record<string, any> = {
      user_id: userId,
    };
    
    // Only add fields that exist in the schema
    if (existingFields.includes('title')) {
      minimalStreamData.title = streamData.title || `Stream`;
    }
    
    if (existingFields.includes('description')) {
      minimalStreamData.description = streamData.description || "Welcome to my stream!";
    }
    
    if (existingFields.includes('is_live')) {
      minimalStreamData.is_live = false;
    }
    
    if (existingFields.includes('stream_key')) {
      minimalStreamData.stream_key = streamData.stream_key;
    }
    
    if (existingFields.includes('rtmp_url')) {
      minimalStreamData.rtmp_url = streamData.rtmp_url;
    }
    
    if (existingFields.includes('viewer_count')) {
      minimalStreamData.viewer_count = 0;
    }
    
    if (existingFields.includes('created_at')) {
      minimalStreamData.created_at = new Date().toISOString();
    }
    
    // Only include updated_at if it exists in the schema
    if (existingFields.includes('updated_at')) {
      minimalStreamData.updated_at = new Date().toISOString();
    }
    
    console.log("Creating stream with validated fields:", minimalStreamData);
    
    // Attempt to create stream with the validated data
    const { data, error } = await supabase
      .from('streams')
      .insert(minimalStreamData)
      .select()
      .single();
      
    if (error) {
      console.error("Error creating stream with validated data:", error);
      
      // Last resort - create with only the user_id
      const { data: lastResortStream, error: lastResortError } = await supabase
        .from('streams')
        .insert({ user_id: userId })
        .select()
        .single();
        
      if (lastResortError) {
        return { success: false, error: lastResortError, stream: null };
      }
      
      return { success: true, stream: lastResortStream };
    }
    
    console.log("Successfully created stream:", data);
    return { success: true, stream: data };
  } catch (error) {
    console.error("Exception creating stream:", error);
    
    // Absolute last resort - try with just user_id
    try {
      const { data: emergencyStream, error: emergencyError } = await supabase
        .from('streams')
        .insert({ user_id: userId })
        .select()
        .single();
        
      if (!emergencyError && emergencyStream) {
        return { success: true, stream: emergencyStream };
      }
    } catch (e) {
      console.error("Emergency stream creation failed:", e);
    }
    
    return { success: false, error, stream: null };
  }
}
