import { supabase } from '@/integrations/supabase/client';

// Create stored procedure for initializing messaging tables
export const setupMessagingTables = async () => {
  const { error } = await supabase.rpc('create_messaging_schema', {});
  if (error) {
    console.error("Failed to create messaging schema:", error);
    return { success: false, error };
  }
  
  return { success: true };
};

// Function to create messaging tables directly through REST API
// This approach doesn't require RPC functions to be set up
export const createMessagingTablesDirectly = async () => {
  try {
    // Use Supabase REST API to execute SQL directly
    // This requires that you have the right permissions
    const response = await fetch(`${supabase.supabaseUrl}/rest/v1/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabase.supabaseKey}`,
        'apikey': supabase.supabaseKey,
        'X-Client-Info': 'clipt-web'
      },
      body: JSON.stringify({
        query: `
          -- Create messages table
          CREATE TABLE IF NOT EXISTS public.messages (
            id SERIAL PRIMARY KEY,
            sender_id UUID REFERENCES auth.users(id) NOT NULL,
            recipient_id UUID REFERENCES auth.users(id) NOT NULL,
            message TEXT NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            read BOOLEAN DEFAULT FALSE
          );
          
          -- Create groups table
          CREATE TABLE IF NOT EXISTS public.groups (
            id SERIAL PRIMARY KEY,
            name TEXT NOT NULL,
            created_by UUID REFERENCES auth.users(id) NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );
          
          -- Create group_members table
          CREATE TABLE IF NOT EXISTS public.group_members (
            id SERIAL PRIMARY KEY,
            group_id INTEGER REFERENCES public.groups(id) NOT NULL,
            user_id UUID REFERENCES auth.users(id) NOT NULL,
            role TEXT DEFAULT 'member',
            joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            UNIQUE(group_id, user_id)
          );
          
          -- Create group_messages table
          CREATE TABLE IF NOT EXISTS public.group_messages (
            id SERIAL PRIMARY KEY,
            group_id INTEGER REFERENCES public.groups(id) NOT NULL,
            sender_id UUID REFERENCES auth.users(id) NOT NULL,
            message TEXT NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );
        `
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error("SQL execution failed:", errorData);
      return { success: false, error: errorData };
    }
    
    return { success: true };
  } catch (error) {
    console.error("Error setting up messaging tables:", error);
    return { success: false, error };
  }
};

// Simple function to check if a table exists
export const checkTableExists = async (tableName: string) => {
  const { error } = await supabase
    .from(tableName)
    .select('count(*)')
    .limit(1);
    
  return !error;
};

// Create messages table with just the REST API
export const createMessagesTable = async () => {
  try {
    // Check if the table already exists
    const { data, error } = await supabase
      .from('messages')
      .select('count(*)')
      .limit(1);
      
    if (!error) {
      // Table already exists
      return { success: true, exists: true };
    }
    
    // Create the table directly with Supabase's JavaScript client
    // This is a simpler approach than using SQL directly
    const { error: createError } = await supabase.rpc('exec', { 
      query: `
        CREATE TABLE IF NOT EXISTS public.messages (
          id SERIAL PRIMARY KEY,
          sender_id UUID NOT NULL,
          recipient_id UUID NOT NULL,
          message TEXT NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          read BOOLEAN DEFAULT FALSE
        );
      `
    });
    
    if (createError) {
      // Alternative approach if RPC fails
      try {
        // Use REST API as fallback
        const response = await fetch(`${supabase.supabaseUrl}/rest/v1/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabase.supabaseKey}`,
            'apikey': supabase.supabaseKey,
            'X-Client-Info': 'clipt-web'
          },
          body: JSON.stringify({
            query: `
              CREATE TABLE IF NOT EXISTS public.messages (
                id SERIAL PRIMARY KEY,
                sender_id UUID NOT NULL,
                recipient_id UUID NOT NULL,
                message TEXT NOT NULL,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                read BOOLEAN DEFAULT FALSE
              );
            `
          })
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          console.error("REST API table creation failed:", errorData);
          
          // Try one more approach - create with psql-like method
          return createFallbackMessagesTable();
        }
        
        return { success: true, exists: false };
      } catch (restError) {
        console.error("REST attempt failed:", restError);
        return createFallbackMessagesTable();
      }
    }
    
    return { success: true, exists: false };
  } catch (error) {
    console.error("Error creating messages table:", error);
    return createFallbackMessagesTable();
  }
};

// Last resort fallback method
const createFallbackMessagesTable = async () => {
  try {
    // Create just the basic functionality we need - a way to store messages
    // This bypasses the need for SQL privileges
    
    // First try to get a session token for this user
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session) {
      console.error("No valid session:", sessionError);
      return { success: false, error: sessionError || "No valid session" };
    }
    
    // Try to create a Storage bucket to use as a makeshift database
    const { error: bucketError } = await supabase.storage.createBucket('messages', {
      public: false
    });
    
    if (bucketError && !bucketError.message.includes('already exists')) {
      console.error("Failed to create storage bucket:", bucketError);
      return { success: false, error: bucketError };
    }
    
    console.log("Created/verified messages storage bucket as fallback");
    
    // Create an empty readme file to verify we can write to it
    const { error: uploadError } = await supabase.storage
      .from('messages')
      .upload('README.txt', new Blob(['Messages storage for Clipt']), {
        upsert: true
      });
      
    if (uploadError) {
      console.error("Failed to write to messages bucket:", uploadError);
      return { success: false, error: uploadError };
    }
    
    return { 
      success: true, 
      fallback: true, 
      message: "Created fallback message storage" 
    };
  } catch (error) {
    console.error("Final fallback attempt failed:", error);
    return { success: false, error };
  }
};

export { supabase };