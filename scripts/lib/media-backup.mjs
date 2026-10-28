import { Buffer } from 'node:buffer';
import { createHash, createPublicKey, generateKeyPairSync, privateDecrypt, publicEncrypt, randomBytes, createCipheriv, createDecipheriv, constants } from 'node:crypto';
import { mkdtemp, writeFile, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve, relative, basename } from 'node:path';
import { inspectBackblazeConnection } from '../check-backblaze-connection.mjs';

export const SOURCE = 'https://slnjliheyiiummxhrgmk.supabase.co';
export const CONTROL = 'clipt-backup-control/transport-private-v1.pem';
export const hash = (bytes, algorithm = 'sha256') => createHash(algorithm).update(bytes).digest('hex');
const AAD = Buffer.from('CLIPT media inventory v1');
export class BackupError extends Error { constructor(code) { super(code); this.code = code; } }
const fail = code => { throw new BackupError(code); };
const safeUrl = (value, kind) => {
  const u = new URL(value);
  if (u.protocol !== 'https:' || u.username || u.password || u.port || u.hash) fail('provider-url-rejected');
  if (kind === 'download' && (!/^f\d+\.backblazeb2\.com$/.test(u.hostname) || u.pathname !== '/' || u.search)) fail('provider-url-rejected');
  if (kind === 'upload' && (!/^[a-z0-9.-]+\.(backblaze\.com|backblazeb2\.com)$/.test(u.hostname) || !/^\/b2api\/v[1-4]\/b2_upload_file(?:\/|$)/.test(u.pathname))) fail('provider-url-rejected');
  return u;
};
export function transportKeyPair() {
  return generateKeyPairSync('rsa', { modulusLength: 3072,
    publicKeyEncoding: { type: 'spki', format: 'der' }, privateKeyEncoding: { type: 'pkcs8', format: 'pem' } });
}
export function sealInventory(inventory, publicKey) {
  validateInventory(inventory);
  const key = randomBytes(32), iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', key, iv); cipher.setAAD(AAD);
  const ciphertext = Buffer.concat([cipher.update(JSON.stringify(inventory), 'utf8'), cipher.final()]);
  return { format: 'clipt-media-inventory-v1', fingerprint: hash(publicKey),
    wrappedKey: publicEncrypt({ key: publicKey, type: 'spki', format: 'der', padding: constants.RSA_PKCS1_OAEP_PADDING, oaepHash: 'sha256' }, key).toString('base64'),
    iv: iv.toString('base64'), tag: cipher.getAuthTag().toString('base64'), ciphertext: ciphertext.toString('base64') };
}
export function openInventory(envelope, privateKey) {
  if (envelope?.format !== 'clipt-media-inventory-v1' || JSON.stringify(envelope).length > 4_000_000) fail('invalid-envelope');
  const pub = createPublicKey(privateKey).export({ type: 'spki', format: 'der' });
  if (hash(pub) !== envelope.fingerprint) fail('transport-key-mismatch');
  const key = privateDecrypt({ key: privateKey, padding: constants.RSA_PKCS1_OAEP_PADDING, oaepHash: 'sha256' }, Buffer.from(envelope.wrappedKey, 'base64'));
  const decipher = createDecipheriv('aes-256-gcm', key, Buffer.from(envelope.iv, 'base64'));
  decipher.setAAD(AAD); decipher.setAuthTag(Buffer.from(envelope.tag, 'base64'));
  const inventory = JSON.parse(Buffer.concat([decipher.update(Buffer.from(envelope.ciphertext, 'base64')), decipher.final()]).toString());
  validateInventory(inventory); return inventory;
}
export function validateInventory(inventory) {
  if (inventory?.project !== 'slnjliheyiiummxhrgmk' || !/^20261027-[a-z0-9-]{1,40}$/.test(inventory.snapshotId || '')
    || !Array.isArray(inventory.objects) || !inventory.objects.length || inventory.objects.length > 200) fail('inventory-out-of-bounds');
  const seen = new Set(); let bytes = 0;
  for (const o of inventory.objects) {
    if (!['avatars', 'clipt-avatars', 'media', 'posts', 'recordings', 'videos'].includes(o.bucket) || o.public !== true
      || typeof o.name !== 'string' || !o.name || o.name.length > 1024 || /[\\\x00-\x1f\x7f]/.test(o.name)
      || o.name.split('/').some(part => !part || part === '.' || part === '..') || typeof o.id !== 'string'
      || typeof o.metadata?.eTag !== 'string' || !/^(?:"?[a-f0-9]{32}(?:-\d+)?"?)$/i.test(o.metadata.eTag)
      || !Number.isSafeInteger(o.metadata.size) || o.metadata.size < 0 || o.metadata.size > 36_000_000) fail('invalid-source-object');
    const identity = o.bucket + '/' + o.name; if (seen.has(identity)) fail('duplicate-source-object'); seen.add(identity); bytes += o.metadata.size;
  }
  if (bytes > 1_000_000_000 || bytes !== inventory.totalBytes) fail('inventory-byte-limit');
  return bytes;
}
export async function boundedBody(response, maxBytes) {
  if (!response.ok) { await response.body?.cancel(); fail('binary-request-rejected'); }
  const declared = Number(response.headers.get('content-length'));
  if (declared > maxBytes) { await response.body?.cancel(); fail('binary-size-limit'); }
  if (!response.body) return Buffer.alloc(0);
  const reader = response.body.getReader(), chunks = []; let total = 0;
  try {
    while (true) { const { value, done } = await reader.read(); if (done) break;
      total += value.byteLength; if (total > maxBytes) fail('binary-size-limit'); chunks.push(Buffer.from(value)); }
  } catch (error) { await reader.cancel(); throw error; }
  return Buffer.concat(chunks, total);
}
export async function connectBackup({ keyId, applicationKey, fetchImpl = fetch }) {
  let authorization;
  const checked = await inspectBackblazeConnection({ keyId, applicationKey, fetchImpl: async (url, options) => {
    const response = await fetchImpl(url, options);
    if (url.endsWith('/b2_authorize_account') && response.ok) authorization = await response.clone().json();
    return response;
  } });
  if (!checked.ok) fail('backup-destination-preflight-failed');
  const storage = authorization.apiInfo.storageApi, token = authorization.authorizationToken;
  const bucketId = storage.allowed.buckets[0].id, api = new URL(storage.apiUrl).origin;
  const download = safeUrl(storage.downloadUrl, 'download').origin;
  async function request(url, options = {}) {
    return fetchImpl(url, { ...options, redirect: 'error', cache: 'no-store', signal: AbortSignal.timeout(120_000) });
  }
  async function json(url, options) {
    const response = await request(url, options); if (!response.ok) { await response.body?.cancel(); fail('backup-provider-request-failed'); }
    return JSON.parse((await boundedBody(response, 4_000_000)).toString());
  }
  const rpc = (op, body) => json(api + '/b2api/v4/' + op, { method: 'POST', headers: { Authorization: token, 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  let upload;
  async function find(name) {
    const result = await rpc('b2_list_file_names', { bucketId, prefix: name, maxFileCount: 2 });
    if (!Array.isArray(result.files)) fail('backup-list-invalid');
    const exact = result.files.filter(f => f.fileName === name);
    if (exact.length > 1) fail('backup-ambiguous-file');
    if (exact[0] && exact[0].bucketId !== bucketId) fail('backup-file-bucket-mismatch');
    return exact[0] || null;
  }
  async function get(file, maxBytes = 36_000_000) {
    if (file.bucketId !== bucketId || typeof file.fileId !== 'string') fail('backup-file-boundary');
    const r = await request(download + '/b2api/v4/b2_download_file_by_id?fileId=' + encodeURIComponent(file.fileId), { headers: { Authorization: token } });
    const bytes = await boundedBody(r, maxBytes);
    if (hash(bytes, 'sha1') !== file.contentSha1 || bytes.length !== file.contentLength) fail('backup-download-integrity');
    return bytes;
  }
  async function put(name, bytes) {
    if (!/^(clipt-backup-control\/transport-private-v1\.pem|snapshots\/20261027-[a-z0-9-]{1,40}\/(?:objects\/\d{4}|manifest\.json|receipt\.json))$/.test(name)) fail('backup-write-boundary');
    if (bytes.length > 36_000_000) fail('backup-write-size-limit');
    const existing = await find(name);
    if (existing) { const saved = await get(existing); if (hash(saved) !== hash(bytes)) fail('backup-existing-file-mismatch'); return existing; }
    if (!upload) { upload = await rpc('b2_get_upload_url', { bucketId });
      if (upload.bucketId !== bucketId || typeof upload.authorizationToken !== 'string') fail('backup-upload-scope'); safeUrl(upload.uploadUrl, 'upload'); }
    const file = await json(upload.uploadUrl, { method: 'POST', headers: {
      Authorization: upload.authorizationToken, 'X-Bz-File-Name': encodeURIComponent(name),
      'Content-Type': 'application/octet-stream', 'Content-Length': String(bytes.length),
      'X-Bz-Content-Sha1': hash(bytes, 'sha1'), 'X-Bz-Info-sha256': hash(bytes), 'X-Bz-Server-Side-Encryption': 'AES256',
    }, body: bytes });
    if (file.bucketId !== bucketId || file.fileName !== name || file.contentLength !== bytes.length || file.contentSha1 !== hash(bytes, 'sha1') || !file.fileId) fail('backup-upload-integrity');
    return file;
  }
  return { find, get, put };
}
export async function bootstrapTransport(client) {
  let existing = await client.find(CONTROL), privateKey;
  if (existing) privateKey = (await client.get(existing, 20_000)).toString();
  else { privateKey = transportKeyPair().privateKey; existing = await client.put(CONTROL, Buffer.from(privateKey)); }
  const restored = await client.get(existing, 20_000);
  if (hash(restored) !== hash(Buffer.from(privateKey))) fail('transport-key-restore-failed');
  const publicKey = createPublicKey(privateKey).export({ type: 'spki', format: 'der' });
  return { stage: 'transport-ready', publicKeySpkiB64: publicKey.toString('base64'), fingerprint: hash(publicKey), mediaTransferred: false, backupCompleted: false };
}
export async function backupAndRestore(inventory, client, { fetchImpl = fetch, progress = () => {} } = {}) {
  validateInventory(inventory);
  const root = resolve(await mkdtemp(join(tmpdir(), 'clipt-media-restore-')));
  const manifest = { ...inventory, files: [], restoreMethod: 'isolated-temp-files-full-byte-sha256', noSourceMutations: true };
  let transferredBytes = 0;
  try {
    for (let i = 0; i < inventory.objects.length; i++) {
      const o = inventory.objects[i];
      const path = o.bucket + '/' + o.name.split('/').map(encodeURIComponent).join('/');
      const response = await fetchImpl(SOURCE + '/storage/v1/object/public/' + path, { redirect: 'error', cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache', 'If-Match': '"' + o.metadata.eTag.replaceAll('"', '') + '"' }, signal: AbortSignal.timeout(120_000) });
      const bytes = await boundedBody(response, o.metadata.size);
      if (bytes.length !== o.metadata.size || response.headers.get('etag')?.replaceAll('"', '') !== o.metadata.eTag.replaceAll('"', '')) fail('source-snapshot-changed');
      const name = 'snapshots/' + inventory.snapshotId + '/objects/' + String(i).padStart(4, '0');
      const saved = await client.put(name, bytes);
      manifest.files.push({ sourceId: o.id, fileName: name, fileId: saved.fileId, bucketId: saved.bucketId,
        contentLength: bytes.length, contentSha1: hash(bytes, 'sha1'), sha256: hash(bytes) });
      transferredBytes += bytes.length;
      if ((i + 1) % 10 === 0 || i + 1 === inventory.objects.length) progress({ stage: 'copy', completedFiles: i + 1, totalFiles: inventory.objects.length, bytes: transferredBytes });
    }
    // Release source buffers; restore each object independently from Backblaze into isolated files.
    let restoredBytes = 0;
    for (let i = 0; i < manifest.files.length; i++) {
      const f = manifest.files[i], restored = await client.get(f, f.contentLength);
      if (hash(restored) !== f.sha256) fail('restore-hash-mismatch');
      const target = join(root, String(i).padStart(4, '0'));
      await writeFile(target, restored, { flag: 'wx', mode: 0o600 });
      const disk = await readFile(target);
      if (hash(disk) !== f.sha256 || disk.length !== f.contentLength) fail('restore-disk-integrity');
      restoredBytes += disk.length;
      if ((i + 1) % 10 === 0 || i + 1 === manifest.files.length) progress({ stage: 'restore', completedFiles: i + 1, totalFiles: manifest.files.length, bytes: restoredBytes });
    }
    if (restoredBytes !== inventory.totalBytes) fail('restore-total-mismatch');
    const serialized = Buffer.from(JSON.stringify(manifest));
    const savedManifest = await client.put('snapshots/' + inventory.snapshotId + '/manifest.json', serialized);
    if (hash(await client.get(savedManifest, 4_000_000)) !== hash(serialized)) fail('manifest-restore-failed');
    const receipt = { snapshotId: inventory.snapshotId, backupCompleted: true, restoreCompleted: true,
      sourceFiles: inventory.objects.length, backedUpFiles: manifest.files.length, restoredFiles: manifest.files.length,
      bytes: transferredBytes, restoredBytes, ownerlessFilesPreserved: inventory.objects.filter(o => !o.owner_id).length,
      manifestSha256: hash(serialized), productionFilesModified: false, bucketPrivacyChanged: false };
    const receiptBytes = Buffer.from(JSON.stringify(receipt));
    const savedReceipt = await client.put('snapshots/' + inventory.snapshotId + '/receipt.json', receiptBytes);
    if (hash(await client.get(savedReceipt, 20_000)) !== hash(receiptBytes)) fail('receipt-restore-failed');
    return receipt;
  } finally {
    const rel = relative(resolve(tmpdir()), root);
    if (!rel.startsWith('..') && !rel.includes('/') && !rel.includes('\\') && basename(root).startsWith('clipt-media-restore-')) await rm(root, { recursive: true, force: true });
  }
}
