import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {randomUUID} from 'node:crypto';
import {PGlite} from '@electric-sql/pglite';
import {runPhotoReview} from '../../supabase/functions/_shared/photo-review-workflow.ts';
import {createAzurePhotoHandler} from '../../supabase/functions/_shared/production-photo-handler.mjs';

const SOURCE='https://slnjliheyiiummxhrgmk.supabase.co';
const owner='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',staff='bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',other='cccccccc-cccc-4ccc-8ccc-cccccccccccc';
const jpg=Uint8Array.from([255,216,255,224,0,0,0,0,0,0,0,0]);
const reference=n=>SOURCE+'/storage/v1/object/authenticated/media/'+owner+'/image-'+n+'.jpg';
test('every album photo and its caption are checked; a flag cannot be overwritten by a later clean image',async()=>{
 const calls=[],finished=[];
 const row={user_id:owner,is_published:true,is_premium:false,is_subscriber_only:false,required_tier_id:null,moderation_hidden:false,post_type:'photo',video_url:null,image_url:reference(1)+','+reference(2),content:'Great game'};
 const result=await runPhotoReview(owner,SOURCE,{reserve:async()=>true,read:async()=>row,download:async(b,p)=>{calls.push(p);return jpg;},analyze:async input=>input.caption?'no_flag_detected':calls.length===1?'needs_review':'no_flag_detected',finish:async s=>finished.push(s),log:()=>{}});
 assert.equal(calls.length,2);assert.equal(result.state,'needs_review');assert.deepEqual(finished,['needs_review']);
 row.image_url+=',https://foreign.invalid/private.jpg';calls.length=0;
 await assert.rejects(runPhotoReview(owner,SOURCE,{reserve:async()=>true,read:async()=>row,download:async()=>{calls.push(1);return jpg;},analyze:async()=>{throw Error('must not scan');},finish:async()=>{},log:()=>{}}));assert.equal(calls.length,0);
});

