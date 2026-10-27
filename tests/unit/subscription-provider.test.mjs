import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {stripTypeScriptTypes} from 'node:module';
const source=stripTypeScriptTypes(readFileSync(new URL('../../supabase/functions/_shared/subscription.ts',import.meta.url),'utf8').replace(/^import .*$/gm,'').replace(/^export /gm,''));
const prices={premium:'price_premium',maxed:'price_maxed'};
const actor='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const now=Math.floor(Date.now()/1000);
test('Sandbox subscription configuration rejects non-development projects before provider access',()=>{
 const env={SUPABASE_URL:'https://other-project.supabase.co',STRIPE_SECRET_KEY:'sk_test_fixture',
  CLIPT_PAYMENTS_MODE:'test',STRIPE_PREMIUM_PRICE_ID:prices.premium,STRIPE_MAXED_PRICE_ID:prices.maxed,
  STRIPE_WEBHOOK_SECRET:'fixture',CLIPT_PAYMENT_RETURN_ORIGIN:'https://preview.invalid'};
 assert.throws(()=>helpers(env).subscriptionConfig(),/restricted to the development project/);
 assert.doesNotThrow(()=>helpers({...env,SUPABASE_URL:'https://akiksrlzdqvipqbbjxpw.supabase.co'}).subscriptionConfig());
});
function erasureFixture(change={}) {
 let current={...fixture().sub,...change}; const calls=[];
 return {calls,stripe:{subscriptions:{
  retrieve:async()=>({...current}),
  cancel:async(id,args,options)=>{calls.push({id,args,options});current={...current,status:'canceled',schedule:null};return {...current};},
 }}};
}
test('deletion cancellation confirms provider shutdown without refund or final invoice',async()=>{
 const f=erasureFixture();
 const result=await helpers().cancelBillingForErasure(f.stripe,'sub_fixture',actor,'cus_fixture','request_fixture');
 assert.equal(result.status,'canceled');assert.equal(f.calls.length,1);
 assert.deepEqual(f.calls[0].args,{invoice_now:false,prorate:false});
 assert.match(f.calls[0].options.idempotencyKey,/clipt-sandbox-erasure:/);
 await helpers().cancelBillingForErasure(f.stripe,'sub_fixture',actor,'cus_fixture','request_fixture');
 assert.equal(f.calls.length,1);
});
for(const [name,change] of [['live',{livemode:true}],['foreign owner',{metadata:{clipt_user_id:'other'}}],['foreign customer',{customer:'cus_other'}]])
 test('deletion rejects '+name+' before provider mutation',async()=>{
  const f=erasureFixture(change);
  await assert.rejects(helpers().cancelBillingForErasure(f.stripe,'sub_fixture',actor,'cus_fixture','request_fixture'),/ownership/);
  assert.equal(f.calls.length,0);
 });
