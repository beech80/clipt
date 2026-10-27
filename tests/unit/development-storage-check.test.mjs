import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { storageCheckAllowed, runDevelopmentStorageCheck, runDevelopmentScanStorageCheck } from '../../src/lib/development-storage-check.ts';

test('replacement scan fixture is scoped and removed reviewer access requires exact denial', async () => {
 const { readFile } = await import('node:fs/promises');
 const page = await readFile(new URL('../../src/pages/DevelopmentStorageCheck.tsx', import.meta.url), 'utf8');
 assert.match(page, /<Button disabled title="Controlled review lock released">/);
 assert.doesNotMatch(page, /onClick=\{\(\)=>void runScanGuard\(\)\}/);
 assert.match(page, /No Azure dispatch or account deletion/);
 assert.match(page, /identity\.data\.user\?\.id!=='1b0ea76e-a629-4f54-8ec5-1e4ae0e7a251'/);
 assert.match(page, /result\.error\?\.code!=='42501'/);
});
const owner='1b0ea76e-a629-4f54-8ec5-1e4ae0e7a251';
const config={dev:true,hostname:'127.0.0.1',project:'https://akiksrlzdqvipqbbjxpw.supabase.co'};
const photo=new Blob([new Uint8Array([137,80,78,71,13,10,26,10,0,0,0,0])],{type:'image/png'});
function fixture({failUpload=false,failCleanup=false,foreignAccessible=false}={}) {
 const objects=new Map(),calls=[];
 const storage={
  upload:async(path,blob,options)=>{calls.push(['upload',path]);if(failUpload||objects.has(path)&&!options.upsert)return {error:{message:'Denied'}};objects.set(path,blob);return {error:null};},
  download:async path=>({data:objects.get(path)??(foreignAccessible&&path.startsWith('46dcc')?photo:null),error:objects.has(path)||foreignAccessible&&path.startsWith('46dcc')?null:{message:'Denied'}}),
  remove:async paths=>{calls.push(['remove',...paths]);if(failCleanup)return {error:{message:'Denied'}};for(const p of paths)objects.delete(p);return {error:null};},
  list:async()=>({data:[...objects.keys()],error:null}),
 };
 return {objects,calls,client:{auth:{getUser:async()=>({data:{user:{id:owner,email_confirmed_at:'confirmed',is_anonymous:false}},error:null})},storage:{from:()=>storage}}};
}
test('Storage verification excludes production, hosted origins and unapproved accounts',()=>{
 assert.equal(storageCheckAllowed(true,config.hostname,config.project,owner),true);
 for(const args of [[false,config.hostname,config.project,owner],[true,'preview.vercel.app',config.project,owner],
  [true,config.hostname,'https://production.supabase.co',owner],[true,config.hostname,config.project,'other']])assert.equal(storageCheckAllowed(...args),false);
 const app=readFileSync(new URL('../../src/App.tsx',import.meta.url),'utf8');
 assert.match(app,/DevelopmentStorageCheck = import\.meta\.env\.DEV \?/);
});

