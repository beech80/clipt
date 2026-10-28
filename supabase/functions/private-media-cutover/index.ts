import { verifyCutoverOidc, MEDIA_BUCKETS, validateRollbackFlags, validateCutoverSamples } from '../_shared/media-cutover-oidc.mjs';

// Deployment must pin one reviewed request commit and a short expiration window.
// The repository copy is inert. Deployment replaces these exact two constants.
const AUTHORIZED_SHA = 'DISABLED';
const DEADLINE = 0;
const PROJECT = 'https://slnjliheyiiummxhrgmk.supabase.co';
const json = (value: unknown, status = 200) => new Response(JSON.stringify(value), { status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });

Deno.serve(async req => {
  if (req.method !== 'POST') return json({ error: 'Not available' }, 405);
  try {
    const token = req.headers.get('authorization')?.match(/^Bearer ([A-Za-z0-9_.-]+)$/)?.[1];
    await verifyCutoverOidc(token, { expectedSha: AUTHORIZED_SHA, deadline: DEADLINE });
  } catch { return json({ error: 'Not authorized' }, 401); }
  // No administrative credential is loaded until the independently verified OIDC check passes.
  const secret = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!secret || Deno.env.get('SUPABASE_URL') !== PROJECT) return json({ error: 'Not configured' }, 503);
  async function storage(path: string, method = 'GET', data?: unknown) {
    const response = await fetch(PROJECT + '/storage/v1' + path, { method, redirect: 'error',
      headers: { apikey: secret!, Authorization: 'Bearer ' + secret!, 'Content-Type': 'application/json' },
      ...(data === undefined ? {} : { body: JSON.stringify(data) }), signal: AbortSignal.timeout(15000) });
    if (!response.ok) { await response.body?.cancel(); throw Error('storage-operation-failed'); }
    return await response.json();
  }
  let previous: {id: string; public: boolean}[] | undefined;
  try {
    const text = await req.text(); if (text.length > 16000) return json({ error: 'Invalid request' }, 400);
    const body = JSON.parse(text);
    if (body.operation === 'rollback') {
      const flags = validateRollbackFlags(body.flags);
      for (const f of flags) await storage('/bucket/' + f.id, 'PUT', { public: f.public });
      return json({ rollbackCompleted: true });
    }
    if (body.operation !== 'private') return json({ error: 'Invalid request' }, 400);
    const samples = validateCutoverSamples(body.samples);
    previous = [];
    for (const id of MEDIA_BUCKETS) { const b = await storage('/bucket/' + id);
      if (b.id !== id || typeof b.public !== 'boolean') throw Error('unexpected-bucket'); previous.push({ id, public: b.public }); }
    validateRollbackFlags(previous);
    for (const id of MEDIA_BUCKETS) await storage('/bucket/' + id, 'PUT', { public: false });
    for (const id of MEDIA_BUCKETS) if ((await storage('/bucket/' + id)).public !== false) throw Error('privacy-verification-failed');
    // This is a service-authorized signing smoke test, not a claim of real owner-session acceptance.
    for (const sample of samples) {
      const path = sample.bucket + '/' + sample.name.split('/').map(encodeURIComponent).join('/');
      const signed = await storage('/object/sign/' + path, 'POST', { expiresIn: 60 });
      const value = signed.signedURL ?? signed.signedUrl;
      if (typeof value !== 'string' || !value.startsWith('/object/sign/')) throw Error('invalid-signed-response');
      const url = new URL(PROJECT + '/storage/v1' + value);
      if (url.origin !== PROJECT || decodeURIComponent(url.pathname) !== '/storage/v1/object/sign/' + sample.bucket + '/' + sample.name) throw Error('invalid-signed-boundary');
      const head = await fetch(url, { method: 'HEAD', redirect: 'error', cache: 'no-store', signal: AbortSignal.timeout(15000) });
      if (head.status !== 200 || Number(head.headers.get('content-length')) !== sample.size || head.headers.get('etag')?.replaceAll('"','') !== sample.etag.replaceAll('"','')) throw Error('signed-media-smoke-failed');
    }
    return json({ bucketsPrivate: MEDIA_BUCKETS.length, signedServiceSamplesPassed: samples.length, before: previous, ownerSessionVerified: false });
  } catch {
    let rollbackCompleted = false;
    if (previous?.length === MEDIA_BUCKETS.length) {
      try { validateRollbackFlags(previous); for (const f of previous) await storage('/bucket/' + f.id, 'PUT', { public: f.public }); rollbackCompleted = true; } catch { /* report fixed status only */ }
    }
    return json({ error: 'Cutover stopped', rollbackCompleted }, 503);
  }
});
