import { readPublicEnvironment } from '../src/lib/environment.ts';

const developmentOrigin = 'https://akiksrlzdqvipqbbjxpw.supabase.co';

export function developmentPreviewEnvironment(env) {
  const config = readPublicEnvironment({ ...env, VITE_APP_ENV: 'staging' });
  if (config.supabaseUrl !== developmentOrigin) {
    throw new Error('Preview must use the designated development Supabase project.');
  }
  if (!config.supabaseAnonKey.startsWith('sb_publishable_')) {
    const claims = JSON.parse(Buffer.from(config.supabaseAnonKey.split('.')[1], 'base64url').toString());
    if (claims.ref !== 'akiksrlzdqvipqbbjxpw') {
      throw new Error('Preview browser key must belong to the development project.');
    }
  }
  return config;
}

export async function verifyPreviewPublicKey(config, request = fetch) {
  if (config.supabaseUrl !== developmentOrigin) throw new Error('Unexpected Preview origin.');
  const result = await request(developmentOrigin + '/auth/v1/settings', {
    headers: { apikey: config.supabaseAnonKey },
    signal: AbortSignal.timeout(15000),
  });
  if (!result.ok) throw new Error('Development browser configuration was not accepted by Supabase.');
}
