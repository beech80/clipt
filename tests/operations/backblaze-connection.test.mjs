import test from 'node:test';
import assert from 'node:assert/strict';
import { inspectBackblazeConnection } from '../../scripts/check-backblaze-connection.mjs';

const keyId = 'synthetic-id';
const applicationKey = 'synthetic+key/==';
const token = 'synthetic-auth-token';
const auth = () => ({ accountId: 'synthetic-account', authorizationToken: token, apiInfo: { storageApi: {
  apiUrl: 'https://api005.backblazeb2.com/', s3ApiUrl: 'https://s3.us-east-005.backblazeb2.com',
  allowed: { buckets: [{ id: 'synthetic-bucket', name: null }], namePrefix: null,
    capabilities: ['listBuckets', 'listFiles', 'readFiles', 'writeFiles'] },
} } });
const metadata = () => ({ buckets: [{ bucketId: 'synthetic-bucket', bucketName: 'clipt-media-backup2026', bucketType: 'allPrivate' }] });
const json = (body, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });
function fixture({ authorization = auth(), bucket = metadata(), authStatus = 200, bucketStatus = 200 } = {}) {
  const calls = [];
  return {
    calls,
    async fetchImpl(url, options) {
      calls.push({ url, options });
      assert.equal(options.redirect, 'error'); assert.equal(options.cache, 'no-store'); assert(options.signal);
      if (calls.length === 1) {
        assert.equal(url, 'https://api.backblazeb2.com/b2api/v4/b2_authorize_account');
        assert.equal(options.method, 'GET');
        assert.equal(Buffer.from(options.headers.Authorization.slice(6), 'base64').toString(), keyId + ':' + applicationKey);
        return json(authorization, authStatus);
      }
      assert.equal(calls.length, 2);
      assert.equal(url, 'https://api005.backblazeb2.com/b2api/v4/b2_list_buckets');
      assert.equal(options.headers.Authorization, token);
      assert.deepEqual(JSON.parse(options.body), { accountId: 'synthetic-account', bucketId: 'synthetic-bucket' });
      return json(bucket, bucketStatus);
    },
  };
}
const inspect = f => inspectBackblazeConnection({ keyId, applicationKey, fetchImpl: f.fetchImpl });
const noDisclosure = r => {
  const text = JSON.stringify(r);
  for (const secret of [keyId, applicationKey, token, 'synthetic-account', 'synthetic-bucket', 'private-provider-message']) assert(!text.includes(secret));
  assert.equal(r.mutationPerformed, false); assert.equal(r.backupCompleted, false);
};

