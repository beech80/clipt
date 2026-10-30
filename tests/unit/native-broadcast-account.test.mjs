import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import ts from 'typescript';
const output=ts.transpileModule(readFileSync(new URL('../../src/native/broadcast/accountGuard.ts',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText;
const module={exports:{}};new Function('require','module','exports',output)(()=>({}),module,module.exports);
function fixture(native=true){let callback,stops=0,unsubscribed=0,current={sessionId:'fixture'},state='publishing';const tasks=[];
 const dispose=module.exports.watchNativeBroadcastAccount({auth:{onAuthStateChange:cb=>{callback=cb;return {data:{subscription:{unsubscribe:()=>unsubscribed++}}};}}},{isNativePlatform:()=>native,isPluginAvailable:()=>true},{stop:async()=>{stops++;},getStatus:async()=>state,current:async()=>current},fn=>tasks.push(fn));
 return{event:(e,id)=>callback?.(e,id?{user:{id}}:null),flush:async()=>{while(tasks.length)tasks.shift()();await new Promise(r=>setImmediate(r));},dispose,get stops(){return stops;},get unsubscribed(){return unsubscribed;},setCurrent:x=>{current=x;},setState:x=>{state=x;}};
}
test('app-wide native capture ends on sign-out or a different signed-in account',async()=>{
 const f=fixture();f.event('INITIAL_SESSION','owner');await f.flush();assert.equal(f.stops,0);
 f.event('TOKEN_REFRESHED','owner');await f.flush();assert.equal(f.stops,0);
 f.event('SIGNED_IN','different');await f.flush();assert.equal(f.stops,1);
 f.event('SIGNED_OUT');await f.flush();assert.equal(f.stops,2);
});
test('same owner can reload the WebView without ending a valid background screen session',async()=>{
 const f=fixture();f.event('INITIAL_SESSION','owner');await f.flush();assert.equal(f.stops,0);f.dispose();assert.equal(f.unsubscribed,1);assert.equal(f.stops,0);
});
test('native capture cannot continue when initial sign-in is absent or belongs to no owned session',async()=>{
 const absent=fixture();absent.event('INITIAL_SESSION');await absent.flush();assert.equal(absent.stops,1);
 const other=fixture();other.setCurrent(null);other.event('INITIAL_SESSION','owner');await other.flush();assert.equal(other.stops,1);
});
test('web clients do not subscribe and cleanup never ends native capture just because a page unmounts',async()=>{
 const f=fixture(false);f.event('SIGNED_OUT');await f.flush();f.dispose();assert.equal(f.stops,0);assert.equal(f.unsubscribed,0);
});
