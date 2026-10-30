import {test,expect} from '@playwright/test';
import {readFile} from 'node:fs/promises';
const base='https://akiksrlzdqvipqbbjxpw.supabase.co';
const owner='00000000-0000-4000-8000-000000000077',streamId='00000000-0000-4000-8000-000000000078';
test('built preview uses explicit test credentials and verified idle-active-idle without legacy calls',async({page})=>{
 const user={id:owner,aud:'authenticated',role:'authenticated',email:'fixture@example.invalid',app_metadata:{},user_metadata:{},created_at:'2026-09-19T00:00:00Z',factors:[]};
 await page.addInitScript(({user})=>{const exp=Math.floor(Date.now()/1000)+3600;const enc=(v:object)=>btoa(JSON.stringify(v)).replace(/=/g,'').replace(/\+/g,'-').replace(/\//g,'_');localStorage.setItem('sb-akiksrlzdqvipqbbjxpw-auth-token',JSON.stringify({access_token:enc({alg:'HS256'})+'.'+enc({sub:user.id,exp,aal:'aal1',role:'authenticated'})+'.fixture',refresh_token:'fixture',expires_at:exp,expires_in:3600,token_type:'bearer',user}));},{user});
 await page.routeWebSocket('**',socket=>socket.close());
 let status='idle',credentialReads=0,legacyCalls=0,chats=0;
 await page.route('**/*',async route=>{
  const req=route.request(),u=new URL(req.url());
  if(u.origin==='http://127.0.0.1:8082')return route.continue();
  if(u.origin==='https://stream.mux.com'){
   const part=u.pathname.split('/').pop()||'';
   const file=part.endsWith('.m3u8')?'index.m3u8':/^segment-\d+\.ts$/.test(part)?part:null;
   if(!file)return route.abort();
   return route.fulfill({status:200,contentType:file.endsWith('.m3u8')?'application/vnd.apple.mpegurl':'video/mp2t',body:await readFile(new URL('./fixtures/channel-hls/'+file,import.meta.url))});
  }
  if(u.origin!==base)return route.abort();
  let data:any=[];
  if(u.pathname==='/auth/v1/user')data=user;
  if(u.pathname==='/rest/v1/streams')data={id:streamId,user_id:owner,title:'Pilot fixture',is_live:status==='active',viewer_count:null,game_id:null,playback_url:null};
  if(u.pathname==='/rest/v1/profiles'||u.pathname==='/rest/v1/rpc/get_own_profile')data={id:owner,username:'tester',avatar_url:null};
  if(u.pathname==='/rest/v1/rpc/clipt_beta_access')data=true;
  if(u.pathname==='/functions/v1/oauth'){legacyCalls++;return route.fulfill({status:404,contentType:'application/json',body:'{"error":"Unexpected legacy endpoint"}'});}
  if(u.pathname==='/functions/v1/mux-test-live'){
   const body=req.postDataJSON();expect(body.streamId).toBe(streamId);
   if(body.action==='credentials'){credentialReads++;data={id:streamId,test:true,rtmp_url:'rtmps://global-live.mux.com:443/app',stream_key:'synthetic-test-key'};}
   else {expect(body.action).toBe('status');data={id:streamId,test:true,is_live:status==='active',provider_status:status,playback_url:'https://stream.mux.com/pilotfixture.m3u8'};}
  }
  if(u.pathname==='/rest/v1/stream_chat'&&req.method()==='POST'){expect(status).toBe('active');chats++;data=null;}
  if(u.pathname==='/rest/v1/rpc/check_chat_rate_limit'||u.pathname==='/rest/v1/rpc/is_user_timed_out')data=false;
  if(u.pathname==='/rest/v1/rpc/filter_chat_message')data=[{is_blocked:false,filtered_message:req.postDataJSON().p_message}];
  return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(data)});
 });
 await page.goto('/stream-setup');
 const check=page.getByRole('button',{name:'Check Mux test status / playback',exact:true});
 await expect(check).toBeVisible();
 await expect(page.getByRole('button',{name:'Initialize Stream',exact:true})).toHaveCount(0);
 expect(credentialReads).toBe(0);
 await page.getByRole('button',{name:'Load OBS test credentials',exact:true}).click();
 await expect(page.getByLabel('Stream Key',{exact:true})).toHaveAttribute('type','password');expect(credentialReads).toBe(1);
 await check.click();await expect(page.getByText('Last verified provider status: idle.',{exact:false})).toBeVisible();
 const chat=page.getByRole('textbox',{name:'Chat message',exact:true});await expect(chat).toBeDisabled();
 status='active';await check.click();await expect(page.getByText('Last verified provider status: active.',{exact:false})).toBeVisible();
 const video=page.locator('.clipt-stream-player video');await expect(video).toBeVisible();await video.scrollIntoViewIfNeeded();
 await expect.poll(()=>video.evaluate((e:HTMLVideoElement)=>e.currentTime),{timeout:10000}).toBeGreaterThan(0);
 await chat.fill('Synthetic live check');await page.getByRole('button',{name:'Send',exact:true}).click();await expect(chat).toHaveValue('');expect(chats).toBe(1);
 status='idle';await check.scrollIntoViewIfNeeded();await check.click();await expect(page.getByText('Last verified provider status: idle.',{exact:false})).toBeVisible();await expect(chat).toBeDisabled();expect(legacyCalls).toBe(0);expect(credentialReads).toBe(1);
});
