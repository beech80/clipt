import { useRef, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { billingPreviewMode } from '@/lib/billing-preview';
import { probeExistingSubscription, probeForeignBilling, probeFirstCheckout, type BillingCheck } from '@/lib/development-billing-check';
import { Button } from '@/components/ui/button';
import { BackButton } from '@/components/ui/back-button';

const fixture = '254c2a1a-17a5-4079-8800-8861e69bccb2';
const freshFixture = '875b6725-b8fd-4999-a5e5-9527daf01073';
export default function DevelopmentBillingCheck() {
  const { user } = useAuth();
  const [other, setOther] = useState(fixture);
  const [results, setResults] = useState<BillingCheck[]>([]);
  const [notice, setNotice] = useState('');
  const [running, setRunning] = useState(false);
  const lock = useRef(false);
  const allowed = import.meta.env.DEV && billingPreviewMode(import.meta.env).readiness;
  async function runFirstCheckout() {
    if (!allowed || user?.id !== freshFixture || lock.current) return;
    lock.current = true; setRunning(true); setNotice(''); setResults([]);
    try {
      const invoke = (endpoint: string, body: Record<string, unknown>) => supabase.functions.invoke(endpoint, { body });
      const ready = await invoke('billing-readiness', {});
      if (ready.error || ready.data?.testMode !== true || ready.data?.generalCheckoutVerified !== false
        || ready.data?.isolatedCheckoutAllowed !== true || ready.data?.pricesVerified !== true
        || ready.data?.webhookConfigured !== true || ready.data?.returnOriginValid !== true) {
        throw new Error('Designated Sandbox configuration not confirmed. No Checkout requests sent.');
      }
      const before = await supabase.from('user_subscriptions').select('id').eq('user_id', user.id);
      if (before.error || before.data?.length !== 0) throw new Error('Fresh account without membership required. No Checkout requests sent.');
      // Persist only the non-secret request ID BEFORE any provider operation.
      // Retries must never silently create a different checkout identity.
      const key = 'clipt.billing.concurrency.v1.' + user.id;
      let requestId = sessionStorage.getItem(key);
      if (!requestId) { requestId = crypto.randomUUID(); sessionStorage.setItem(key, requestId); }
      if (!/^[0-9a-f-]{36}$/i.test(requestId)) throw new Error('Saved request identity invalid. Stop and report it.');
      const checks = await probeFirstCheckout(invoke, requestId);
      const after = await supabase.from('user_subscriptions').select('id').eq('user_id', user.id);
      checks.push({ name: 'No unpaid membership granted', passed: !after.error && after.data?.length === 0,
        detail: !after.error && after.data?.length === 0 ? 'Membership remains empty.' : 'Not verified: unexpected membership or query failure.' });
      setResults(checks);
      setNotice('Send these results for independent server/provider counts. Do not subscribe, pay, clear the saved request identity, or create another account.');
    } catch (error) { setNotice(error instanceof Error ? error.message : 'Check interrupted; no success assumed.'); }
    finally { setRunning(false); lock.current = false; }
  }
  async function run() {
    if (!allowed || !user || lock.current) return;
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(other) || other === user.id) {
      setNotice('Enter a different development account UID for the ownership checks.'); return;
    }
    lock.current = true; setRunning(true); setNotice(''); setResults([]);
    const checks: BillingCheck[] = [];
    try {
      const invoke = (endpoint: string, body: Record<string, unknown>) => supabase.functions.invoke(endpoint, { body });
      checks.push(...await probeForeignBilling(invoke, other));
      const foreign = await supabase.from('user_subscriptions').select('id').eq('user_id', other).limit(1);
      checks.push({ name: 'Foreign membership is hidden by RLS', passed: !foreign.error && foreign.data?.length === 0,
        detail: !foreign.error && foreign.data?.length === 0 ? 'Owner-scoped query returned no foreign rows.' : 'Not verified: query failed or exposed a foreign row.' });
      if (checks.some(check => !check.passed)) throw new Error('Ownership checks did not all pass. Further requests stopped; report these results.');
      if (user.id === fixture) {
        const ready = await invoke('billing-readiness', {});
        if (ready.error || ready.data?.testMode !== true || ready.data?.generalCheckoutVerified !== false
          || ready.data?.isolatedCheckoutAllowed !== true || ready.data?.pricesVerified !== true) {
          throw new Error('Sandbox gate not confirmed. No concurrent Checkout requests sent.');
        }
        const before = await supabase.from('user_subscriptions').select('id,status,current_period_start,current_period_end,cancel_at_period_end')
          .eq('user_id', user.id).order('current_period_end', { ascending: false }).limit(1).maybeSingle();
        if (before.error || before.data?.status !== 'active') throw new Error('Existing subscription not confirmed. No concurrent Checkout requests sent.');
        checks.push(...await probeExistingSubscription(invoke));
        const after = await supabase.from('user_subscriptions').select('id,status,current_period_start,current_period_end,cancel_at_period_end')
          .eq('user_id', user.id).order('current_period_end', { ascending: false }).limit(1).maybeSingle();
        const unchanged = !after.error && JSON.stringify(before.data) === JSON.stringify(after.data);
        checks.push({ name: 'Recorded membership unchanged', passed: unchanged,
          detail: unchanged ? 'Owner membership snapshot unchanged.' : 'Not verified: membership changed or query failed.' });
      } else {
        setNotice('Second-account ownership checks only. Run again as the designated account for concurrent rejection checks.');
      }
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Checks interrupted. No success assumed.');
    } finally { setResults(checks); setRunning(false); lock.current = false; }
  }
  if (!allowed) return <main className="p-6">Development billing checks are unavailable here.</main>;
  return <main className="clipt-auth mx-auto max-w-3xl space-y-5 px-4 py-8">
    <header className="flex items-center gap-3"><BackButton /><h1 className="text-2xl font-bold">Development billing checks</h1></header>
    <p>No payment submission, redirects, account deletion or membership grants. Normal server authorization remains enforced.</p>
    <p>Signed-in development UID: {user?.id ?? 'Sign in first'}</p>
    <label className="block space-y-2">Different development account UID
      <input className="block w-full rounded border border-primary/40 bg-black p-3" value={other}
        onChange={event => setOther(event.target.value.trim())} disabled={running} spellCheck={false} />
    </label>
    <Button disabled={!user || running} onClick={() => void run()}>{running ? 'Running hosted checks…' : 'Run billing protection checks'}</Button>
    {user?.id === freshFixture && <Button disabled={running} onClick={() => void runFirstCheckout()}>Run first-time concurrent Sandbox Checkout check (no payment)</Button>}
    {notice && <p role="alert">{notice}</p>}
    <div aria-live="polite" className="space-y-3">{results.map(result => <section key={result.name} className="rounded border border-primary/40 p-4">
      <h2>{result.passed ? 'PASS' : 'NOT VERIFIED'} — {result.name}</h2><p>{result.detail}</p>
    </section>)}</div>
    <p>Complete billing readiness is not assumed from these results. Provider/session counts still need independent verification. No tokens or raw responses are stored or displayed; the first-time check saves only a non-secret retry request ID.</p>
  </main>;
}
