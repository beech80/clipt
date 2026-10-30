import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import ts from 'typescript';
const require=createRequire(import.meta.url);
function fixture({hidden=true,pending=false,production=false,playback=true}={}){
 const effects=[],checks=[],cleared=[],updates=[];let timer,delay,now=1000,states=0,mutations=0;
 const state=['','',true,301000,playback?{id:'local',url:'https://stream.mux.com/fixture.m3u8'}:null];
 const hooks={useState:()=>{const index=states++;return[state[index],value=>updates.push({index,value})];},useEffect:fn=>effects.push(fn)};
 const ui=new Proxy({},{get:()=>()=>null});
 const localRequire=name=>{
  if(name==='react')return hooks;
  if(name==='@/contexts/AuthContext')return{useAuth:()=>({user:{id:'owner'}})};
  if(name==='react-router-dom')return{useSearchParams:()=>[new URLSearchParams()]};
  if(name==='@tanstack/react-query')return{
   useQueryClient:()=>({}),useQuery:config=>({data:config.queryKey[0]==='own-stream'?{id:'local',title:'Test',game_id:null}:[]}),
   useMutation:()=>{const first=mutations++===0;return{isPending:first&&pending,mutate:first?id=>checks.push(id):()=>{},data:undefined};},
  };
  if(name==='@/integrations/supabase/client')return{storageProjectUrl:production?'https://slnjliheyiiummxhrgmk.supabase.co':'https://akiksrlzdqvipqbbjxpw.supabase.co'};
  if(name==='@/lib/live-test-environment')return require('../../src/lib/live-test-environment.ts');
  if(name==='@/lib/game-catalog')return{gameLabel:()=>'',completeGameCatalog:()=>[]};
  if(name==='@/lib/channel-feeds')return{validChannelGame:()=>false};
  if(name==='@/services/streamService')return ui;
  if(name.startsWith('@/components/')||name==='./StreamPlayer'||name.startsWith('./broadcast/')||name.startsWith('./chat/'))return ui;
  return require(name);
 };
 const output=ts.transpileModule(readFileSync(new URL('../../src/components/streaming/StreamDashboard.tsx',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText;
 const mod={exports:{}};
 class Clock extends Date{static now(){return now;}}
 new Function('require','module','exports','Date','document','setInterval','clearInterval',output)(localRequire,mod,mod.exports,Clock,{hidden},(fn,ms)=>{timer=fn;delay=ms;return 7;},id=>cleared.push(id));
 mod.exports.StreamDashboard();
 const effect=effects.find(fn=>fn.toString().includes('setInterval'));
 assert.ok(effect);const cleanup=effect();
 return{checks,updates,cleared,delay,tick:()=>timer?.(),hasTimer:Boolean(timer),advanceTo:value=>{now=value;},cleanup};
}
test('actual dashboard keeps refreshing the approved pilot while OBS hides the browser page',()=>{
 const f=fixture({hidden:true});assert.equal(f.delay,20000);f.tick();assert.deepEqual(f.checks,['local']);f.tick();assert.deepEqual(f.checks,['local','local']);f.cleanup();assert.deepEqual(f.cleared,[7]);
});
test('background monitoring retains the five-minute deadline and cannot extend itself',()=>{
 const f=fixture();f.advanceTo(301000);f.tick();assert.deepEqual(f.checks,[]);assert.ok(f.updates.some(x=>x.index===3&&x.value===0));
});
test('a pending provider check cannot spawn another polling interval',()=>{
 const f=fixture({pending:true});assert.equal(f.hasTimer,false);f.tick();assert.deepEqual(f.checks,[]);
});
test('production and missing playback never start development pilot monitoring',()=>{
 for(const options of [{production:true},{playback:false}]){const f=fixture(options);assert.equal(f.hasTimer,false);assert.deepEqual(f.checks,[]);}
});
