import test from 'node:test';
import assert from 'node:assert/strict';
import { checkProduction, githubClient, synchronizeAlerts } from '../../scripts/check-production-availability.mjs';

const ids = ['login', 'privacy', 'terms', 'auth-health', 'beta-admission', 'data-denial'];
const checks = (failed = []) => ids.map(id => ({ id, ok: !failed.includes(id) }));
const runUrl = 'https://github.com/beech80/clipt/actions/runs/123456';
const marker = '<!-- clipt-external-monitor:v1 -->';
const verification = '<!-- clipt-external-monitor:verification:v1 -->';
const botIssue = (number, body, state = 'open') => ({ number, body, state, user: { login: 'github-actions[bot]' } });
const json = (value, status = 200) => new Response(JSON.stringify(value), { status, headers: { 'content-type': 'application/json' } });
const html = () => new Response('<html><div id="root"></div></html>', { headers: { 'content-type': 'text/html' } });
const healthyFetch = async url => {
  const path = new URL(url).pathname;
  if (['/login', '/privacy', '/terms'].includes(path)) return html();
  if (path === '/auth/v1/health') return json({ version: 'test' });
  if (path === '/rest/v1/rpc/clipt_beta_access') return json(false);
  return json({ code: '42501' }, 401);
};
function fixture(initial = []) {
  const issues = structuredClone(initial);
  const writes = [];
  return {
    issues, writes,
    async listIssues() { return issues; },
    async createIssue(issue) {
      writes.push({ action: 'create', ...issue });
      const receipt = { ...botIssue(100 + issues.length, issue.body), ...issue };
      issues.push(receipt); return receipt;
    },
    async closeIssue(number, body) {
      writes.push({ action: 'close', number });
      Object.assign(issues.find(i => i.number === number), { state: 'closed', body });
      return { state: 'closed' };
    },
  };
}

test('healthy probes perform six bounded requests without requiring private credentials', async () => {
  const requests = [];
  const results = await checkProduction({ fetchImpl: async (url, options) => {
    requests.push({ url, options }); return healthyFetch(url);
  } });
  assert.equal(results.length, 6);
  assert(results.every(r => r.ok && r.attempts === 1));
  assert(requests.every(r => r.options.redirect === 'error' && r.options.signal));
  const key = requests.find(r => r.options.headers?.apikey).options.headers.apikey;
  assert.equal(JSON.parse(Buffer.from(key.split('.')[1], 'base64url')).role, 'anon');
  assert(!JSON.stringify(results).includes(key));
});

test('unexpected public data access or disabled invitation enforcement raises a failure', async () => {
  const results = await checkProduction({ sleep: async () => {}, fetchImpl: async url => {
    if (url.includes('/rpc/clipt_beta_access')) return json(true);
    if (url.includes('/games?')) return json([{ id: 'must-not-log' }]);
    return healthyFetch(url);
  } });
  assert.deepEqual(results.filter(r => !r.ok).map(r => r.id), ['beta-admission', 'data-denial']);
  assert(!JSON.stringify(results).includes('must-not-log'));
});

test('a transient request failure retries once and does not become an outage', async () => {
  let attempts = 0; let waits = 0;
  const results = await checkProduction({ sleep: async () => { waits++; }, fetchImpl: async url => {
    if (url.endsWith('/login') && attempts++ === 0) throw new Error('sensitive exception');
    return healthyFetch(url);
  } });
  assert(results.every(r => r.ok)); assert.equal(waits, 1);
  assert.equal(results.find(r => r.id === 'login').attempts, 2);
});

test('login redirects/error HTML and gateway failures fail without logging response bodies', async () => {
  const results = await checkProduction({ sleep: async () => {}, fetchImpl: async url => {
    if (url.endsWith('/login')) return new Response('private error detail', { status: 200, headers: { 'content-type': 'text/html' } });
    if (url.endsWith('/health')) return json({ private: 'provider body' }, 503);
    return healthyFetch(url);
  } });
  assert.deepEqual(results.filter(r => !r.ok).map(r => r.id), ['login', 'auth-health']);
  assert(!JSON.stringify(results).includes('private'));
});

