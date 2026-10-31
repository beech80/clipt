import test from 'node:test';
import assert from 'node:assert/strict';
import {createPrivateKey} from 'node:crypto';
import {nativeCommand,nativeRequestBody,nativeError,providerSnapshot,NATIVE_DEVELOPMENT_ORIGIN,nativeConfigurationIssues} from '../../supabase/functions/native-broadcast-session/protocol.ts';
import {nativeRandomToken,nativeTokenHash,nativePlaybackUrl,importNativeSigningKey} from '../../supabase/functions/native-broadcast-session/crypto.ts';
import {reconcileNativeBroadcasts} from '../../supabase/functions/native-broadcast-session/reconcile.ts';
const id='10000000-0000-4000-8000-000000000001',stream='10000000-0000-4000-8000-000000000002',owner='10000000-0000-4000-8000-000000000003';
const selection={mode:'screen',quality:'360p15',orientation:'landscape',microphone:true,systemAudio:false,cameraPosition:'back'};
const now=Date.now(),base={sessionId:id,streamId:stream,ownerId:owner,state:'ready',selection,providerId:'providerfixture',playbackId:'playbackfixture',providerMode:'test',maxDurationSeconds:300,expiresAt:new Date(now+300000).toISOString(),grantExpiresAt:new Date(now+60000).toISOString()};
const resource={id:'providerfixture',status:'idle',test:true,playback_ids:[{id:'playbackfixture',policy:'signed'}],stream_key:'synthetic_fixture_only',max_continuous_duration:300,passthrough:id};
function fixture(patch={}){
 const calls=[];
 const d={now:()=>now,randomToken:()=>nativeRandomToken(),hashToken:nativeTokenHash,authenticate:async()=>({id:owner,authSessionId:id,aal:'aal2'}),
  db:async(action,args)=>{calls.push({action,args});return {...base,...(action==='reserve'?{needsProvision:true}:{}),...(action==='snapshot'?{state:args.status==='active'?'active':'starting',providerStatus:args.status}:{}),...(action==='stop'?{state:'stopping'}:{})};},
  provider:{create:async()=>{calls.push({action:'provider-create'});return resource;},read:async()=>resource,disable:async()=>{calls.push({action:'provider-disable'});}},
  signPlayback:async()=> 'https://stream.mux.com/synthetic.m3u8?token=fixture',
  config:{origin:NATIVE_DEVELOPMENT_ORIGIN,enabled:true,provisioningEnabled:true,mode:'test',paidApproved:false,maxDurationSeconds:300,signingReady:true,operationsReady:true,testOwnerId:owner},...patch};
 return {d,calls};
}
const req=new Request('https://fixture.invalid',{method:'POST'});
test('native creation is gated before auth and cannot activate paid/production resources',async()=>{
 for(const patch of [{enabled:false},{provisioningEnabled:false},{signingReady:false},{operationsReady:false},{origin:'https://slnjliheyiiummxhrgmk.supabase.co'},{mode:'paid',paidApproved:false},{maxDurationSeconds:301}]){
  const {d,calls}=fixture();Object.assign(d.config,patch);
  await assert.rejects(nativeCommand(req,{action:'create',protocolVersion:1},d));assert.deepEqual(calls,[]);
 }
});
test('create returns only an owner-bound grant; stores hashes and never returns provider credentials',async()=>{
 const {d,calls}=fixture();const value=await nativeCommand(req,{action:'create',protocolVersion:1,streamId:stream,requestId:id,selection},d);
 assert.equal(value.streamId,stream);assert.match(value.grant,/^[A-Za-z0-9_-]{64}$/);
 assert.ok(!JSON.stringify(value).includes(resource.stream_key));assert.equal(value.streamKey,undefined);assert.equal(value.ingestUrl,undefined);
 const reserve=calls.find(c=>c.action==='reserve');assert.match(reserve.args.grantHash,/^[a-f0-9]{64}$/);assert.notEqual(reserve.args.grantHash,value.grant);
 assert.equal(calls.filter(c=>c.action==='provider-create').length,1);
});
test('idempotent ready reservation never creates another provider resource',async()=>{
 const {d,calls}=fixture();d.db=async(a,args)=>{calls.push({action:a,args});return base;};
 await nativeCommand(req,{action:'create',protocolVersion:1,streamId:stream,requestId:id,selection},d);
 assert.equal(calls.some(c=>c.action==='provider-create'),false);
});
test('unknown provider-create outcome leaves reconciliation work instead of retrying paid creation',async()=>{
 const {d,calls}=fixture();d.provider.create=async()=>{throw Error('private provider diagnostic');};
 await assert.rejects(nativeCommand(req,{action:'create',protocolVersion:1,streamId:stream,requestId:id,selection},d),e=>e.code==='PROVISION_PENDING');
 assert.ok(calls.some(c=>c.action==='uncertain'));
});
test('redeem atomically claims a grant and returns bounded native-only transport credentials',async()=>{
 const {d,calls}=fixture();const grant=nativeRandomToken();const value=await nativeCommand(req,{action:'redeem',protocolVersion:1,grant},d);
 assert.equal(value.ingestUrl,'rtmps://global-live.mux.com:443/app');assert.equal(value.streamKey,resource.stream_key);
 assert.match(value.stopToken,/^[A-Za-z0-9_-]{64}$/);assert.equal(calls[0].action,'redeem');assert.equal(calls[0].args.grantHash,await nativeTokenHash(grant));
});
test('changed resource identity, paid mode, public playback and unbounded duration cannot pass native validation',()=>{
 for(const patch of [{id:'wrong'},{passthrough:'wrong'},{test:false},{max_continuous_duration:301},{playback_ids:[{id:'playbackfixture',policy:'public'}]},{status:'unknown'}])assert.throws(()=>providerSnapshot({...resource,...patch},base));
});
test('heartbeat cannot declare LIVE or extend the fixed maximum duration',async()=>{
 const {d,calls}=fixture();const result=await nativeCommand(req,{action:'heartbeat',protocolVersion:1,sessionId:id,stopToken:nativeRandomToken()},d);
 assert.equal(result.isLive,undefined);assert.equal(result.expiresAt,base.expiresAt);assert.equal(calls[0].action,'heartbeat');
});
test('failed provider stop remains pending and does not return ended',async()=>{
 const {d,calls}=fixture();d.provider.disable=async()=>{throw Error('offline');};
 await assert.rejects(nativeCommand(req,{action:'stop',protocolVersion:1,sessionId:id,stopToken:nativeRandomToken()},d));
 assert.ok(calls.some(c=>c.action==='stop'));assert.ok(!calls.some(c=>c.action==='finish_stop'));
});
test('verified idle transport never grants playback or reports LIVE',async()=>{
 const {d}=fixture();const status=await nativeCommand(req,{action:'status',protocolVersion:1,sessionId:id},d);assert.equal(status.isLive,false);
 await assert.rejects(nativeCommand(req,{action:'playback',protocolVersion:1,streamId:stream},d),e=>e.code==='STREAM_OFFLINE');
});
test('current owner session can be restored without returning transport credentials',async()=>{
 const {d}=fixture();const result=await nativeCommand(req,{action:'current',protocolVersion:1},d);
 assert.equal(result.session.sessionId,id);assert.equal(result.session.grant,undefined);assert.equal(result.session.stopToken,undefined);
});
test('body parser rejects oversized, non-JSON and array requests',async()=>{
 for(const [body,type] of [['[]','application/json'],['{}','text/plain'],['{"data":"'+ 'a'.repeat(9000)+'"}','application/json']]){
  await assert.rejects(nativeRequestBody(new Request('https://fixture.invalid',{method:'POST',headers:{'Content-Type':type},body})));
 }
});
test('unknown failures and private provider diagnostics are never reflected in responses',async()=>{
 const response=nativeError(Error('stream_key=do-not-reflect'));assert.equal(response.status,503);assert.ok(!(await response.text()).includes('do-not-reflect'));
});
test('scoped reconcile cannot release ambiguous provider creation without a complete listing',async()=>{
 const {d,calls}=fixture();d.db=async(a,args)=>{calls.push({action:a,args});return a==='reconcile_list'?[{...base,providerId:undefined,state:'uncertain'}]:base;};
 const result=await reconcileNativeBroadcasts(d,async()=>({resources:[],complete:false}));assert.equal(result.pending,1);assert.ok(!calls.some(c=>c.action==='finish_stop'));
});
test('private Mux playback tokens have verifiable RS256 signatures, bounded audience and expiry',async()=>{
 const keys=await crypto.subtle.generateKey({name:'RSASSA-PKCS1-v1_5',modulusLength:2048,publicExponent:Uint8Array.of(1,0,1),hash:'SHA-256'},true,['sign','verify']);
 const pem='-----BEGIN PRIVATE KEY-----\n'+Buffer.from(await crypto.subtle.exportKey('pkcs8',keys.privateKey)).toString('base64')+'\n-----END PRIVATE KEY-----';
 const imported=await importNativeSigningKey(pem),url=new URL(await nativePlaybackUrl('playbackfixture',now+60000,'keyfixture',imported,now));
 const token=url.searchParams.get('token'),parts=token.split('.'),claims=JSON.parse(Buffer.from(parts[1],'base64url'));
 assert.equal(claims.aud,'v');assert.equal(claims.sub,'playbackfixture');assert.equal(claims.kid,'keyfixture');
 assert.ok(await crypto.subtle.verify('RSASSA-PKCS1-v1_5',keys.publicKey,Buffer.from(parts[2],'base64url'),new TextEncoder().encode(parts[0]+'.'+parts[1])));
 const providerPem=createPrivateKey(pem).export({type:'pkcs1',format:'pem'});
 const providerBase64=Buffer.from(providerPem).toString('base64');
 const formats=[providerPem,' \r\n'+providerPem+'\r\n ',providerBase64,
  providerBase64.match(/.{1,64}/g).join('\r\n'),pem,'\n '+pem+'\n',
  pem.replaceAll('\n','\\n'),Buffer.from(pem).toString('base64')];
 for(const encoded of formats){
  const providerKey=await importNativeSigningKey(encoded);
  const providerParts=new URL(await nativePlaybackUrl('playbackfixture',now+60000,'keyfixture',providerKey,now)).searchParams.get('token').split('.');
  assert.ok(await crypto.subtle.verify('RSASSA-PKCS1-v1_5',keys.publicKey,Buffer.from(providerParts[2],'base64url'),new TextEncoder().encode(providerParts[0]+'.'+providerParts[1])));
 }
 await assert.rejects(nativePlaybackUrl('playbackfixture',now+3600000,'keyfixture',imported,now));
});

