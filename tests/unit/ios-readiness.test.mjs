import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = path => readFileSync(new URL(path, import.meta.url), 'utf8');

test('iOS camera capture declares a focused camera usage description', () => {
  const plist = read('../../ios/App/App/Info.plist');
  assert.match(plist, /<key>NSCameraUsageDescription<\/key>\s*<string>CLIPT uses the camera only when you choose Take Photo/);
  assert.match(plist, /<key>UIRequiredDeviceCapabilities<\/key>\s*<array>\s*<string>arm64<\/string>/);
  assert.doesNotMatch(plist, /<string>armv7<\/string>/);
  assert.doesNotMatch(plist, /NSMicrophoneUsageDescription/);
});

test('native authentication email links use the reviewed HTTPS app instead of capacitor localhost', () => {
  const redirect = read('../../src/lib/auth-redirect.ts');
  const auth = read('../../src/contexts/AuthContext.tsx');
  assert.match(redirect, /Capacitor\.isNativePlatform\(\) \? nativeWebOrigin : window\.location\.origin/);
  assert.match(redirect, /https:\/\/clipt-media-only\.vercel\.app/);
  assert.match(auth, /emailRedirectTo: authRedirect\('\/login'\)/);
  assert.match(auth, /redirectTo: authRedirect\('\/update-password'\)/);
  assert.doesNotMatch(auth, /emailRedirectTo: `\$\{window\.location\.origin\}/);
});
