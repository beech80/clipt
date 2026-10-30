import {useCallback,useEffect,useRef,useState} from 'react';
import {useAuth} from '@/contexts/AuthContext';
import {Button} from '@/components/ui/button';
import {Label} from '@/components/ui/label';
import {nativeBroadcastBridge} from '@/native/broadcast/bridge';
import type {NativeBroadcastCapabilities,NativeBroadcastSelection,NativePublishState} from '@/native/broadcast/types';
import {endNativeSession,nativeCurrentSession,nativeSessionStatus,prepareNativeSession,type NativeSessionStatus} from '@/native/broadcast/session';

export function NativeBroadcastPanel({streamId}:{streamId:string}){
 const {user}=useAuth();
 const [cap,setCap]=useState<NativeBroadcastCapabilities|null>(null);
 const [selection,setSelection]=useState<NativeBroadcastSelection>({mode:'camera',quality:'360p15',orientation:'portrait',microphone:true,systemAudio:false,cameraPosition:'back'});
 const [session,setSession]=useState<NativeSessionStatus|null>(null),[transport,setTransport]=useState<NativePublishState>('idle');
 const [microphoneMuted,setMicrophoneMuted]=useState(false),[gameMuted,setGameMuted]=useState(false);
 const [pending,setPending]=useState(false),[error,setError]=useState(''),[started,setStarted]=useState(false);
 const busy=useRef(false),requestId=useRef<string|null>(null),sessionId=useRef<string|null>(null);
 const active=started&&!['ended','failed'].includes(transport);
 useEffect(()=>{
  let alive=true;
  void nativeBroadcastBridge.inspect().then(async result=>{
   if(!alive||!result.supported)return;
   setCap(result.capabilities);
   setSelection(s=>({...s,mode:result.capabilities.modes.includes('camera')?'camera':'screen',
    quality:result.capabilities.qualityIds.includes('360p15')?'360p15':result.capabilities.qualityIds[0],
    microphone:result.capabilities.microphone,systemAudio:false}));
   try {
    const current=await nativeCurrentSession();
    if(!alive)return;
    if(current){sessionId.current=current.sessionId;setSession(current);setStarted(true);
     setSelection(current.selection);setMicrophoneMuted(!current.selection.microphone);setGameMuted(!current.selection.systemAudio);}
    const transportState=await nativeBroadcastBridge.getStatus();
    if(alive){setTransport(transportState);if(!['idle','ended','failed'].includes(transportState))setStarted(true);}
   }catch{if(alive)setError('Saved broadcast status could not be loaded. Check sign-in, or use native controls to end capture.');}
  });
  return()=>{alive=false;};
 },[]);
 const refresh=useCallback(async()=>{
  try{
   const status=await nativeBroadcastBridge.getStatus();setTransport(status);
   if(sessionId.current)setSession(await nativeSessionStatus(sessionId.current));
  }catch{setError('Broadcast status is temporarily unavailable. Native capture can still be ended from its broadcast controls.');}
 },[]);
 useEffect(()=>{
  if(!started)return;
  void refresh();
  const timer=setInterval(()=>{if(!document.hidden)void refresh();},15000);
  const resume=()=>{if(!document.hidden)void refresh();};
  document.addEventListener('visibilitychange',resume);
  return()=>{clearInterval(timer);document.removeEventListener('visibilitychange',resume);};
 },[started,refresh]);
 // Navigating away must not end Screen Live. Native code owns the session,
 // expiry and heartbeat. Only an explicit end or account sign-out stops it.
 useEffect(()=>{
  if(user||!started)return;
  void nativeBroadcastBridge.stop().catch(()=>undefined);
 },[user,started]);
 async function begin(){
  if(busy.current||!cap||!user||active)return;
  busy.current=true;setPending(true);setError('');
  requestId.current??=crypto.randomUUID();
  try{
   const prepared=await prepareNativeSession(streamId,requestId.current,selection);
   sessionId.current=prepared.sessionId;
   try{await nativeBroadcastBridge.start({grant:prepared.grant,selection:prepared.selection});}
   catch{
    try{await endNativeSession(prepared.sessionId);sessionId.current=null;requestId.current=null;}catch{/* Keep End broadcast available for cleanup. */}
    throw Error('Phone capture did not start. Check permissions, then retry.');
   }
   setStarted(true);setTransport('connecting');setMicrophoneMuted(!selection.microphone);setGameMuted(!selection.systemAudio);requestId.current=null;
   await refresh();
  }catch(failure){setError(failure instanceof Error?failure.message:'Broadcast did not start.');}
  finally{busy.current=false;setPending(false);}
 }
 async function end(){
  if(busy.current)return;
  busy.current=true;setPending(true);setError('');
  let nativeFailed=false;
  try{await nativeBroadcastBridge.stop();}catch{nativeFailed=true;}
  try{
   if(sessionId.current)await endNativeSession(sessionId.current);
   setTransport('ended');setStarted(false);setSession(null);sessionId.current=null;requestId.current=null;
   if(nativeFailed)setError('Server broadcast access ended. Check the native broadcast controls to confirm capture has stopped.');
  }catch(failure){setError(failure instanceof Error?failure.message:'Broadcast cleanup is pending. Retry End broadcast.');}
  finally{busy.current=false;setPending(false);}
 }
 async function mute(kind:'microphone'|'game'){
  if(!cap||busy.current)return;
  busy.current=true;setPending(true);setError('');
  try{const mic=kind==='microphone'?!microphoneMuted:microphoneMuted,game=kind==='game'?!gameMuted:gameMuted;await nativeBroadcastBridge.setMuted(mic,game);setMicrophoneMuted(mic);setGameMuted(game);}
  catch{setError('Audio could not be changed. Use the native broadcast audio controls.');}
  finally{busy.current=false;setPending(false);}
 }
 if(!cap)return null;
 return <section aria-label="Phone broadcasting" className="gaming-card p-4 space-y-4 min-w-0">
  <h2 className="text-xl font-semibold">Go live from your phone</h2>
  <div className="flex flex-wrap gap-3" role="group" aria-label="Broadcast source">
   {cap.modes.map(mode=><Button key={mode} variant={selection.mode===mode?'default':'outline'} aria-pressed={selection.mode===mode} disabled={pending||active} onClick={()=>setSelection(s=>({...s,mode,systemAudio:false}))}>{mode==='camera'?'Camera Live':'Screen Live'}</Button>)}
  </div>
  {!active&&<div className="grid gap-3 sm:grid-cols-2">
   <Label className="space-y-2">Quality<select aria-label="Broadcast quality" className="block w-full min-h-11 bg-background border rounded p-2" disabled={pending} value={selection.quality} onChange={e=>setSelection(s=>({...s,quality:e.target.value as NativeBroadcastSelection['quality']}))}>{cap.qualityIds.map(id=><option key={id} value={id}>{id.replace('p','p / ')} FPS</option>)}</select></Label>
   <Label className="space-y-2">Orientation<select aria-label="Broadcast orientation" className="block w-full min-h-11 bg-background border rounded p-2" disabled={pending} value={selection.orientation} onChange={e=>setSelection(s=>({...s,orientation:e.target.value as 'portrait'|'landscape'}))}><option value="portrait">Portrait</option><option value="landscape">Landscape</option></select></Label>
   {cap.microphone&&<Label className="flex items-center gap-3 min-h-11"><input type="checkbox" checked={selection.microphone} disabled={pending} onChange={e=>setSelection(s=>({...s,microphone:e.target.checked}))}/>Include microphone</Label>}
   {selection.mode==='screen'&&cap.systemAudio!=='unsupported'&&<Label className="flex items-center gap-3 min-h-11"><input type="checkbox" checked={selection.systemAudio} disabled={pending} onChange={e=>setSelection(s=>({...s,systemAudio:e.target.checked}))}/>Include game audio where permitted</Label>}
  </div>}
  <p className="text-sm">{selection.mode==='screen'?'Your phone will ask what to share. Screen Live can continue when you switch to a game. Some games block audio or protected video.':'Camera Live uses a native preview. Leaving CLIPT ends camera capture.'}</p>
  {started&&<p role="status">{session?.isLive?'LIVE — confirmed by the streaming provider.': 'Phone transport: '+transport+'. Waiting for verified live video.'}</p>}
  {error&&<p role="alert">{error}</p>}
  <div className="flex flex-wrap gap-3">
   {!active?<Button disabled={pending||!user} onClick={()=>void begin()}>{pending?'Preparing…':'Start '+(selection.mode==='camera'?'Camera Live':'Screen Live')}</Button>:<>
    {selection.microphone&&<Button variant="outline" disabled={pending} aria-pressed={microphoneMuted} onClick={()=>void mute('microphone')}>{microphoneMuted?'Unmute microphone':'Mute microphone'}</Button>}
    {selection.systemAudio&&<Button variant="outline" disabled={pending} aria-pressed={gameMuted} onClick={()=>void mute('game')}>{gameMuted?'Unmute game audio':'Mute game audio'}</Button>}
    {selection.mode==='camera'&&cap.cameraSwitch&&<Button variant="outline" disabled={pending} onClick={()=>void nativeBroadcastBridge.switchCamera().catch(()=>setError('Camera could not be changed.'))}>Switch camera</Button>}
   </>}
   {(started||sessionId.current)&&<Button variant="destructive" disabled={pending} onClick={()=>void end()}>{pending?'Updating…':'End broadcast'}</Button>}
  </div>
 </section>;
}
