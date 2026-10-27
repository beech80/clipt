import { useRef, useState } from 'react';
import { supabase, storageProjectUrl } from '@/integrations/supabase/client';
import { runDevelopmentStorageCheck, runDevelopmentScanStorageCheck } from '@/lib/development-storage-check';
import { Button } from '@/components/ui/button';

export default function DevelopmentStorageCheck() {
  const lock = useRef(false);
  const [busy, setBusy] = useState(false);
  const [messages, setMessages] = useState<string[]>([]);
  const [error, setError] = useState('');
  const report = (text: string) => setMessages(previous => [...previous, text]);
  async function run() {
    if (lock.current) return;
    lock.current = true; setBusy(true); setMessages([]); setError('');
    try {
      const response = await fetch('/og-image.png');
      if (!response.ok) throw new Error('Repository fixture unavailable.');
      await runDevelopmentStorageCheck(supabase, await response.blob(), {
        dev: import.meta.env.DEV, hostname: location.hostname, project: storageProjectUrl,
      }, report);
      report('Storage API run completed. This does not certify active-scanner races.');
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : 'Storage verification failed.');
    } finally { lock.current = false; setBusy(false); }
  }
  async function runScanGuard() {
    if(lock.current)return;
    lock.current=true;setBusy(true);setMessages([]);setError('');
    try {
      await runDevelopmentScanStorageCheck(supabase,{
        dev:import.meta.env.DEV,hostname:location.hostname,project:storageProjectUrl,
      },report);
    } catch(failure) {
      setError(failure instanceof Error?failure.message:'Pending-lock verification failed.');
    } finally {lock.current=false;setBusy(false);}
  }
  async function runAzureVerification() {
    if(lock.current)return;
    lock.current=true;setBusy(true);setMessages([]);setError('');
    try {
      const {data:session,error:identityError}=await supabase.auth.getUser();
      if(identityError||session.user?.id!=='875b6725-b8fd-4999-a5e5-9527daf01073'
        ||!import.meta.env.DEV||!['127.0.0.1','localhost'].includes(location.hostname)
        ||storageProjectUrl!=='https://akiksrlzdqvipqbbjxpw.supabase.co')
        throw new Error('Designated replacement photo account on development localhost required.');
      const retryKey='clipt.azure.verification.v1.'+session.user.id;
      let requestId=sessionStorage.getItem(retryKey);
      if(!requestId){requestId=crypto.randomUUID();sessionStorage.setItem(retryKey,requestId);}
      if(!/^[0-9a-f-]{36}$/i.test(requestId))throw new Error('Saved verification request invalid. Stop and report it.');
      report('Azure verification request: '+requestId);
      const {data,error:failure}=await supabase.functions.invoke('review-public-photo',{
        body:{postId:'8ce1d610-d203-4775-8723-942052a02026',requestId},
      });
      if(failure){
        let detail='No confirmed HTTP response; check your signed-in session and connection.';
        if(failure.context instanceof Response){
          detail='HTTP '+failure.context.status+'.';
          try {
            const rejected=await failure.context.clone().json();
            const safeMessages=['Public photo review pilot is disabled','Approved verification resource required',
              'This service is not configured','Authentication required','Invalid or expired session',
              'Verify your authenticator to continue','Verified account required','The operation could not be completed'];
            if(safeMessages.includes(rejected?.error))detail+=' '+rejected.error;
          }catch{/* Never display raw response bodies or provider details. */}
        }
        throw new Error('Azure verification not confirmed: '+detail+' No safety approval is assumed. Keep the saved request identity.');
      }
      if(!['needs_review','no_flag_detected','already_reserved'].includes(data?.state))
        throw new Error('Azure verification did not confirm a result. No safety approval is assumed.');
      report('Server review result: '+data.state);
      if(data.state==='already_reserved')report('An existing reservation is not proof of completed Azure processing; independent server state is required.');
      for(const [label,postId] of [
        ['Squad video','289fadc8-62f9-43a4-bb00-167edf706eaa'],
        ['other-account private draft','e4a2240e-4aa6-4c1c-87dd-6064ef265e6e'],
      ]) {
        const denied=await supabase.functions.invoke('review-public-photo',{
          body:{postId,requestId:crypto.randomUUID()},
        });
        if(!denied.error||!(denied.error.context instanceof Response)||denied.error.context.status!==503)
          throw new Error('Verification scope refusal was not confirmed; stop provider testing.');
        report('PASS: '+label+' refused before scanning by verification scope.');
      }
      report('A no-flag result is not a safety guarantee. General scanning remains disabled.');
    } catch(failure) {
      setError(failure instanceof Error?failure.message:'Azure verification failed.');
    } finally {lock.current=false;setBusy(false);}
  }
  async function runStaffBoundary() {
    if(lock.current)return;
    lock.current=true;setBusy(true);setMessages([]);setError('');
    try {
      const identity=await supabase.auth.getUser();
      if(identity.error||identity.data.user?.id!=='1b0ea76e-a629-4f54-8ec5-1e4ae0e7a251'
        ||!import.meta.env.DEV||!['127.0.0.1','localhost'].includes(location.hostname)
        ||storageProjectUrl!=='https://akiksrlzdqvipqbbjxpw.supabase.co')
        throw new Error('Former temporary reviewer account on development localhost required.');
      const result=await supabase.rpc('azure_photo_review_queue' as never);
      if(result.error?.code!=='42501')throw new Error('Non-staff review access denial was not confirmed.');
      report('PASS: authenticated non-staff moderator-queue RPC denied by the server.');
    } catch(failure) {
      setError(failure instanceof Error?failure.message:'Staff boundary verification failed.');
    } finally {lock.current=false;setBusy(false);}
  }
  return <main className="container max-w-3xl p-6 space-y-4">
    <h1 className="text-xl font-bold">Development Storage verification</h1>
    <p>Localhost only. Creates temporary repository-image fixtures in your own private media prefix, checks simultaneous requests, then removes only that run’s fixtures. No account, existing media, post or provider scan changes.</p>
    <Button disabled={busy} onClick={() => void run()}>{busy ? 'Testing Storage…' : 'Run authenticated Storage checks'}</Button>
    <p>The controlled fixture lock has been reconciled. No Azure dispatch or account deletion occurs from this page. Do not rerun the mutation check after lock release.</p>
    <Button disabled title="Controlled review lock released">Test disposable photo scan lock</Button>
    <p>Limited Azure verification sends only the designated public-photo fixture and its caption to the approved Free resource. No private content, videos, or messages. General scanning remains disabled.</p>
    <Button disabled={busy} onClick={()=>void runAzureVerification()}>Verify Azure public-photo fixture</Button>
    <p>Read-only access check for the former temporary reviewer after its Moderator role was removed. An exact server authorization denial is required.</p>
    <Button disabled={busy} onClick={()=>void runStaffBoundary()}>Check non-staff review access</Button>
    {error && <p role="alert">{error}</p>}
    <ul aria-live="polite" className="space-y-2">{messages.map((text,index) => <li key={index}>{text}</li>)}</ul>
  </main>;
}
