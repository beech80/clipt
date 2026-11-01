import {test,expect} from '@playwright/test';
import {readFile} from 'node:fs/promises';
const base='https://slnjliheyiiummxhrgmk.supabase.co';
const owner='00000000-0000-4000-8000-000000000077',streamId='00000000-0000-4000-8000-000000000078',sessionId='00000000-0000-4000-8000-000000000079';
async function fixture(page:any,{denied=false,quota=false}={}){
 const user={id:owner,aud:'authenticated',role:'authenticated',email:'fixture@example.invalid',app_metadata:{},user_metadata:{},created_at:'2026-09-19T00:00:00Z',factors:[]};
 await page.addInitScript(({user}:any)=>{const exp=Math.floor(Date.now()/1000)+3600,encode=(v:any)=>btoa(JSON.stringify(v)).replace(/=/g,'').replace(/\+/g,'-').replace(/\//g,'_');
  localStorage.setItem('sb-slnjliheyiiummxhrgmk-auth-token',JSON.stringify({access_token:encode({alg:'HS256'})+'.'+encode({sub:user.id,exp,aal:'aal1',role:'authenticated'})+'.fixture',refresh_token:'fixture',expires_at:exp,expires_in:3600,token_type:'bearer',user}));},{user});
 await page.routeWebSocket('**',socket=>socket.close());
 const state={session:null as any,creates:0,keys:0,legacy:0,requests:[] as string[]};
 const snapshot=()=>({sessionId,streamId,state:state.session,isLive:state.session==='active',expiresAt:new Date(Date.now()+1800000).toISOString(),maxDurationSeconds:1800});
 await page.route('**/*',async(route:any)=>{
  const req=route.request(),url=new URL(req.url());if(url.origin==='http://127.0.0.1:8083')return route.continue();
  if(url.origin==='https://stream.mux.com'){
   const part=url.pathname.split('/').pop()||'',file=part.endsWith('.m3u8')?'index.m3u8':/^segment-\d+\.ts$/.test(part)?part:null;
   if(!file)return route.abort();return route.fulfill({status:200,contentType:file.endsWith('.m3u8')?'application/vnd.apple.mpegurl':'video/mp2t',body:await readFile(new URL('./fixtures/channel-hls/'+file,import.meta.url))});
  }
  if(url.origin!==base)return route.abort();let data:any=[];
  if(url.pathname==='/auth/v1/user')data=user;
  if(url.pathname==='/rest/v1/profiles'||url.pathname==='/rest/v1/rpc/get_own_profile')data={id:owner,username:'tester',avatar_url:null};
  if(url.pathname==='/rest/v1/rpc/clipt_beta_access')data=true;
  if(url.pathname==='/rest/v1/streams')data={id:streamId,user_id:owner,title:'OBS fixture',game_id:null,is_live:state.session==='active',viewer_count:null};
  if(url.pathname==='/functions/v1/obs-broadcast-session/status')data={protocolVersion:1,enabled:true,configured:true,operationsReady:true,maxDurationSeconds:1800,monthlyBroadcastMinutes:300};
  if(url.pathname==='/functions/v1/oauth'||url.pathname==='/functions/v1/native-broadcast-session'){state.legacy++;return route.fulfill({status:404,contentType:'application/json',body:'{}'});}
  if(url.pathname==='/functions/v1/obs-broadcast-session'){
   if(denied)return route.fulfill({status:403,contentType:'application/json',body:'{"code":"SESSION_FORBIDDEN"}'});
   const body=req.postDataJSON();expect(body.protocolVersion).toBe(1);
   if(body.action==='current')data={session:state.session?snapshot():null};
   else if(body.action==='create'){state.creates++;state.requests.push(body.requestId);expect(body.streamId).toBe(streamId);
    if(quota)return route.fulfill({status:409,contentType:'application/json',body:'{"code":"BETA_LIMIT"}'});
    state.session='ready';data={session:snapshot()};
   }else if(body.action==='credentials'){state.keys++;data={ingestUrl:'rtmps://global-live.mux.com:443/app',streamKey:'PRIVATE_LOCAL_FIXTURE_ONLY',expiresAt:new Date(Date.now()+1800000).toISOString()};}
   else if(body.action==='playback')data={playbackUrl:'https://stream.mux.com/obsfixture.m3u8?token=localfixture',expiresAt:new Date(Date.now()+180000).toISOString()};
   else if(body.action==='stop'){state.session='ended';data={session:snapshot()};state.session=null;}
   else throw Error('Unexpected OBS action');
  }
  if(url.pathname==='/rest/v1/rpc/check_chat_rate_limit'||url.pathname==='/rest/v1/rpc/is_user_timed_out')data=false;
  return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(data)});
 });return state;
}
for(const viewport of [{width:1366,height:768},{width:1024,height:768},{width:390,height:844}])test('production OBS controls, private playback and end flow fit '+viewport.width,async({page})=>{
 await page.setViewportSize(viewport);const state=await fixture(page);await page.goto('/stream-setup');
 await expect(page.getByRole('region',{name:'Broadcast instructions',exact:true})).toBeVisible();
 const prepare=page.getByRole('button',{name:'Prepare OBS broadcast',exact:true});await expect(prepare).toBeEnabled();
 expect(state.creates).toBe(0);expect(state.keys).toBe(0);
 await prepare.click();await expect(page.getByText(/Status: ready/)).toBeVisible();expect(state.creates).toBe(1);expect(state.keys).toBe(0);
 await page.getByRole('button',{name:'Get OBS credentials',exact:true}).click();
 await expect(page.getByLabel('Stream key',{exact:true})).toHaveAttribute('type','password');expect(state.keys).toBe(1);
 await page.getByRole('button',{name:'Clear credentials',exact:true}).click();await expect(page.getByLabel('Stream key',{exact:true})).toHaveCount(0);
 state.session='active';await page.getByRole('button',{name:'Check status',exact:true}).click();
 await expect(page.getByText(/Status: LIVE/)).toBeVisible();
 const video=page.locator('.clipt-stream-player video');await expect(video).toBeVisible();await video.scrollIntoViewIfNeeded();
 await expect.poll(()=>video.evaluate((v:HTMLVideoElement)=>v.currentTime),{timeout:12000}).toBeGreaterThan(0);
 await page.getByRole('button',{name:'End broadcast',exact:true}).scrollIntoViewIfNeeded();await page.getByRole('button',{name:'End broadcast',exact:true}).click();
 await expect(prepare).toBeEnabled();await expect(video).toHaveCount(0);
 expect(state.legacy).toBe(0);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
});
test('revoked or uninvited sessions cannot prepare or reveal OBS credentials',async({page})=>{
 const state=await fixture(page,{denied:true});await page.goto('/stream-setup');
 await expect(page.getByText(/Current session could not be checked/)).toBeVisible();
 await expect(page.getByRole('button',{name:'Prepare OBS broadcast',exact:true})).toBeDisabled();
 expect(state.creates).toBe(0);expect(state.keys).toBe(0);
});
test('quota failure preserves a stable request ID and never claims LIVE',async({page})=>{
 const state=await fixture(page,{quota:true});await page.goto('/stream-setup');
 const prepare=page.getByRole('button',{name:'Prepare OBS broadcast',exact:true});await expect(prepare).toBeEnabled();await prepare.click();
 await expect(page.getByText(/broadcast or viewer allowance is full/)).toBeVisible();
 await prepare.click();await expect.poll(()=>state.creates).toBe(2);expect(state.requests[0]).toBe(state.requests[1]);
 await expect(page.getByText(/Status: LIVE/)).toHaveCount(0);expect(state.keys).toBe(0);expect(state.legacy).toBe(0);
});
