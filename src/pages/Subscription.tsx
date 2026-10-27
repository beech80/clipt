import { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { BackButton } from '@/components/ui/back-button';
import { membershipCatalog } from '@/lib/membership-catalog';
import SubscriptionReadiness from '@/components/SubscriptionReadiness';
import { billingPreviewMode } from '@/lib/billing-preview';
import { membershipRead } from '@/lib/membership-read';

export default function Subscription() {
  const { user } = useAuth();
  const mode = billingPreviewMode(import.meta.env);
  const [testUser, setTestUser] = useState<string|null>(null);
  const checkoutDisabled = mode.checkoutDisabled && !(mode.readiness && user?.id === testUser);
  const busy = useRef(false);
  const [pending, setPending] = useState('');
  const [notice, setNotice] = useState('');
  const current = useQuery({
    queryKey: ['user-subscription', user?.id], enabled: Boolean(user), retry: false,
    queryFn: async () => {
      const { data, error } = await membershipRead(signal => supabase.from('user_subscriptions')
        .select('status,current_period_start,current_period_end,cancel_at_period_end,subscription_plans(clipt_membership_code)')
        .eq('user_id', user!.id).order('current_period_end', { ascending: false }).limit(1).abortSignal(signal).maybeSingle());
      if (error) throw error;
      return data;
    },
  });
  async function subscribe(plan: 'premium' | 'maxed') {
    if (checkoutDisabled) return;
    if (busy.current) return;
    if (!user) { setNotice('Sign in to manage membership.'); return; }
    busy.current = true; setPending(plan); setNotice('');
    try {
      const key='clipt.subscription.request.v1.'+user.id;
      const saved=sessionStorage.getItem(key);
      const attempt=saved?JSON.parse(saved):{plan,requestId:crypto.randomUUID()};
      if(attempt.plan!==plan||typeof attempt.requestId!=='string')throw new Error('Resolve the original pending checkout before choosing another plan.');
      sessionStorage.setItem(key,JSON.stringify(attempt));
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { plan, requestId: attempt.requestId },
      });
      if (error) {
        let expired = false;
        try {
          const response = error.context;
          if (response instanceof Response && response.status === 409) {
            const body = await response.json();
            expired = body?.error === 'Original checkout expired; refresh and start a new request';
          }
        } catch { /* Preserve uncertain attempts rather than start a duplicate. */ }
        if (expired) {
          sessionStorage.removeItem(key);
          throw new Error('The original sandbox checkout expired. You can start a new request.');
        }
        throw new Error('Sandbox checkout could not be confirmed. Retry the original request; no membership activation is assumed.');
      }
      if (!data?.testMode || typeof data.url !== 'string') throw new Error('Sandbox subscriptions are not yet configured. No membership activation is assumed.');
      const url = new URL(data.url);
      if (url.origin !== 'https://checkout.stripe.com' || url.username || url.password) throw new Error('Checkout destination could not be verified.');
      window.location.assign(url.href);
    } catch (error) { setNotice(error instanceof Error ? error.message : 'Checkout could not be started.'); }
    finally { busy.current = false; setPending(''); }
  }
  async function manage(action:'cancel'|'resume'|'change_plan',plan?:'premium'|'maxed') {
    if (checkoutDisabled) return;
    if(!user||busy.current)return;
    busy.current=true;setPending(action);setNotice('');
    try {
      const key='clipt.subscription.manage.v1.'+user.id;
      const saved=sessionStorage.getItem(key);
      const attempt=saved?JSON.parse(saved):{action,plan,requestId:crypto.randomUUID()};
      if(attempt.action!==action||attempt.plan!==plan)throw new Error('Retry the original pending membership change first.');
      sessionStorage.setItem(key,JSON.stringify(attempt));
      const {data,error}=await supabase.functions.invoke('manage-subscription',{body:attempt});
      if(error||data?.testMode!==true)throw new Error('Membership change could not be confirmed. Retry the same action; no change is assumed.');
      sessionStorage.removeItem(key);
      setNotice(data.fulfillmentStatus==='awaiting_paid_renewal'
        ?'Plan change scheduled for renewal. New benefits require a verified paid invoice.'
        :'Provider request accepted. Awaiting webhook confirmation; refresh membership status.');
      await current.refetch();
    }catch(error){setNotice(error instanceof Error?error.message:'Membership change unavailable.');}
    finally{busy.current=false;setPending('');}
  }
  // A recorded subscription can still renew even when its paid access expired.
  // Management is independently authorized against Stripe by the server.
  const recorded = current.data?.status === 'active';
  const active = recorded
    && new Date(current.data.current_period_start).getTime() <= Date.now()
    && new Date(current.data.current_period_end).getTime() > Date.now();
  useEffect(() => {
    // Clear the browser retry key only after owner-scoped server membership is
    // confirmed, never merely because the Checkout return URL was visited.
    if (active && user?.id) {
      try { sessionStorage.removeItem('clipt.subscription.request.v1.' + user.id); }
      catch { /* Storage failure must not invent or revoke membership. */ }
    }
  }, [active, user?.id]);
  return <main className="clipt-auth mx-auto max-w-4xl space-y-6 px-4 py-8">
    <header className="flex items-center gap-3"><BackButton /><h1 className="text-2xl font-bold">Clipt membership</h1></header>
    <p>Monthly automatic renewal. Cancellation keeps benefits until the paid period ends. Sandbox only; no real billing is enabled.</p>
    <SubscriptionReadiness onTestAccess={(id,allowed)=>setTestUser(allowed?id:null)}/>
    {mode.checkoutDisabled&&!checkoutDisabled&&<p role="status">Isolated development test account only: Sandbox Checkout and management are enabled. General checkout remains disabled.</p>}
    {checkoutDisabled && <p role="status">Checkout and billing changes are disabled while sandbox verification is incomplete.</p>}
    {!user ? <p>Sign in to see your membership.</p> : current.isPending ? <p role="status">Checking membership…</p> : current.isError
      ? <div role="alert"><p>Membership status could not be loaded.</p><Button onClick={() => void current.refetch()}>Retry status</Button></div>
      : <section aria-label="Server membership status">
        <p>{active ? 'Active membership recorded by the server.' : 'No active membership recorded.'}</p>
        {active && current.data?.cancel_at_period_end && <p>Cancellation scheduled. Benefits remain until {new Date(current.data.current_period_end).toLocaleDateString()}.</p>}
        {recorded && !active && <p>A subscription is recorded, but its paid access is not current. No membership benefits are granted. You can manage future billing below.</p>}
        {recorded && <div className="space-y-3">
          <p>Plan changes take effect at renewal, with no mid-period charge. New benefits require a paid invoice. Provider controls remain gated until sandbox verification.</p>
          <Button variant="outline" disabled={checkoutDisabled || Boolean(pending)} onClick={()=>void manage(current.data?.cancel_at_period_end?'resume':'cancel')}>
            {current.data?.cancel_at_period_end?'Resume monthly renewal':active?'Cancel at paid period end':'Cancel future renewal'}
          </Button>
          <Button variant="outline" disabled={Boolean(pending)} onClick={()=>void current.refetch()}>Refresh membership status</Button>
        </div>}
      </section>}
    <div className="grid gap-5 md:grid-cols-2">{(Object.keys(membershipCatalog) as ('premium' | 'maxed')[]).map(code => {
      const plan = membershipCatalog[code];
      return <Card key={code} className="space-y-4 p-6"><h2 className="text-xl font-bold">{plan.name}</h2>
        <p>${(plan.cents / 100).toFixed(2)} USD / month</p>
        <ul className="space-y-2">{plan.features.map(feature => <li key={feature}>{feature}</li>)}</ul>
        <Button disabled={checkoutDisabled || !user || Boolean(pending) || Boolean(recorded) || current.isPending || current.isError} onClick={() => void subscribe(code)}>
          {pending === code ? 'Checking sandbox checkout…' : 'Subscribe in sandbox'}
        </Button>
        {recorded&&<Button variant="outline" disabled={checkoutDisabled||Boolean(pending)||Boolean(current.data?.cancel_at_period_end)} onClick={()=>void manage('change_plan',code)}>Switch to {plan.name} at renewal</Button>}
      </Card>;
    })}</div>
    {notice && <p role="alert">{notice}</p>}
    <p className="text-sm">Tokens are earned, not purchased. Trophy is a free ranking signal, not a payment.</p>
  </main>;
}
