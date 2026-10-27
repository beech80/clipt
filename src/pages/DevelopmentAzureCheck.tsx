import {useRef,useState} from 'react';
import {useAuth} from '@/contexts/AuthContext';
import {supabase,storageProjectUrl} from '@/integrations/supabase/client';
import {Button} from '@/components/ui/button';
const owner='1b0ea76e-a629-4f54-8ec5-1e4ae0e7a251';
export default function DevelopmentAzureCheck(){
 const {user}=useAuth();
 return user?.id===owner?<FixtureCheck key={user.id}/>:<main className="container max-w-2xl p-6 pb-64"><h1>Development Azure check</h1><p>Sign in to the owner of the approved public test photo. No scan was run.</p></main>;
}
function FixtureCheck(){
 const lock=useRef(false),[busy,setBusy]=useState(false),[attempted,setAttempted]=useState(false);
 const [messages,setMessages]=useState<string[]>([]),[error,setError]=useState('');
 async function run(){
  if(lock.current||attempted)return;lock.current=true;setBusy(true);setMessages([]);setError('');
  try {
   const identity=await supabase.auth.getUser();
   if(identity.error||identity.data.user?.id!==owner
    ||!['development','staging'].includes(import.meta.env.VITE_APP_ENV)
    ||storageProjectUrl!=='https://akiksrlzdqvipqbbjxpw.supabase.co')throw new Error('Designated development photo owner required.');
   const result=await supabase.functions.invoke('verify-photo-quarantine',{body:{}});
   if(result.error){
    const status=result.error.context instanceof Response?result.error.context.status:'unavailable';
    throw new Error('Fixture result not confirmed: HTTP '+status+'. Stop and send this result.');
   }
   if(!['needs_review','no_flag_detected','already_reserved'].includes(result.data?.state))throw new Error('No confirmed review result.');
   setMessages(['Quarantine integration request: c26f0d68-19f7-4f99-9c5a-52fe945caa10','Server result: '+result.data.state,
    result.data.state==='needs_review'?'Flagged result: independent quarantine verification required.':result.data.state==='already_reserved'?'Existing reservation: independent server result required; no new scan was run.':'No flag detected is not a safety guarantee. No quarantine/appeal pass is assumed.',
    'General scanning remains disabled. No private content or video was submitted.']);
  }catch(failure){setError(failure instanceof Error?failure.message:'Fixture result unavailable.');}
  finally{setBusy(false);setAttempted(true);lock.current=false;}
 }
 return <main className="container max-w-2xl space-y-5 p-6 pb-64">
  <h1 className="text-2xl font-bold">Azure public-photo integration test</h1>
  <p>Only public photo 0b28e432-16c4-4fc1-adc7-bec6ce263cd8 and its caption are sent to the approved Free resource. A real flag hides this test photo for review, not deletion or a ban.</p>
  <p>One fixed server request prevents repeat scans. Run once and send the result. No payments, account deletion, other uploads or private content are involved.</p>
  <Button disabled={busy||attempted} onClick={()=>void run()}>{busy?'Checking Azure…':'Run current public-photo Azure test'}</Button>
  {error&&<p role="alert">{error}</p>}
  <ul aria-live="polite" className="space-y-3 break-words">{messages.map((message,index)=><li key={index}>{message}</li>)}</ul>
 </main>;
}
