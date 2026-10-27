export type PublicEnvironment = {
  supabaseUrl: string;
  supabaseAnonKey: string;
  stage: 'development' | 'staging' | 'production';
};

/** Pure validation shared with tests. Never include credential values in errors. */
export function readPublicEnvironment(env: Record<string, unknown>): PublicEnvironment {
  const stage = env.VITE_APP_ENV || 'development';
  if (!['development', 'staging', 'production'].includes(String(stage))) {
    throw new Error('VITE_APP_ENV must be development, staging, or production.');
  }
  const url = String(env.VITE_SUPABASE_URL || '').trim();
  const key = String(env.VITE_SUPABASE_ANON_KEY || '').trim();
  if (!url || !key) {
    throw new Error('Configure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env.local.');
  }
  let parsed: URL;
  try { parsed = new URL(url); } catch { throw new Error('VITE_SUPABASE_URL must be a valid URL.'); }
  const local = ['localhost', '127.0.0.1', '[::1]'].includes(parsed.hostname);
  if ((parsed.protocol !== 'https:' && !(local && parsed.protocol === 'http:'))
      || parsed.username || parsed.password || parsed.search || parsed.hash
      || parsed.pathname !== '/') {
    throw new Error('Use an HTTPS Supabase origin (HTTP is allowed only on localhost).');
  }
  if (key.startsWith('sb_secret_')) throw new Error('A server secret cannot be used as a browser key.');
  if (!key.startsWith('sb_publishable_')) {
    try {
      const payload = JSON.parse(atob(key.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
      if (payload.role !== 'anon') throw new Error('invalid role');
    } catch {
      throw new Error('VITE_SUPABASE_ANON_KEY must be an anon JWT or publishable key, never a service-role key.');
    }
  }
  return { supabaseUrl: parsed.origin, supabaseAnonKey: key, stage: stage as PublicEnvironment['stage'] };
}
