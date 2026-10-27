import type { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { LegalLinks } from '@/components/LegalLinks';

const publicPaths = new Set(['/login', '/reset-password', '/forgot-password',
  '/update-password', '/resend-verification', '/privacy', '/terms',
  '/docs/privacy-policy', '/docs/terms-of-service', '/delete-account']);

/** Navigation UX only. Server membership/RLS and Edge guards are authoritative. */
export function BetaAccessGate({ children }: { children: ReactNode }) {
  const required = import.meta.env.VITE_BETA_ACCESS_REQUIRED === 'true';
  const { pathname } = useLocation();
  const { user, loading, signOut } = useAuth();
  const publicPage = publicPaths.has(pathname);
  const access = useQuery({
    queryKey: ['beta-access', user?.id ?? 'guest'],
    enabled: required && !publicPage && !loading && Boolean(user),
    queryFn: async ({ signal }) => {
      const { data, error } = await supabase.rpc('clipt_beta_access').abortSignal(signal);
      if (error) throw new Error('Beta access could not be checked.');
      return data === true;
    },
    retry: false,
    staleTime: 0,
    refetchInterval: 60_000,
    refetchIntervalInBackground: false,
  });
  if (!required || publicPage) return <>{children}</>;
  if (loading || (user && access.isPending)) return <main className="mx-auto max-w-md p-6"><p role="status">Checking beta invitation…</p></main>;
  if (user && access.data === true && !access.isError) return <>{children}</>;
  return <main className="clipt-auth mx-auto max-w-md space-y-4 p-6">
    <h1 className="text-2xl font-bold">CLIPT private beta</h1>
    <p>This free beta is available only to explicitly invited accounts. Payments are disabled.</p>
    {access.isError ? <><p role="alert">We couldn’t verify your invitation. Access remains closed until the check succeeds.</p>
      <button type="button" disabled={access.isFetching} onClick={() => void access.refetch()}>Retry invitation check</button></>
      : user ? <p role="status">This account does not currently have an active beta invitation.</p>
      : <Link to="/login">Sign in with your invited account</Link>}
    {user && <button type="button" onClick={() => void signOut().catch(() => undefined)}>Sign out to switch accounts</button>}
    <a className="block" href="mailto:beecher@cliptgaming.com">Contact beta support</a>
    <Link className="block" to="/delete-account">Manage account deletion</Link>
    <LegalLinks />
  </main>;
}
