import test from 'node:test';import assert from 'node:assert/strict';import {generateKeyPairSync,sign,createHash} from 'node:crypto';import {readFileSync,readdirSync} from 'node:fs';
import {PGlite} from '@electric-sql/pglite';
import {verifyBackupOidc,attestBackupRunner,BACKUP_AUDIENCE,GITHUB_ISSUER,BACKUP_WORKFLOW} from '../../supabase/functions/_shared/private-backup-oidc.mjs';
import {createPrivateBackupHandler} from '../../supabase/functions/_shared/private-backup-handler.mjs';
import {sourceIdentityHash,BACKUP_SOURCE} from '../../supabase/functions/_shared/private-backup-boundary.mjs';
import {REVIEWED_BACKUP_FILES} from '../../supabase/functions/private-media-backup/reviewed-runner.mjs';
const now=Date.UTC(2026,9,30,3,17),sec=now/1000,sha='a'.repeat(40);
const pair=generateKeyPairSync('rsa',{modulusLength:2048}),jwk={...pair.publicKey.export({format:'jwk'}),kid:'fixture-key',alg:'RS256',use:'sig'};
const claims=()=>({iss:GITHUB_ISSUER,aud:BACKUP_AUDIENCE,repository:'beech80/clipt',repository_id:'917757980',repository_owner_id:'195324952',ref:'refs/heads/main',event_name:'schedule',sha,workflow_sha:sha,workflow_ref:BACKUP_WORKFLOW,sub:'repo:beech80/clipt:ref:refs/heads/main',runner_environment:'github-hosted',run_id:'77',run_attempt:'1',exp:sec+300,iat:sec,nbf:sec});
function token(c=claims(),h={alg:'RS256',kid:jwk.kid}){const input=Buffer.from(JSON.stringify(h)).toString('base64url')+'.'+Buffer.from(JSON.stringify(c)).toString('base64url');return input+'.'+sign('RSA-SHA256',Buffer.from(input),pair.privateKey).toString('base64url');}
const options=(extra={})=>({now,fetchImpl:async(url,opts)=>{assert.equal(url,GITHUB_ISSUER+'/.well-known/jwks');assert.equal(opts.redirect,'error');return new Response(JSON.stringify({keys:[jwk]}));},...extra});
test('only verified GitHub schedule/dispatch/push identities for this main-branch workflow are accepted',async()=>{for(const event_name of ['schedule','workflow_dispatch','push'])assert.equal((await verifyBackupOidc(token({...claims(),event_name}),options())).run_id,'77');});
for(const[field,value]of[
 ['iss','https://evil.example'],['aud','other'],['repository','other/clipt'],['repository_id','1'],['repository_owner_id','1'],
 ['ref','refs/pull/1/merge'],['event_name','pull_request_target'],['sha','invalid'],['workflow_sha','invalid'],
 ['workflow_ref','beech80/clipt/.github/workflows/other.yml@refs/heads/main'],['sub','repo:other/clipt:ref:refs/heads/main'],['runner_environment','self-hosted'],
 ['run_id','../outside'],['run_attempt','0'],['exp',sec],['exp',sec+601],['iat',sec-601],['iat',sec+31],['nbf',sec+31]
])test('reject mismatched OIDC before fetching keys: '+field,async()=>{let calls=0;await assert.rejects(verifyBackupOidc(token({...claims(),[field]:value}),options({fetchImpl:async()=>{calls++;throw Error();}})));assert.equal(calls,0);});
test('wrong signatures, algorithms, injected key URLs, missing/duplicate keys and HTTP failure are denied',async()=>{
 const parts=token().split('.'),sig=Buffer.from(parts[2],'base64url');sig[0]^=1;parts[2]=sig.toString('base64url');await assert.rejects(verifyBackupOidc(parts.join('.'),options()));
 for(const h of [{alg:'none',kid:jwk.kid},{alg:'HS256',kid:jwk.kid},{alg:'RS256',kid:jwk.kid,jku:'https://evil.example'}])await assert.rejects(verifyBackupOidc(token(claims(),h),options()));
 for(const keys of [[],[jwk,jwk]])await assert.rejects(verifyBackupOidc(token(),options({fetchImpl:async()=>new Response(JSON.stringify({keys}))})));
 await assert.rejects(verifyBackupOidc(token(),options({fetchImpl:async()=>new Response('',{status:503})})));
});
test('both current GitHub subject formats preserve immutable repository and owner identity',async()=>{
 assert.equal((await verifyBackupOidc(token({...claims(),sub:'repo:beech80@195324952/clipt@917757980:ref:refs/heads/main'}),options())).repository_id,'917757980');
});
test('reviewed source attestation binds exact bytes at the verified immutable workflow commit',async()=>{
 const files=Object.fromEntries(['scripts/a.mjs','scripts/b.mjs','scripts/c.mjs','scripts/d.mjs','.github/workflows/a.yml'].map(path=>[path,createHash('sha256').update(path).digest('hex')]));
 assert.equal(await attestBackupRunner(claims(),files,{fetchImpl:async(url,opts)=>{assert(url.startsWith('https://raw.githubusercontent.com/beech80/clipt/'+sha+'/'));assert.equal(opts.redirect,'error');return new Response(url.split('/'+sha+'/')[1]);}}),true);
 await assert.rejects(attestBackupRunner(claims(),files,{fetchImpl:async()=>new Response('changed')}));
 await assert.rejects(attestBackupRunner(claims(),{}));await assert.rejects(attestBackupRunner(claims(),{...files,'scripts/../secret':'a'.repeat(64)}));
});
test('runner attestation uses the executed checkout SHA separately from the workflow-definition SHA',async()=>{
 const files=Object.fromEntries(['scripts/a.mjs','scripts/b.mjs','scripts/c.mjs','scripts/d.mjs','.github/workflows/a.yml'].map(path=>[path,createHash('sha256').update(path).digest('hex')]));
 await attestBackupRunner({...claims(),workflow_sha:'b'.repeat(40)},files,{fetchImpl:async url=>{const path=new URL(url).pathname.split('/').slice(4).join('/');assert(url.includes((path.startsWith('.github/')?'b'.repeat(40):sha)+'/'+path));return new Response(path);}});
});
test('checked-in runner policy matches every executed file and contains no administrator credential in the workflow or runner',()=>{
 const paths=Object.keys(REVIEWED_BACKUP_FILES);assert.equal(paths.length,7);
 for(const[path,digest]of Object.entries(REVIEWED_BACKUP_FILES))assert.equal(createHash('sha256').update(readFileSync(new URL('../../'+path,import.meta.url))).digest('hex'),digest,path);
 const runner=readFileSync(new URL('../../scripts/run-private-media-backup.mjs',import.meta.url),'utf8'),workflow=readFileSync(new URL('../../.github/workflows/clipt-private-media-recurring.yml',import.meta.url),'utf8');
 assert(!runner.includes('SUPABASE_SERVICE_ROLE_KEY'));assert(!workflow.includes('SUPABASE_SERVICE_ROLE_KEY'));assert.match(workflow,/cron: '17 3 \* \* \*'/);assert.match(workflow,/id-token: write/);assert.match(workflow,/persist-credentials: false/);assert(!workflow.includes('upload-artifact'));
});
const object=()=>({id:'00000000-0000-4000-8000-000000000001',bucket:'media',bucket_id:'media',public:false,name:'private folder/clip #1.mp4',owner:null,owner_id:null,metadata:{size:3,eTag:'a'.repeat(32)},version:'v1'});
const inventory=()=>({format:'clipt-private-media-inventory-v1',project:'slnjliheyiiummxhrgmk',capturedAt:'2026-10-30T03:17:00Z',totalBytes:3,objects:[object()]});
const req=body=>new Request(BACKUP_SOURCE+'/functions/v1/private-media-backup',{method:'POST',headers:{Authorization:'Bearer synthetic.oidc.token'},body:JSON.stringify(body)});
test('invalid identity, unreviewed code and unsupported actions never load an administrator key',async()=>{
 for(const kind of ['identity','source','body']){
  let secrets=0,network=0;const handler=createPrivateBackupHandler({reviewedFiles:{},now:()=>now,getEnv:()=>{secrets++;return'private';},verifyToken:async()=>{if(kind==='identity')throw Error();return claims();},attestRunner:async()=>{if(kind==='source')throw Error();},fetchImpl:async()=>{network++;throw Error();}});
  const response=await handler(req(kind==='body'?{action:'rollback'}:{action:'inventory'}));assert.equal(response.status,kind==='body'?400:401);assert.equal(secrets,0);assert.equal(network,0);
 }
});
test('authorized worker can only read bounded metadata and sign an unchanged exact private path',async()=>{
 const calls=[];const handler=createPrivateBackupHandler({reviewedFiles:{},now:()=>now,verifyToken:async()=>claims(),attestRunner:async()=>true,getEnv:key=>key==='SUPABASE_URL'?BACKUP_SOURCE:'synthetic-admin-key',fetchImpl:async(url,opts)=>{
  assert(url.startsWith(BACKUP_SOURCE));assert.equal(opts.method,'POST');assert.equal(opts.redirect,'error');assert.equal(opts.headers.Authorization,'Bearer synthetic-admin-key');calls.push(url);
  return new Response(JSON.stringify(url.endsWith('/clipt_backup_inventory')?inventory():url.endsWith('/clipt_backup_object')?object():{signedURL:'/object/sign/media/private%20folder/clip%20%231.mp4?token=synthetic-signed'}));
 }});
 const a=await handler(req({action:'inventory'}));assert.equal(a.status,200);assert.equal((await a.json()).runId,'77');
 const b=await handler(req({action:'sign',id:object().id,identity:await sourceIdentityHash(object())}));assert.equal(b.status,200);assert.equal((await b.json()).expiresIn,300);
 const before=calls.length;const changed=await handler(req({action:'sign',id:object().id,identity:'b'.repeat(64)}));assert.equal(changed.status,409);assert.equal(calls.length,before+1);
 assert(calls.every(x=>x.includes('/rest/v1/rpc/clipt_backup_')||x.includes('/storage/v1/object/sign/')));assert.equal((await handler(new Request(BACKUP_SOURCE))).status,405);
});
test('backup SQL is invoker-only and denies browser roles while the service role can inventory ownerless objects',async()=>{
 const db=new PGlite();try{
 await db.exec("create role anon;create role authenticated;create role service_role bypassrls;create schema storage;create table storage.buckets(id text primary key,public boolean not null);create table storage.objects(id uuid primary key,bucket_id text references storage.buckets(id),name text,owner uuid,owner_id text,metadata jsonb,version text,created_at timestamptz default now(),updated_at timestamptz default now(),last_accessed_at timestamptz,user_metadata jsonb,archived_at timestamptz,is_delete_marker boolean default false,is_versioned boolean default false);grant usage on schema storage to service_role;grant select on all tables in schema storage to service_role;alter table storage.objects enable row level security;");
 for(const bucket of ['avatars','clipt-avatars','media','posts','recordings','videos'])await db.query('insert into storage.buckets values($1,false)',[bucket]);
 await db.query('insert into storage.objects(id,bucket_id,name,metadata,version) values($1,$2,$3,$4,$5)',[object().id,'media',object().name,JSON.stringify(object().metadata),'v1']);
 const file=readdirSync(new URL('../../supabase/migrations/',import.meta.url)).find(x=>x.endsWith('_recurring_private_media_backup.sql'));await db.exec(readFileSync(new URL('../../supabase/migrations/'+file,import.meta.url),'utf8'));
 for(const role of ['anon','authenticated']){await db.exec('set role '+role);await assert.rejects(db.query('select clipt_backup_inventory()'),/permission denied/);await assert.rejects(db.query('select clipt_backup_object($1)',[object().id]),/permission denied/);await db.exec('reset role');}
 await db.exec('set role service_role');const result=(await db.query('select clipt_backup_inventory() value')).rows[0].value;assert.equal(result.objects.length,1);assert.equal(result.objects[0].owner_id,null);assert.equal(result.totalBytes,3);assert.equal(result.objects[0].public,false);assert.equal((await db.query("select prosecdef from pg_proc where proname='clipt_backup_inventory'")).rows[0].prosecdef,false);await db.exec('reset role');
 await db.exec("update storage.buckets set public=true where id='media';set role service_role");await assert.rejects(db.query('select clipt_backup_inventory()'),/Unsupported private/);
 }finally{await db.close();}
});
