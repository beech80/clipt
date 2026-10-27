import test from 'node:test';
import assert from 'node:assert/strict';
import { developmentPreviewEnvironment, verifyPreviewPublicKey } from '../../scripts/preview-environment.mjs';
const origin='https://akiksrlzdqvipqbbjxpw.supabase.co';
const jwt=(role,ref)=>'header.'+Buffer.from(JSON.stringify({role,ref})).toString('base64url')+'.signature';
const env={VITE_SUPABASE_URL:origin,VITE_SUPABASE_ANON_KEY:jwt('anon','akiksrlzdqvipqbbjxpw')};
test('Preview requires explicit configuration and pins staging to development',()=>{
  assert.throws(()=>developmentPreviewEnvironment({}),/Configure/);
  assert.equal(developmentPreviewEnvironment({...env,VITE_APP_ENV:'production'}).stage,'staging');
  assert.throws(()=>developmentPreviewEnvironment({...env,VITE_SUPABASE_URL:'https://slnjliheyiiummxhrgmk.supabase.co'}),/designated development/);
});
test('Preview rejects server keys and foreign anon keys without printing values',()=>{
  for(const key of ['sb_secret_private',jwt('service_role','akiksrlzdqvipqbbjxpw'),jwt('anon','other-project')])
    assert.throws(()=>developmentPreviewEnvironment({...env,VITE_SUPABASE_ANON_KEY:key}),error=>!error.message.includes(key));
});
test('Preview checks the public key only against fixed development Auth settings',async()=>{
  const config=developmentPreviewEnvironment(env);let calls=0;
  await verifyPreviewPublicKey(config,async(url,options)=>{
    calls++;assert.equal(url,origin+'/auth/v1/settings');assert.equal(options.headers.apikey,config.supabaseAnonKey);
    return {ok:true};
  });assert.equal(calls,1);
  await assert.rejects(verifyPreviewPublicKey(config,async()=>({ok:false})),/not accepted/);
  await assert.rejects(verifyPreviewPublicKey({...config,supabaseUrl:'https://example.com'},async()=>{throw Error('must not call')}),/Unexpected/);
});
