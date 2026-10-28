import test from 'node:test';
import assert from 'node:assert/strict';
import { Buffer } from 'node:buffer';
import { createPublicKey } from 'node:crypto';
import { transportKeyPair, sealInventory, openInventory, validateInventory, boundedBody, backupAndRestore, bootstrapTransport, connectBackup, SOURCE, CONTROL, hash } from '../../scripts/lib/media-backup.mjs';

const data = Buffer.from('synthetic media bytes');
const etag = hash(data, 'md5');
const source = () => ({ project: 'slnjliheyiiummxhrgmk', snapshotId: '20261027-contract-test', totalBytes: data.length,
  objects: [{ id: 'synthetic-id', bucket: 'media', name: 'synthetic folder/clip #1.mp4', owner_id: null,
    public: true, metadata: { size: data.length, eTag: '"' + etag + '"', mimetype: 'video/mp4' }, version: 'synthetic-version' }] });
const keys = transportKeyPair();
const response = (bytes = data, tag = etag) => new Response(bytes, { headers: { etag: '"' + tag + '"', 'content-length': String(bytes.length) } });
function memoryClient() {
  const files = new Map(); let writes = 0;
  return { files, get writes() { return writes; },
    async find(name) { return files.get(name)?.file || null; },
    async put(name, bytes) {
      writes++;
      const file = { fileName: name, fileId: 'synthetic-' + files.size, bucketId: 'synthetic-bucket', contentLength: bytes.length, contentSha1: hash(bytes, 'sha1') };
      files.set(name, { file, bytes: Buffer.from(bytes) }); return file;
    },
    async get(file) { return Buffer.from(files.get(file.fileName).bytes); },
  };
}

test('inventory transport round-trips with authenticated encryption and reveals no source paths', () => {
  const inventory = source(), envelope = sealInventory(inventory, keys.publicKey);
  const publicText = JSON.stringify(envelope);
  assert(!publicText.includes(inventory.objects[0].name)); assert(!publicText.includes('owner_id'));
  assert.deepEqual(openInventory(envelope, keys.privateKey), inventory);
  assert.notEqual(sealInventory(inventory, keys.publicKey).ciphertext, envelope.ciphertext);
});
for (const part of ['ciphertext', 'tag', 'wrappedKey', 'iv', 'fingerprint']) {
  test('tampered encrypted transport fails closed: ' + part, () => {
    const envelope = sealInventory(source(), keys.publicKey);
    const bytes = Buffer.from(envelope[part], 'base64'); bytes[0] ^= 1; envelope[part] = bytes.toString('base64');
    assert.throws(() => openInventory(envelope, keys.privateKey));
  });
}
test('another transport private key cannot decrypt the inventory', () => {
  const other = transportKeyPair(); assert.throws(() => openInventory(sealInventory(source(), keys.publicKey), other.privateKey));
});
for (const [label, change] of [
  ['other project', s => { s.project = 'another'; }],
  ['invalid snapshot', s => { s.snapshotId = '../outside'; }],
  ['empty inventory', s => { s.objects = []; }],
  ['private source', s => { s.objects[0].public = false; }],
  ['other bucket', s => { s.objects[0].bucket = 'other'; }],
  ['path traversal', s => { s.objects[0].name = '../private'; }],
  ['nested traversal', s => { s.objects[0].name = 'a/../private'; }],
  ['absolute path', s => { s.objects[0].name = '/private'; }],
  ['control path', s => { s.objects[0].name = 'a\nb'; }],
  ['backslash path', s => { s.objects[0].name = 'a\\b'; }],
  ['duplicate source', s => { s.objects.push(structuredClone(s.objects[0])); }],
  ['invalid etag', s => { s.objects[0].metadata.eTag = 'untrusted'; }],
  ['oversized object', s => { s.objects[0].metadata.size = 36_000_001; }],
  ['wrong byte total', s => { s.totalBytes++; }],
]) test('reject unsafe inventory: ' + label, () => { const s = source(); change(s); assert.throws(() => validateInventory(s)); });