async function fixture(){
 const db=new PGlite();
 await db.exec(`
 create role anon;create role authenticated;create role service_role;
 create schema clipt_private;create schema auth;create schema storage;
 create table public.profiles(id uuid primary key);
 create table public.posts(id uuid primary key,user_id uuid references profiles(id),content text default 'Great game',image_url text,video_url text,
 is_published boolean default true,is_premium boolean default false,is_subscriber_only boolean default false,
 required_tier_id uuid,moderation_hidden boolean default false,post_type text default 'photo',scheduled_publish_time timestamptz);
 create table public.user_roles(user_id uuid,role text);
 create table auth.mfa_factors(user_id uuid,status text);
 create table storage.objects(bucket_id text,name text,owner_id text,owner uuid,primary key(bucket_id,name));
 create function auth.uid() returns uuid language sql as $$select nullif(current_setting('test.uid',true),'')::uuid$$;
 create function auth.jwt() returns jsonb language sql as $$select jsonb_build_object('aal',coalesce(nullif(current_setting('test.aal',true),''),'aal1'))$$;
 create function clipt_private.account_available() returns boolean language sql as $$select true$$;
 create function clipt_private.beta_access_allowed() returns boolean language sql as $$select true$$;
 grant usage on schema public,auth,storage to anon,authenticated,service_role;
 grant select on public.profiles,public.posts,storage.objects to anon,authenticated;
 alter table public.posts enable row level security;
 create policy visible on public.posts for select using(user_id=auth.uid() or (is_published and not moderation_hidden));
 `);
 const sourceSQL=await readFile(new URL('../../database/production_azure_photo_rollout.sql',import.meta.url),'utf8');try{await db.exec(sourceSQL);}catch(error){console.error({position:error.position,internalPosition:error.internalPosition,where:error.where,internalQuery:error.internalQuery?.slice(0,1000),around:sourceSQL.slice(Math.max(0,Number(error.position)-180),Number(error.position)+100)});throw error;}
 await db.query('insert into public.profiles(id) values($1),($2),($3)',[owner,staff,other]);
 await db.query("insert into public.user_roles values($1,'moderator')",[staff]);
 const actor=async(id,aal='aal1')=>{await db.exec('reset role');await db.query("select set_config('test.uid',$1,false),set_config('test.aal',$2,false)",[id,aal]);await db.exec('set role authenticated');};
 const activate=async()=>{await assert.rejects(db.exec('update clipt_private.azure_dispatch_settings set enabled=true'),/verification and MFA/);await db.query("insert into auth.mfa_factors values($1,'verified')",[staff]);await db.exec('update clipt_private.azure_dispatch_settings set verified_free_tier=true,probe_verified_at=now()');await db.exec('update clipt_private.azure_dispatch_settings set enabled=true');};
 return {db,actor,activate};
}
test('actual production SQL defaults off and holds only eligible photos; MFA staff can resolve failed album review',async()=>{
 const {db,actor,activate}=await fixture();try{
  const old=randomUUID(),post=randomUUID();
  await db.query('insert into public.posts(id,user_id,image_url) values($1,$2,$3)',[old,owner,reference(0)]);
  assert.equal((await db.query('select count(*)::int n from clipt_private.azure_review_dispatch')).rows[0].n,0);
  assert.equal((await db.query('select azure_photo_worker_status() value')).rows[0].value.enabled,false);
  await activate();
  await db.query('insert into public.posts(id,user_id,image_url) values($1,$2,$3)',[post,owner,reference(1)+','+reference(2)]);
  const d=(await db.query('select id from clipt_private.azure_review_dispatch where post_id=$1',[post])).rows[0].id;
  await db.exec('set role anon');assert.equal((await db.query('select id from public.posts where id=$1',[post])).rows.length,0);
  await assert.rejects(db.query('select azure_photo_worker_status()'),/permission denied/);
  await actor(owner);assert.equal((await db.query('select id from public.posts where id=$1',[post])).rows.length,1);
  await assert.rejects(db.query('select * from production_photo_review_queue()'),/moderator/);
  await actor(staff);await assert.rejects(db.query('select * from production_photo_review_queue()'),/moderator/);
  await actor(staff,'aal2');assert.equal((await db.query('select * from production_photo_review_queue()')).rows.length,1);
  assert.equal((await db.query('select * from production_photo_review_preview($1)',[d])).rows[0].image_url,reference(1)+','+reference(2));
  await db.exec('reset role');await db.exec('set role service_role');
  const job=(await db.query('select * from claim_public_photo_review()')).rows[0];
  await db.exec('reset role');
  assert.equal((await db.query('select operations from clipt_private.azure_review_jobs where id=$1',[d])).rows[0].operations,3);
  await actor(staff,'aal2');await assert.rejects(db.query("select resolve_production_photo_review($1,'restore')",[d]),/processing/);
  await db.exec('reset role');await db.query("select finish_azure_review_with_quarantine($1,$2,'failed')",[owner,job.request_id]);await db.query('select finish_public_photo_dispatch($1,false)',[job.request_id]);
  assert.equal((await db.query('select moderation_hidden from public.posts where id=$1',[post])).rows[0].moderation_hidden,true);
  await actor(other,'aal2');await assert.rejects(db.query('select * from production_photo_review_preview($1)',[d]),/moderator/);
  await actor(staff,'aal2');assert.equal((await db.query("select resolve_production_photo_review($1,'restore') ok",[d])).rows[0].ok,true);
  await db.exec('reset role');assert.equal((await db.query('select state from clipt_private.azure_review_jobs where id=$1',[d])).rows[0].state,'failed','manual review never fabricates an Azure approval');
  await db.exec('set role anon');assert.equal((await db.query('select id from public.posts where id=$1',[post])).rows.length,1);
 }finally{await db.close();}
});
test('queued quota holds can be reviewed and stale processing jobs are quarantined rather than left locked',async()=>{
 const {db,actor,activate}=await fixture();try{
  await activate();
  const post=randomUUID();await db.query('insert into public.posts(id,user_id,image_url) values($1,$2,$3)',[post,owner,reference(1)]);
  const d=(await db.query('select id from clipt_private.azure_review_dispatch')).rows[0].id;
  await actor(staff,'aal2');await db.query("select resolve_production_photo_review($1,'keep')",[d]);
  await db.exec('reset role');assert.equal((await db.query('select count(*)::int n from clipt_private.azure_review_jobs')).rows[0].n,0);
  const second=randomUUID();await db.query('insert into public.posts(id,user_id,image_url) values($1,$2,$3)',[second,owner,reference(2)]);
  await db.query('select * from claim_public_photo_review()');
  await db.exec("update clipt_private.azure_review_dispatch set claimed_at=now()-interval '25 minutes' where state='processing'");
  assert.equal((await db.query('select reconcile_stale_photo_reviews() n')).rows[0].n,1);
  await actor(staff,'aal2');const rows=(await db.query('select * from production_photo_review_queue()')).rows;assert.equal(rows.length,1);assert.equal(rows[0].state,'failed');
 }finally{await db.close();}
});

