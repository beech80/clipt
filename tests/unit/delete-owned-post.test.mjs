import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {stripTypeScriptTypes} from 'node:module';
const source=stripTypeScriptTypes(readFileSync(new URL('../../src/lib/delete-owned-post.ts',import.meta.url),'utf8'));
const {deleteOwnedPost}=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
function client({actor='owner',row={id:'post'},error=null}={}) {
  const calls=[];const builder={delete(){calls.push('delete');return this;},eq(k,v){calls.push([k,v]);return this;},select(v){calls.push(['select',v]);return this;},retry(v){calls.push(['retry',v]);return this;},async maybeSingle(){return {data:row,error};}};
  return {calls,auth:{getUser:async()=>({data:{user:actor?{id:actor}:null}})},from:()=>builder};
}
test('post deletion requires fresh owner authentication before mutation',async()=>{
  for(const actor of [null,'other']) {const db=client({actor});await assert.rejects(deleteOwnedPost(db,'post','owner'));assert.deepEqual(db.calls,[]);}
});
test('post deletion requires server-confirmed matching row and retains owner scoping',async()=>{
  const db=client();await deleteOwnedPost(db,'post','owner');
  assert.deepEqual(db.calls,['delete',['id','post'],['user_id','owner'],['select','id'],['retry',false]]);
  for(const options of [{row:null},{row:{id:'wrong'}},{error:{message:'network uncertainty'}}]) await assert.rejects(deleteOwnedPost(client(options),'post','owner'),/not confirmed/);
});
