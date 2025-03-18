// schema-analyzer.ts - A utility to analyze and log the database schema
import { supabase } from '@/integrations/supabase/client';

/**
 * Logs the schema of a table to help diagnose database issues
 * @param tableName - The name of the table to analyze
 */
export async function analyzeTableSchema(tableName: string) {
  console.log(`Analyzing schema for table: ${tableName}`);
  
  try {
    // Get column information from information_schema
    const { data: columns, error } = await supabase.from('information_schema.columns')
      .select('column_name, data_type, is_nullable')
      .eq('table_schema', 'public')
      .eq('table_name', tableName);
    
    if (error) {
      console.error(`Error fetching schema for ${tableName}:`, error);
      return null;
    }
    
    console.log(`Schema for ${tableName}:`, columns);
    return columns;
  } catch (err) {
    console.error(`Exception analyzing schema for ${tableName}:`, err);
    return null;
  }
}

/**
 * Creates a diagnostic log of the user's environment
 * Useful for debugging database issues
 */
export async function createDiagnosticLog() {
  console.log("Creating diagnostic log...");
  
  try {
    // Check if we can connect to Supabase
    const { data: connectionTest, error: connectionError } = await supabase
      .from('pg_catalog.pg_tables')
      .select('tablename')
      .eq('schemaname', 'public')
      .limit(1);
    
    if (connectionError) {
      console.error("Failed to connect to Supabase:", connectionError);
    } else {
      console.log("Successfully connected to Supabase");
    }
    
    // Get a list of all tables in the database
    const { data: tables, error: tablesError } = await supabase
      .from('pg_catalog.pg_tables')
      .select('tablename')
      .eq('schemaname', 'public');
    
    if (tablesError) {
      console.error("Error getting tables:", tablesError);
    } else {
      console.log("Tables in database:", tables);
      
      // Analyze each table's schema
      for (const table of tables || []) {
        await analyzeTableSchema(table.tablename);
      }
    }
    
    // Check if specific tables exist
    const criticalTables = ['streams', 'profiles', 'games'];
    for (const tableName of criticalTables) {
      const { data, error } = await supabase
        .from('pg_catalog.pg_tables')
        .select('tablename')
        .eq('schemaname', 'public')
        .eq('tablename', tableName);
      
      const exists = data && data.length > 0;
      console.log(`Table '${tableName}' exists: ${exists}`);
      
      if (exists) {
        await analyzeTableSchema(tableName);
      }
    }
    
    return {
      timestamp: new Date().toISOString(),
      tables: tables,
      connection: connectionError ? 'failed' : 'success'
    };
  } catch (error) {
    console.error("Error creating diagnostic log:", error);
    return {
      timestamp: new Date().toISOString(),
      error: String(error)
    };
  }
}
