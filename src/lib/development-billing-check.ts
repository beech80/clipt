export type BillingCheck = { name: string; passed: boolean; detail: string };
type Reply = { data: unknown; error: { context?: unknown } | null };
export type BillingProbe = (endpoint: string, body: Record<string, unknown>) => Promise<Reply>;

// Only exact application rejections count. Network errors, MFA failures and
// generic provider/database failures are not proof of ownership enforcement.
export async function exactBillingRejection(reply: Reply, status: number, message: string) {
  if (!reply.error || !(reply.error.context instanceof Response)) return false;
  if (reply.error.context.status !== status) return false;
  try {
    const body = await reply.error.context.clone().json();
    return body?.error === message;
  } catch { return false; }
}

export async function probeForeignBilling(invoke: BillingProbe, otherUserId: string): Promise<BillingCheck[]> {
  const bodies = [
    ['create-checkout', { userId: otherUserId, plan: 'premium', requestId: crypto.randomUUID() }],
    ['manage-subscription', { userId: otherUserId, action: 'cancel', requestId: crypto.randomUUID() }],
  ] as const;
  return Promise.all(bodies.map(async ([endpoint, body]) => {
    try {
      const passed = await exactBillingRejection(await invoke(endpoint, body), 403, 'You can only manage your own account');
      return { name: `${endpoint}: foreign owner rejected`, passed,
        detail: passed ? 'Exact server ownership denial received.' : 'Not verified: unexpected response or transport failure. Stop and report this result.' };
    } catch {
      return { name: `${endpoint}: foreign owner rejected`, passed: false, detail: 'Not verified: request failed.' };
    }
  }));
}

// Caller must first verify an existing active subscription. This checks concurrent
// rejection for an already-subscribed user, NOT first-time reservation concurrency.
export async function probeExistingSubscription(invoke: BillingProbe): Promise<BillingCheck[]> {
  const shared = crypto.randomUUID();
  const ids = [shared, shared, crypto.randomUUID(), crypto.randomUUID()];
  const results = await Promise.all(ids.map(async requestId => {
    try {
      return await exactBillingRejection(await invoke('create-checkout', { plan: 'premium', requestId }),
        409, 'Subscription state could not be confirmed; retry the original request');
    } catch { return false; }
  }));
  return [{ name: 'Four concurrent duplicate-subscription attempts', passed: results.every(Boolean),
    detail: results.every(Boolean) ? 'All four requests received the expected conflict. No Checkout URL was followed.'
      : 'Not verified: at least one request was not the expected conflict. Do not pay or retry automatically.' }];
}

export async function probeFirstCheckout(invoke: BillingProbe, requestId: string): Promise<BillingCheck[]> {
  const replies = await Promise.all([0, 1, 2].map(async () => {
    try { return await invoke('create-checkout', { plan: 'premium', requestId }); }
    catch { return { data: null, error: {} }; }
  }));
  const urls = replies.map(reply => {
    const data = reply.data as { testMode?: unknown; fulfillmentStatus?: unknown; url?: unknown } | null;
    if (reply.error || data?.testMode !== true || data.fulfillmentStatus !== 'unverified' || typeof data.url !== 'string') return null;
    try {
      const url = new URL(data.url);
      return url.origin === 'https://checkout.stripe.com' && !url.username && !url.password
        && url.pathname.includes('cs_test_') ? url.href : null;
    } catch { return null; }
  });
  const same = urls.every(url => url !== null && url === urls[0]);
  const checks = [{ name: 'Three simultaneous first-time requests reuse one Sandbox checkout', passed: same,
    detail: same ? 'All three returned the same validated test checkout URL. It was not opened or paid.'
      : 'Not verified: inconsistent response or transport failure. Keep this request identity; do not pay or start another attempt.' }];
  if (!same) return checks;
  let conflict = false;
  try {
    conflict = await exactBillingRejection(await invoke('create-checkout', { plan: 'premium', requestId: crypto.randomUUID() }),
      409, 'Subscription state could not be confirmed; retry the original request');
  } catch { /* Unknown outcomes never pass. */ }
  checks.push({ name: 'Different request cannot create a second pending checkout', passed: conflict,
    detail: conflict ? 'Exact pending-checkout conflict received.' : 'Not verified: unexpected response. Stop and report it.' });
  return checks;
}
