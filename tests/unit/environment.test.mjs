import test from 'node:test';
import assert from 'node:assert/strict';
import { readPublicEnvironment } from '../../src/lib/environment.ts';

const jwt = (role) => 'header.' + Buffer.from(JSON.stringify({ role })).toString('base64url') + '.signature';
const valid = { VITE_SUPABASE_URL: 'http://127.0.0.1:54321', VITE_SUPABASE_ANON_KEY: jwt('anon') };
test('accepts local anon configuration without changing the key', () => {
  assert.equal(readPublicEnvironment(valid).supabaseAnonKey, valid.VITE_SUPABASE_ANON_KEY);
});
test('requires explicit public configuration', () => {
  assert.throws(() => readPublicEnvironment({}), /Configure/);
});
test('rejects service-role and secret keys without exposing them', () => {
  for (const key of [jwt('service_role'), 'sb_secret_private', 'malformed']) {
    assert.throws(() => readPublicEnvironment({ ...valid, VITE_SUPABASE_ANON_KEY: key }),
      error => !error.message.includes(key));
  }
});
test('rejects remote HTTP and URLs containing credentials or paths', () => {
  for (const url of ['http://example.com', 'https://user:pass@example.com', 'https://example.com/rest', 'https://example.com?secret=1']) {
    assert.throws(() => readPublicEnvironment({ ...valid, VITE_SUPABASE_URL: url }));
  }
});
test('accepts HTTPS publishable configuration and validates stage', () => {
  assert.equal(readPublicEnvironment({ ...valid, VITE_SUPABASE_URL: 'https://example.supabase.co', VITE_SUPABASE_ANON_KEY: 'sb_publishable_test', VITE_APP_ENV: 'staging' }).stage, 'staging');
  assert.throws(() => readPublicEnvironment({ ...valid, VITE_APP_ENV: 'typo' }));
});
