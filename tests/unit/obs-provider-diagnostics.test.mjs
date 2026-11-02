import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';import ts from 'typescript';
const mod={exports:{}};new Function('module','exports',ts.transpileModule(readFileSync(new URL('../../supabase/functions/obs-broadcast-session/diagnostics.ts',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText)(mod,mod.exports);
test('Mux refusal diagnostics disclose fixed codes only',async()=>{
 for(const [status,text,expected]of [[402,'SECRET fixture','MUX_BILLING_REQUIRED'],[400,'Upgrade your free plan PRIVATE fixture','MUX_BILLING_REQUIRED'],[403,'PRIVATE fixture','MUX_PERMISSION_REQUIRED'],[400,'max_continuous_duration PRIVATE fixture','MUX_DURATION_REJECTED']]){
 const code=await mod.exports.muxRejectionCode(new Response(text,{status}));assert.equal(code,expected);assert.doesNotMatch(code,/PRIVATE|SECRET|fixture/);
 }
});
test('provider shape diagnostics never disclose keys or actual resource identities',()=>{
 const result=mod.exports.obsProviderShape({id:'PRIVATE_ID',stream_key:'PRIVATE_KEY',passthrough:'clipt-obs:PRIVATE_SESSION',test:null,max_continuous_duration:90,status:'idle',playback_ids:[{id:'PRIVATE_PLAYBACK',policy:'signed'}]});
 assert.equal(result.testField,'null');assert.equal(result.signedOnly,true);assert.doesNotMatch(JSON.stringify(result),/PRIVATE/);
});

test('account diagnostics correlate the known dashboard without disclosing private names or credentials',()=>{
 assert.deepEqual(mod.exports.muxAccountShape({organization_id:'t0gc3o',environment_id:'a7g7mn',environment_type:'development',organization_name:'PRIVATE',access_token_name:'PRIVATE',token:'SECRET'}),{knownDashboardOrganization:true,knownDashboardEnvironment:true,environmentType:'development'});
 assert.deepEqual(mod.exports.muxAccountShape({organization_id:'other',environment_id:'other',environment_type:'PRIVATE'}),{knownDashboardOrganization:false,knownDashboardEnvironment:false,environmentType:'unknown'});
 assert.doesNotMatch(JSON.stringify(mod.exports.muxAccountShape({organization_name:'PRIVATE',token:'SECRET'})),/PRIVATE|SECRET/);
});
