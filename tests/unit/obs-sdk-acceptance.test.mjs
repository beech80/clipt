import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';import ts from 'typescript';
function compile(name,deps={}){const m={exports:{}};new Function('require','module','exports',ts.transpileModule(readFileSync(new URL('../../supabase/functions/obs-broadcast-session/'+name,import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText)(path=>deps[path],m,m.exports);return m.exports;}
const lifecycle=compile('lifecycle.ts'),diagnostics=compile('diagnostics.ts');
const {createSdkAcceptance}=compile('sdk-acceptance.ts',{'./lifecycle.ts':lifecycle,'./diagnostics.ts':diagnostics});
const s={sessionId:'10000000-0000-4000-8000-000000000001',acceptance:true,maxDurationSeconds:90,needsProvision:true};
const p={id:'provider',passthrough:'clipt-obs:'+s.sessionId,status:'idle',max_continuous_duration:90,playback_ids:[{id:'signed',policy:'signed'}],stream_key:'PRIVATE_TEST_ONLY'};
test('independent SDK uses single create, explicit auth, no retries/logs/redirects and fresh original-client readback',async()=>{
 let options,body,creates=0,reads=0;
 class Client{constructor(o){options=o;this.video={liveStreams:{create:async b=>{body=b;creates++;return p;}}};}}
 const result=await createSdkAcceptance(s,'TOKEN_FIXTURE','SECRET_FIXTURE',async id=>{assert.equal(id,'provider');reads++;return {...p};},async()=>({default:Client}));
 assert.equal(result.stream_key,p.stream_key);assert.equal(creates,1);assert.equal(reads,1);
 assert.equal(options.authorizationToken,null);assert.equal(options.maxRetries,0);assert.equal(options.timeout,12000);assert.equal(options.logLevel,'off');
 assert.equal(options.baseURL,'https://api.mux.com');assert.equal(options.fetchOptions.redirect,'error');
 assert.equal(options.defaultHeaders.Authorization,'Basic '+btoa('TOKEN_FIXTURE:SECRET_FIXTURE'));
 assert.equal('test' in body,false);assert.equal(body.max_continuous_duration,90);assert.deepEqual(body.playback_policies,['signed']);
 assert.deepEqual(body.new_asset_settings.playback_policies,['signed']);assert.equal(body.passthrough,p.passthrough);
});
test('SDK probe refuses ordinary users and overlong sessions before import or provider access',async()=>{
 for(const bad of [{acceptance:false},{maxDurationSeconds:1800},{needsProvision:false}]){
 let touched=false;await assert.rejects(createSdkAcceptance({...s,...bad},'id','secret',async()=>{touched=true;},async()=>{touched=true;}),e=>e.code==='SDK_CHECK_FORBIDDEN');assert.equal(touched,false);
 }
});
test('SDK failures are redacted and never fall back to a second create',async()=>{
 let calls=0;class Client{constructor(){this.video={liveStreams:{create:async()=>{calls++;throw Object.assign(Error('PRIVATE_SECRET'),{status:402});}}};}}
 await assert.rejects(createSdkAcceptance(s,'id','secret',async()=>{throw Error('Must not read');},async()=>({default:Client})),e=>e.code==='MUX_BILLING_REQUIRED'&&!e.message.includes('PRIVATE'));assert.equal(calls,1);
});
test('independent observations reject foreign resources and disagreement; true test stays rejected',async()=>{
 class Client{constructor(){this.video={liveStreams:{create:async()=>p}};}}
 await assert.rejects(createSdkAcceptance(s,'id','secret',async()=>({...p,id:'foreign'}),async()=>({default:Client})));
 await assert.rejects(createSdkAcceptance(s,'id','secret',async()=>({...p,test:true}),async()=>({default:Client})),e=>e.code==='PROVIDER_UNVERIFIED');
 class TestClient{constructor(){this.video={liveStreams:{create:async()=>({...p,test:true,max_continuous_duration:300})}};}}
 const result=await createSdkAcceptance(s,'id','secret',async()=>({...p,test:true,max_continuous_duration:300}),async()=>({default:TestClient}));
 assert.throws(()=>lifecycle.obsProvider(result,s),e=>e.code==='MUX_PAID_MODE_UNAVAILABLE');
});
