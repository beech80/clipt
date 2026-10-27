import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import ts from 'typescript';
const code=ts.transpileModule(readFileSync(new URL('../../src/hooks/useBlockUser.ts',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText;
function fixture(options={}){
 let blocked=false,writes=0;
 const query={select:()=>query,eq:()=>query,maybeSingle:async()=>({data:blocked?{blocked_id:'target'}:null,error:options.readError||null}),
  insert:async()=>{writes++;if(!options.writeError)blocked=true;return {error:options.writeError||null};},
  delete:()=>{const d={eq:()=>d,then:resolve=>{writes++;if(!options.writeError)blocked=false;return Promise.resolve({error:options.writeError||null}).then(resolve);}};return d;}};
 const supabase={auth:{getUser:async()=>({data:{user:options.noUser?null:{id:'actor'}},error:null})},from:()=>query};
 const mod={exports:{}};
 new Function('require','module','exports',code)(name=>name==='react'?{useCallback:fn=>fn,useState:()=>[false,()=>{}],useRef:()=>({current:false})}:{supabase},mod,mod.exports);
 return {hook:mod.exports.useBlockUser(),writes:()=>writes};
}
test('block read failures propagate rather than pretending unblocked',async()=>{
 const f=fixture({readError:Error('denied')});await assert.rejects(f.hook.checkIfBlocked('target'),/denied/);
 assert.equal(await fixture().hook.checkIfBlocked('target'),false);
});
test('failed writes cannot report success, concurrent writes have one winner, and confirmed unblock works',async()=>{
 await assert.rejects(fixture({writeError:Error('denied')}).hook.blockUser('target'),/denied/);
 const f=fixture();const first=f.hook.blockUser('target');await assert.rejects(f.hook.blockUser('target'),/in progress/);assert.equal(await first,true);assert.equal(f.writes(),1);
 assert.equal(await f.hook.checkIfBlocked('target'),true);assert.equal(await f.hook.unblockUser('target'),false);
 assert.equal(await f.hook.checkIfBlocked('target'),false);
});
test('self-block and unauthenticated writes are rejected before the database',async()=>{
 for(const [f,target] of [[fixture(),'actor'],[fixture({noUser:true}),'target']]){await assert.rejects(f.hook.blockUser(target),/authorization/);assert.equal(f.writes(),0);}
});