function handlerFixture({enabled=false,free=true,keys=true,tokenFails=false,attestFails=false}={}){
 const calls=[],env={SUPABASE_URL:SOURCE,SUPABASE_SERVICE_ROLE_KEY:'server-secret',...(keys?{AZURE_CONTENT_SAFETY_ENDPOINT:'https://clipt-content-safety-dev.cognitiveservices.azure.com/',AZURE_CONTENT_SAFETY_KEY:'azure-secret'}:{})};
 const handler=createAzurePhotoHandler({reviewedFiles:{},getEnv:k=>env[k],verifyToken:async()=>{if(tokenFails)throw Error();return {run_id:'1',run_attempt:'1'};},attestRunner:async()=>{if(attestFails)throw Error();},review:async()=>{throw Error('No user content in probe');},analyze:async(_c,input)=>{calls.push({provider:input});return 'no_flag_detected';},fetchImpl:async(url,options)=>{calls.push(url);if(url.endsWith('/azure_photo_worker_status'))return Response.json({enabled,verifiedFreeTier:free,moderatorReady:false});if(url.endsWith('/reserve_azure_photo_probe'))return Response.json(true);if(url.endsWith('/record_azure_photo_worker'))return Response.json(true);throw Error('Unexpected call');}});
 const request=action=>handler(new Request('https://worker.invalid',{method:'POST',headers:{Authorization:'Bearer fixture'},body:JSON.stringify({action})}));
 return {calls,request};
}
test('worker never loads administrative state for untrusted or unreviewed jobs',async()=>{for(const change of [{tokenFails:true},{attestFails:true}]){const f=handlerFixture(change);assert.equal((await f.request('tick')).status,401);assert.equal(f.calls.length,0);}});
test('disabled worker does not require keys or contact Azure; probe uses only synthetic content',async()=>{const off=handlerFixture({keys:false,free:false});assert.equal((await (await off.request('tick')).json()).state,'disabled');assert.equal(off.calls.length,1);const f=handlerFixture();const r=await f.request('probe');assert.equal(r.status,200);assert.equal((await r.json()).userContentSent,false);assert.equal(f.calls.filter(x=>x.provider).length,2);assert.ok(f.calls.every(x=>typeof x==='string'? !x.includes('storage/v1'):true));});
test('provider credentials and verified free-tier configuration are required and never returned',async()=>{for(const flags of [{keys:false},{free:false}]){const f=handlerFixture(flags);const r=await f.request('probe');assert.equal(r.status,503);const text=await r.text();assert.doesNotMatch(text,/server-secret|azure-secret/);assert.equal(f.calls.filter(x=>x.provider).length,0);}});

