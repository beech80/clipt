import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { stripTypeScriptTypes } from 'node:module';
const source = stripTypeScriptTypes(readFileSync(new URL('../../src/lib/billing-preview.ts', import.meta.url), 'utf8'));
const { billingPreviewMode } = await import('data:text/javascript;base64,' + Buffer.from(source).toString('base64'));
const development = { VITE_APP_ENV: 'development', VITE_SUPABASE_URL: 'https://akiksrlzdqvipqbbjxpw.supabase.co' };

test('global menu exposes the subscription route without initiating checkout', () => {
  const menu = readFileSync(new URL('../../src/pages/Menu.tsx', import.meta.url), 'utf8');
  assert.match(menu, /title: 'Membership \/ Subscription'.*path: '\/subscription'/);
  assert.ok(menu.indexOf("title: 'Membership / Subscription'") < menu.indexOf("title: 'Live Streams'"));
  assert.match(menu, /<Link to=\{item.path\}>/);
  assert.doesNotMatch(menu, /create-checkout|manage-subscription/);
});
test('membership is wired into the mounted App rather than only the unused route catalog', () => {
  const app = readFileSync(new URL('../../src/App.tsx', import.meta.url), 'utf8');
  assert.match(app, /React\.lazy\(\(\) => import\('\.\/pages\/Subscription'\)\)/);
  assert.match(app, /path="\/subscription" element=\{<Subscription \/>\}/);
  assert.match(app, /path="\/membership" element=\{<Navigate to="\/subscription" replace \/>\}/);
  assert.match(app, /path="\/payment-success" element=\{<PaymentSuccess \/>\}/);
});
test('return page cannot grant membership and checkout retry keys require server confirmation or verified expiry',()=>{
 const returned=readFileSync(new URL('../../src/pages/payment-success.tsx',import.meta.url),'utf8');
 assert.match(returned,/does not confirm payment or activate membership/);
 assert.doesNotMatch(returned,/functions\.invoke|\.from\(|sessionStorage/);
 const membership=readFileSync(new URL('../../src/pages/Subscription.tsx',import.meta.url),'utf8');
 assert.match(membership,/if \(active && user\?\.id\)/);
 assert.match(membership,/response\.status === 409/);
 assert.match(membership,/Original checkout expired; refresh and start a new request/);
});
test('sandbox diagnostics appear in explicitly enabled development Preview builds', () => {
  assert.deepEqual(billingPreviewMode({ ...development, VITE_BILLING_READINESS_ENABLED: 'true' }), { readiness: true, checkoutDisabled: true });
});
test('diagnostics never appear against production or unrelated projects', () => {
  for (const overrides of [{ VITE_APP_ENV: 'production' }, { VITE_SUPABASE_URL: 'https://other.supabase.co' }])
    assert.equal(billingPreviewMode({ ...development, ...overrides, DEV: true, VITE_BILLING_READINESS_ENABLED: 'true' }).readiness, false);
});
test('checkout fails closed without an explicit future enablement', () => {
  for (const value of [undefined, '', 'true', 'FALSE', false])
    assert.equal(billingPreviewMode({ VITE_BILLING_CHECKOUT_DISABLED: value }).checkoutDisabled, true);
});

test('isolated pilot UI access requires verified readiness and the current account identity', () => {
  const readiness = readFileSync(new URL('../../src/components/SubscriptionReadiness.tsx', import.meta.url), 'utf8');
  const membership = readFileSync(new URL('../../src/pages/Subscription.tsx', import.meta.url), 'utf8');
  assert.match(readiness, /key=\{user\.id\}/);
  assert.match(readiness, /setData\(null\);onTestAccess\(false\)/);
  assert.match(readiness, /schema\.safeParse\(response\.data\)/);
  assert.match(readiness, /isolatedCheckoutAllowed===true&&checked\.data\.pricesVerified&&checked\.data\.webhookConfigured&&checked\.data\.returnOriginValid/);
  assert.match(membership, /mode\.readiness && user\?\.id === testUser/);
});

test('isolated readiness permission is server-derived without enabling general checkout', () => {
  const handler = readFileSync(new URL('../../supabase/functions/billing-readiness/index.ts', import.meta.url), 'utf8');
  assert.match(handler, /isolatedCheckoutAllowed:\s*Deno\.env\.get\('CLIPT_SUBSCRIPTION_TEST_USER_ID'\)\s*===\s*user\.id/);
  assert.match(handler, /generalCheckoutVerified:\s*false/);
});

test('expired recorded subscription exposes management without paid access or duplicate checkout',()=>{
 const membership=readFileSync(new URL('../../src/pages/Subscription.tsx',import.meta.url),'utf8');
 const variables=membership.slice(membership.indexOf('  const recorded ='),membership.indexOf('  useEffect(() =>'));
 const read=new Function('current',variables+'return {recorded,active};');
 const current={data:{status:'active',current_period_start:'2026-08-01',current_period_end:'2026-09-01'}};
 assert.deepEqual(read(current),{recorded:true,active:false});
 assert.deepEqual(read({data:{...current.data,status:'canceled'}}),{recorded:false,active:false});
 assert.match(membership,/recorded && !active/);
 assert.match(membership,/\{recorded && <div/);
 assert.match(membership,/Boolean\(recorded\).*subscribe\(code\)/);
});
