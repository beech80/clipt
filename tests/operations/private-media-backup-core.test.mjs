import test from 'node:test';import assert from 'node:assert/strict';import {Buffer} from 'node:buffer';
import {runPrivateBackup,backupContext,privateSourceClient} from '../../scripts/lib/private-media-backup.mjs';
import {hash} from '../../scripts/lib/media-backup.mjs';
import {validatePrivateInventory,validateBackupObject,sourceIdentityHash,validateSignedSource,BACKUP_SOURCE,BACKUP_ENDPOINT} from '../../supabase/functions/_shared/private-backup-boundary.mjs';
const data=Buffer.from('synthetic private bytes'),etag=hash(data,'md5'),id='00000000-0000-4000-8000-000000000001';
const object=()=>({id,bucket:'media',bucket_id:'media',name:'private folder/clip #1.mp4',public:false,owner:null,owner_id:null,version:'version-1',created_at:'2026-10-30T00:00:00Z',updated_at:'2026-10-30T00:00:00Z',metadata:{size:data.length,eTag:etag,mimetype:'video/mp4'}});
const inventory=()=>({format:'clipt-private-media-inventory-v1',project:'slnjliheyiiummxhrgmk',capturedAt:'2026-10-30T03:17:00Z',runId:'77',runAttempt:'1',totalBytes:data.length,objects:[object()]});
const signed=o=>BACKUP_SOURCE+'/storage/v1/object/sign/'+o.bucket+'/'+o.name.split('/').map(encodeURIComponent).join('/')+'?token=synthetic-token';
const source={sign:async o=>signed(o)};
function client(){
 const files=new Map();let writes=0;
 return {files,get writes(){return writes;},async put(name,bytes){const old=files.get(name);if(old){assert.equal(hash(old.bytes),hash(bytes));return old.file;}writes++;const file={fileName:name,fileId:'file-'+files.size,bucketId:'synthetic',contentLength:bytes.length,contentSha1:hash(bytes,'sha1')};files.set(name,{file,bytes:Buffer.from(bytes)});return file;},async get(file){return Buffer.from(files.get(file.fileName).bytes);}};
}
const mediaResponse=(body=data,tag=etag)=>new Response(body,{headers:{etag:'"'+tag+'"','content-length':String(body.length)}});
test('private backup copies signed bytes, restores every record, preserves ownerless metadata and emits no private URL/path',async()=>{
 const c=client(),logs=[];const result=await runPrivateBackup(inventory(),c,source,{progress:x=>logs.push(x),fetchImpl:async(url,opts)=>{assert.equal(url,signed(object()));assert.equal(opts.redirect,'error');assert.equal(opts.headers['If-Match'],'"'+etag+'"');assert(!opts.headers.Authorization);return mediaResponse();}});
 assert.equal(result.backupCompleted,true);assert.equal(result.restoreCompleted,true);assert.equal(result.restoredBytes,data.length);assert.equal(result.ownerlessFilesPreserved,1);
 const manifest=JSON.parse(c.files.get('recurring/v1/runs/20261030-77-1/manifest.json').bytes);assert.deepEqual(manifest.objects,inventory().objects);assert.equal(manifest.files[0].sha256,hash(data));
 assert(!JSON.stringify([...logs,result,manifest]).includes('synthetic-token'));assert(!JSON.stringify([...logs,result]).includes(object().name));
});
test('content-addressed objects deduplicate while each snapshot and every source record remain independently restorable',async()=>{
 const c=client(),v=inventory();v.objects.push({...object(),id:'00000000-0000-4000-8000-000000000002',name:'another.mp4'});v.totalBytes*=2;
 const a=await runPrivateBackup(v,c,source,{fetchImpl:async()=>mediaResponse()});assert.equal(a.restoredFiles,2);assert.equal(c.writes,3);
 const b=await runPrivateBackup({...v,runId:'78'},c,source,{fetchImpl:async()=>mediaResponse()});assert.equal(b.restoredBytes,v.totalBytes);assert.equal(c.writes,5);
});
for(const [name,change]of[
 ['public source',v=>v.objects[0].public=true],['wrong project',v=>v.project='other'],['outside bucket',v=>v.objects[0].bucket='outside'],
 ['traversal',v=>v.objects[0].name='../private'],['backslash',v=>v.objects[0].name='a\\b'],['bad ID',v=>v.objects[0].id='other'],
 ['duplicate identity',v=>v.objects.push(object())],['wrong totals',v=>v.totalBytes++],['huge file',v=>v.objects[0].metadata.size=100000001],
 ['archived version',v=>v.objects[0].archived_at='2026-10-30'],['delete marker',v=>v.objects[0].is_delete_marker=true],['unhandled versioning',v=>v.objects[0].is_versioned=true]
])test('private source validation fails closed: '+name,()=>{const v=inventory();change(v);assert.throws(()=>validatePrivateInventory(v));});
test('source identity binds owner, version, timestamps, path and bytes metadata',async()=>{
 const a=object(),digest=await sourceIdentityHash(a);for(const change of [{owner_id:'different-owner'},{version:'new'},{updated_at:'later'},{name:'other.mp4'},{metadata:{...a.metadata,size:a.metadata.size+1}}])assert.notEqual(await sourceIdentityHash({...a,...change}),digest);
 assert.doesNotThrow(()=>validateBackupObject({...a,metadata:{...a.metadata,size:100000000}}));
});
for(const url of ['https://evil.example/object','http://slnjliheyiiummxhrgmk.supabase.co/','https://slnjliheyiiummxhrgmk.supabase.co/storage/v1/object/public/media/private','https://slnjliheyiiummxhrgmk.supabase.co/storage/v1/object/sign/media/other.mp4?token=x'])
 test('signed source cannot escape the exact private object: '+url,()=>assert.throws(()=>validateSignedSource(url,object())));