test('unconfirmed deletion cancellation does not report success',async()=>{
 const f=erasureFixture();f.stripe.subscriptions.cancel=async()=>fixture().sub;
 await assert.rejects(helpers().cancelBillingForErasure(f.stripe,'sub_fixture',actor,'cus_fixture','request_fixture'),/unconfirmed/);
});
function helpers(env={}) {
 class HttpError extends Error {constructor(status,message){super(message);this.status=status;}}
 return new Function('HttpError','Deno','serverEnv','serviceClient',source+';return {approvedPrice,subscriptionSnapshot,checkoutAllowed,subscriptionConfig,schedulePeriodCancellation,cancelBillingForErasure,verifyErasureBillingShutdown};')(
  HttpError,{env:{get:key=>env[key]}},key=>{if(!env[key])throw new HttpError(503,'Not configured');return env[key];},()=>{throw new Error('Unexpected database');});
}
function fixture(change={}) {
 const price={id:prices.maxed,livemode:false,active:true,currency:'usd',unit_amount:1499,type:'recurring',recurring:{interval:'month',interval_count:1,usage_type:'licensed'}};
 const invoice={livemode:false,status:'paid',currency:'usd',amount_paid:1499,customer:'cus_fixture',subscription:'sub_fixture',lines:{has_more:false,data:[{price:{id:prices.maxed},quantity:1,proration:false,period:{start:now-86400,end:now+29*86400}}]}};
 const sub={id:'sub_fixture',livemode:false,status:'active',cancel_at_period_end:false,customer:'cus_fixture',metadata:{clipt_user_id:actor},collection_method:'charge_automatically',items:{has_more:false,data:[{price:{id:prices.maxed},quantity:1}]},latest_invoice:invoice};
 const stripe={prices:{retrieve:async()=>({...price,...change.price})},subscriptions:{retrieve:async()=>({...sub,...change.subscription,latest_invoice:{...invoice,...change.invoice}})}};
 return {stripe,invoice,sub};
}
function shutdownFixture(change={}) {
 const f=erasureFixture();
 f.stripe.customers={retrieve:async()=>({id:'cus_fixture',livemode:false,metadata:{clipt_user_id:actor},...change.customer})};
 f.stripe.subscriptions.list=async()=>({has_more:false,data:[fixture().sub],...change.subscriptions});
 f.stripe.invoices={list:async()=>({has_more:false,data:[],...change.invoices})};
 return f;
}
test('complete billing shutdown verifies customer, subscriptions and pending invoice collection',async()=>{
 const f=shutdownFixture();const proof=await helpers().verifyErasureBillingShutdown(f.stripe,actor,'cus_fixture','sub_fixture','request_fixture');
 assert.deepEqual(proof,{customer_id:'cus_fixture',subscription_id:'sub_fixture',status:'canceled'});assert.equal(f.calls.length,1);
});
for(const [name,change] of [
 ['foreign customer owner',{customer:{metadata:{clipt_user_id:'other'}}}],
 ['deleted customer',{customer:{deleted:true}}],
 ['live customer',{customer:{livemode:true}}],
 ['unbounded subscription list',{subscriptions:{has_more:true}}],
 ['additional active subscription',{subscriptions:{data:[{...fixture().sub,id:'sub_other'}]}}],
])test('billing shutdown rejects '+name+' before cancellation',async()=>{
 const f=shutdownFixture(change);await assert.rejects(helpers().verifyErasureBillingShutdown(f.stripe,actor,'cus_fixture','sub_fixture','request_fixture'));
 assert.equal(f.calls.length,0);
});
test('pending automatic invoice prevents account-erasure authorization after cancellation',async()=>{
 const f=shutdownFixture({invoices:{data:[{livemode:false,customer:'cus_fixture',subscription:'sub_fixture',status:'open',auto_advance:true}]}});
 await assert.rejects(helpers().verifyErasureBillingShutdown(f.stripe,actor,'cus_fixture','sub_fixture','request_fixture'),/Pending invoice/);
});
test('customer without subscription is verified without cancellation or refund',async()=>{
 const f=shutdownFixture({subscriptions:{data:[]}});
 const proof=await helpers().verifyErasureBillingShutdown(f.stripe,actor,'cus_fixture',null,'request_fixture');
 assert.equal(proof.status,'no_subscription');assert.equal(f.calls.length,0);
});
test('provider adapter grants only an exact, server-retrieved paid recurring invoice',async()=>{
 const snapshot=await helpers().subscriptionSnapshot(fixture().stripe,'sub_fixture',prices);
 assert.equal(snapshot.user_id,actor);assert.equal(snapshot.paid_tier,'maxed');assert.equal(Date.parse(snapshot.paid_end)-Date.parse(snapshot.paid_start),30*86400000);
});
for(const [name,invoice] of [
 ['failed payment',{status:'open',amount_paid:0}],['foreign customer',{customer:'cus_other'}],['foreign subscription',{subscription:'sub_other'}],
 ['underpayment',{amount_paid:499}],['live invoice',{livemode:true}],['proration',{lines:{has_more:false,data:[{price:{id:prices.maxed},quantity:1,proration:true,period:{start:now-1,end:now+1}}]}}],
 ['future paid period',{lines:{has_more:false,data:[{price:{id:prices.maxed},quantity:1,proration:false,period:{start:now+86400,end:now+2*86400}}]}}],
])test(name+' cannot extend paid membership',async()=>{const snapshot=await helpers().subscriptionSnapshot(fixture({invoice}).stripe,'sub_fixture',prices);assert.equal(snapshot.paid_tier,undefined);assert.equal(snapshot.paid_end,undefined);});
for(const [name,price] of [['live price',{livemode:true}],['incorrect cents',{unit_amount:1500}],['annual recurring',{recurring:{interval:'year',interval_count:1,usage_type:'licensed'}}]])
 test(name+' rejected before fulfillment',async()=>{await assert.rejects(helpers().subscriptionSnapshot(fixture({price}).stripe,'sub_fixture',prices),/price does not match/);});
