export const OIDC_AUDIENCE = 'clipt-production-media-cutover-v1';
export const OIDC_ISSUER = 'https://token.actions.githubusercontent.com';
export const MEDIA_BUCKETS = ['avatars', 'clipt-avatars', 'media', 'posts', 'videos', 'recordings'];
export const BASELINE_FLAGS = MEDIA_BUCKETS.map(id => ({ id, public: id !== 'recordings' }));
const decode = text => Uint8Array.from(atob(text.replaceAll('-', '+').replaceAll('_', '/')), c => c.charCodeAt(0));
const parse = part => JSON.parse(new TextDecoder().decode(decode(part)));
export async function verifyCutoverOidc(token, { expectedSha, deadline, now = Date.now(), fetchImpl = fetch } = {}) {
  if (!/^[a-f0-9]{40}$/.test(expectedSha || '') || !Number.isFinite(deadline) || now >= deadline || typeof token !== 'string' || token.length > 16000) throw Error('authorization-denied');
  const parts = token.split('.'); if (parts.length !== 3) throw Error('authorization-denied');
  const header = parse(parts[0]), c = parse(parts[1]), seconds = Math.floor(now / 1000);
  if (header.alg !== 'RS256' || typeof header.kid !== 'string' || header.kid.length > 200
    || c.iss !== OIDC_ISSUER || c.aud !== OIDC_AUDIENCE || c.repository !== 'beech80/clipt'
    || c.repository_id !== '917757980' || c.repository_owner_id !== '195324952'
    || c.ref !== 'refs/heads/main' || c.event_name !== 'push' || c.sha !== expectedSha
    || c.workflow_ref !== 'beech80/clipt/.github/workflows/private-media-cutover.yml@refs/heads/main'
    || !Number.isInteger(c.exp) || !Number.isInteger(c.iat) || !Number.isInteger(c.nbf)
    || c.exp <= seconds || c.exp - c.iat > 600 || c.iat > seconds + 30 || c.iat < seconds - 600 || c.nbf > seconds + 30) throw Error('authorization-denied');
  const response = await fetchImpl(OIDC_ISSUER + '/.well-known/jwks', { redirect: 'error', cache: 'no-store', signal: AbortSignal.timeout(10000) });
  if (!response.ok) throw Error('authorization-denied');
  const jwks = await response.json();
  const matches = jwks?.keys?.filter(k => k.kid === header.kid && k.kty === 'RSA' && (!k.alg || k.alg === 'RS256') && (!k.use || k.use === 'sig'));
  if (matches?.length !== 1) throw Error('authorization-denied');
  const key = await crypto.subtle.importKey('jwk', matches[0], { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['verify']);
  if (!await crypto.subtle.verify('RSASSA-PKCS1-v1_5', key, decode(parts[2]), new TextEncoder().encode(parts[0] + '.' + parts[1]))) throw Error('authorization-denied');
  return true;
}
export function validateRollbackFlags(flags) {
  if (!Array.isArray(flags) || flags.length !== MEDIA_BUCKETS.length) throw Error('invalid-rollback');
  if (!MEDIA_BUCKETS.every(id => flags.filter(f => f.id === id && typeof f.public === 'boolean').length === 1)) throw Error('invalid-rollback');
  const privateOnly = flags.every(f => f.public === false);
  const baseline = flags.every(f => f.public === (f.id !== 'recordings'));
  if (!privateOnly && !baseline) throw Error('invalid-rollback');
  return MEDIA_BUCKETS.map(id => ({ id, public: flags.find(f => f.id === id).public }));
}
export function validateCutoverSamples(samples) {
  if (!Array.isArray(samples) || samples.length !== 4) throw Error('invalid-samples');
  if (!['avatars','media','posts','videos'].every(b => samples.filter(s => s.bucket === b).length === 1)) throw Error('invalid-samples');
  for (const s of samples) if (typeof s.name !== 'string' || !s.name || s.name.length > 1024 || /[\\\x00-\x1f\x7f]/.test(s.name)
    || s.name.split('/').some(p => !p || p === '.' || p === '..') || !Number.isInteger(s.size) || s.size < 1 || s.size > 36_000_000
    || typeof s.etag !== 'string' || !/^"?[a-f0-9]{32}(?:-\d+)?"?$/i.test(s.etag)) throw Error('invalid-samples');
  return samples;
}
