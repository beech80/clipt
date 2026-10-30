import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import ts from 'typescript';
import {DEFAULT_NATIVE_QUALITY,NATIVE_QUALITY_IDS,nativeEncoderSettings,readNativeCapabilities,validateNativeSelection} from '../../src/native/broadcast/policy.ts';
const require=createRequire(import.meta.url);
const cap={protocolVersion:1,platform:'ios',modes:['camera','screen'],qualityIds:['360p15','720p30'],microphone:true,cameraSwitch:true,backgroundScreen:true,systemAudio:'permission-dependent'};
const selection={mode:'screen',quality:'360p15',orientation:'landscape',microphone:true,systemAudio:true,cameraPosition:'back'};
function fixture({native=true,available=true,platform='ios',capabilities=cap,error=false}={}){
 const calls=[];const runtime={isNativePlatform:()=>native,getPlatform:()=>platform,isPluginAvailable:()=>available};
 const plugin={getCapabilities:async()=>{calls.push('capabilities');if(error)throw Error('private-value');return capabilities;},start:async value=>{calls.push({start:value});if(error)throw Error('rtmps://private-value');},stop:async()=>calls.push('stop'),setMuted:async value=>calls.push({mute:value}),switchCamera:async()=>calls.push('switch')};
 const output=ts.transpileModule(readFileSync(new URL('../../src/native/broadcast/bridge.ts',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,esModuleInterop:true}}).outputText;
 const mod={exports:{}};const localRequire=name=>name==='@capacitor/core'?{Capacitor:runtime,registerPlugin:()=>plugin}:name==='./policy'?{readNativeCapabilities,validateNativeSelection}:require(name);
 new Function('require','module','exports',output)(localRequire,mod,mod.exports);
 return{bridge:mod.exports.createNativeBroadcastBridge(runtime,plugin),calls,plugin};
}
test('quality starts at 360p15 with explicit bps units and two-second keyframes',()=>{
 assert.equal(DEFAULT_NATIVE_QUALITY,'360p15');
 const q=nativeEncoderSettings(DEFAULT_NATIVE_QUALITY,'landscape');assert.deepEqual([q.width,q.height,q.fps,q.videoBitrateBps,q.keyframeIntervalSeconds],[640,360,15,1000000,2]);
 assert.equal(q.videoCodec,'h264');assert.equal(q.audioCodec,'aac');assert.equal(q.audioBitrateBps,64000);
});
test('portrait uses the same pixel budget without stretching or shrinking controls',()=>{
 for(const id of NATIVE_QUALITY_IDS){const l=nativeEncoderSettings(id,'landscape'),p=nativeEncoderSettings(id,'portrait');assert.equal(l.width,p.height);assert.equal(l.height,p.width);assert.equal(l.width%2,0);assert.equal(l.height%2,0);assert.equal(l.fps,p.fps);assert.equal(l.videoBitrateBps,p.videoBitrateBps);}
});
test('invalid quality and orientation cannot enter the encoder',()=>{
 for(const id of ['4k','__proto__','constructor',undefined])assert.throws(()=>nativeEncoderSettings(id,'landscape'));
 assert.throws(()=>nativeEncoderSettings('360p15','rotated'));
});
test('native capability parsing requires matching platform, protocol, valid options and cross-app screen support',()=>{
 assert.deepEqual(readNativeCapabilities(cap,'ios'),cap);
 for(const patch of [{protocolVersion:2},{platform:'web'},{modes:['camera','camera']},{modes:['screen'],backgroundScreen:false},{qualityIds:['4k']},{qualityIds:[]},{systemAudio:{toString:()=> 'supported'}},{microphone:'yes'}])assert.throws(()=>readNativeCapabilities({...cap,...patch},'ios'));
 assert.throws(()=>readNativeCapabilities(cap,'android'));
});
test('higher quality and audio are offered only when native capability confirms support',()=>{
 assert.equal(validateNativeSelection(selection,cap).fps,15);
 assert.throws(()=>validateNativeSelection({...selection,quality:'1080p30'},cap));
 assert.throws(()=>validateNativeSelection({...selection,mode:'camera',systemAudio:true},cap));
 assert.throws(()=>validateNativeSelection(selection,{...cap,systemAudio:'unsupported'}));
 assert.throws(()=>validateNativeSelection(selection,{...cap,microphone:false}));
 assert.equal(validateNativeSelection({...selection,microphone:false,systemAudio:false},{...cap,microphone:false,systemAudio:'unsupported'}).width,640);
});
test('web and missing native engine never access capture, permissions or provider calls',async()=>{
 for(const opts of [{native:false},{available:false}]){
  const f=fixture(opts);assert.equal((await f.bridge.inspect()).supported,false);
  await assert.rejects(f.bridge.start({grant:'a'.repeat(64),selection}),/unavailable/);assert.deepEqual(f.calls,[]);
 }
});
test('unknown or failing native plugins cannot report support',async()=>{
 for(const opts of [{platform:'web'},{capabilities:{...cap,protocolVersion:9}},{error:true}]){
  const f=fixture(opts);const r=await f.bridge.inspect();assert.deepEqual(r,{supported:false,reason:'native-engine-unavailable'});assert.ok(!JSON.stringify(r).includes('private-value'));
 }
});
test('bridge forwards only a native grant, verified selection and fixed encoder settings',async()=>{
 const f=fixture();await f.bridge.start({grant:'a'.repeat(64),selection:{...selection,server:'rtmps://evil.invalid',streamKey:'private-value'},apiKey:'private-value',videoBitrate:999999999});
 const value=f.calls.find(x=>x.start).start;assert.deepEqual(Object.keys(value).sort(),['encoder','grant','selection']);
 assert.deepEqual(value.selection,selection);assert.equal(value.encoder.videoBitrateBps,1000000);assert.ok(!JSON.stringify(value).includes('evil.invalid'));assert.ok(!JSON.stringify(value).includes('private-value'));
});
test('bad grants, unsupported qualities and missing system audio cannot start native capture',async()=>{
 for(const input of [{grant:'short',selection},{grant:'a'.repeat(64),selection:{...selection,quality:'1080p30'}}]){
  const f=fixture();await assert.rejects(f.bridge.start(input));assert.equal(f.calls.some(x=>x.start),false);
 }
});
test('ending remains possible when capability reads fail after permission revocation',async()=>{
 const f=fixture({error:true});await f.bridge.stop();assert.deepEqual(f.calls,['stop']);
});
test('camera switching and audio toggles respect actual supported capabilities',async()=>{
 const f=fixture();await f.bridge.switchCamera();await f.bridge.setMuted(true,true);assert.ok(f.calls.includes('switch'));assert.ok(f.calls.some(x=>x.mute?.microphone===true));
 const missing=fixture({capabilities:{...cap,cameraSwitch:false,systemAudio:'unsupported'}});await assert.rejects(missing.bridge.switchCamera());await assert.rejects(missing.bridge.setMuted(true,false));
});
test('native capture errors cannot expose provider diagnostics or keys',async()=>{
 const f=fixture();f.plugin.start=async()=>{throw Error('rtmps://private-key-value');};
 await assert.rejects(f.bridge.start({grant:'a'.repeat(64),selection}),error=>error.message==='Native broadcast did not start');
});
test('native shell uses bundled assets and disallows remote builder URLs, mixed content and cleartext',()=>{
 const output=ts.transpileModule(readFileSync(new URL('../../capacitor.config.ts',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText;const mod={exports:{}};new Function('module','exports',output)(mod,mod.exports);const c=mod.exports.default;
 assert.equal(c.appId,'com.slnjliheyiiummxhrgmk.clip');assert.equal(c.appName,'CLIPT');assert.equal(c.webDir,'dist');assert.equal(c.server.url,undefined);assert.equal(c.server.cleartext,false);assert.equal(c.android.allowMixedContent,false);assert.equal(c.zoomEnabled,true);assert.equal(c.loggingBehavior,'none');assert.equal(c.bundledWebRuntime,undefined);
 const nodeConfig=JSON.parse(readFileSync(new URL('../../tsconfig.node.json',import.meta.url),'utf8').replace(/\/\*[\s\S]*?\*\//g,''));
 assert.ok(nodeConfig.include.includes('capacitor.config.ts'));
});
