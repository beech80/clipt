import test from 'node:test';
import assert from 'node:assert/strict';
import { generateKeyPairSync, sign } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { verifyCutoverOidc, OIDC_AUDIENCE, OIDC_ISSUER, validateRollbackFlags, validateCutoverSamples, BASELINE_FLAGS, MEDIA_BUCKETS } from '../../supabase/functions/_shared/media-cutover-oidc.mjs';

const now = Date.UTC(2026,9,27,23,0,0), seconds = now / 1000, expectedSha = 'a'.repeat(40);
const pair = generateKeyPairSync('rsa', { modulusLength: 2048 });
const jwk = { ...pair.publicKey.export({ format: 'jwk' }), kid: 'synthetic-key', alg: 'RS256', use: 'sig' };
const claims = () => ({ iss: OIDC_ISSUER, aud: OIDC_AUDIENCE, repository: 'beech80/clipt', repository_id: '917757980',
  repository_owner_id: '195324952', ref: 'refs/heads/main', event_name: 'push', sha: expectedSha,
  workflow_ref: 'beech80/clipt/.github/workflows/private-media-cutover.yml@refs/heads/main', exp: seconds + 300, iat: seconds, nbf: seconds });
const token = (c = claims(), header = { alg: 'RS256', kid: jwk.kid }) => {
  const input = Buffer.from(JSON.stringify(header)).toString('base64url') + '.' + Buffer.from(JSON.stringify(c)).toString('base64url');
  return input + '.' + sign('RSA-SHA256', Buffer.from(input), pair.privateKey).toString('base64url');
};
const options = (extra = {}) => ({ expectedSha, deadline: now + 600000, now,
  fetchImpl: async (url, opts) => { assert.equal(url, OIDC_ISSUER + '/.well-known/jwks'); assert.equal(opts.redirect, 'error'); return new Response(JSON.stringify({ keys: [jwk] })); }, ...extra });

test('only a verified GitHub token for the exact reviewed push commit is accepted', async () => {
  assert.equal(await verifyCutoverOidc(token(), options()), true);
});
for (const [field, value] of [
  ['iss','https://evil.example'], ['aud','other-audience'], ['repository','evil/clipt'], ['repository_id','1'],
  ['repository_owner_id','1'], ['ref','refs/heads/feature'], ['event_name','pull_request'], ['sha','b'.repeat(40)],
  ['workflow_ref','beech80/clipt/.github/workflows/other.yml@refs/heads/main'],
  ['exp',seconds], ['iat',seconds - 601], ['nbf',seconds + 31], ['exp',seconds + 601], ['exp','later'],
]) test('reject OIDC claim mismatch: ' + field + '/' + value, async () => {
  const c = claims(); c[field] = value; let calls = 0;
  await assert.rejects(verifyCutoverOidc(token(c), options({ fetchImpl: async () => { calls++; throw Error('must not fetch'); } })));
  assert.equal(calls, 0);
});
test('expired deployment window rejects otherwise valid credentials without requesting keys', async () => {
  await assert.rejects(verifyCutoverOidc(token(), options({ deadline: now })));
  await assert.rejects(verifyCutoverOidc(token(), options({ expectedSha: 'DISABLED' })));
});
test('invalid signature, unsupported algorithms, unknown keys and failed JWKS requests are rejected', async () => {
  const value = token(); const parts = value.split('.'); const signature = Buffer.from(parts[2], 'base64url'); signature[0] ^= 1; parts[2] = signature.toString('base64url');
  await assert.rejects(verifyCutoverOidc(parts.join('.'), options()));
  await assert.rejects(verifyCutoverOidc(token(claims(), { alg: 'none', kid: jwk.kid }), options()));
  await assert.rejects(verifyCutoverOidc(token(claims(), { alg: 'HS256', kid: jwk.kid }), options()));
  await assert.rejects(verifyCutoverOidc(token(), options({ fetchImpl: async () => new Response(JSON.stringify({ keys: [] })) })));
  await assert.rejects(verifyCutoverOidc(token(), options({ fetchImpl: async () => new Response('', { status: 503 }) })));
});
for (const value of [undefined, '', 'a.b', 'a.b.c.d', 'x'.repeat(16001)]) test('reject malformed token safely: ' + String(value).length, async () => {
  await assert.rejects(verifyCutoverOidc(value, options()));
});
test('rollback can only restore the exact recorded baseline or leave everything private', () => {
  assert.deepEqual(validateRollbackFlags(BASELINE_FLAGS), BASELINE_FLAGS);
  assert.deepEqual(validateRollbackFlags(MEDIA_BUCKETS.map(id => ({id,public:false}))), MEDIA_BUCKETS.map(id => ({id,public:false})));
  assert.throws(() => validateRollbackFlags([...BASELINE_FLAGS, {id:'other',public:true}]));
  assert.throws(() => validateRollbackFlags(BASELINE_FLAGS.map(f => ({...f, public: true}))));
  assert.throws(() => validateRollbackFlags(BASELINE_FLAGS.map(f => f.id==='media'?{...f,public:false}:f)));
  assert.throws(() => validateRollbackFlags(BASELINE_FLAGS.map(f => ({...f,public:'true'}))));
});
const samples = () => ['avatars','media','posts','videos'].map(bucket => ({ bucket, name: 'synthetic-owner/clip.mp4', size: 20, etag: 'a'.repeat(32) }));
test('service signing smoke samples have fixed buckets and bounded safe object paths', () => {
  assert.deepEqual(validateCutoverSamples(samples()), samples());
  for (const edit of [s=>s.pop(),s=>{s[0].name='../secret';},s=>{s[0].name='path\\secret';},s=>{s[0].bucket='recordings';},s=>{s[0].size=999999999;},s=>{s[0].etag='invalid';}]) {
    const s=samples();edit(s);assert.throws(()=>validateCutoverSamples(s));
  }
});
test('checked-in privileged operation is inert and administrator credentials stay in the authenticated server body', async () => {
  const server = await readFile(new URL('../../supabase/functions/private-media-cutover/index.ts', import.meta.url), 'utf8');
  const runner = await readFile(new URL('../../scripts/run-private-media-cutover.mjs', import.meta.url), 'utf8');
  assert.match(server, /const AUTHORIZED_SHA = 'DISABLED'/); assert.match(server, /const DEADLINE = 0/);
  assert(server.indexOf('await verifyCutoverOidc') < server.indexOf("Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')"));
  assert(!runner.includes('SUPABASE_SERVICE_ROLE_KEY')); assert(!runner.includes('console.log(oidc'));
  assert.match(runner, /ownerSessionVerified: false/); assert.match(runner, /sourceObjectsDeleted: false/);
});
