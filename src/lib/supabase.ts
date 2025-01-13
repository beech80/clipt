import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    'Missing Supabase environment variables. Please connect your Supabase project by clicking the Supabase menu in the top right corner.'
  );
}

export const supabase = createClient(supabaseUrl, supabaseKey);