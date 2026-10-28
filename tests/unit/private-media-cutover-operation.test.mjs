import test from 'node:test';
import assert from 'node:assert/strict';
import ts from 'typescript';
import { readFile } from 'node:fs/promises';
import { MEDIA_BUCKETS, BASELINE_FLAGS, validateRollbackFlags, validateCutoverSamples } from '../../supabase/functions/_shared/media-cutover-oidc.mjs';

const code = await readFile(new URL('../../supabase/functions/private-media-cutover/index.ts', import.meta.url), 'utf8');
const samples = ['avatars','media','posts','videos'].map(bucket => ({ bucket, name:'synthetic-owner/clip.mp4',size:20,etag:'a'.repeat(32) }));
async function harness({ authorized = true, wrongProject = false, failBucket = null, failSignedHead = false } = {}) {
  let handler, secretReads = 0, failed = false;
  const buckets = new Map(BASELINE_FLAGS.map(f => [f.id, {...f, file_size_limit:36_000_000}])), calls = [];
  const fetchImpl = async (url, options) => {
    calls.push({url:String(url),options});
    const u = new URL(url);
    if(u.pathname.startsWith('/storage/v1/bucket/')) {
      assert.equal(options.headers.Authorization,'Bearer synthetic-private-service-key');
      const id=u.pathname.split('/').at(-1);assert(MEDIA_BUCKETS.includes(id));
      if(options.method==='PUT') {
        if(id===failBucket&&!failed){failed=true;return new Response('private provider error',{status:503});}
        const body=JSON.parse(options.body);assert.deepEqual(Object.keys(body),['public']);buckets.get(id).public=body.public;
      } else assert.equal(options.method,'GET');
      return new Response(JSON.stringify(buckets.get(id)));
    }
    if(u.pathname.startsWith('/storage/v1/object/sign/')) {
      if(options.method==='POST') {
        assert.equal(options.headers.Authorization,'Bearer synthetic-private-service-key');
        assert.deepEqual(JSON.parse(options.body),{expiresIn:60});
        return new Response(JSON.stringify({signedURL:u.pathname.replace('/storage/v1','')+'?token=synthetic-private-signed-token'}));
      }
      assert.equal(options.method,'HEAD');assert(!options.headers?.Authorization);
      return new Response(null,{status:failSignedHead?403:200,headers:{'content-length':'20',etag:'"'+'a'.repeat(32)+'"'}});
    }
    throw Error('Unexpected provider boundary');
  };
  const Deno={serve:h=>{handler=h;},env:{get:name=>{secretReads++;return name==='SUPABASE_SERVICE_ROLE_KEY'?'synthetic-private-service-key':wrongProject?'https://other.supabase.co':'https://slnjliheyiiummxhrgmk.supabase.co';}}};
  const javascript=ts.transpileModule(code.replace(/^import .*\n/,''),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS}}).outputText;
  new Function('Deno','fetch','verifyCutoverOidc','MEDIA_BUCKETS','validateRollbackFlags','validateCutoverSamples',javascript)(Deno,fetchImpl,async()=>{if(!authorized)throw Error('Unauthorized');return true;},MEDIA_BUCKETS,validateRollbackFlags,validateCutoverSamples);
  const request=body=>handler(new Request('https://slnjliheyiiummxhrgmk.supabase.co/functions/v1/private-media-cutover',{method:'POST',headers:{Authorization:'Bearer synthetic.jwt.token'},body:JSON.stringify(body)}));
  return {request,buckets,calls,get secretReads(){return secretReads;}};
}
test('unauthorized cutover cannot load server credentials or call Storage',async()=>{
  const h=await harness({authorized:false}),r=await h.request({operation:'private',samples});
  assert.equal(r.status,401);assert.equal(h.secretReads,0);assert.equal(h.calls.length,0);
});
test('wrong configured project fails without calling Storage',async()=>{
  const h=await harness({wrongProject:true}),r=await h.request({operation:'private',samples});
  assert.equal(r.status,503);assert.equal(h.calls.length,0);
});
test('fixed operation updates exactly six bucket flags and tests four signed media samples',async()=>{
  const h=await harness(),r=await h.request({operation:'private',samples}),body=await r.json();
  assert.equal(r.status,200);assert.equal(body.bucketsPrivate,6);assert.equal(body.signedServiceSamplesPassed,4);assert.equal(body.ownerSessionVerified,false);
  assert.deepEqual(body.before,BASELINE_FLAGS);assert([...h.buckets.values()].every(b=>b.public===false&&b.file_size_limit===36_000_000));
  assert(!JSON.stringify(body).includes('synthetic-private'));assert(!JSON.stringify(body).includes('synthetic-owner'));
  assert.equal(h.calls.filter(c=>c.options.method==='PUT').length,6);
});
for(const config of [{failBucket:'media'},{failSignedHead:true}])test('failed cutover restores the exact previous visibility flags: '+JSON.stringify(config),async()=>{
  const h=await harness(config),r=await h.request({operation:'private',samples}),body=await r.json();
  assert.equal(r.status,503);assert.equal(body.rollbackCompleted,true);
  assert.deepEqual(MEDIA_BUCKETS.map(id=>({id,public:h.buckets.get(id).public})),BASELINE_FLAGS);
  assert(!JSON.stringify(body).includes('private provider'));
});
test('rollback rejects other buckets or arbitrary public access changes',async()=>{
  const h=await harness(),r=await h.request({operation:'rollback',flags:MEDIA_BUCKETS.map(id=>({id,public:true}))});
  assert.equal(r.status,503);assert.equal(h.calls.length,0);
});
test('reviewed rollback can restore only the captured baseline',async()=>{
  const h=await harness();await h.request({operation:'private',samples});const r=await h.request({operation:'rollback',flags:BASELINE_FLAGS});
  assert.equal(r.status,200);assert.equal((await r.json()).rollbackCompleted,true);
  assert.deepEqual(MEDIA_BUCKETS.map(id=>({id,public:h.buckets.get(id).public})),BASELINE_FLAGS);
});
