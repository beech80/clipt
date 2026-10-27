import test from 'node:test';
import assert from 'node:assert/strict';
import { needsMfaChallenge, validateAuthenticatorCode } from '../../src/lib/mfa.ts';

test('MFA requires a challenge for enrolled accounts at AAL1', () => {
  assert.equal(needsMfaChallenge({ currentLevel: 'aal1', nextLevel: 'aal2' }), true);
  assert.equal(needsMfaChallenge({ currentLevel: null, nextLevel: 'aal2' }), true);
  assert.equal(needsMfaChallenge({ currentLevel: 'aal2', nextLevel: 'aal2' }), false);
  assert.equal(needsMfaChallenge({ currentLevel: 'aal1', nextLevel: 'aal1' }), false);
});
test('authenticator input preserves leading zeroes and rejects malformed codes', () => {
  assert.equal(validateAuthenticatorCode(' 012345 '), '012345');
  for (const code of ['', '12345', '1234567', 'abcdef', '123 45']) {
    assert.throws(() => validateAuthenticatorCode(code));
  }
});
