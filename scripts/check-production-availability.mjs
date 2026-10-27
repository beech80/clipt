import { pathToFileURL } from 'node:url';

export const WEB = 'https://clipttest-matthew-beechers-projects.vercel.app';
export const API = 'https://slnjliheyiiummxhrgmk.supabase.co';
// This is the existing browser-public anon key, never a service-role credential.
const PUBLIC_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNsbmpsaWhleWlpdW1teGhyZ21rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzY4MDI2MTEsImV4cCI6MjA1MjM3ODYxMX0.0O3AhsGPFIoHQPY329lM0HA1JdFZoSodIK6uFz6DLyM";
const INCIDENT = '<!-- clipt-external-monitor:v1 -->';
const VERIFICATION = '<!-- clipt-external-monitor:verification:v1 -->';
const BOT = 'github-actions[bot]';
const OWNER = 'beech80';
const CHECK_IDS = new Set(['login', 'privacy', 'terms', 'auth-health', 'beta-admission', 'data-denial']);
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

export async function checkProduction({ fetchImpl = fetch, sleep = delay } = {}) {
  const publicHeaders = { apikey: PUBLIC_ANON_KEY, Authorization: 'Bearer ' + PUBLIC_ANON_KEY };
  const probes = [
    ...['login', 'privacy', 'terms'].map(id => ({
      id, url: WEB + '/' + id, options: {},
      accept: async r => r.status === 200 && /text\/html/i.test(r.headers.get('content-type') ?? '')
        && /<div\s+id=["']root["']/.test(await r.text()),
    })),
    { id: 'auth-health', url: API + '/auth/v1/health', options: { headers: publicHeaders },
      accept: async r => r.status === 200 && typeof (await r.json())?.version === 'string' },
    { id: 'beta-admission', url: API + '/rest/v1/rpc/clipt_beta_access',
      options: { method: 'POST', headers: { ...publicHeaders, 'Content-Type': 'application/json' }, body: '{}' },
      accept: async r => r.status === 200 && (await r.json()) === false },
    { id: 'data-denial', url: API + '/rest/v1/games?select=id&limit=1', options: { headers: publicHeaders },
      accept: async r => [401, 403].includes(r.status) && (await r.json())?.code === '42501' },
  ];
  return Promise.all(probes.map(async probe => {
    let status = null;
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const r = await fetchImpl(probe.url, { ...probe.options, redirect: 'error', signal: AbortSignal.timeout(10_000) });
        status = r.status;
        if (await probe.accept(r)) return { id: probe.id, ok: true, status, attempts: attempt };
      } catch { status = null; } // Never log response bodies, URLs, tokens or exceptions.
      if (attempt === 1) await sleep(1500);
    }
    return { id: probe.id, ok: false, status, attempts: 2 };
  }));
}

