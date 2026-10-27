import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { stripTypeScriptTypes } from 'node:module';
const source = stripTypeScriptTypes(readFileSync(new URL('../../supabase/functions/_shared/subscription.ts', import.meta.url), 'utf8').replace(/^import .*$/gm, '').replace(/^export /gm, ''));
const release = new Function('HttpError', source + ';return releaseExpiredErasureCheckouts;')(Error);
function fixture(change = {}) {
 const calls = [];
 const session = {id:'cs_test_fixture',status:'expired',livemode:false,customer:'cus_fixture',client_reference_id:'owner',metadata:{clipt_user_id:'owner'},mode:'subscription',payment_status:'unpaid',subscription:null,invoice:null,payment_intent:null,...change};
 const stripe = {customers:{retrieve:async()=>({id:'cus_fixture',livemode:false,metadata:{clipt_user_id:'owner'}})},checkout:{sessions:{list:async()=>({has_more:false,data:[session]})}}};
 const command = async(action,payload)=>{calls.push({action,payload});return action==='account'?{customer_id:'cus_fixture'}:true;};
 return {calls,stripe,command};
}
test('expired unpaid provider-bound session releases only the matching local reservation',async()=>{
 const f=fixture();await release(f.stripe,'owner',f.command);
 assert.deepEqual(f.calls,[{action:'account',payload:{user_id:'owner'}},{action:'release',payload:{user_id:'owner',session_id:'cs_test_fixture'}}]);
});
test('open and completed sessions are not expired or released',async()=>{
 for(const status of ['open','complete']){const f=fixture({status});await release(f.stripe,'owner',f.command);assert.equal(f.calls.length,1);}
});
test('unsafe expired session proofs cannot release reservations',async()=>{
 for(const change of [{livemode:true},{id:'cs_live_bad'},{customer:'cus_other'},{client_reference_id:'other'},{metadata:{}},{mode:'payment'},{payment_status:'paid'},{subscription:'sub_paid'},{invoice:'in_paid'},{payment_intent:'pi_paid'}]){
  const f=fixture(change);await assert.rejects(release(f.stripe,'owner',f.command));assert.equal(f.calls.length,1);
 }
});
test('pagination or provider failure cannot release reservations',async()=>{
 for(const list of [async()=>({has_more:true,data:[]}),async()=>{throw Error('timeout');}]){
  const f=fixture();f.stripe.checkout.sessions.list=list;await assert.rejects(release(f.stripe,'owner',f.command));assert.equal(f.calls.length,1);
 }
});