test('valid private single-bucket scope works when authorization omits the bucket name', async () => {
  const f = fixture(); const r = await inspect(f);
  assert.equal(r.ok, true); assert.equal(r.authenticated, true); assert.equal(r.privateBucket, true);
  assert.equal(r.expectedBucketVerified, true); assert.equal(f.calls.length, 2); noDisclosure(r);
});
test('present bucket name does not change immutable-ID verification or special-character preservation', async () => {
  const a = auth(); a.apiInfo.storageApi.allowed.buckets[0].name = 'clipt-media-backup2026';
  const f = fixture({ authorization: a }); const r = await inspect(f);
  assert.equal(r.ok, true); noDisclosure(r);
});
test('missing inputs do not make a provider request', async () => {
  const r = await inspectBackblazeConnection({ fetchImpl: () => { throw Error('unexpected network'); } });
  assert.equal(r.code, 'missing-credentials'); noDisclosure(r);
});
test('copying whitespace fails without changing the entered bytes or making a request', async () => {
  const r = await inspectBackblazeConnection({ keyId, applicationKey: applicationKey + '\n', fetchImpl: () => { throw Error('unexpected network'); } });
  assert.equal(r.code, 'unexpected-whitespace-or-control-character'); noDisclosure(r);
});
test('401 is reported separately from bucket checks without disclosing a provider message', async () => {
  const f = fixture({ authorization: { code: 'bad_auth_token', message: applicationKey + ' private-provider-message' }, authStatus: 401 });
  const r = await inspect(f); assert.equal(r.code, 'bad_auth_token'); assert.equal(r.httpStatus, 401);
  assert.equal(r.authenticated, false); assert.equal(r.privateBucket, null); assert.equal(f.calls.length, 1); noDisclosure(r);
});
test('network failures report no credential verdict or raw exception', async () => {
  const r = await inspectBackblazeConnection({ keyId, applicationKey, fetchImpl: async () => { throw Error(applicationKey); } });
  assert.equal(r.code, 'network-no-response'); assert.equal(r.privateBucket, null); noDisclosure(r);
});
test('unexpected provider error codes and raw HTML are not printed', async () => {
  const f = fixture({ authorization: { code: applicationKey, message: 'private-provider-message' }, authStatus: 500 });
  const r = await inspect(f); assert.equal(r.code, 'provider-rejected-request'); noDisclosure(r);
  const html = await inspectBackblazeConnection({ keyId, applicationKey, fetchImpl: async () => new Response('private-provider-message', { status: 502 }) });
  assert.equal(html.code, 'unexpected-provider-response'); noDisclosure(html);
});
for (const buckets of [null, [], [{ id: 'one' }, { id: 'two' }], [{ name: 'clipt-media-backup2026' }]]) {
  test('master, multiple, missing or incomplete bucket scope is rejected: ' + JSON.stringify(buckets), async () => {
    const a = auth(); a.apiInfo.storageApi.allowed.buckets = buckets;
    const f = fixture({ authorization: a }); const r = await inspect(f);
    assert.equal(r.code, 'single-bucket-key-required'); assert.equal(f.calls.length, 1); noDisclosure(r);
  });
}
for (const apiUrl of ['https://other.example/', 'http://api005.backblazeb2.com/', 'https://user@api005.backblazeb2.com/', 'https://api005.backblazeb2.com/private', 'https://api005.backblazeb2.com/?query=1']) {
  test('unexpected token destination is rejected: ' + apiUrl, async () => {
    const a = auth(); a.apiInfo.storageApi.apiUrl = apiUrl;
    const f = fixture({ authorization: a }); const r = await inspect(f);
    assert.equal(r.code, 'unexpected-api-boundary'); assert.equal(f.calls.length, 1); noDisclosure(r);
  });
}
test('wrong S3 region is rejected before the token is used', async () => {
  const a = auth(); a.apiInfo.storageApi.s3ApiUrl = 'https://s3.us-west-001.backblazeb2.com';
  const f = fixture({ authorization: a }); const r = await inspect(f);
  assert.equal(r.code, 'unexpected-region'); assert.equal(f.calls.length, 1); noDisclosure(r);
});
for (const cap of ['listBuckets', 'listFiles', 'readFiles', 'writeFiles']) {
  test('missing required capability fails closed: ' + cap, async () => {
    const a = auth(); a.apiInfo.storageApi.allowed.capabilities = a.apiInfo.storageApi.allowed.capabilities.filter(c => c !== cap);
    const f = fixture({ authorization: a }); const r = await inspect(f);
    assert.equal(r.code, 'missing-required-capability'); assert.deepEqual(r.missingCapabilities, [cap]);
    assert.equal(f.calls.length, 1); noDisclosure(r);
  });
}
test('a file-prefix restriction is not silently ignored', async () => {
  const a = auth(); a.apiInfo.storageApi.allowed.namePrefix = 'private-prefix';
  const f = fixture({ authorization: a }); const r = await inspect(f);
  assert.equal(r.code, 'unexpected-prefix-restriction'); assert.equal(f.calls.length, 1); noDisclosure(r);
});
for (const change of ['wrong-id', 'wrong-name', 'extra-bucket', 'public']) {
  test('exact private destination is verified, not assumed: ' + change, async () => {
    const b = metadata();
    if (change === 'wrong-id') b.buckets[0].bucketId = 'other';
    if (change === 'wrong-name') b.buckets[0].bucketName = 'other';
    if (change === 'extra-bucket') b.buckets.push({ bucketId: 'other' });
    if (change === 'public') b.buckets[0].bucketType = 'allPublic';
    const f = fixture({ bucket: b }); const r = await inspect(f);
    assert.equal(r.code, change === 'public' ? 'backup-bucket-not-private' : 'unexpected-bucket-response');
    assert.equal(r.ok, false); assert.equal(r.authenticated, true); noDisclosure(r);
  });
}
test('bucket-read authorization failure is distinguished from initial authentication', async () => {
  const f = fixture({ bucket: { code: 'unauthorized', message: token }, bucketStatus: 401 }); const r = await inspect(f);
  assert.equal(r.code, 'unauthorized'); assert.equal(r.stage, 'read-private-bucket-metadata');
  assert.equal(r.authenticated, true); assert.equal(r.privateBucket, null); noDisclosure(r);
});
