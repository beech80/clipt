// apply-migrations.js
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get current directory since __dirname isn't available in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Get Supabase credentials from environment or config
const SUPABASE_URL = process.env.SUPABASE_URL || "https://slnjliheyiiummxhrgmk.supabase.co";
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_SERVICE_KEY) {
  console.error('Error: SUPABASE_SERVICE_KEY environment variable is required');
  console.error('Usage: SUPABASE_SERVICE_KEY=your_service_key node apply-migrations.js');
  process.exit(1);
}

// Create Supabase client with service key
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Read migration files
const migrationsDir = path.join(__dirname, 'migrations');
const files = fs.readdirSync(migrationsDir).sort();

async function applyMigrations() {
  for (const file of files) {
    if (!file.endsWith('.sql')) continue;
    
    console.log(`Applying migration: ${file}`);
    const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
    
    try {
      // Execute the SQL directly using Supabase's REST API
      const { data, error } = await supabase.rpc('exec_sql', { sql });
      
      if (error) {
        console.error(`Error applying migration ${file}:`, error);
      } else {
        console.log(`Successfully applied migration: ${file}`);
      }
    } catch (err) {
      console.error(`Failed to apply migration ${file}:`, err);
    }
  }
}

applyMigrations()
  .then(() => console.log('Migrations complete'))
  .catch(err => console.error('Migration error:', err));
