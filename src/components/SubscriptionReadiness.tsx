import {useRef,useState} from 'react';
import {useAuth} from '@/contexts/AuthContext';
import {supabase} from '@/lib/supabase';
import {Button} from '@/components/ui/button';
import {Card} from '@/components/ui/card';
import {z} from 'zod';
import {billingPreviewMode} from '@/lib/billing-preview';

const schema=z.object({
 testMode:z.literal(true),generalCheckoutVerified:z.literal(false),
 missingFields:z.array(z.string()),pricesVerified:z.boolean(),
 premiumVerified:z.boolean().optional(),maxedVerified:z.boolean().optional(),
 webhookConfigured:z.boolean(),returnOriginValid:z.boolean(),
 returnOriginMatchesCurrentPreview:z.boolean().optional(),
 lifecycleVerified:z.literal(false).optional(),
 isolatedCheckoutAllowed:z.boolean().optional(),
});
export default function SubscriptionReadiness({onTestAccess}:{onTestAccess?:(userId:string,allowed:boolean)=>void}) {
 const {user}=useAuth();
 return user&&billingPreviewMode(import.meta.env).readiness?<AccountReadiness key={user.id} onTestAccess={allowed=>onTestAccess?.(user.id,allowed)}/>:null;
}
function AccountReadiness({onTestAccess}:{onTestAccess:(allowed:boolean)=>void}) {
 const [data,setData]=useState<z.infer<typeof schema>|null>(null);
 const [error,setError]=useState(''),[busy,setBusy]=useState(false);
 const lock=useRef(false);
 async function check() {
  if(lock.current)return;lock.current=true;setBusy(true);setError('');setData(null);onTestAccess(false);
  try {
   const response=await supabase.functions.invoke('billing-readiness',{body:{}});
   if(response.error) {
    // Function errors contain only intentionally sanitized server messages.
    let message='Readiness check unavailable. Sign in with the designated development test account and retry.';
    try {const body=await response.error.context?.json();if(typeof body?.error==='string')message=body.error;}catch{/* No raw provider errors. */}
    throw new Error(message);
   }
   const checked=schema.safeParse(response.data);
   if(!checked.success)throw new Error('Readiness response could not be verified. No billing readiness is assumed.');
   setData(checked.data);
   onTestAccess(checked.data.isolatedCheckoutAllowed===true&&checked.data.pricesVerified&&checked.data.webhookConfigured&&checked.data.returnOriginValid);
  }catch(failure){setError(failure instanceof Error?failure.message:'Readiness check unavailable.');}
  finally{lock.current=false;setBusy(false);}
 }
 return <Card className="p-5 space-y-3 border-primary/40" aria-label="Development billing readiness">
  <h2 className="font-semibold">Development sandbox readiness</h2>
  <p className="text-sm">Read-only check for the designated test account. No Checkout, payment, membership grant or database write.</p>
  <Button variant="outline" disabled={busy} onClick={()=>void check()}>{busy?'Checking sandbox…':'Check sandbox configuration'}</Button>
  {error&&<p role="alert" className="text-sm">{error}</p>}
  {data&&<div role="status" className="space-y-2 text-sm">
   <p>Premium monthly price: {data.premiumVerified?'Verified $4.99 USD':'Not verified'}</p>
   <p>Maxed monthly price: {data.maxedVerified?'Verified $14.99 USD':'Not verified'}</p>
   <p>Development webhook destination/events: {data.webhookConfigured?'Configured — signature/delivery still unverified':'Not verified'}</p>
   <p>HTTPS return origin: {data.returnOriginValid?'Format valid — development isolation still requires review':'Missing or invalid'}</p>
   <p>Current development Preview destination: {data.returnOriginMatchesCurrentPreview===true?'Server configuration matches the current corrected Preview — rendered return flow still requires verification':data.returnOriginMatchesCurrentPreview===false?'Does not match the current corrected Preview; review server configuration':'Not checked by this server version'}</p>
   <p>Isolated Sandbox test access: {data.isolatedCheckoutAllowed===true?'Designated account allowed — not general billing approval':'Not configured for this account; checkout stays disabled'}</p>
   {data.missingFields.length>0&&<p>Missing server configuration: {data.missingFields.join(', ')}</p>}
   <p>General checkout verification flag remains false. Full billing lifecycle is not yet verified.</p>
  </div>}
 </Card>;
}
