import test from 'node:test';
import assert from 'node:assert/strict';
import {webcrypto} from 'node:crypto';
import {verifyObsOidc,OBS_AUDIENCE,OBS_WORKFLOW} from '../../supabase/functions/_shared/obs-beta-oidc.mjs';
test('OBS worker verifies GitHub RSA signature, immutable repository, main workflow and ten-minute expiry',async()=>{
 const key=await webcrypto.subtle.generateKey({name:'RSASSA-PKCS1-v1_5',modulusLength:2048,publicExponent:new Uint8Array([1,0,1]),hash:'SHA-256'},true,['sign','verify']);
 const jwk={...await webcrypto.subtle.exportKey('jwk',key.publicKey),kid:'fixturekey'};
 const now=Date.now(),n=Math.floor(now/1000);
 const claims={iss:'https://token.actions.githubusercontent.com',aud:OBS_AUDIENCE,repository:'beech80/clipt',repository_id:'917757980',
 repository_owner_id:'195324952',ref:'refs/heads/main',event_name:'push',workflow_ref:OBS_WORKFLOW,
 sha:'a'.repeat(40),workflow_sha:'b'.repeat(40),sub:'repo:beech80/clipt:ref:refs/heads/main',runner_environment:'github-hosted',
 run_id:'12345',run_attempt:'1',exp:n+300,iat:n,nbf:n-1};
 const token=async(c)=>{
  const encode=x=>Buffer.from(JSON.stringify(x)).toString('base64url');
  const input=encode({alg:'RS256',kid:'fixturekey'})+'.'+encode(c);
  const sig=await webcrypto.subtle.sign('RSASSA-PKCS1-v1_5',key.privateKey,new TextEncoder().encode(input));
  return input+'.'+Buffer.from(sig).toString('base64url');
 };
 const options={now,fetchImpl:async()=>new Response(JSON.stringify({keys:[jwk]}),{status:200})};
 assert.equal((await verifyObsOidc(await token(claims),options)).run_id,'12345');
 for(const patch of [{ref:'refs/heads/evil'},{repository_id:'1'},{aud:'other'},{event_name:'pull_request'},
  {workflow_ref:OBS_WORKFLOW.replace('obs-beta-operations','other')},{exp:n-1},{iat:n-1000},{runner_environment:'self-hosted'}])
  await assert.rejects(verifyObsOidc(await token({...claims,...patch}),options));
 const forged=await token(claims);await assert.rejects(verifyObsOidc(forged.slice(0,-2)+'xx',options));
});
