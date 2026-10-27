import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';

const receiptKey = 'clipt-account-erasure-v1';
type Receipt = { requestId: string; receipt: string; userId: string };
function readReceipt(): Receipt | null {
  try {
    const value = JSON.parse(sessionStorage.getItem(receiptKey) || 'null');
    return value && typeof value.userId === 'string' && /^[a-f0-9-]{36}$/i.test(value.requestId)
      && /^[a-f0-9]{64}$/.test(value.receipt) ? value : null;
  } catch { return null; }
}

export default function DeleteAccount() {
  const { user } = useAuth();
  const [receipt, setReceipt] = useState(readReceipt);
  const [confirmation, setConfirmation] = useState('');
  const [state, setState] = useState<'idle' | 'cleanup' | 'complete'>(() => {
    try { return !user && Date.now() - Number(sessionStorage.getItem(receiptKey + '-complete') || 0) < 300000 ? 'complete' : 'idle'; }
    catch { return 'idle'; }
  });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const running = useRef(false);
  const foreignReceipt = Boolean(receipt && user && receipt.userId !== user.id);

  async function submit() {
    if (running.current || foreignReceipt || (!receipt && (!user || confirmation !== 'DELETE'))) return;
    running.current = true; setBusy(true); setError('');
    try {
      let current = receipt;
      const resume = Boolean(current);
      if (!current && user) {
        const bytes = crypto.getRandomValues(new Uint8Array(32));
        current = { userId: user.id, requestId: crypto.randomUUID(), receipt: Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('') };
        // Save before submission so ambiguous responses never create a second job.
        sessionStorage.setItem(receiptKey, JSON.stringify(current));
        setReceipt(current);
      }
      if (!current) return;
      let { data, error: failure } = await supabase.functions.invoke('account-deletion', {
        body: { action: resume ? 'resume' : 'begin', requestId: current.requestId,
          receipt: current.receipt, ...(resume ? {} : { userId: current.userId, confirmation: 'DELETE' }) },
      });
      // A lost request before it reached the server has no job yet. Reuse the
      // same identity only after normal owner authentication, never a new job.
      if (resume && failure?.context instanceof Response && failure.context.status === 403 && user?.id === current.userId) {
        const retried = await supabase.functions.invoke('account-deletion', { body: {
          action: 'begin', requestId: current.requestId, receipt: current.receipt,
          userId: user.id, confirmation: 'DELETE',
        } });
        data = retried.data; failure = retried.error;
      }
      if (failure) {
        const status = failure.context instanceof Response ? failure.context.status : 0;
        if (!resume && [400,401,403,409].includes(status)) {
          sessionStorage.removeItem(receiptKey); setReceipt(null);
        }
        throw new Error(status === 409 ? 'Deletion is blocked by an active photo review, subscription, shared resource, provider media or hold. Your request did not commit a deletion. Retry after the blocking condition is resolved.' : 'Deletion could not be confirmed. Keep this tab and retry; no success is assumed.');
      }
      if (data?.state !== 'complete' && data?.state !== 'cleanup') throw new Error('The server did not confirm deletion status. Retry using this saved request.');
      setState(data.state);
      if (data.state === 'complete') {
        sessionStorage.setItem(receiptKey + '-complete', String(Date.now()));
        sessionStorage.removeItem(receiptKey); setReceipt(null);
        await supabase.auth.signOut({ scope: 'local' });
      }
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Deletion could not be confirmed.'); }
    finally { running.current = false; setBusy(false); }
  }

  return <main className="mx-auto max-w-xl p-4 pb-52">
    <Card className="p-5 space-y-4">
      <h1 className="text-2xl font-bold">Delete account</h1>
      {state === 'complete' ? <>
        <p role="status">Account deletion confirmed. Your account, public profile and account-linked data have been removed, and owned storage cleanup is complete.</p>
        <p className="text-sm text-muted-foreground">Only minimized financial/security records subject to the retention policy below remain. They are not publicly accessible.</p>
        <Link to="/start" className="underline">Return to Start</Link>
      </> : <>
        <p>This is permanent. Once accepted, your profile, posts/drafts, comments, likes, follows, account-linked messages, settings and other nonessential account data are erased. Owned media and sign-in access are removed before completion is confirmed.</p>
        <p className="text-sm text-muted-foreground">In development, verified subscription billing is stopped before account deletion, without an automatic refund. Pending billing operations, external provider media or shared resources may need review first. Keep this tab and its saved receipt until completion is confirmed.</p>
        {state === 'cleanup' && <p role="status">Account data erased; remaining storage/Auth cleanup is in progress. Keep this tab and retry completion.</p>}
        {foreignReceipt && <p role="alert">A different account has an unfinished deletion request in this tab. Sign out before resuming that request.</p>}
        {!receipt && user && <div className="space-y-2">
          <label htmlFor="delete-confirmation">Type DELETE to confirm</label>
          <Input id="delete-confirmation" value={confirmation} onChange={event => setConfirmation(event.target.value)} autoComplete="off" disabled={busy} />
        </div>}
        {!receipt && !user ? <Link to="/login" className="underline">Sign in to request deletion</Link> : <Button variant="destructive" onClick={() => void submit()} disabled={busy || foreignReceipt || (!receipt && confirmation !== 'DELETE')}>
          {busy ? 'Confirming deletion…' : receipt ? 'Retry deletion completion' : 'Permanently delete my account'}
        </Button>}
        {error && <p role="alert">{error}</p>}
      </>}
      <section className="space-y-2 text-sm text-muted-foreground" aria-label="Retention policy">
        <h2 className="text-base font-semibold text-white">Limited records retained</h2>
        <p>Financial/accounting records: 7 years by default for accounting, refunds, disputes, fraud prevention and legal/tax obligations. Security/abuse records: 2 years by default. Periods are configurable for applicable requirements.</p>
        <p>Active disputes, chargebacks, fraud investigations and legal holds can extend retention until resolved and the applicable period expires. Retained records exclude unnecessary profile details, passwords and stream/payment credentials. Restricted records are purged after expiry when no hold applies.</p>
        <p>This cannot recall copies previously downloaded by other people. Provider or backup retention may require separate handling; deletion is not a claim that all third-party copies disappear immediately.</p>
      </section>
    </Card>
  </main>;
}