test('bounded binary reader rejects declared oversized bodies', async () => {
  await assert.rejects(boundedBody(new Response('abcd', { headers: { 'content-length': '100' } }), 4));
});
test('bounded binary reader rejects actual oversize without content-length', async () => {
  await assert.rejects(boundedBody(new Response('abcde'), 4));
});
test('rejected HTTP responses are not consumed or reported as media', async () => {
  await assert.rejects(boundedBody(new Response('private provider message', { status: 403 }), 100));
});

test('bootstrap stores and independently reads back its private key; only public key is returned', async () => {
  const client = memoryClient();
  const first = await bootstrapTransport(client);
  assert.equal(first.stage, 'transport-ready'); assert.equal(first.mediaTransferred, false);
  assert.equal(first.backupCompleted, false); assert(!JSON.stringify(first).includes('PRIVATE KEY'));
  const key = client.files.get(CONTROL).bytes;
  assert.equal(first.publicKeySpkiB64, createPublicKey(key).export({ type: 'spki', format: 'der' }).toString('base64'));
  const second = await bootstrapTransport(client);
  assert.deepEqual(first, second); assert.equal(client.writes, 1);
});

test('full copy and restore writes isolated files and preserves ownerless source metadata in private manifest', async () => {
  const client = memoryClient(), logs = [];
  const result = await backupAndRestore(source(), client, { fetchImpl: async (url, options) => {
    assert.equal(url, SOURCE + '/storage/v1/object/public/media/synthetic%20folder/clip%20%231.mp4');
    assert.equal(options.headers['If-Match'], '"' + etag + '"'); assert.equal(options.redirect, 'error');
    assert(!options.headers.Authorization); assert(!options.method || options.method === 'GET');
    return response();
  }, progress: r => logs.push(r) });
  assert.equal(result.backupCompleted, true); assert.equal(result.restoreCompleted, true);
  assert.equal(result.restoredBytes, data.length); assert.equal(result.restoredFiles, 1); assert.equal(result.ownerlessFilesPreserved, 1);
  assert.equal(result.productionFilesModified, false); assert.equal(result.bucketPrivacyChanged, false);
  const manifest = JSON.parse(client.files.get('snapshots/20261027-contract-test/manifest.json').bytes);
  assert.deepEqual(manifest.objects, source().objects); assert.equal(manifest.files[0].sha256, hash(data));
  assert(!JSON.stringify([...logs, result]).includes(source().objects[0].name));
});

for (const [label, fetchImpl] of [
  ['source changed etag', async () => response(data, '0'.repeat(32))],
  ['source truncated', async () => response(data.subarray(1))],
  ['source oversized', async () => response(Buffer.concat([data, data]))],
  ['source unavailable', async () => new Response('', { status: 404 })],
]) test('no backup receipt when ' + label, async () => {
  const client = memoryClient(); await assert.rejects(backupAndRestore(source(), client, { fetchImpl }));
  assert(![...client.files.keys()].some(k => k.endsWith('receipt.json'))); assert.equal(client.writes, 0);
});
test('backup download corruption fails restore and never publishes a completion receipt', async () => {
  const client = memoryClient(); client.get = async () => Buffer.from('corrupted');
  await assert.rejects(backupAndRestore(source(), client, { fetchImpl: async () => response() }));
  assert(![...client.files.keys()].some(k => k.endsWith('receipt.json')));
});
test('private manifest corruption cannot produce completion', async () => {
  const client = memoryClient(), original = client.get;
  client.get = async file => file.fileName.endsWith('manifest.json') ? Buffer.from('corrupt') : original(file);
  await assert.rejects(backupAndRestore(source(), client, { fetchImpl: async () => response() }));
  assert(![...client.files.keys()].some(k => k.endsWith('receipt.json')));
});

