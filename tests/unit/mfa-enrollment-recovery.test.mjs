import test from 'node:test';
import assert from 'node:assert/strict';
import { startAuthenticatorEnrollment } from '../../src/lib/mfa.ts';

const pending = { id: 'unfinished', factor_type: 'totp', status: 'unverified', friendly_name: 'Clipt authenticator' };
function fixture(factors = []) {
  const calls = [];
  const api = {
    async listFactors() { calls.push('list'); return { data: { all: factors }, error: null }; },
    async unenroll({ factorId }) { calls.push('remove:' + factorId); return { error: null }; },
    async enroll() {
      calls.push('enroll');
      return { data: { id: 'new', type: 'totp', totp: { qr_code: 'private-qr', secret: 'private-secret' } }, error: null };
    },
  };
  return { api, calls };
}
test('first setup creates an enrollment without deleting any factor', async () => {
  const { api, calls } = fixture();
  assert.deepEqual(await startAuthenticatorEnrollment(api), { id: 'new', qrCode: 'private-qr', secret: 'private-secret' });
  assert.deepEqual(calls, ['list', 'enroll']);
});
test('a reload-lost enrollment is removed before creating its replacement', async () => {
  const { api, calls } = fixture([pending]);
  await startAuthenticatorEnrollment(api);
  assert.deepEqual(calls, ['list', 'remove:unfinished', 'enroll']);
});
test('verified TOTP prevents restart before any factor is removed', async () => {
  const { api, calls } = fixture([pending, { ...pending, id: 'verified', status: 'verified' }]);
  await assert.rejects(startAuthenticatorEnrollment(api), /already verified/);
  assert.deepEqual(calls, ['list']);
});
test('setup leaves differently named and non-TOTP factors intact', async () => {
  const { api, calls } = fixture([
    { ...pending, id: 'other-app', friendly_name: 'Other authenticator' },
    { ...pending, id: 'phone', factor_type: 'phone' },
    { ...pending, id: 'unknown', status: 'unexpected' },
    { ...pending, id: 'unnamed', friendly_name: undefined },
    pending,
  ]);
  await startAuthenticatorEnrollment(api);
  assert.deepEqual(calls, ['list', 'remove:unfinished', 'enroll']);
});
test('a list error never removes factors or starts another enrollment', async () => {
  const { api, calls } = fixture([pending]);
  api.listFactors = async () => ({ data: null, error: Error('offline') });
  await assert.rejects(startAuthenticatorEnrollment(api), /offline/);
  assert.deepEqual(calls, []);
});
test('missing list data never starts or removes an enrollment', async () => {
  const { api, calls } = fixture();
  api.listFactors = async () => ({ data: null, error: null });
  await assert.rejects(startAuthenticatorEnrollment(api), /Could not load/);
  assert.deepEqual(calls, []);
});
test('a cleanup failure stops the restart before creating another factor', async () => {
  const { api, calls } = fixture([pending]);
  api.unenroll = async () => { calls.push('remove-failed'); return { error: Error('not allowed') }; };
  await assert.rejects(startAuthenticatorEnrollment(api), /not allowed/);
  assert.deepEqual(calls, ['list', 'remove-failed']);
});
test('an enrollment error is returned without fabricating setup credentials', async () => {
  const { api } = fixture();
  api.enroll = async () => ({ data: null, error: Error('enrollment denied') });
  await assert.rejects(startAuthenticatorEnrollment(api), /enrollment denied/);
});
test('a wrong enrollment response is rejected', async () => {
  const { api } = fixture();
  api.enroll = async () => ({ data: { id: 'phone', type: 'phone' }, error: null });
  await assert.rejects(startAuthenticatorEnrollment(api), /was not returned/);
});