export function githubClient({ token, repository, fetchImpl = fetch }) {
  if (!token || repository !== 'beech80/clipt') throw new Error('Verified monitor repository and token required');
  const base = 'https://api.github.com/repos/beech80/clipt';
  const request = async (path, options = {}) => {
    const r = await fetchImpl(base + path, {
      ...options, redirect: 'error', signal: AbortSignal.timeout(15_000),
      headers: { Authorization: 'Bearer ' + token, Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28', 'Content-Type': 'application/json' },
    });
    if (!r.ok) throw new Error('GitHub alert delivery request failed (HTTP ' + r.status + ')');
    return r.json();
  };
  return {
    async listIssues() {
      const issues = await request('/issues?state=all&creator=github-actions%5Bbot%5D&sort=updated&direction=desc&per_page=100');
      if (!Array.isArray(issues) || issues.length === 100) throw new Error('Alert inventory incomplete; inspect manually');
      return issues;
    },
    createIssue: issue => request('/issues', { method: 'POST', body: JSON.stringify(issue) }),
    closeIssue: (number, body) => request('/issues/' + number, {
      method: 'PATCH', body: JSON.stringify({ state: 'closed', state_reason: 'completed', body }),
    }),
  };
}

export async function synchronizeAlerts({ checks, github, runUrl, now = new Date().toISOString() }) {
  if (!Array.isArray(checks) || checks.length !== CHECK_IDS.size
    || new Set(checks.map(c => c.id)).size !== CHECK_IDS.size
    || checks.some(c => !CHECK_IDS.has(c.id) || typeof c.ok !== 'boolean')) {
    throw new Error('Complete fixed monitor checks required');
  }
  if (!/^https:\/\/github\.com\/beech80\/clipt\/actions\/runs\/\d+$/.test(runUrl)) {
    throw new Error('Verified workflow run URL required');
  }
  const issues = await github.listIssues();
  const owned = issues.filter(i => !i.pull_request && i.user?.login === BOT && Number.isSafeInteger(i.number));
  const openIncidents = owned.filter(i => i.state === 'open' && i.body?.includes(INCIDENT));
  const failures = checks.filter(c => !c.ok).map(c => c.id);
  if (failures.length) {
    if (openIncidents.length) return { delivery: 'existing-incident', healthy: false };
    const receipt = await github.createIssue({
      title: '[CLIPT monitor] Production needs attention', assignees: [OWNER],
      body: [INCIDENT, 'Independent checks failed twice for: ' + failures.join(', ') + '.',
        'Detected: ' + now, 'Workflow evidence: ' + runUrl,
        'No private content or credentials are included. Investigate before changing access or payment gates.'].join('\n\n'),
    });
    if (!Number.isSafeInteger(receipt.number)) throw new Error('GitHub alert receipt unconfirmed');
    return { delivery: 'incident-created', healthy: false, issue: receipt.number };
  }
  for (const issue of openIncidents) {
    const receipt = await github.closeIssue(issue.number,
      issue.body + '\n\nRecovery verified: ' + now + '\nAll six checks passed. ' + runUrl);
    if (receipt.state !== 'closed') throw new Error('Recovery receipt unconfirmed');
  }
  // One initial notification proves the external delivery path without faking an outage.
  // Keep it open for the owner to confirm receipt; never recreate it after closure.
  if (!owned.some(i => i.body?.includes(VERIFICATION))) {
    const receipt = await github.createIssue({
      title: '[CLIPT monitor] Verify external alert delivery', assignees: [OWNER],
      body: [VERIFICATION, 'CLIPT is healthy. Its independent monitor is running on GitHub, outside CLIPT and Supabase.',
        'Please confirm this notification reached you, then close this verification issue.',
        'For email delivery, enable GitHub notification emails and select your verified destination in GitHub settings.',
        'This test does not establish inbox delivery. No SMTP password or new service account is required.',
        'Checks: ' + runUrl].join('\n\n'),
    });
    if (!Number.isSafeInteger(receipt.number)) throw new Error('Verification receipt unconfirmed');
    return { delivery: 'verification-created', healthy: true, issue: receipt.number };
  }
  return { delivery: openIncidents.length ? 'recovered' : 'unchanged', healthy: true };
}

async function main() {
  const checks = await checkProduction();
  console.log(JSON.stringify({ check: 'clipt-production-availability', checks }));
  if (process.argv.includes('--probe-only')) {
    if (checks.some(c => !c.ok)) process.exitCode = 1;
    return;
  }
  const repository = process.env.GITHUB_REPOSITORY;
  const runId = process.env.GITHUB_RUN_ID;
  if (!/^\d+$/.test(runId ?? '')) throw new Error('Workflow run ID required');
  const delivery = await synchronizeAlerts({
    checks, github: githubClient({ token: process.env.GITHUB_TOKEN, repository }),
    runUrl: 'https://github.com/beech80/clipt/actions/runs/' + runId,
  });
  console.log(JSON.stringify({ check: 'clipt-external-alert-delivery', ...delivery }));
  if (!delivery.healthy) process.exitCode = 1;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch(() => {
    console.error('External monitoring or alert delivery failed; inspect this workflow. No private response details were logged.');
    process.exitCode = 1;
  });
}