test('replacement Azure diagnostic is exactly scoped and retains uncertain retry identity',()=>{
 const page=readFileSync(new URL('../../src/pages/DevelopmentStorageCheck.tsx',import.meta.url),'utf8');
 const diagnostic=page.slice(page.indexOf('async function runAzureVerification()'),page.indexOf('async function runStaffBoundary()'));
 assert.match(diagnostic,/875b6725-b8fd-4999-a5e5-9527daf01073/);
 assert.match(diagnostic,/8ce1d610-d203-4775-8723-942052a02026/);
 assert.match(diagnostic,/sessionStorage\.setItem\(retryKey,requestId\)/);
 assert.match(diagnostic,/existing reservation is not proof of completed Azure processing/);
 assert.match(diagnostic,/failure\.context\.status/);
 assert.match(diagnostic,/safeMessages\.includes\(rejected\?\.error\)/);
 assert.doesNotMatch(diagnostic,/sessionStorage\.removeItem|AZURE_CONTENT_SAFETY_KEY|access_token/);
});
test('normal caller API run checks duplicates, bytes, foreign denial and exact cleanup',async()=>{
 const f=fixture(),messages=[];await runDevelopmentStorageCheck(f.client,photo,config,text=>messages.push(text));
 assert.equal(f.objects.size,0);assert.equal(messages.filter(x=>x.startsWith('PASS')).length,6);
 const removed=f.calls.find(x=>x[0]==='remove').slice(1);
 assert.equal(removed.length,4);assert.ok(removed.every(x=>x.startsWith(owner+'/clipt-verification-')));
});
test('upload failure still cleans only the run-local attempted objects',async()=>{
 const f=fixture({failUpload:true});await assert.rejects(runDevelopmentStorageCheck(f.client,photo,config,()=>{}),/uploads failed/);
 assert.equal(f.calls.filter(x=>x[0]==='remove').length,1);assert.equal(f.objects.size,0);
});
test('cleanup failure is reported, never a false cleanup pass',async()=>{
 const f=fixture({failCleanup:true});await assert.rejects(runDevelopmentStorageCheck(f.client,photo,config,()=>{}),/cleanup failed/);
 assert.equal(f.objects.size,4);
});
test('foreign bytes fail the run and still clean only owned fixtures',async()=>{
 const f=fixture({foreignAccessible:true});await assert.rejects(runDevelopmentStorageCheck(f.client,photo,config,()=>{}),/Foreign private media/);
 assert.equal(f.objects.size,0);
});
test('unapproved context and invalid file fail before any Storage operation',async()=>{
 const f=fixture();await assert.rejects(runDevelopmentStorageCheck(f.client,photo,{...config,dev:false},()=>{}),/localhost required/);
 await assert.rejects(runDevelopmentStorageCheck(f.client,new Blob(['bad'],{type:'image/png'}),config,()=>{}),/fixture required/);
 assert.equal(f.calls.length,0);
});

test('transport rejection waits for slower uploads before cleanup',async()=>{
 const f=fixture();const storage=f.client.storage.from();const original=storage.upload;
 storage.upload=async(path,blob,options)=>{
  if(path.endsWith('concurrent-0.png'))throw new Error('Network unavailable');
  await new Promise(resolve=>setTimeout(resolve,25));
  return original(path,blob,options);
 };
 await assert.rejects(runDevelopmentStorageCheck(f.client,photo,config,()=>{}),/uploads failed/);
 assert.equal(f.objects.size,0);
 assert.equal(f.calls.at(-1)[0],'remove');
});

function lockedFixture({transport=false,generic=false,privacyGeneric=false}={}) {
 const uid='8bd9e1e8-4079-48b7-8cae-3a3c0176dfc8';
 const refusal={error:{code:'55000',message:'Photo review in progress; please retry shortly'}};
 const mutation=async()=>{if(transport)throw new Error('Offline');return generic?{error:{message:'Network error'}}:refusal;};
 const storage={download:async()=>({data:photo,error:null}),upload:mutation,remove:mutation};
 const from=()=>({select:()=>({eq:()=>({single:async()=>({error:null,data:{user_id:uid,
  image_url:config.project+'/storage/v1/object/public/media/'+uid+'/56bfb87a-c362-4294-ae6b-05fcb3c58f0d.jpg',is_published:true}})})}),
  update:()=>({eq:()=>({select:async()=>privacyGeneric?{error:{message:'Offline'}}:refusal})})});
 return {auth:{getUser:async()=>({error:null,data:{user:{id:uid,email_confirmed_at:'confirmed'}}})},storage:{from:()=>storage},from};
}
test('pending-scan check requires explicit hosted lock refusals',async()=>{
 const messages=[];await runDevelopmentScanStorageCheck(lockedFixture(),config,text=>messages.push(text));
 assert.equal(messages.filter(x=>x.startsWith('PASS')).length,2);
});
test('pending-scan check never passes on transport rejection or generic Storage errors',async()=>{
 for(const options of [{transport:true},{generic:true}]){
  const messages=[];await assert.rejects(runDevelopmentScanStorageCheck(lockedFixture(options),config,text=>messages.push(text)),/unverified/);
  assert.equal(messages.filter(x=>x.includes('Storage upsert/delete')).length,0);
 }
});
test('pending-scan privacy check rejects generic errors instead of proving a lock',async()=>{
 const messages=[];await assert.rejects(runDevelopmentScanStorageCheck(lockedFixture({privacyGeneric:true}),config,text=>messages.push(text)),/unverified/);
 assert.equal(messages.filter(x=>x.includes('privacy')).length,0);
});
