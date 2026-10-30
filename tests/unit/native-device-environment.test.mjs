import test from 'node:test';
import assert from 'node:assert/strict';
import {nativeDeviceEnvironment,prepareNativeDeviceEnvironment} from '../../scripts/native-device-environment.mjs';
const config={supabaseUrl:'https://akiksrlzdqvipqbbjxpw.supabase.co',supabaseAnonKey:'sb_publishable_'+'a'.repeat(32)};
test('phone package selects only the designated development project and three browser-safe variables',()=>{
 const env=nativeDeviceEnvironment(config);
 assert.deepEqual(env,{VITE_APP_ENV:'staging',VITE_SUPABASE_URL:config.supabaseUrl,VITE_SUPABASE_ANON_KEY:config.supabaseAnonKey});
 assert.deepEqual(Object.keys(config).sort(),['supabaseAnonKey','supabaseUrl']);
 for(const supabaseUrl of ['https://slnjliheyiiummxhrgmk.supabase.co','http://127.0.0.1:54321','https://other.invalid','https://akiksrlzdqvipqbbjxpw.supabase.co/?key=bad'])
  assert.throws(()=>nativeDeviceEnvironment({...config,supabaseUrl}));
});
test('private credentials, environment-file injection and additional configuration cannot enter a phone package',()=>{
 for(const value of [null,[],{...config,secret:'do-not-log'},...['sb_secret_'+'a'.repeat(32),'sb_publishable_short',config.supabaseAnonKey+'\nCLIPT_NATIVE_MUX_PAID_APPROVED=true',config.supabaseAnonKey+' '].map(supabaseAnonKey=>({...config,supabaseAnonKey}))])
  assert.throws(()=>nativeDeviceEnvironment(value));
});
test('an unaccepted public key cannot write the build environment',async()=>{
 let written=false;
 await assert.rejects(prepareNativeDeviceEnvironment(config,{verify:async()=>{throw Error('not accepted');},write:async()=>{written=true;}}));
 assert.equal(written,false);
});
test('a verified public environment is written without enabling hosted publishing, payments or production',async()=>{
 let written='',verified;
 const result=await prepareNativeDeviceEnvironment(config,{verify:async value=>{verified=value;},write:async value=>{written=value;}});
 assert.deepEqual(verified,config);
 assert.deepEqual(result,{stage:'staging',supabaseUrl:config.supabaseUrl});
 assert.equal(written,'VITE_APP_ENV=staging\nVITE_SUPABASE_URL='+config.supabaseUrl+'\nVITE_SUPABASE_ANON_KEY='+config.supabaseAnonKey+'\n');
 assert.ok(!/MUX_|SERVICE_ROLE|PAID|ENABLED/.test(written));
});
