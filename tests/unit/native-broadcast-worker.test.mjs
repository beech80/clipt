import test from 'node:test';
import assert from 'node:assert/strict';
import {reconcileNativeStreams} from '../../scripts/reconcile-native-streams.mjs';
test('native cleanup uses only its scoped token and the fixed development action',async()=>{
 let call;const result=await reconcileNativeStreams({token:'a'.repeat(64),request:async(url,options)=>{call={url,options};return Response.json({checked:2,stopped:1,pending:0});}});
 assert.equal(call.url,'https://akiksrlzdqvipqbbjxpw.supabase.co/functions/v1/native-broadcast-session');
 assert.equal(call.options.redirect,'error');assert.deepEqual(JSON.parse(call.options.body),{protocolVersion:1,action:'reconcile'});
 assert.equal(call.options.headers.Authorization,'Bearer '+'a'.repeat(64));assert.deepEqual(result,{checked:2,stopped:1,pending:0});
});
test('missing/malformed cleanup credentials do not make a request',async()=>{
 for(const token of [undefined,'short','a'.repeat(63),'a'.repeat(64)+'\n']){
  let called=false;await assert.rejects(reconcileNativeStreams({token,request:async()=>{called=true;}}));assert.equal(called,false);
 }
});
test('cleanup refuses failed, pending and malformed observations without leaking response content',async()=>{
 for(const response of [new Response('private provider diagnostic',{status:401}),new Response('private provider diagnostic',{status:200}),Response.json({checked:1,stopped:0,pending:1}),Response.json({checked:0,stopped:1,pending:0}),Response.json({checked:'1',stopped:0,pending:0})]){
  await assert.rejects(reconcileNativeStreams({token:'a'.repeat(64),request:async()=>response}),e=>!e.message.includes('private provider diagnostic'));
 }
});
