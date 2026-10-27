import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';
import { readPublicEnvironment } from '@/lib/environment';

let configuration: ReturnType<typeof readPublicEnvironment> | undefined;
export let configurationError: string | undefined;
try {
  configuration = readPublicEnvironment(import.meta.env);
} catch (error) {
  configurationError = error instanceof Error ? error.message : 'Invalid application configuration.';
}

// The UI displays a setup error when configuration is missing. The inert client
// also rejects every request, so importing a page cannot contact an old project.
export const storageProjectUrl = configuration?.supabaseUrl;
export const supabase = createClient<Database>(
  configuration?.supabaseUrl || 'http://127.0.0.1:54321',
  configuration?.supabaseAnonKey || 'unconfigured',
  {
    auth: {
      autoRefreshToken: Boolean(configuration),
      persistSession: Boolean(configuration),
      detectSessionInUrl: Boolean(configuration),
    },
    global: configuration ? {} : {
      fetch: async () => { throw new Error(configurationError); },
    },
    realtime: { params: { eventsPerSecond: 10 } },
  },
);
