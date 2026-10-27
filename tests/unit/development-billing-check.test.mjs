import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { stripTypeScriptTypes } from 'node:module';
const source = stripTypeScriptTypes(readFileSync(new URL('../../src/lib/development-billing-check.ts', import.meta.url), 'utf8'));
const { exactBillingRejection, probeForeignBilling, probeExistingSubscription, probeFirstCheckout } = await import('data:text/javascript;base64,' + Buffer.from(source).toString('base64'));
const rejected = (status, message) => ({ data: null, error: { context: new Response(JSON.stringify({ error: message }), { status }) } });
test('only an exact server rejection counts, never transport, MFA or generic failures', async () => {
  const message = 'You can only manage your own account';
  assert.equal(await exactBillingRejection(rejected(403, message), 403, message), true);
  for (const reply of [{ data: null, error: null }, { data: null, error: {} }, rejected(500, message), rejected(403, 'Verify your authenticator to continue')])
    assert.equal(await exactBillingRejection(reply, 403, message), false);
});
test('foreign-owner probes supply the target and never retry or redirect', async () => {
  const calls = [];
  const results = await probeForeignBilling(async (endpoint, body) => {
    calls.push({ endpoint, body }); return rejected(403, 'You can only manage your own account');
  }, '254c2a1a-17a5-4079-8800-8861e69bccb2');
  assert.equal(calls.length, 2); assert.ok(results.every(result => result.passed));
  assert.ok(calls.every(call => call.body.userId === '254c2a1a-17a5-4079-8800-8861e69bccb2'));
});
test('duplicate rejection probes really overlap and cover same and distinct request IDs', async () => {
  const calls = []; let release;
  const gate = new Promise(resolve => { release = resolve; });
  const pending = probeExistingSubscription(async (endpoint, body) => {
    calls.push(body.requestId); await gate;
    return rejected(409, 'Subscription state could not be confirmed; retry the original request');
  });
  assert.equal(calls.length, 4); assert.equal(calls[0], calls[1]); assert.equal(new Set(calls).size, 3);
  release(); assert.equal((await pending)[0].passed, true);
});
test('unexpected Checkout success and request crashes never pass', async () => {
  assert.equal((await probeExistingSubscription(async () => ({ data: { url: 'https://checkout.stripe.com/' }, error: null })))[0].passed, false);
  assert.ok((await probeForeignBilling(async () => { throw new Error('offline'); }, 'other')).every(result => !result.passed));
});
test('route is dev-only, guarded, provider keys and raw results are not exposed', () => {
  const app = readFileSync(new URL('../../src/App.tsx', import.meta.url), 'utf8');
  const page = readFileSync(new URL('../../src/pages/DevelopmentBillingCheck.tsx', import.meta.url), 'utf8');
  assert.match(app, /DevelopmentBillingCheck = import\.meta\.env\.DEV \?/);
  assert.match(app, /path="\/development-billing-check" element=\{<AuthGuard>/);
  assert.match(page, /before\.data\?\.status !== 'active'/);
  assert.match(page, /generalCheckoutVerified !== false/);
  assert.doesNotMatch(page, /service_role|STRIPE_SECRET|access_token|window\.location|localStorage/);
  assert.match(page, /sessionStorage\.setItem\(key, requestId\)/);
});
test('first-time concurrent requests share identity and a different attempt must conflict', async () => {
  const calls = []; let release;
  const gate = new Promise(resolve => { release = resolve; });
  const original = crypto.randomUUID();
  const pending = probeFirstCheckout(async (endpoint, body) => {
    calls.push(body.requestId);
    if (body.requestId !== original) return rejected(409, 'Subscription state could not be confirmed; retry the original request');
    await gate;
    return { data: { testMode: true, fulfillmentStatus: 'unverified', url: 'https://checkout.stripe.com/c/pay/cs_test_fixture#fragment' }, error: null };
  }, original);
  assert.deepEqual(calls, [original, original, original]);
  release(); const result = await pending;
  assert.equal(calls.length, 4); assert.notEqual(calls[3], original);
  assert.ok(result.every(check => check.passed));
});
test('different checkout URLs, live IDs and errors cannot pass first-time verification', async () => {
  for (const bad of ['https://evil.example/c/pay/cs_test_bad', 'https://checkout.stripe.com/c/pay/cs_live_bad']) {
    const result = await probeFirstCheckout(async () => ({ data: { testMode: true, fulfillmentStatus: 'unverified', url: bad }, error: null }), crypto.randomUUID());
    assert.equal(result.length, 1); assert.equal(result[0].passed, false);
  }
  let count = 0;
  const inconsistent = await probeFirstCheckout(async () => ({ data: { testMode: true, fulfillmentStatus: 'unverified', url: 'https://checkout.stripe.com/c/pay/cs_test_' + ++count }, error: null }), crypto.randomUUID());
  assert.equal(inconsistent[0].passed, false); assert.equal(count, 3);
});
