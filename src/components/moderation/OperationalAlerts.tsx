import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const labels = {
  render_failure: 'Screen failure reported',
  cron_failure: 'Scheduled task needs attention',
  verification: 'Alert delivery verification',
};

export function OperationalAlerts() {
  const { user } = useAuth();
  const client = useQueryClient();
  const key = ['operational-alerts', user?.id];
  const query = useQuery({
    queryKey: key,
    enabled: Boolean(user),
    retry: false,
    refetchInterval: 60_000,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('list_operational_alerts').retry(false);
      if (error || !Array.isArray(data)) throw new Error('Operations alerts unavailable');
      return data;
    },
  });
  const acknowledge = useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase.rpc('ack_operational_alert', { alert_id: id }).retry(false);
      if (error || data !== id) throw new Error('Acknowledgment unconfirmed');
    },
    onSuccess: () => { void client.invalidateQueries({ queryKey: key }); },
    onError: () => toast.error('Alert acknowledgment was not confirmed. Please refresh.'),
  });
  return <section id="operations-alerts" aria-labelledby="operations-title" className="gaming-card space-y-4 p-4">
    <h2 id="operations-title" className="flex items-center gap-2 text-xl font-semibold">
      <AlertTriangle aria-hidden="true" className="h-5 w-5" /> Operations alerts
    </h2>
    <p className="text-sm text-muted-foreground">In-app alerts for reported screen failures and failed scheduled jobs. No error text, private messages or signed URLs are collected. Recent alerts are retained for 14 days. Email and push delivery are not configured.</p>
    <Button variant="outline" onClick={() => void query.refetch()} disabled={query.isFetching}>Refresh alerts</Button>
    {query.isPending ? <p role="status">Loading operations alerts…</p> : query.isError ?
      <p role="alert">Operations alerts could not be loaded. Refresh to try again.</p> :
      query.data.length === 0 ? <p role="status">No recent operations alerts.</p> :
      <ul className="space-y-3">{query.data.map(alert => <li key={alert.id} className="space-y-2 rounded-lg border border-purple-500/40 p-3">
        <p className="font-medium">{labels[alert.kind as keyof typeof labels] ?? 'Operations alert'}</p>
        <p className="text-sm">Area: {alert.route_key} · Reports: {alert.occurrences}</p>
        <time className="block text-sm text-muted-foreground" dateTime={alert.last_seen_at}>{new Date(alert.last_seen_at).toLocaleString()}</time>
        {alert.acknowledged ? <p className="text-sm">Acknowledged</p> :
          <Button disabled={acknowledge.isPending} onClick={() => acknowledge.mutate(alert.id)}>Acknowledge alert</Button>}
      </li>)}</ul>}
  </section>;
}