function provider({ uploadUrl = 'https://pod-000-1007-13.backblaze.com/b2api/v4/b2_upload_file/test', publicBucket = false } = {}) {
  const requests = [], stored = new Map(), accountToken = 'synthetic-account-token'; let seq = 0;
  const json = body => new Response(JSON.stringify(body));
  return { requests, stored, fetchImpl: async (url, options) => {
    requests.push({ url, options });
    assert.equal(options.redirect, 'error');
    if (url.endsWith('/b2_authorize_account')) return json({ accountId: 'synthetic-account', authorizationToken: accountToken,
      apiInfo: { storageApi: { apiUrl: 'https://api005.backblazeb2.com/', downloadUrl: 'https://f005.backblazeb2.com/', s3ApiUrl: 'https://s3.us-east-005.backblazeb2.com',
        allowed: { buckets: [{ id: 'synthetic-bucket', name: null }], capabilities: ['listBuckets', 'listFiles', 'readFiles', 'writeFiles'], namePrefix: null } } } });
    if (url.endsWith('/b2_list_buckets')) return json({ buckets: [{ bucketId: 'synthetic-bucket', bucketName: 'clipt-media-backup2026', bucketType: publicBucket ? 'allPublic' : 'allPrivate' }] });
    if (url.endsWith('/b2_list_file_names')) {
      assert.equal(options.headers.Authorization, accountToken); const b = JSON.parse(options.body); assert.equal(b.bucketId, 'synthetic-bucket');
      return json({ files: [...stored.values()].filter(v => v.file.fileName.startsWith(b.prefix)).map(v => v.file) });
    }
    if (url.endsWith('/b2_get_upload_url')) return json({ bucketId: 'synthetic-bucket', authorizationToken: 'synthetic-upload-token', uploadUrl });
    if (url === uploadUrl) {
      assert.equal(options.headers.Authorization, 'synthetic-upload-token'); assert.equal(options.headers['X-Bz-Content-Sha1'], hash(options.body, 'sha1'));
      assert.equal(options.headers['Content-Length'], String(options.body.length)); assert.equal(options.headers['X-Bz-Server-Side-Encryption'], 'AES256');
      const file = { fileName: decodeURIComponent(options.headers['X-Bz-File-Name']), fileId: 'file-' + seq++, bucketId: 'synthetic-bucket', contentLength: options.body.length, contentSha1: hash(options.body, 'sha1') };
      stored.set(file.fileId, { file, bytes: Buffer.from(options.body) }); return json(file);
    }
    if (url.startsWith('https://f005.backblazeb2.com/b2api/v4/b2_download_file_by_id?fileId=')) {
      assert.equal(options.headers.Authorization, accountToken); return new Response(stored.get(new URL(url).searchParams.get('fileId')).bytes);
    }
    throw Error('unexpected request');
  } };
}
test('native client uploads with SHA1 and SSE-B2, downloads independently and resumes without replacement', async () => {
  const p = provider(), client = await connectBackup({ keyId: 'synthetic-key', applicationKey: 'synthetic-secret', fetchImpl: p.fetchImpl });
  const name = 'snapshots/20261027-contract-test/objects/0000';
  const file = await client.put(name, data); assert.deepEqual(await client.get(file), data);
  assert.deepEqual(await client.put(name, data), file);
  assert.equal(p.requests.filter(r => r.options.headers?.Authorization === 'synthetic-upload-token').length, 1);
  await assert.rejects(client.put(name, Buffer.from('other bytes')));
  await assert.rejects(client.put('outside/scope', data));
  await assert.rejects(client.get({ ...file, bucketId: 'other' }));
});
test('public destination blocks all writes', async () => {
  const p = provider({ publicBucket: true });
  await assert.rejects(connectBackup({ keyId: 'synthetic-key', applicationKey: 'synthetic-secret', fetchImpl: p.fetchImpl }));
  assert.equal(p.requests.length, 2); assert.equal(p.stored.size, 0);
});
for (const uploadUrl of ['http://pod.backblaze.com/b2api/v4/b2_upload_file/a', 'https://evil.example/b2api/v4/b2_upload_file/a', 'https://pod.backblaze.com.evil.example/b2api/v4/b2_upload_file/a', 'https://pod.backblaze.com/unexpected']) {
  test('upload token never leaves a validated provider destination: ' + uploadUrl, async () => {
    const p = provider({ uploadUrl }); const client = await connectBackup({ keyId: 'synthetic-key', applicationKey: 'synthetic-secret', fetchImpl: p.fetchImpl });
    await assert.rejects(client.put('snapshots/20261027-contract-test/objects/0000', data));
    assert.equal(p.stored.size, 0);
  });
}