test('missing owner binding or live subscription is rejected',async()=>{
 await assert.rejects(helpers().subscriptionSnapshot(fixture({subscription:{metadata:{}}}).stripe,'sub_fixture',prices),/owner binding/);
 await assert.rejects(helpers().subscriptionSnapshot(fixture({subscription:{livemode:true}}).stripe,'sub_fixture',prices),/Unsupported/);
});
test('unverified checkout permits only the securely configured isolated test identity',()=>{
 const guard=helpers({CLIPT_SUBSCRIPTION_TEST_USER_ID:actor}).checkoutAllowed;
 assert.doesNotThrow(()=>guard(actor));assert.throws(()=>guard('other-user'),/awaits lifecycle/);
 assert.throws(()=>helpers().checkoutAllowed(actor),/awaits lifecycle/);
});
function cancellationFixture(change={}) {
 let current={...fixture().sub,schedule:'sub_sched_fixture'};
 const calls=[];
 const schedule={id:'sub_sched_fixture',livemode:false,status:'active',subscription:current.id,customer:current.customer,...change.schedule};
 const stripe={
  subscriptionSchedules:{
   retrieve:async()=>schedule,
   release:async(id,args,config)=>{
    calls.push({operation:'release',id,args,config});
    if(change.releaseFailure)throw new Error('Provider timeout');
    current={...current,schedule:null};
    return {id,status:'released',livemode:false,released_subscription:current.id,customer:current.customer,...change.released};
   },
  },
  subscriptions:{
   retrieve:async()=>({...current,...change.refreshed}),
   update:async(id,args,config)=>{
    calls.push({operation:'update',id,args,config});
    if(change.updateFailure){change.updateFailure=false;throw new Error('Provider timeout');}
    current={...current,cancel_at_period_end:args.cancel_at_period_end};
    return {...current,...change.updated};
   },
  },
 };
 return {stripe,calls,read:()=>current};
}
test('scheduled tier change cancellation releases schedule and cancels renewal, not paid access',async()=>{
 const f=cancellationFixture();
 const result=await helpers().schedulePeriodCancellation(f.stripe,f.read(),actor,'cus_fixture','request-fixture',true);
 assert.equal(result.status,'active');assert.equal(result.cancel_at_period_end,true);
 assert.deepEqual(f.calls.map(call=>call.operation),['release','update']);
 assert.deepEqual(f.calls[0].args,{preserve_cancel_date:true});
 assert.deepEqual(f.calls[1].args,{cancel_at_period_end:true,proration_behavior:'none'});
});
test('retry after schedule release succeeds reuses original cancellation identity',async()=>{
 const f=cancellationFixture({updateFailure:true});
 await assert.rejects(helpers().schedulePeriodCancellation(f.stripe,f.read(),actor,'cus_fixture','same-request',true),/timeout/);
 const result=await helpers().schedulePeriodCancellation(f.stripe,f.read(),actor,'cus_fixture','same-request',true);
 assert.equal(result.cancel_at_period_end,true);
 assert.equal(f.calls.filter(call=>call.operation==='release').length,1);
 const updates=f.calls.filter(call=>call.operation==='update');
 assert.deepEqual(updates[0],updates[1]);
});
for(const [name,schedule] of [['live schedule',{livemode:true}],['foreign subscription',{subscription:'sub_other'}],['foreign customer',{customer:'cus_other'}],['inactive schedule',{status:'canceled'}]])
 test(name+' cannot be released by membership cancellation',async()=>{
  const f=cancellationFixture({schedule});
  await assert.rejects(helpers().schedulePeriodCancellation(f.stripe,f.read(),actor,'cus_fixture','request-fixture',true),/binding/);
  assert.equal(f.calls.length,0);
 });
test('failed or unconfirmed release prevents renewal mutation',async()=>{
 for(const change of [{releaseFailure:true},{released:{released_subscription:'sub_other'}},{refreshed:{schedule:'sub_sched_other'}}]){
  const f=cancellationFixture(change);
  await assert.rejects(helpers().schedulePeriodCancellation(f.stripe,f.read(),actor,'cus_fixture','request-fixture',true));
  assert.equal(f.calls.some(call=>call.operation==='update'),false);
 }
});
test('resuming a scheduled subscription does not silently erase its future tier change',async()=>{
 const f=cancellationFixture();
 await assert.rejects(helpers().schedulePeriodCancellation(f.stripe,f.read(),actor,'cus_fixture','request-fixture',false),/resolved/);
 assert.equal(f.calls.length,0);
});