test('first healthy run creates one verification receipt assigned to the owner', async () => {
  const github = fixture();
  const r = await synchronizeAlerts({ checks: checks(), github, runUrl });
  assert.equal(r.delivery, 'verification-created');
  assert.deepEqual(github.writes[0].assignees, ['beech80']);
  assert(github.writes[0].body.includes(verification));
  assert(!github.writes[0].body.includes('needs attention'));
});

test('healthy runs stay quiet and do not recreate a closed verification notification', async () => {
  const github = fixture([botIssue(1, verification, 'closed')]);
  const r = await synchronizeAlerts({ checks: checks(), github, runUrl });
  assert.equal(r.delivery, 'unchanged'); assert.equal(github.writes.length, 0);
});

test('a confirmed failure creates a single owner-assigned incident and repeat runs stay quiet', async () => {
  const github = fixture();
  const first = await synchronizeAlerts({ checks: checks(['auth-health']), github, runUrl });
  const next = await synchronizeAlerts({ checks: checks(['auth-health']), github, runUrl });
  assert.equal(first.delivery, 'incident-created'); assert.equal(next.delivery, 'existing-incident');
  assert.equal(github.writes.length, 1); assert.deepEqual(github.writes[0].assignees, ['beech80']);
  assert(github.writes[0].body.includes('auth-health'));
});

test('recovery closes only bot-owned incidents and leaves ordinary user issues alone', async () => {
  const github = fixture([botIssue(1, marker), botIssue(2, verification, 'closed'),
    { number: 3, state: 'open', body: marker, user: { login: 'someone-else' } }]);
  const r = await synchronizeAlerts({ checks: checks(), github, runUrl });
  assert.equal(r.delivery, 'recovered');
  assert.deepEqual(github.writes, [{ action: 'close', number: 1 }]);
  assert.equal(github.issues[2].state, 'open');
});

test('incomplete or injected check names and non-GitHub run links cannot create notifications', async () => {
  const github = fixture();
  await assert.rejects(synchronizeAlerts({ checks: checks().slice(1), github, runUrl }), /fixed monitor checks/);
  await assert.rejects(synchronizeAlerts({ checks: [...checks().slice(1), { id: 'private message', ok: false }], github, runUrl }), /fixed monitor checks/);
  await assert.rejects(synchronizeAlerts({ checks: checks(), github, runUrl: 'https://other.example/private' }), /Verified workflow/);
  assert.equal(github.writes.length, 0);
});

test('missing or rejected GitHub delivery receipts fail rather than claiming notification delivery', async () => {
  const github = fixture(); github.createIssue = async () => ({});
  await assert.rejects(synchronizeAlerts({ checks: checks(['login']), github, runUrl }), /receipt unconfirmed/);
  assert.throws(() => githubClient({ token: '', repository: 'beech80/clipt' }), /required/);
  assert.throws(() => githubClient({ token: 'test', repository: 'other/repo' }), /required/);
});

test('GitHub client uses fixed repository boundaries and redacts provider errors', async () => {
  const client = githubClient({ token: 'test-secret', repository: 'beech80/clipt', fetchImpl: async (url, options) => {
    assert(url.startsWith('https://api.github.com/repos/beech80/clipt/'));
    assert.equal(options.redirect, 'error');
    return json({ message: 'test-secret provider response' }, 403);
  } });
  await assert.rejects(client.listIssues(), e => e.message === 'GitHub alert delivery request failed (HTTP 403)');
});

test('a full inventory fails for manual review instead of silently duplicating old incidents', async () => {
  const client = githubClient({ token: 'test-secret', repository: 'beech80/clipt', fetchImpl: async () => json(Array(100).fill({})) });
  await assert.rejects(client.listIssues(), /inventory incomplete/);
});
