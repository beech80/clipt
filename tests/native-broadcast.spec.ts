import {test,expect,type Page} from '@playwright/test';
const api='https://akiksrlzdqvipqbbjxpw.supabase.co';
const owner='10000000-0000-4000-8000-000000000003',stream='10000000-0000-4000-8000-000000000002',session='10000000-0000-4000-8000-000000000001';
async function fixture(page:Page,{native=true,deny=false,restored=false}={}){
 const user={id:owner,aud:'authenticated',role:'authenticated',email:'fixture@example.invalid',app_metadata:{},user_metadata:{},created_at:'2026-09-19T00:00:00Z',factors:[]};
 await page.addInitScript(({user,native,deny,restored})=>{
  const exp=Math.floor(Date.now()/1000)+3600,enc=(v:object)=>btoa(JSON.stringify(v)).replace(/=/g,'').replace(/\+/g,'-').replace(/\//g,'_');
  localStorage.setItem('sb-akiksrlzdqvipqbbjxpw-auth-token',JSON.stringify({access_token:enc({alg:'HS256'})+'.'+enc({sub:user.id,exp,aal:'aal1',role:'authenticated'})+'.fixture',refresh_token:'fixture',expires_at:exp,expires_in:3600,token_type:'bearer',user}));
  (window as any).__nativeCalls=[];(window as any).__nativeState=restored?'publishing':'idle';
  if(native){
   (window as any).CapacitorCustomPlatform={name:'android'};
   (window as any).Capacitor={
    PluginHeaders:[{name:'CliptBroadcaster',methods:['getCapabilities','getStatus','start','stop','setMuted','switchCamera'].map(name=>({name,rtype:'promise'}))}],
    nativePromise:async(_name:string,method:string,options:unknown)=>{
     (window as any).__nativeCalls.push({method,options});
     if(method==='getCapabilities')return {protocolVersion:1,platform:'android',modes:['camera','screen'],qualityIds:['360p15','720p30'],microphone:true,cameraSwitch:true,backgroundScreen:true,systemAudio:'permission-dependent'};
     if(method==='getStatus')return {state:(window as any).__nativeState};
     if(method==='start'){if(deny)throw Error('synthetic denied permission');(window as any).__nativeState='publishing';return;}
     if(method==='stop'){(window as any).__nativeState='ended';return;}
    },
   };
  }
 },{user,native,deny,restored});
 await page.routeWebSocket('**',socket=>socket.close());
 const stats={creates:0,stops:0,statuses:0,live:false,selection:restored?{mode:'screen',quality:'360p15',orientation:'landscape',microphone:true,systemAudio:false,cameraPosition:'back'}:null as any};
 await page.route('**/*',async route=>{
  const req=route.request(),url=new URL(req.url());
  if(url.origin==='http://127.0.0.1:8082')return route.continue();
  if(url.origin!==api)return route.abort();
  let data:any=[];
  if(url.pathname==='/auth/v1/user')data=user;
  if(url.pathname==='/rest/v1/streams')data={id:stream,user_id:owner,title:'Phone fixture',is_live:false,viewer_count:null,game_id:null,playback_url:null};
  if(url.pathname==='/rest/v1/profiles'||url.pathname==='/rest/v1/rpc/get_own_profile')data={id:owner,username:'tester',avatar_url:null};
  if(url.pathname==='/rest/v1/rpc/clipt_beta_access')data=true;
  if(url.pathname==='/functions/v1/native-broadcast-session'){
   const body=req.postDataJSON();expect(body.protocolVersion).toBe(1);
   if(body.action==='current')data={protocolVersion:1,session:restored?{protocolVersion:1,sessionId:session,streamId:stream,state:'active',isLive:true,selection:stats.selection,expiresAt:new Date(Date.now()+300000).toISOString(),maxDurationSeconds:300}:null};
   else if(body.action==='create'){
    stats.creates++;stats.selection=body.selection;expect(body.streamId).toBe(stream);
    expect(body.selection.quality).toBe('360p15');
    data={protocolVersion:1,sessionId:session,streamId:stream,grant:'a'.repeat(64),selection:body.selection,expiresAt:new Date(Date.now()+60000).toISOString(),maxDurationSeconds:300};
   }else if(body.action==='status'){
    stats.statuses++;data={protocolVersion:1,sessionId:session,streamId:stream,state:stats.live?'active':'starting',isLive:stats.live,selection:stats.selection,expiresAt:new Date(Date.now()+300000).toISOString(),maxDurationSeconds:300};
   }else if(body.action==='stop'){stats.stops++;data={protocolVersion:1,sessionId:session,state:'ended'};}
   else return route.fulfill({status:400,json:{code:'INVALID_ACTION',error:'Unexpected action'}});
  }
  return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(data)});
 });
 return stats;
}
test('web preserves OBS without pretending native capture is available',async({page})=>{
 const stats=await fixture(page,{native:false});await page.goto('/stream-setup');
 await expect(page.getByRole('button',{name:'Check Mux test status / playback',exact:true})).toBeVisible();
 await expect(page.getByRole('button',{name:'Camera Live',exact:true})).toHaveCount(0);
 expect(stats.creates).toBe(0);
});
test('native Screen Live uses bounded grants, keeps LIVE provider verified and ends explicitly',async({page})=>{
 await page.setViewportSize({width:390,height:844});
 const stats=await fixture(page);await page.goto('/stream-setup');
 const panel=page.getByRole('region',{name:'Phone broadcasting'});
 await expect(panel).toBeVisible();expect(stats.creates).toBe(0);
 await panel.getByRole('button',{name:'Screen Live',exact:true}).click();
 await panel.getByRole('button',{name:'Start Screen Live',exact:true}).click();
 await expect.poll(()=>stats.creates).toBe(1);
 await expect(panel.getByText(/Waiting for verified live video/)).toBeVisible();
 await expect(panel.getByText('LIVE — confirmed by the streaming provider.')).toHaveCount(0);
 const start=await page.evaluate(()=>(window as any).__nativeCalls.find((v:any)=>v.method==='start'));
 expect(start.options.selection.mode).toBe('screen');expect(start.options.encoder.videoBitrateBps).toBe(1000000);
 expect(start.options).not.toHaveProperty('streamKey');expect(start.options).not.toHaveProperty('ingestUrl');
 await panel.getByRole('button',{name:'Mute microphone',exact:true}).click();
 const mute=await page.evaluate(()=>(window as any).__nativeCalls.find((v:any)=>v.method==='setMuted'));
 expect(mute.options).toEqual({microphone:true,systemAudio:true});
 stats.live=true;
 await expect(panel.getByText('LIVE — confirmed by the streaming provider.',{exact:true})).toBeVisible({timeout:20000});
 await panel.getByRole('button',{name:'End broadcast',exact:true}).click();
 await expect.poll(()=>stats.stops).toBe(1);
 await expect(panel.getByRole('button',{name:'Start Screen Live',exact:true})).toBeVisible();
});
test('denied native capture revokes the prepared session and permits a fresh retry',async({page})=>{
 const stats=await fixture(page,{deny:true});await page.goto('/stream-setup');
 const panel=page.getByRole('region',{name:'Phone broadcasting'});
 await panel.getByRole('button',{name:'Start Camera Live',exact:true}).click();
 await expect(panel.getByRole('alert')).toContainText('Phone capture did not start');
 expect(stats.creates).toBe(1);expect(stats.stops).toBe(1);
 await panel.getByRole('button',{name:'Start Camera Live',exact:true}).click();
 await expect.poll(()=>stats.creates).toBe(2);await expect.poll(()=>stats.stops).toBe(2);
});

test('returning from another app restores broadcast controls without creating or restarting the session',async({page})=>{
 const stats=await fixture(page,{restored:true});stats.live=true;await page.goto('/stream-setup');
 const panel=page.getByRole('region',{name:'Phone broadcasting'});
 await expect(panel.getByRole('button',{name:'End broadcast',exact:true})).toBeVisible();
 expect(stats.creates).toBe(0);
 expect(await page.evaluate(()=>(window as any).__nativeCalls.filter((v:any)=>v.method==='start').length)).toBe(0);
 await panel.getByRole('button',{name:'End broadcast',exact:true}).click();
 await expect.poll(()=>stats.stops).toBe(1);
});
