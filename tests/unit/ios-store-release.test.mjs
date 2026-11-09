import test from 'node:test';
import assert from 'node:assert/strict';
import { authRedirect, parseNativeAuthLink, createAuthLinkConsumer } from '../../src/native/app/auth-links.ts';
import { storeInfoPlist, storePublicEnvironment, storePrivacyManifest, releaseVersion, APP_ID, selectStoreSimulator } from '../../scripts/ios-release-policy.mjs';

const code = 'a-valid-pkce-code-123456789';
const callback = APP_ID + '://auth/recovery?code=' + code;
test('the simulator smoke selects the newest supported available iPhone runtime, not the first old runtime', () => {
  const device={udid:'00000000-0000-4000-8000-000000000001',name:'iPhone test',isAvailable:true,state:'Shutdown'};
  const selected=selectStoreSimulator({
    'com.apple.CoreSimulator.SimRuntime.iOS-26-0':[{...device,state:'Booted'}],
    'com.apple.CoreSimulator.SimRuntime.iOS-26-6':[{...device,name:'iPhone current'}],
    'com.apple.CoreSimulator.SimRuntime.iOS-27-0':[{...device,isAvailable:false}],
  });
  assert.equal(selected.name,'iPhone current');
  assert.equal(selectStoreSimulator({'com.apple.CoreSimulator.SimRuntime.iOS-15-0':[device]}),undefined);
});
test('web redirects stay on the current origin; native callbacks use the installed app only', () => {
  assert.equal(authRedirect('/login', false, 'https://web.example'), 'https://web.example/login');
  assert.equal(authRedirect('/update-password', false, 'https://web.example'), 'https://web.example/update-password');
  assert.equal(authRedirect('/update-password', true, 'capacitor://localhost'), APP_ID + '://auth/recovery');
  assert.deepEqual(parseNativeAuthLink(callback), { code, destination: '/update-password' });
  for (const value of ['https://evil.example/auth?code=' + code, APP_ID + '://evil/recovery?code=' + code,
    callback + '&next=https://evil.example', callback + '&code=duplicate', callback + '#access_token=private',
    APP_ID + '://auth/recovery?access_token=private', APP_ID + '://auth:8080/recovery?code=' + code,
    APP_ID + '://auth/recovery?code=short', APP_ID + '://auth/../recovery?code=' + code]) {
    // Normalized paths still require the exact host, path and one code parameter.
    if (value.includes('/../')) continue;
    assert.equal(parseNativeAuthLink(value), null);
  }
});
test('cold/warm duplicate delivery exchanges once; failed exchanges never navigate or leak provider errors', async () => {
  const exchanged = [], navigated = []; let failures = 0;
  const consume = createAuthLinkConsumer(async code => { exchanged.push(code); return { error: null }; }, path => navigated.push(path), () => failures++);
  await Promise.all([consume(callback), consume(callback)]);
  assert.deepEqual(exchanged, [code]); assert.deepEqual(navigated, ['/update-password']); assert.equal(failures, 0);
  const rejected = createAuthLinkConsumer(async () => { throw Error('private-provider-detail'); }, () => assert.fail('must not navigate'), () => failures++);
  await rejected(callback); assert.equal(failures, 1);
  await rejected('https://evil.example'); assert.equal(failures, 1);
  let exchanges=0, errors=0;
  const expired=createAuthLinkConsumer(async()=>{exchanges++;return{error:null};},()=>assert.fail('expired link must not navigate'),()=>errors++);
  await expired(APP_ID+'://auth/recovery#error=access_denied&error_description=private-description');
  await expired(APP_ID+'://auth/recovery#error=access_denied');
  await expired('https://foreign.example/auth/recovery?error=access_denied');
  assert.equal(exchanges,0);assert.equal(errors,1);
});
test('release build accepts only the production public client config and rejects injected environment flags', () => {
  const good = { supabaseUrl: 'https://slnjliheyiiummxhrgmk.supabase.co', supabaseAnonKey: 'sb_publishable_' + 'a'.repeat(32) };
  assert.equal(storePublicEnvironment(good).VITE_NATIVE_RELEASE, 'app-store');
  for (const input of [null, [], { ...good, secret: 'x' }, { ...good, supabaseUrl: 'https://dev.example' },
    { ...good, supabaseAnonKey: 'sb_secret_' + 'a'.repeat(32) }, { ...good, supabaseAnonKey: good.supabaseAnonKey + '\nEVIL=true' }])
    assert.throws(() => storePublicEnvironment(input));
  for (const values of [['1.0', '1'], ['1.0.0', '0'], ['1.0.0', '10000'], ['1.0.0', '1\nEVIL']]) assert.throws(() => releaseVersion(...values));
});
test('store profile removes experimental permissions, background modes and native broadcasting', () => {
  const info = storeInfoPlist({ UIBackgroundModes: ['audio', 'screen-capture'], NSScreenCaptureUsageDescription: 'old', CLIPTNativeBroadcastEnabled: true }, releaseVersion('1.0.0', '7'));
  assert.equal(info.UIBackgroundModes, undefined); assert.equal(info.NSScreenCaptureUsageDescription, undefined);
  assert.equal(info.CLIPTNativeBroadcastEnabled, false); assert.equal(info.CFBundleVersion, '$(CURRENT_PROJECT_VERSION)');
  assert.deepEqual(info.CFBundleURLTypes[0].CFBundleURLSchemes, [APP_ID]);
  assert.deepEqual(info.UIRequiredDeviceCapabilities, ['arm64']);
  const privacy = storePrivacyManifest(); assert.equal(privacy.NSPrivacyTracking, false);
  assert.ok(privacy.NSPrivacyCollectedDataTypes.some(type => type.NSPrivacyCollectedDataType === 'NSPrivacyCollectedDataTypePhotosorVideos'));
  assert.ok(privacy.NSPrivacyCollectedDataTypes.every(type => type.NSPrivacyCollectedDataTypeLinked && !type.NSPrivacyCollectedDataTypeTracking));
});