import {generateKeyPairSync,createSign} from 'node:crypto';
import {verifyPhotoOidc,attestPhotoRunner,PHOTO_AUDIENCE,PHOTO_WORKFLOW} from '../../supabase/functions/_shared/photo-review-oidc.mjs';
test('photo worker verifies the signed repository/workflow identity and rejects preview, expired, wrong-audience and forged tokens',async()=>{
 const {privateKey,publicKey}=generateKeyPairSync('rsa',{modulusLength:2048}),jwk=publicKey.export({format:'jwk'});jwk.kid='fixture';const seconds=Math.floor(Date.now()/1000);
 const good={iss:'https://token.actions.githubusercontent.com',aud:PHOTO_AUDIENCE,repository:'beech80/clipt',repository_id:'917757980',repository_owner_id:'195324952',ref:'refs/heads/main',event_name:'schedule',workflow_ref:PHOTO_WORKFLOW,sha:'a'.repeat(40),workflow_sha:'b'.repeat(40),sub:'repo:beech80/clipt:ref:refs/heads/main',runner_environment:'github-hosted',run_id:'1',run_attempt:'1',iat:seconds,nbf:seconds,exp:seconds+300};
 const token=(change={},forge=false)=>{const head=Buffer.from(JSON.stringify({alg:'RS256',kid:'fixture'})).toString('base64url'),body=Buffer.from(JSON.stringify({...good,...change})).toString('base64url'),data=head+'.'+body;const sig=createSign('RSA-SHA256').update(data).sign(privateKey).toString('base64url');return data+'.'+(forge?'x'+sig.slice(1):sig);};
 const opts={fetchImpl:async url=>{assert.equal(url,'https://token.actions.githubusercontent.com/.well-known/jwks');return Response.json({keys:[jwk]});}};
 assert.equal((await verifyPhotoOidc(token(),opts)).repository_id,'917757980');
 for(const change of [{aud:'wrong'},{ref:'refs/heads/preview'},{workflow_ref:'other'},{repository_id:'1'},{exp:seconds-1},{runner_environment:'self-hosted'}])await assert.rejects(verifyPhotoOidc(token(change),opts));
 await assert.rejects(verifyPhotoOidc(token({},true),opts));
 await assert.rejects(attestPhotoRunner(good,{'.github/workflows/clipt-azure-photo-review.yml':'0'.repeat(64),'scripts/run-azure-photo-worker.mjs':'0'.repeat(64)},{fetchImpl:async()=>new Response('changed source')}));
});

import {createRequire} from 'node:module';
import ts from 'typescript';
import React from 'react';
const require=createRequire(import.meta.url);
async function reviewUI({loaded=new Set(),decision=null,urls=['https://slnjliheyiiummxhrgmk.supabase.co/storage/v1/object/sign/media/one?token=fixture','https://slnjliheyiiummxhrgmk.supabase.co/storage/v1/object/sign/media/two?token=fixture'],withPreview=true}={}){
 const source=await readFile(new URL('../../src/components/moderation/ProductionPhotoReviewQueue.tsx',import.meta.url),'utf8');
 const code=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText;
 const mutations=[],calls=[],values=[withPreview?{id:'dddddddd-dddd-4ddd-8ddd-dddddddddddd',urls,caption:'Original caption'}:null,loaded,decision];let n=0;
 const deps={react:{...React,useEffect(){},useRef:x=>({current:x}),useState:x=>[values[n++]??(typeof x==='function'?x():x),()=>{}]},
 '@tanstack/react-query':{useQueryClient:()=>({invalidateQueries:async()=>{}}),useQuery:()=>({data:[],isPending:false,isError:false}),useMutation:opts=>{mutations.push(opts);return {isPending:false,isError:false,mutate:()=>{throw Error('No automatic decisions');}};}},
 '@/integrations/supabase/client':{storageProjectUrl:SOURCE,supabase:{rpc:async(name,args)=>{calls.push({name,args});return {data:true,error:null};},functions:{invoke:async()=>({data:{postId:'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee',urls,caption:'Original caption'},error:null})}}},
 '@/contexts/AuthContext':{useAuth:()=>({user:{id:staff}})},'@/components/ui/button':{Button:()=>null},'react-router-dom':{Link:()=>null}};
 const mod={exports:{}};new Function('require','module','exports',code)(name=>deps[name]??require(name),mod,mod.exports);const tree=mod.exports.ProductionPhotoReviewQueue();return {mutations,calls,tree};
}
test('protected moderator preview rejects off-site media and releasing an album requires every image to load',async()=>{
 const bad=await reviewUI({withPreview:false,urls:['https://other.invalid/private']});await assert.rejects(bad.mutations[0].mutationFn('dddddddd-dddd-4ddd-8ddd-dddddddddddd'),/Invalid protected preview/);
 const partial=await reviewUI({loaded:new Set([0]),decision:'restore'});await assert.rejects(partial.mutations[1].mutationFn(),/every photo/);assert.equal(partial.calls.length,0);
 const all=await reviewUI({loaded:new Set([0,1]),decision:'restore'});assert.equal(all.calls.length,0);await all.mutations[1].mutationFn();assert.deepEqual(all.calls,[{name:'resolve_production_photo_review',args:{p_job:'dddddddd-dddd-4ddd-8ddd-dddddddddddd',p_decision:'restore'}}]);
});
