import {Capacitor} from '@capacitor/core';
import {supabase} from '@/lib/supabase';
import {nativeBroadcastBridge} from './bridge';
import {nativeCurrentSession} from './session';
type Source={auth:{onAuthStateChange(callback:(event:string,session:{user:{id:string}}|null)=>void):{data:{subscription:{unsubscribe():void}}}}};
type Runtime={isNativePlatform():boolean;isPluginAvailable(name:string):boolean};
type Controls={stop():Promise<void>;getStatus():Promise<string>;current():Promise<unknown>};
// App-scoped: a Screen Live session must survive route changes, but never a
// sign-out or account switch. This listener does not authorize any broadcast.
export function watchNativeBroadcastAccount(source:Source,runtime:Runtime,controls:Controls,defer:(fn:()=>void)=>void=fn=>{setTimeout(fn,0);}){
 if(!runtime.isNativePlatform()||!runtime.isPluginAvailable('CliptBroadcaster'))return ()=>{};
 let owner:string|undefined,epoch=0,disposed=false;
 const stop=()=>{void controls.stop().catch(()=>undefined);};
 const {data:{subscription}}=source.auth.onAuthStateChange((event,session)=>{
  const previous=owner,next=session?.user.id,version=++epoch;
  owner=next;
  if(event==='SIGNED_OUT'||!next||(previous!==undefined&&next!==previous)){
   defer(()=>{if(!disposed)stop();});return;
  }
  if(event==='INITIAL_SESSION'){
   // Recover native state without ending the same owner's background capture.
   // Run outside Supabase's auth callback lock before making another auth call.
   defer(()=>{void (async()=>{
    const state=await controls.getStatus();
    if(['idle','ended','failed'].includes(state)||disposed||version!==epoch)return;
    const current=await controls.current();
    if(!current&&!disposed&&version===epoch)stop();
   })().catch(()=>undefined);});
  }
 });
 return ()=>{disposed=true;subscription.unsubscribe();};
}
export const installNativeBroadcastAccountGuard=()=>watchNativeBroadcastAccount(supabase,Capacitor,{
 stop:()=>nativeBroadcastBridge.stop(),getStatus:()=>nativeBroadcastBridge.getStatus(),current:()=>nativeCurrentSession(),
});
