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

// Function to create messaging tables directly from SQL
export const createMessagingTablesDirectly = async () => {
  try {
    // Create messages table
    const { error: messagesError } = await supabase.rpc('create_tables', {
      query: `
        CREATE TABLE IF NOT EXISTS messages (
          id SERIAL PRIMARY KEY,
          sender_id UUID REFERENCES auth.users(id) NOT NULL,
          recipient_id UUID REFERENCES auth.users(id) NOT NULL,
          message TEXT NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          read BOOLEAN DEFAULT FALSE
        );
      `
    });
    
    if (messagesError) {
      console.error("Error creating messages table:", messagesError);
      return { success: false, error: messagesError };
    }
    
    // Create groups table
    const { error: groupsError } = await supabase.rpc('create_tables', {
      query: `
        CREATE TABLE IF NOT EXISTS groups (
          id SERIAL PRIMARY KEY,
          name TEXT NOT NULL,
          created_by UUID REFERENCES auth.users(id) NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    });
    
    if (groupsError) {
      console.error("Error creating groups table:", groupsError);
      return { success: false, error: groupsError };
    }
    
    // Create group_members table
    const { error: membersError } = await supabase.rpc('create_tables', {
      query: `
        CREATE TABLE IF NOT EXISTS group_members (
          id SERIAL PRIMARY KEY,
          group_id INTEGER REFERENCES groups(id) NOT NULL,
          user_id UUID REFERENCES auth.users(id) NOT NULL,
          role TEXT DEFAULT 'member',
          joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          UNIQUE(group_id, user_id)
        );
      `
    });
    
    if (membersError) {
      console.error("Error creating group_members table:", membersError);
      return { success: false, error: membersError };
    }
    
    // Create group_messages table
    const { error: groupMessagesError } = await supabase.rpc('create_tables', {
      query: `
        CREATE TABLE IF NOT EXISTS group_messages (
          id SERIAL PRIMARY KEY,
          group_id INTEGER REFERENCES groups(id) NOT NULL,
          sender_id UUID REFERENCES auth.users(id) NOT NULL,
          message TEXT NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    });
    
    if (groupMessagesError) {
      console.error("Error creating group_messages table:", groupMessagesError);
      return { success: false, error: groupMessagesError };
    }
    
    return { success: true };
  } catch (error) {
    console.error("Error setting up messaging tables:", error);
    return { success: false, error };
  }
};

export { supabase };