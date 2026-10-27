import {useRef,useState} from 'react';
import {useAuth} from '@/contexts/AuthContext';
import {supabase,storageProjectUrl} from '@/integrations/supabase/client';
import {Button} from '@/components/ui/button';
import {automaticPhotoFixture,runAutomaticPhotoStorageCheck} from '@/lib/automatic-photo-storage-check';

export default function AutomaticPhotoCheck(){
 const {user}=useAuth();
 return user?.id===automaticPhotoFixture.owner?<FixtureCheck key={user.id}/>:<main className="container max-w-2xl p-6"><h1>Development photo check</h1><p>Sign in to the approved disposable account. No changes were made.</p></main>;
}
function FixtureCheck(){
 const lock=useRef(false),[busy,setBusy]=useState(false),[attempted,setAttempted]=useState(false);
 const [messages,setMessages]=useState<string[]>([]),[error,setError]=useState('');
 async function run(){
  if(lock.current||attempted)return;lock.current=true;setBusy(true);setError('');setMessages([]);
  try{await runAutomaticPhotoStorageCheck(supabase,{project:storageProjectUrl,stage:import.meta.env.VITE_APP_ENV},
   message=>setMessages(previous=>[...previous,message]));}
  catch(failure){setError(failure instanceof Error?failure.message:'Test not confirmed. Stop and report the result.');}
  finally{setBusy(false);setAttempted(true);lock.current=false;}
 }
 return <main className="container max-w-2xl space-y-5 p-6 pb-64">
  <h1 className="text-2xl font-bold">Disposable photo Storage check</h1>
  <p>This development-only check attempts to replace and remove only the approved test photo during its processing hold. It expects both actions to be refused and verifies the bytes are unchanged.</p>
  <p>No Azure scan, payment, account deletion, or other account’s media is involved. Run once, then send all results. A generic server error is not an authorization pass.</p>
  <Button disabled={busy||attempted} onClick={()=>void run()}>{busy?'Checking held photo…':'Run held-photo Storage check once'}</Button>
  {error&&<p role="alert">{error}</p>}
  <ul aria-live="polite" className="space-y-3 break-words">{messages.map((message,index)=><li key={index}>{message}</li>)}</ul>
 </main>;
}
