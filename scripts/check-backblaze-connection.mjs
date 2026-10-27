import { Buffer } from 'node:buffer';
import { pathToFileURL } from 'node:url';

const AUTH_URL = 'https://api.backblazeb2.com/b2api/v4/b2_authorize_account';
const EXPECTED_ENDPOINT = 'https://s3.us-east-005.backblazeb2.com';
const EXPECTED_BUCKET = 'clipt-media-backup2026';
const REQUIRED = ['listBuckets', 'listFiles', 'readFiles', 'writeFiles'];
const SAFE_CODES = new Set(['bad_auth_token', 'expired_auth_token', 'unauthorized', 'unsupported', 'access_denied']);

/** Two read-only requests; never writes credentials, cache files or media. */
export async function inspectBackblazeConnection({ keyId, applicationKey, fetchImpl = fetch } = {}) {
  const report = {
    test: 'backblaze-readonly-preflight', credentialSource: 'github-encrypted-secrets',
    ok: false, stage: 'validate-input', authenticated: false,
    singleBucketRestricted: false, expectedRegion: false, permissionsVerified: false,
    expectedBucketVerified: false, privateBucket: null,
    mutationPerformed: false, backupCompleted: false,
  };
  const fail = code => ({ ...report, code });
  if (typeof keyId !== 'string' || typeof applicationKey !== 'string' || !keyId || !applicationKey) return fail('missing-credentials');
  // Report fixed field names and issue categories only, never entered values or characters.
  const invalidCredentialFields = [];
  for (const [field, value] of [['CLIPT_B2_KEY_ID', keyId], ['CLIPT_B2_APPLICATION_KEY', applicationKey]]) {
    const issues = [];
    if (value.trim() !== value) issues.push('leading-or-trailing-whitespace');
    if (/\s/.test(value.trim())) issues.push('whitespace-inside-value');
    if (/[\x00-\x1f\x7f]/.test(value)) issues.push('control-character');
    if (/[\u0080-\uffff]/.test(value)) issues.push('non-ascii-character');
    if (field === 'CLIPT_B2_KEY_ID' && value.includes(':')) issues.push('colon-in-key-id');
    if (issues.length) invalidCredentialFields.push({ field, issues });
  }
  // Preserve original bytes and fail before network access when copying artifacts are found.
  if (invalidCredentialFields.length) {
    return { ...fail('unexpected-whitespace-or-control-character'), invalidCredentialFields };
  }
  async function request(url, options) {
    try {
      const response = await fetchImpl(url, {
        ...options, redirect: 'error', cache: 'no-store', signal: AbortSignal.timeout(15_000),
      });
      report.httpStatus = response.status;
      let body;
      try { body = await response.json(); } catch { return { error: 'unexpected-provider-response' }; }
      if (!response.ok) return { error: SAFE_CODES.has(body?.code) ? body.code : 'provider-rejected-request' };
      return { body };
    } catch { return { error: 'network-no-response' }; }
  }
  report.stage = 'authenticate-backblaze';
  const first = await request(AUTH_URL, {
    method: 'GET', headers: { Authorization: 'Basic ' + Buffer.from(keyId + ':' + applicationKey, 'utf8').toString('base64') },
  });
  if (first.error) return fail(first.error);
  const auth = first.body;
  const storage = auth?.apiInfo?.storageApi;
  if (typeof auth?.authorizationToken !== 'string' || !auth.authorizationToken || typeof auth?.accountId !== 'string' || !auth.accountId || !storage) {
    return fail('unexpected-authorization-response');
  }
  report.authenticated = true;
  report.stage = 'verify-provider-and-key-scope';
  let api;
  try { api = new URL(storage.apiUrl); } catch { return fail('unexpected-api-boundary'); }
  if (api.protocol !== 'https:' || !/^api[0-9]+\.backblazeb2\.com$/.test(api.hostname)
    || api.port || api.pathname !== '/' || api.username || api.password || api.search || api.hash) return fail('unexpected-api-boundary');
  report.expectedRegion = typeof storage.s3ApiUrl === 'string' && storage.s3ApiUrl.replace(/\/$/, '') === EXPECTED_ENDPOINT;
  if (!report.expectedRegion) return fail('unexpected-region');
  const allowed = storage.allowed;
  if (!Array.isArray(allowed?.buckets) || allowed.buckets.length !== 1
    || typeof allowed.buckets[0]?.id !== 'string' || !allowed.buckets[0].id) return fail('single-bucket-key-required');
  report.singleBucketRestricted = true;
  if (allowed.namePrefix != null && allowed.namePrefix !== '') return fail('unexpected-prefix-restriction');
  const capabilities = Array.isArray(allowed.capabilities) ? allowed.capabilities : [];
  report.missingCapabilities = REQUIRED.filter(cap => !capabilities.includes(cap));
  report.permissionsVerified = report.missingCapabilities.length === 0;
  if (!report.permissionsVerified) return fail('missing-required-capability');

  report.stage = 'read-private-bucket-metadata';
  const second = await request(api.origin + '/b2api/v4/b2_list_buckets', {
    method: 'POST', headers: { Authorization: auth.authorizationToken, 'Content-Type': 'application/json' },
    body: JSON.stringify({ accountId: auth.accountId, bucketId: allowed.buckets[0].id }),
  });
  if (second.error) return fail(second.error);
  const buckets = second.body?.buckets;
  if (!Array.isArray(buckets) || buckets.length !== 1 || buckets[0]?.bucketId !== allowed.buckets[0].id
    || buckets[0].bucketName !== EXPECTED_BUCKET) return fail('unexpected-bucket-response');
  report.expectedBucketVerified = true;
  report.privateBucket = buckets[0].bucketType === 'allPrivate';
  if (!report.privateBucket) return fail('backup-bucket-not-private');
  report.stage = 'complete';
  report.ok = true;
  return report;
}

async function main() {
  try {
    const report = await inspectBackblazeConnection({
      keyId: process.env.CLIPT_B2_KEY_ID,
      applicationKey: process.env.CLIPT_B2_APPLICATION_KEY,
    });
    console.log(JSON.stringify(report));
    if (!report.ok) process.exitCode = 1;
  } finally {
    delete process.env.CLIPT_B2_KEY_ID;
    delete process.env.CLIPT_B2_APPLICATION_KEY;
  }
}

if (typeof process !== 'undefined' && process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch(() => {
    console.error(JSON.stringify({ test: 'backblaze-readonly-preflight', ok: false,
      code: 'check-could-not-complete', mutationPerformed: false, backupCompleted: false }));
    process.exitCode = 1;
  });
}
