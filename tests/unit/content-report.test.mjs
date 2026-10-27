import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';

const actor = '11111111-1111-4111-8111-111111111111';
const target = '22222222-2222-4222-8222-222222222222';
const receipt = '33333333-3333-4333-8333-333333333333';
const input = { contentId: target, contentType: 'post', reason: 'spam', details: '  Test context  ', expectedUserId: actor };
const code = ts.transpileModule(readFileSync(new URL('../../src/lib/content-report.ts', import.meta.url), 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
function fixture(options = {}) {
  let authCalls = 0;
  const writes = [];
  let retried;
  const query = {
    select(columns) { assert.equal(columns, 'id'); return query; },
    single() { return query; },
    async retry(value) {
      retried = value;
      if (options.writeThrow) throw options.writeThrow;
      return { data: 'data' in options ? options.data : { id: receipt }, error: options.writeError ?? null };
    },
  };
  const supabase = {
    auth: { async getUser() {
      authCalls++;
      if (options.authThrow) throw options.authThrow;
      return { data: { user: 'user' in options ? options.user : { id: actor, is_anonymous: false } }, error: options.authError ?? null };
    } },
    from(table) { assert.equal(table, 'content_reports'); return { insert(payload) { writes.push(payload); return query; } }; },
  };
  const mod = { exports: {} };
  new Function('require', 'module', 'exports', code)(name => {
    assert.equal(name, '@/lib/supabase'); return { supabase };
  }, mod, mod.exports);
  return { ...mod.exports, writes, authCalls: () => authCalls, retried: () => retried };
}
for (const contentType of ['post', 'comment', 'stream']) {
  test(`confirmed ${contentType} report uses verified caller and one non-retried insert`, async () => {
    const f = fixture();
    assert.equal(await f.submitContentReport({ ...input, contentType }), receipt);
    assert.deepEqual(f.writes, [{ reporter_id: actor, content_id: target, content_type: contentType, reason: 'spam', notes: 'Test context' }]);
    assert.equal(f.authCalls(), 1);
    assert.equal(f.retried(), false);
  });
}
test('all six existing report reasons work and blank context is null', async () => {
  for (const reason of ['inappropriate', 'harassment', 'spam', 'violence', 'copyright', 'other']) {
    const f = fixture();
    await f.submitContentReport({ ...input, reason, details: '  ' });
    assert.equal(f.writes[0].notes, null);
  }
});
test('invalid targets, unsupported types, reasons and oversized context stop before network calls', async () => {
  for (const change of [{ contentId: '' }, { contentId: 'not-a-uuid' }, { contentType: 'chat_message' }, { contentType: 'user' }, { reason: 'unknown' }, { details: 'x'.repeat(2001) }, { details: null }, { expectedUserId: '' }]) {
    const f = fixture();
    await assert.rejects(f.submitContentReport({ ...input, ...change }), error => error.kind === 'invalid');
    assert.equal(f.authCalls(), 0);
    assert.equal(f.writes.length, 0);
  }
});
test('missing, changed, anonymous and failed identities cannot submit', async () => {
  for (const options of [{ user: null }, { user: { id: target } }, { user: { id: actor, is_anonymous: true } }, { authError: { message: 'private-provider-detail' } }, { authThrow: Error('private-provider-detail') }]) {
    const f = fixture(options);
    await assert.rejects(f.submitContentReport(input), error => error.kind === 'auth' && !error.message.includes('private-provider-detail'));
    assert.equal(f.writes.length, 0);
  }
});
test('RLS denial, network failure, missing or malformed receipts never report success or leak backend errors', async () => {
  for (const options of [{ writeError: { code: '42501', message: 'private-provider-detail' } }, { writeThrow: Error('private-provider-detail') }, { data: null }, { data: {} }, { data: { id: '' } }, { data: { id: 123 } }, { data: { id: 'not-a-uuid' } }]) {
    const f = fixture(options);
    await assert.rejects(f.submitContentReport(input), error => error.kind === 'unconfirmed' && !error.message.includes('private-provider-detail'));
    assert.equal(f.writes.length, 1);
  }
});
test('report UI has no raw-error logging and prevents stale dialog completion across targets/accounts', () => {
  const dialog = readFileSync(new URL('../../src/components/report/ReportDialog.tsx', import.meta.url), 'utf8');
  const provider = readFileSync(new URL('../../src/components/report/ReportDialogProvider.tsx', import.meta.url), 'utf8');
  assert.doesNotMatch(dialog, /console\.(error|log|warn)/);
  assert.match(dialog, /if \(!mounted\.current\) return/);
  assert.match(dialog, /toast\.dismiss\(activeToast\.current\)/);
  assert.match(dialog, /disabled=\{isSubmitting \|\| !reason \|\| !supported\}/);
  assert.match(provider, /key=\{`\$\{user\?\.id \?\? 'signed-out'\}:\$\{contentType\}:\$\{contentId\}`\}/);
});