test('test publishing is restricted to the designated account, independent of ordinary development access',async()=>{
 const {d,calls}=fixture();d.authenticate=async()=>({id:stream,authSessionId:id,aal:'aal2'});
 await assert.rejects(nativeCommand(req,{action:'create',protocolVersion:1,streamId:stream,requestId:id,selection},d),e=>e.code==='TEST_OWNER_REQUIRED');
 assert.deepEqual(calls,[]);
 const missing=fixture();missing.d.config.testOwnerId='';
 await assert.rejects(nativeCommand(req,{action:'create',protocolVersion:1,streamId:stream,requestId:id,selection},missing.d),e=>e.code==='NATIVE_DISABLED');
});

test('private signing rejects API-token secrets, public keys, weak keys and oversized values without reflecting them',async()=>{
 const weak=await crypto.subtle.generateKey({name:'RSASSA-PKCS1-v1_5',modulusLength:1024,publicExponent:Uint8Array.of(1,0,1),hash:'SHA-256'},true,['sign','verify']);
 const weakPem='-----BEGIN PRIVATE KEY-----\n'+Buffer.from(await crypto.subtle.exportKey('pkcs8',weak.privateKey)).toString('base64')+'\n-----END PRIVATE KEY-----';
 const publicPem='-----BEGIN PUBLIC KEY-----\n'+Buffer.from(await crypto.subtle.exportKey('spki',weak.publicKey)).toString('base64')+'\n-----END PUBLIC KEY-----';
 for(const invalid of ['', 'synthetic-api-token-secret-not-a-signing-key', weakPem,publicPem,'a'.repeat(16385)]){
  await assert.rejects(importNativeSigningKey(invalid),e=>e.code==='PLAYBACK_UNAVAILABLE'&&e.status===503&&(!invalid||!e.message.includes(invalid)));
 }
});

