import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import ts from 'typescript';
function guard(origin,fetcher){
 const source=readFileSync(new URL('../../supabase/functions/_shared/obs-beta-erasure.ts',import.meta.url),'utf8');
 const mod={exports:{}};
 class HttpError extends Error{constructor(status,message){super(message);this.status=status;}}
 new Function('require','module','exports','Deno','fetch',ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText)(
  ()=>({HttpError}),mod,mod.exports,{env:{get:()=>origin}},fetcher);
 return mod.exports.endOwnerObsBeforeErasure;
}
test('OBS erasure guard leaves the development billing path unchanged',async()=>{
 await guard('https://akiksrlzdqvipqbbjxpw.supabase.co',()=>{throw Error('Unexpected network');})(new Request('https://fixture.invalid'));
});
test('production erasure requires confirmed shutdown and forwards only the authenticated user token',async()=>{
 const request=new Request('https://fixture.invalid',{headers:{Authorization:'Bearer fixture-user-token'}});
 let calls=0;
 await guard('https://slnjliheyiiummxhrgmk.supabase.co',async(url,args)=>{
  calls++;assert.equal(url,'https://slnjliheyiiummxhrgmk.supabase.co/functions/v1/obs-broadcast-session');
  assert.equal(args.headers.Authorization,'Bearer fixture-user-token');assert.equal(args.headers.apikey,undefined);
  assert.deepEqual(JSON.parse(args.body),{protocolVersion:1,action:'erase'});
  return new Response(JSON.stringify({state:'ended'}),{status:200});
 })(request);assert.equal(calls,1);
 for(const result of [new Response('{}',{status:200}),new Response('{}',{status:503})]){
  await assert.rejects(guard('https://slnjliheyiiummxhrgmk.supabase.co',async()=>result)(request),e=>e.status===503);
 }
});
