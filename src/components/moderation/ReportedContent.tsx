import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export const ReportedContent = () => {
  const { user } = useAuth();
  const [pendingOnly, setPendingOnly] = useState(true);
  const cache = useQueryClient();
  const reports = useQuery({
    queryKey: ['content-reports', user?.id, pendingOnly],
    retry: false,
    queryFn: async () => {
      let query = supabase.from('content_reports')
        .select('id,content_id,content_type,reason,notes,status,created_at,action_taken,resolved_at,resolved_by,severity_level')
        .order('created_at', { ascending: false }).order('id').limit(100);
      if (pendingOnly) query = query.in('status', ['pending', 'reviewed']);
      const { data, error } = await query.retry(false);
      if (error) throw error;
      return data;
    },
  });
  const review = useMutation({
    mutationFn: async ({ id, decision }: { id: string; decision: 'dismiss' | 'hide_post' }) => {
      const { data, error } = await supabase.rpc('review_content_report', { report_id: id, decision });
      if (error || data !== id) throw error ?? new Error('Review not confirmed');
    },
    onSuccess: () => {
      void cache.invalidateQueries({ queryKey: ['content-reports'] });
      void cache.invalidateQueries({ queryKey: ['top-clipts'] });
      toast.success('Report decision saved');
    },
    onError: () => toast.error('Review was not confirmed. Refresh the queue before retrying.'),
  });
  return <section className="space-y-4" aria-label="Content reports">
    <div className="flex flex-wrap gap-2">
      <Button aria-pressed={pendingOnly} onClick={() => setPendingOnly(true)}>Pending</Button>
      <Button aria-pressed={!pendingOnly} onClick={() => setPendingOnly(false)}>All reports</Button>
      <Button variant="outline" disabled={reports.isFetching} onClick={() => void reports.refetch()}>Refresh</Button>
    </div>
    <p className="text-xs text-muted-foreground">Showing up to 100 most recent matching reports.</p>
    {reports.isSuccess && <div aria-label="Loaded report summary" className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      {[{label:'Reports in this view',value:reports.data.length},{label:'Awaiting review in this view',value:reports.data.filter(report=>['pending','reviewed'].includes(report.status)).length},{label:'Other statuses in this view',value:reports.data.filter(report=>!['pending','reviewed'].includes(report.status)).length}].map(({label,value})=><div key={label} className="gaming-card p-4"><p className="text-sm text-purple-200">{label}</p><p className="text-2xl font-semibold tabular-nums">{value}</p></div>)}
    </div>}
    {reports.isPending ? <p role="status">Loading reports…</p> : reports.isError ?
      <p role="alert">Reports could not be loaded. Use Refresh to try again.</p> : !reports.data?.length ?
      <p>No reports to review in this view.</p> : reports.data.map(report =>
        <article key={report.id} className="gaming-card space-y-3 rounded-xl border border-primary/40 p-4 [overflow-wrap:anywhere]">
          <h2 className="font-semibold">{report.content_type} report · {report.status}</h2>
          <p className="break-words">Reason: {report.reason}</p>
          {report.notes ? <p className="break-words text-sm">{report.notes}</p> : null}
          <p className="text-xs text-muted-foreground">Submitted {new Date(report.created_at).toLocaleString()}</p>
          {report.content_type === 'post' ? <Link className="inline-block underline" to={`/post/${report.content_id}`}>View reported post</Link> : null}
          {['pending', 'reviewed'].includes(report.status) ? <div className="flex flex-wrap gap-2">
            {report.content_type === 'post' ? <Button variant="destructive" disabled={review.isPending} onClick={() => {
              if (window.confirm('Hide this post from other users? The post and media will be retained.')) review.mutate({ id: report.id, decision: 'hide_post' });
            }}>Hide post</Button> : null}
            <Button variant="outline" disabled={review.isPending} onClick={() => review.mutate({ id: report.id, decision: 'dismiss' })}>Dismiss report</Button>
          </div> : <p className="text-sm">Decision: {report.action_taken ?? report.status}{report.resolved_at ? ` · ${new Date(report.resolved_at).toLocaleString()}` : ''}</p>}
        </article>)}
  </section>;
};
