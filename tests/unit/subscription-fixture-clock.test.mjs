import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {stripTypeScriptTypes} from 'node:module';

const source=stripTypeScriptTypes(readFileSync(new URL('../../supabase/functions/_shared/subscription.ts',import.meta.url),'utf8').replace(/^import .*$/gm,'').replace(/^export /gm,''));
function fixture(overrides={},clockOverrides={}) {
 const env={SUPABASE_URL:'https://akiksrlzdqvipqbbjxpw.supabase.co',CLIPT_PAYMENTS_MODE:'test',CLIPT_SUBSCRIPTIONS_VERIFIED:'false',CLIPT_SUBSCRIPTION_TEST_USER_ID:'owner',CLIPT_SUBSCRIPTION_TEST_CLOCK_ID:'clock_fixture',...overrides};
 const reads=[];
 const stripe={testHelpers:{testClocks:{retrieve:async id=>{reads.push(id);return {id,livemode:false,status:'ready',frozen_time:1,...clockOverrides};}}}};
 const run=new Function('Deno','HttpError',source+'\nreturn sandboxFixtureClock;')({env:{get:key=>env[key]}},class extends Error {});
 return {run:()=>run(stripe,'owner'),reads};
}
test('fixture clock is optional and causes no provider read when disabled',async()=>{
 const f=fixture({CLIPT_SUBSCRIPTION_TEST_CLOCK_ID:''});assert.equal(await f.run(),undefined);assert.deepEqual(f.reads,[]);
});
test('ready historical Sandbox clock is retrieved from server configuration',async()=>{
 const f=fixture();assert.equal(await f.run(),'clock_fixture');assert.deepEqual(f.reads,['clock_fixture']);
});
test('foreign identity, project, live mode, verified flag and malformed clock fail before provider access',async()=>{
 for(const overrides of [{CLIPT_SUBSCRIPTION_TEST_USER_ID:'foreign'},{SUPABASE_URL:'https://other.supabase.co'},{CLIPT_PAYMENTS_MODE:'live'},{CLIPT_SUBSCRIPTIONS_VERIFIED:'true'},{CLIPT_SUBSCRIPTION_TEST_CLOCK_ID:'browser-input'}]) {
  const f=fixture(overrides);await assert.rejects(f.run());assert.deepEqual(f.reads,[]);
 }
});
test('future, advancing, live and mismatched clocks cannot create a fixture customer',async()=>{
 for(const clock of [{frozen_time:Math.floor(Date.now()/1000)+3600},{status:'advancing'},{livemode:true},{id:'clock_other'},{frozen_time:0},{frozen_time:1.5}]) await assert.rejects(fixture({},clock).run());
});
