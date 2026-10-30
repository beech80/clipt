import test from 'node:test';
import assert from 'node:assert/strict';
import ts from 'typescript';
import {readFileSync} from 'node:fs';
const source=readFileSync(new URL('../../src/native/broadcast/session.ts',import.meta.url),'utf8');
const module={exports:{}};new Function('require','module','exports',ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText)(()=>({}),module,module.exports);
const {readNativePlayback,isNativePlaybackMarker,readPreparedNativeSession,readNativeSessionStatus}=module.exports;
const id='10000000-0000-4000-8000-000000000001',stream='10000000-0000-4000-8000-000000000002',now=Date.now();
const selection={mode:'camera',quality:'360p15',orientation:'portrait',microphone:true,systemAudio:false,cameraPosition:'back'};
const prepared={protocolVersion:1,sessionId:id,streamId:stream,grant:'a'.repeat(64),expiresAt:new Date(now+60000).toISOString(),maxDurationSeconds:300,selection};
test('client accepts only matching expiring grants and discards transport secret fields',()=>{
 const result=readPreparedNativeSession({...prepared,streamKey:'never-forward',ingestUrl:'rtmps://evil.invalid'},stream,selection,now);
 assert.equal(result.streamKey,undefined);assert.equal(result.ingestUrl,undefined);assert.deepEqual(result.selection,selection);
 for(const patch of [{streamId:id},{grant:'short'},{expiresAt:new Date(now-1).toISOString()},{expiresAt:new Date(now+3600000).toISOString()},{selection:{...selection,microphone:false}}])assert.throws(()=>readPreparedNativeSession({...prepared,...patch},stream,selection,now));
});
test('client does not turn arbitrary native transport state into provider LIVE',()=>{
 const status={...prepared,state:'starting',isLive:false};assert.equal(readNativeSessionStatus(status).isLive,false);
 assert.throws(()=>readNativeSessionStatus({...status,isLive:true}));
 assert.throws(()=>readNativeSessionStatus({...status,state:'publishing'}));
 assert.throws(()=>readNativeSessionStatus({...status,selection:{...selection,quality:'4k'}}));
});
test('native playback markers are bound to the exact stream identifier',()=>{
 assert.equal(isNativePlaybackMarker('clipt-native:'+stream,stream),true);
 assert.equal(isNativePlaybackMarker('clipt-native:'+id,stream),false);
 assert.equal(isNativePlaybackMarker('https://stream.mux.com/native.m3u8',stream),false);
});
test('private playback rejects token leaks, other hosts, duplicate tokens and invalid expiry',()=>{
 const value={protocolVersion:1,playbackUrl:'https://stream.mux.com/synthetic.m3u8?token=synthetic',expiresAt:new Date(now+60000).toISOString()};
 assert.equal(readNativePlayback(value,now).url,value.playbackUrl);
 for(const playbackUrl of ['https://evil.invalid/synthetic.m3u8?token=synthetic','https://user:pass@stream.mux.com/synthetic.m3u8?token=synthetic','https://stream.mux.com/synthetic.m3u8?token=a&token=b','https://stream.mux.com/synthetic.m3u8?token=a&debug=secret','https://stream.mux.com/synthetic.m3u8#token=a'])assert.throws(()=>readNativePlayback({...value,playbackUrl},now));
 assert.throws(()=>readNativePlayback({...value,expiresAt:new Date(now+3600000).toISOString()},now));
});