for(const [name,fetchImpl]of[
 ['changed etag',async()=>mediaResponse(data,'0'.repeat(32))],['truncated bytes',async()=>mediaResponse(data.subarray(1))],['rejected source',async()=>new Response('private message',{status:403})]
])test('no completion is written when '+name,async()=>{const c=client();await assert.rejects(runPrivateBackup(inventory(),c,source,{fetchImpl}));assert.equal(c.writes,0);});
test('restored byte or manifest corruption cannot produce a completion receipt',async()=>{
 for(const where of ['object','manifest']){const c=client(),get=c.get;c.get=async file=>where==='object'&&file.fileName.includes('/objects/')||where==='manifest'&&file.fileName.endsWith('/manifest.json')?Buffer.from('corrupt'):get(file);await assert.rejects(runPrivateBackup(inventory(),c,source,{fetchImpl:async()=>mediaResponse()}));assert(![...c.files.keys()].some(k=>k.endsWith('/receipt.json')));}
});
const env=()=>({GITHUB_REPOSITORY:'beech80/clipt',GITHUB_REF:'refs/heads/main',GITHUB_EVENT_NAME:'schedule',GITHUB_RUN_ID:'77',GITHUB_RUN_ATTEMPT:'1',ACTIONS_ID_TOKEN_REQUEST_URL:'https://pipelines.actions.githubusercontent.com/token',ACTIONS_ID_TOKEN_REQUEST_TOKEN:'synthetic-request-token'});
test('source client uses cached GitHub OIDC only at fixed endpoints and binds the response to this run',async()=>{
 const calls=[];const c=privateSourceClient(env(),{fetchImpl:async(url,opts)=>{calls.push(url);if(url.startsWith('https://pipelines.actions.githubusercontent.com/')){assert.equal(new URL(url).searchParams.get('audience'),'clipt-recurring-private-media-backup-v1');return new Response(JSON.stringify({value:'synthetic.oidc.token'}));}
 assert.equal(url,BACKUP_ENDPOINT);assert.equal(opts.headers.Authorization,'Bearer synthetic.oidc.token');const body=JSON.parse(opts.body);return new Response(JSON.stringify(body.action==='inventory'?inventory():{url:signed(object())}));}});
 assert.deepEqual(await c.inventory(),inventory());assert.equal(await c.sign(object()),signed(object()));assert.equal(calls.filter(x=>x.startsWith('https://pipelines.')).length,1);
});
test('wrong contexts, OIDC destinations and run responses fail before any private download',async()=>{
 for(const change of [{GITHUB_REF:'refs/heads/other'},{GITHUB_REPOSITORY:'other/clipt'},{GITHUB_EVENT_NAME:'pull_request'},{GITHUB_RUN_ID:'../outside'}])assert.throws(()=>backupContext({...env(),...change}));
 assert.throws(()=>privateSourceClient({...env(),ACTIONS_ID_TOKEN_REQUEST_URL:'https://evil.example'}));
 const c=privateSourceClient(env(),{fetchImpl:async url=>new Response(JSON.stringify(url.startsWith('https://pipelines.')?{value:'synthetic.oidc.token'}:{...inventory(),runId:'78'}))});await assert.rejects(c.inventory());
});