test('configuration diagnostics identify every failed gate without returning private values',()=>{
 const {d}=fixture();
 Object.assign(d.config,{origin:'private-origin-sentinel',enabled:false,provisioningEnabled:false,
  signingReady:false,operationsReady:false,testOwnerId:'private-owner-sentinel',maxDurationSeconds:301});
 assert.deepEqual(nativeConfigurationIssues(d.config),[
  'development_project','CLIPT_NATIVE_BROADCAST_ENABLED','CLIPT_NATIVE_MUX_CREATE_ENABLED',
  'signing_key_configuration','webhook_or_cleanup_configuration','CLIPT_NATIVE_TEST_OWNER_ID',
  'CLIPT_NATIVE_MAX_DURATION_SECONDS']);
 assert.ok(!JSON.stringify(nativeConfigurationIssues(d.config)).includes('sentinel'));
});
test('configuration diagnostics preserve approved test and paid duration boundaries',()=>{
 const {d}=fixture();assert.deepEqual(nativeConfigurationIssues(d.config),[]);
 Object.assign(d.config,{mode:'paid',paidApproved:false,maxDurationSeconds:7200,testOwnerId:''});
 assert.deepEqual(nativeConfigurationIssues(d.config),['paid_mode_approval']);
 d.config.paidApproved=true;assert.deepEqual(nativeConfigurationIssues(d.config),[]);
 for(const seconds of [59,7201,NaN,Infinity,300.5]) {
  d.config.maxDurationSeconds=seconds;
  assert.deepEqual(nativeConfigurationIssues(d.config),['CLIPT_NATIVE_MAX_DURATION_SECONDS']);
 }
});
test('disabled configuration diagnostics never change the public response or invoke storage/provider',async()=>{
 const {d,calls}=fixture();d.config.operationsReady=false;
 let error;try{await nativeCommand(req,{action:'redeem',protocolVersion:1},d);}catch(value){error=value;}
 const response=nativeError(error);assert.equal(response.status,503);
 assert.deepEqual(await response.json(),{error:'Native broadcasting is not enabled for this environment',code:'NATIVE_DISABLED'});
 assert.deepEqual(calls,[]);
});
