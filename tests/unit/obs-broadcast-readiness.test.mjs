import test from 'node:test';import assert from 'node:assert/strict';
import {obsReadiness} from '../../supabase/functions/obs-broadcast-session/readiness.ts';
const complete=()=>({SUPABASE_URL:'https://slnjliheyiiummxhrgmk.supabase.co',MUX_TOKEN_ID:'synthetic-id',MUX_TOKEN_SECRET:'synthetic-secret',MUX_SIGNING_KEY_ID:'syntheticKey',MUX_SIGNING_PRIVATE_KEY:'synthetic-private-key',MUX_OBS_WEBHOOK_SECRET:'synthetic-webhook-secret',CLIPT_OBS_BROADCAST_ENABLED:'false'});
test('OBS readiness checks signing without returning any provider credentials or resources',async()=>{
 let reads=0;const result=await obsReadiness(complete(),{probeProvider:async()=>{reads++;return 200;},checkSigning:async()=>true});
 assert.equal(result.configured,true);assert.equal(result.enabled,false);assert.equal(reads,0);assert.equal(result.signingReady,true);
 for(const value of Object.values(complete()).filter(x=>x.startsWith('synthetic')))assert(!JSON.stringify(result).includes(value));
});
test('missing credentials and malformed signing remain unavailable without a provider mutation',async()=>{
 let reads=0;const result=await obsReadiness({...complete(),MUX_TOKEN_SECRET:'',MUX_SIGNING_PRIVATE_KEY:'wrong-access-token'}, {probeProvider:async()=>{reads++;return 200;},checkSigning:async()=>{throw Error('synthetic-private-message');}},true);
 assert.equal(result.configured,false);assert(result.missing.includes('MUX_TOKEN_SECRET'));assert(result.missing.includes('signing_private_key_format'));assert.equal(reads,0);assert(!JSON.stringify(result).includes('synthetic-private-message'));
});
test('explicit provider probe returns only a bounded HTTP status and rejects malformed tokens',async()=>{
 const rejected=await obsReadiness(complete(),{probeProvider:async()=>401,checkSigning:async()=>true},true);assert.equal(rejected.providerReadStatus,401);
 let reads=0;const malformed=await obsReadiness({...complete(),MUX_TOKEN_ID:' synthetic-id'}, {probeProvider:async()=>{reads++;return 200;},checkSigning:async()=>true},true);assert.equal(reads,0);assert(malformed.missing.includes('mux_token_format'));
});
