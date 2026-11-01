import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import ts from 'typescript';
const source=readFileSync(new URL('../../supabase/functions/obs-broadcast-session/lifecycle.ts',import.meta.url),'utf8');
const module={exports:{}};
new Function('module','exports',ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText)(module,module.exports);
const {obsCommand,obsProvider,reconcileObs}=module.exports;
const session={sessionId:'10000000-0000-4000-8000-000000000001',streamId:'10000000-0000-4000-8000-000000000002',state:'provisioning',needsProvision:true,expiresAt:new Date(Date.now()+1800000).toISOString(),maxDurationSeconds:1800};
const provider={id:'provider',passthrough:'clipt-obs:'+session.sessionId,test:false,status:'idle',max_continuous_duration:1800,playback_ids:[{id:'playback',policy:'signed'}],stream_key:'PRIVATE_TEST_ONLY'};
test('OBS verifies exact resource, paid mode, signed playback and provider duration',()=>{
 assert.equal(obsProvider(provider,session).id,'provider');
 const omitted={...provider};delete omitted.test;assert.equal(obsProvider(omitted,session).id,'provider');
 for(const bad of [{test:true},{passthrough:'another'},{max_continuous_duration:43200},{playback_ids:[{id:'public',policy:'public'}]},{status:'unknown'}])
  assert.throws(()=>obsProvider({...provider,...bad},session));
});
test('ambiguous provider create is never retried and stores durable uncertainty',async()=>{
 const calls=[];let creates=0;
 const d={now:Date.now,db:async(action)=>{calls.push(action);return {...session,needsProvision:action==='reserve'&&creates===0,state:creates?'uncertain':'provisioning'};},
 provider:{create:async()=>{creates++;throw Error('timeout');}}};
 const body={protocolVersion:1,action:'create',streamId:session.streamId,requestId:session.sessionId};
 await assert.rejects(obsCommand(body,{},d));await obsCommand(body,{},d);
 assert.equal(creates,1);assert.ok(calls.includes('uncertain'));
});
test('failed attach disables the known created resource and does not return credentials',async()=>{
 const calls=[];const d={now:Date.now,db:async(action)=>{calls.push(action);if(action==='attach')throw Error();return session;},
 provider:{create:async()=>provider,disable:async id=>calls.push('disable:'+id)}};
 await assert.rejects(obsCommand({protocolVersion:1,action:'create',streamId:session.streamId,requestId:session.sessionId},{},d));
 assert.ok(calls.includes('disable:provider'));
});
test('stop clears local eligibility before provider calls and confirms disable before finish',async()=>{
 const calls=[];const d={now:Date.now,db:async action=>{calls.push(action);return {...session,state:'stopping',providerId:'provider',playbackId:'playback'};},
 provider:{disable:async()=>calls.push('disable'),clearRecordings:async()=>calls.push('clear-recordings'),read:async()=>({...provider,status:'disabled'})}};
 const result=await obsCommand({protocolVersion:1,action:'stop',sessionId:session.sessionId},{},d);
 assert.deepEqual(calls,['stop','disable','clear-recordings','finish']);assert.equal(result.session.state,'ended');
});
test('an incomplete provider listing cannot release an uncertain reservation',async()=>{
 const calls=[];const d={now:Date.now,db:async action=>{calls.push(action);return action==='list'?[{...session,state:'stopping'}]:null;},
 provider:{list:async()=>({resources:[],complete:false})}};
 assert.equal((await reconcileObs(d)).pending,1);assert.ok(!calls.includes('finish'));assert.ok(!calls.includes('worker_complete'));
});
test('provider bootstrap keeps private keys server-only and never retries a claimed setup',async()=>{
 const raw=readFileSync(new URL('../../supabase/functions/obs-broadcast-session/bootstrap.ts',import.meta.url),'utf8');
 const m={exports:{}};
 new Function('require','module','exports',ts.transpileModule(raw,{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText)(()=>module.exports,m,m.exports);
 let requests=0;
 await assert.rejects(m.exports.bootstrapObs({db:async a=>a==='configuration'?{bootstrapState:'claimed'}:{claimed:false},request:async()=>{requests++;}}));
 assert.equal(requests,0);
 const secret='PRIVATE_NEVER_RETURN';let saved;
 const result=await m.exports.bootstrapObs({db:async(a,args)=>a==='configuration'?{bootstrapState:'new'}:a==='bootstrap_claim'?{claimed:true}:(saved=args,{saved:true}),
  checkKey:async()=>{},request:async path=>path.includes('signing-keys')?{id:'key',private_key:secret}:{id:'hook',address:m.exports.OBS_WEBHOOK_ADDRESS,enabled:true,signing_secret:'WEBHOOK_PRIVATE_ONLY'}});
 assert.equal(saved.privateKey,secret);assert.equal(JSON.stringify(result).includes(secret),false);assert.deepEqual(result,{configured:true});
});

test('cleanup disables an owned test or oversized resource without treating it as usable paid playback',async()=>{
 const calls=[],sessionRow={...session,state:'stopping',needsProvision:false};
 const raw={...provider,test:true,max_continuous_duration:300};
 const d={now:Date.now,db:async(action,args)=>{
  calls.push(action);if(action==='list')return [sessionRow];if(action==='adopt')return {...sessionRow,providerId:'provider',playbackId:'playback'};
  return null;
 },provider:{list:async()=>({resources:[raw],complete:true}),disable:async()=>calls.push('disable'),
 read:async()=>({...raw,status:'disabled'}),clearRecordings:async()=>calls.push('clear-recordings')}};
 const result=await reconcileObs(d);assert.equal(result.pending,0);assert.equal(result.ended,1);
 assert.deepEqual(calls,['list','adopt','disable','clear-recordings','finish','worker_complete']);
 assert.throws(()=>obsProvider(raw,session),e=>e.code==='MUX_PAID_MODE_UNAVAILABLE');
});
