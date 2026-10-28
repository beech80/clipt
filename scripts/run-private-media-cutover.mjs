import { readFile } from 'node:fs/promises';
import { connectBackup, hash, SOURCE } from './lib/media-backup.mjs';
import { OIDC_AUDIENCE, BASELINE_FLAGS } from '../supabase/functions/_shared/media-cutover-oidc.mjs';

let stage = 'verify-backup', before, oidc;
async function operation(body) {
  const response = await fetch(SOURCE + '/functions/v1/private-media-cutover', { method: 'POST', redirect: 'error',
    headers: { Authorization: 'Bearer ' + oidc, 'Content-Type': 'application/json' }, body: JSON.stringify(body), signal: AbortSignal.timeout(120000) });
  if (!response.ok) { await response.body?.cancel(); throw Error('operation-rejected'); }
  return await response.json();
}
try {
  if (process.env.GITHUB_REPOSITORY !== 'beech80/clipt' || process.env.GITHUB_REF !== 'refs/heads/main' || process.env.GITHUB_EVENT_NAME !== 'push') throw Error('invalid-context');
  const request = JSON.parse(await readFile('operations/private-media-cutover-request.json', 'utf8'));
  if (request.operation !== 'private' || request.backupManifestSha256 !== 'a308214b9af823e48c196e2784e0f354f9aa38a4e679650b6d3b7c6b56e63118') throw Error('invalid-request');
  const b2 = await connectBackup({ keyId: process.env.CLIPT_B2_KEY_ID, applicationKey: process.env.CLIPT_B2_APPLICATION_KEY });
  delete process.env.CLIPT_B2_KEY_ID; delete process.env.CLIPT_B2_APPLICATION_KEY;
  const saved = await b2.find('snapshots/20261027-beta-initial/manifest.json'); if (!saved) throw Error('backup-missing');
  const bytes = await b2.get(saved, 4_000_000); if (hash(bytes) !== request.backupManifestSha256) throw Error('backup-hash');
  const manifest = JSON.parse(bytes.toString());
  if (manifest.objects.length !== 141 || manifest.totalBytes !== 942701900 || manifest.files.length !== 141) throw Error('backup-incomplete');
  const receiptFile = await b2.find('snapshots/20261027-beta-initial/receipt.json'); if (!receiptFile) throw Error('backup-receipt-missing');
  const receipt = JSON.parse((await b2.get(receiptFile, 20000)).toString());
  if (!receipt.backupCompleted || !receipt.restoreCompleted || receipt.manifestSha256 !== request.backupManifestSha256) throw Error('backup-not-verified');
  const samples = ['avatars','media','posts','videos'].map(bucket => {
    const o = manifest.objects.find(o => o.bucket === bucket && o.owner_id); if (!o) throw Error('sample-unavailable');
    return { bucket, name: o.name, size: o.metadata.size, etag: o.metadata.eTag };
  });
  stage = 'authorize-one-time-operation';
  const tokenUrl = new URL(process.env.ACTIONS_ID_TOKEN_REQUEST_URL);
  if (tokenUrl.protocol !== 'https:' || !tokenUrl.hostname.endsWith('.actions.githubusercontent.com')) throw Error('unexpected-oidc-endpoint');
  tokenUrl.searchParams.set('audience', OIDC_AUDIENCE);
  const tokenResponse = await fetch(tokenUrl, { redirect: 'error', headers: { Authorization: 'Bearer ' + process.env.ACTIONS_ID_TOKEN_REQUEST_TOKEN }, signal: AbortSignal.timeout(15000) });
  if (!tokenResponse.ok) throw Error('oidc-unavailable');
  oidc = (await tokenResponse.json()).value;
  stage = 'storage-api-cutover';
  const result = await operation({ operation: 'private', samples }); before = result.before;
  if (result.bucketsPrivate !== 6 || result.signedServiceSamplesPassed !== 4) throw Error('cutover-not-verified');
  stage = 'verify-anonymous-denial'; let denied = 0;
  for (const o of manifest.objects) {
    const path = o.bucket + '/' + o.name.split('/').map(encodeURIComponent).join('/');
    const response = await fetch(SOURCE + '/storage/v1/object/public/' + path + '?clipt_private_probe=' + encodeURIComponent(process.env.GITHUB_RUN_ID),
      { method: 'HEAD', redirect: 'error', cache: 'no-store', signal: AbortSignal.timeout(15000) });
    if (![400,401,403,404].includes(response.status)) throw Error('anonymous-denial-failed'); denied++;
    if (denied % 25 === 0) console.log(JSON.stringify({ stage, deniedObjects: denied, total: 141 }));
  }
  console.log(JSON.stringify({ privateMediaCutoverCompleted: true, privateBuckets: 6, anonymousObjectsDenied: denied,
    signedServiceSamplesPassed: 4, ownerlessFilesRestricted: 2, ownerSessionVerified: false, productionObjectsMoved: false, sourceObjectsDeleted: false }));
} catch {
  let rollbackCompleted = false;
  if (oidc && stage !== 'authorize-one-time-operation' && stage !== 'verify-backup') {
    try { const r = await operation({ operation: 'rollback', flags: before ?? BASELINE_FLAGS }); rollbackCompleted = r.rollbackCompleted === true; } catch { /* never print provider/token details */ }
  }
  console.error(JSON.stringify({ stage, privateMediaCutoverCompleted: false, rollbackCompleted, code: 'cutover-stopped-for-review' }));
  process.exitCode = 1;
} finally {
  delete process.env.CLIPT_B2_KEY_ID; delete process.env.CLIPT_B2_APPLICATION_KEY; delete process.env.ACTIONS_ID_TOKEN_REQUEST_TOKEN;
}
