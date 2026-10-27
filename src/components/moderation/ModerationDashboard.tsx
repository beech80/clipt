import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { ReportedContent } from './ReportedContent';
import { OperationalAlerts } from './OperationalAlerts';
import { PhotoReviewQueue } from './PhotoReviewQueue';
import { PhotoQuarantineQueue } from './PhotoQuarantineQueue';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { ShieldCheck, Flag, BookOpen } from 'lucide-react';
import { Link } from 'react-router-dom';

export const ModerationDashboard = () => {
  const { user } = useAuth();
  const role = useQuery({
    queryKey: ['moderation-role', user?.id],
    enabled: Boolean(user),
    retry: false,
    queryFn: async () => {
      const { data, error } = await supabase.from('user_roles').select('role')
        .eq('user_id', user!.id).in('role', ['admin', 'moderator']).limit(1).retry(false);
      if (error) throw error;
      return data.length > 0;
    },
  });
  return <main className="clipt-moderation mx-auto max-w-6xl space-y-5 px-4 py-6">
    <header className="flex flex-wrap items-center gap-3 border-b border-purple-500/40 pb-4"><ShieldCheck aria-hidden="true" className="h-7 w-7 text-purple-300" /><h1 className="text-2xl font-bold">Admin / Moderation Dashboard</h1><span className="rounded border border-purple-400/50 px-3 py-1 text-xs text-purple-200">Authorized staff only</span></header>
    {role.data && <PhotoReviewQueue />}
    {role.data && <PhotoQuarantineQueue />}
    {role.data && <OperationalAlerts />}
    {role.isPending ? <p role="status">Checking moderator access…</p> : role.isError ?
      <div role="alert"><p>Moderator access could not be checked.</p><Button onClick={() => void role.refetch()}>Retry</Button></div> :
      !role.data ? <p role="alert">Access denied. A server-assigned moderator or admin role is required.</p> :
      <div className="clipt-moderation-layout"><nav aria-label="Moderation sections" className="gaming-card p-4 space-y-3"><a className="flex min-h-12 items-center gap-2 rounded border border-purple-500/40 p-3" href="#moderation-reports"><Flag aria-hidden="true" className="h-5 w-5" />Content reports</a><Link className="flex min-h-12 items-center gap-2 rounded border border-purple-500/40 p-3" to="/docs/user-guide"><BookOpen aria-hidden="true" className="h-5 w-5" />Guidance & limitations</Link><p className="text-xs text-muted-foreground">The development photo pilot has separate review and quarantine controls above when configured. General account bans, account appeals and global staff analytics are not available here.</p></nav><div id="moderation-reports" className="min-w-0 space-y-4"><p className="text-sm text-muted-foreground">Review reports, dismiss them, or hide a reported post. Hiding preserves the post and its media; it does not erase already-public media URLs.</p><ReportedContent /></div></div>}
  </main>;
};
