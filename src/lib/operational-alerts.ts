import { supabase } from '@/lib/supabase';

export type OperationalRoute = 'feed' | 'profile' | 'messages' | 'discovery' | 'settings' | 'create' | 'other';

export function operationalRoute(pathname: string): OperationalRoute {
  const first = pathname.split('/')[1];
  if (first === '' || first === 'clipts' || first === 'squad') return 'feed';
  if (first === 'profile' || first === 'user') return 'profile';
  if (first === 'messages') return 'messages';
  if (first === 'discovery' || first === 'search' || first === 'games') return 'discovery';
  if (first === 'settings') return 'settings';
  if (first === 'new-post' || first === 'upload') return 'create';
  return 'other';
}

/** Deliberately accepts no Error, stack, URL query, user text or browser fingerprint. */
export async function reportOperationalFailure(pathname: string): Promise<void> {
  try {
    await supabase.rpc('report_operational_issue', { route_key: operationalRoute(pathname) }).retry(false);
  } catch {
    // Reporting must never throw into the already-failed render tree or retry writes.
  }
}
