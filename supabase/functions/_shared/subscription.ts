import Stripe from 'https://esm.sh/stripe@14.21.0'
import { HttpError, serverEnv, serviceClient } from './request.ts'

export const planCents = { premium: 499, maxed: 1499 } as const
export type MembershipPlan = keyof typeof planCents
export function subscriptionConfig() {
  if (serverEnv('SUPABASE_URL') !== 'https://akiksrlzdqvipqbbjxpw.supabase.co') {
    throw new HttpError(503, 'Sandbox subscriptions are restricted to the development project')
  }
  const key = serverEnv('STRIPE_SECRET_KEY')
  if (serverEnv('CLIPT_PAYMENTS_MODE') !== 'test' || !/^(sk|rk)_test_/.test(key)) throw new HttpError(503, 'Test subscriptions are not configured')
  const prices = { premium: serverEnv('STRIPE_PREMIUM_PRICE_ID'), maxed: serverEnv('STRIPE_MAXED_PRICE_ID') }
  if (prices.premium === prices.maxed || Object.values(prices).some(id => !/^price_[A-Za-z0-9]+$/.test(id))) throw new HttpError(503, 'Distinct recurring test prices are required')
  const origin = new URL(serverEnv('CLIPT_PAYMENT_RETURN_ORIGIN'))
  if (origin.protocol !== 'https:' || origin.username || origin.password || origin.pathname !== '/' || origin.search || origin.hash) throw new HttpError(503, 'Subscription return origin is not configured')
  serverEnv('STRIPE_WEBHOOK_SECRET')
  return { key, prices, origin: origin.origin }
}
export function checkoutAllowed(userId: string) {
  // Only a securely configured test identity may run pre-release lifecycle tests.
  // General checkout stays closed until the full sandbox lifecycle is approved.
  if (Deno.env.get('CLIPT_SUBSCRIPTIONS_VERIFIED') !== 'true' && Deno.env.get('CLIPT_SUBSCRIPTION_TEST_USER_ID') !== userId) {
    throw new HttpError(503, 'Sandbox subscription checkout awaits lifecycle verification')
  }
}
export async function billingCommand(action: string, payload: Record<string, unknown>) {
  const { data, error } = await serviceClient().rpc('sandbox_billing_command', { p_action: action, p_payload: payload })
  if (error) throw new HttpError(error.code === '23505' ? 409 : 503, 'Subscription state could not be confirmed; retry the original request')
  return data
}
export async function approvedPrice(stripe: Stripe, plan: MembershipPlan, prices: Record<MembershipPlan, string>) {
  const price = await stripe.prices.retrieve(prices[plan])
  if (price.livemode || !price.active || price.currency !== 'usd' || price.unit_amount !== planCents[plan]
    || price.type !== 'recurring' || price.recurring?.interval !== 'month' || price.recurring.interval_count !== 1
    || price.recurring.usage_type !== 'licensed') throw new HttpError(503, 'Approved monthly sandbox price does not match')
  return price
}
export function stripeId(value: string | { id: string } | null | undefined) { return typeof value === 'string' ? value : value?.id }
// Release only provider-confirmed expired/unpaid reservations. Never expire an
// open session, create Checkout, or infer expiration from the local clock.
export async function releaseExpiredErasureCheckouts(stripe: Stripe, userId: string,
  command: typeof billingCommand = billingCommand) {
  const account = await command('account', { user_id: userId })
  if (!account?.customer_id) return
  const customerId = account.customer_id
  const customer = await stripe.customers.retrieve(customerId)
  if (customer.deleted || customer.livemode !== false || customer.id !== customerId
    || customer.metadata.clipt_user_id !== userId) throw new HttpError(409, 'Billing customer ownership could not be verified')
  const sessions = await stripe.checkout.sessions.list({ customer: customerId, limit: 100 })
  if (sessions.has_more !== false) throw new HttpError(409, 'Checkout inventory requires review')
  for (const session of sessions.data) {
    if (session.status !== 'expired') continue
    if (!session.id.startsWith('cs_test_') || session.livemode !== false
      || stripeId(session.customer) !== customerId || session.client_reference_id !== userId
      || session.metadata?.clipt_user_id !== userId || session.mode !== 'subscription'
      || session.payment_status !== 'unpaid' || session.subscription || session.invoice || session.payment_intent) {
      throw new HttpError(409, 'Expired checkout binding requires review')
    }
  }
  // Validate the complete bounded inventory before any local reservation release.
  for (const session of sessions.data) if (session.status === 'expired') {
    await command('release', { user_id: userId, session_id: session.id })
  }
}
export async function sandboxFixtureClock(stripe: Stripe, userId: string) {
  const clockId = Deno.env.get('CLIPT_SUBSCRIPTION_TEST_CLOCK_ID')
  if (!clockId) return undefined
  // This optional server-controlled fixture never accepts a clock from the browser.
  if (Deno.env.get('SUPABASE_URL') !== 'https://akiksrlzdqvipqbbjxpw.supabase.co'
    || Deno.env.get('CLIPT_PAYMENTS_MODE') !== 'test'
    || Deno.env.get('CLIPT_SUBSCRIPTIONS_VERIFIED') !== 'false'
    || Deno.env.get('CLIPT_SUBSCRIPTION_TEST_USER_ID') !== userId
    || !/^clock_[A-Za-z0-9]+$/.test(clockId)) {
    throw new HttpError(503, 'Isolated billing clock is not configured')
  }
  const clock = await stripe.testHelpers.testClocks.retrieve(clockId)
  if (clock.id !== clockId || clock.livemode !== false || clock.status !== 'ready'
    || !Number.isSafeInteger(clock.frozen_time) || clock.frozen_time <= 0
    || clock.frozen_time > Math.floor(Date.now() / 1000)) {
    throw new HttpError(503, 'Isolated billing clock is not ready')
  }
  return clockId
}
export async function schedulePeriodCancellation(stripe: Stripe, sub: Stripe.Subscription, userId: string, customerId: string, requestId: string, cancel: boolean) {
  const checkBinding = (value: Stripe.Subscription) => {
    if (value.livemode || value.id !== sub.id || stripeId(value.customer) !== customerId
      || value.metadata.clipt_user_id !== userId || !['active', 'past_due'].includes(value.status)) {
      throw new HttpError(409, 'Subscription binding or state could not be verified')
    }
  }
  checkBinding(sub)
  const idempotencyKey = 'clipt-sandbox-manage:' + userId + ':' + requestId
  if (sub.schedule) {
    if (!cancel) throw new HttpError(409, 'A scheduled plan change must be resolved before resuming renewal')
    const scheduleId = stripeId(sub.schedule)!
    const schedule = await stripe.subscriptionSchedules.retrieve(scheduleId)
    if (schedule.livemode || schedule.status !== 'active' || stripeId(schedule.subscription) !== sub.id
      || stripeId(schedule.customer) !== customerId) throw new HttpError(409, 'Schedule binding could not be verified')
    // Release removes future tier changes without canceling paid access.
    // Never call schedules.cancel or subscriptions.cancel here.
    const released = await stripe.subscriptionSchedules.release(schedule.id, { preserve_cancel_date: true },
      { idempotencyKey: idempotencyKey + ':release:' + schedule.id })
    if (released.livemode || released.status !== 'released' || stripeId(released.released_subscription) !== sub.id
      || stripeId(released.customer) !== customerId) throw new HttpError(502, 'Schedule release unconfirmed; retry the original cancellation')
    const current = await stripe.subscriptions.retrieve(sub.id)
    checkBinding(current)
    if (current.schedule) throw new HttpError(409, 'Another schedule is pending; retry the original cancellation')
  }
  const updated = await stripe.subscriptions.update(sub.id, { cancel_at_period_end: cancel, proration_behavior: 'none' },
    { idempotencyKey })
  checkBinding(updated)
  if (updated.cancel_at_period_end !== cancel) throw new HttpError(502, 'Renewal change unconfirmed')
  return updated
}
// Provider adapter only. Account erasure must additionally reserve deletion in
// the database, block concurrent checkout, and retain its verified receipt.
// Never invoke this from a browser success callback or ordinary cancellation.
export async function cancelBillingForErasure(stripe: Stripe, subscriptionId: string, userId: string, customerId: string, requestId: string) {
  const key = 'clipt-sandbox-erasure:' + userId + ':' + requestId
  const binding = (sub: Stripe.Subscription) => {
    if (sub.livemode || sub.id !== subscriptionId || stripeId(sub.customer) !== customerId
      || sub.metadata.clipt_user_id !== userId) throw new HttpError(409, 'Erasure billing ownership could not be verified')
  }
  let sub = await stripe.subscriptions.retrieve(subscriptionId)
  binding(sub)
  if (sub.status === 'canceled') return sub
  if (sub.schedule) {
    const schedule = await stripe.subscriptionSchedules.retrieve(stripeId(sub.schedule)!)
    if (schedule.livemode || !['active', 'not_started'].includes(schedule.status)
      || stripeId(schedule.subscription) !== subscriptionId || stripeId(schedule.customer) !== customerId) {
      throw new HttpError(409, 'Erasure schedule ownership could not be verified')
    }
    const released = await stripe.subscriptionSchedules.release(schedule.id, { preserve_cancel_date: true },
      { idempotencyKey: key + ':release:' + schedule.id })
    if (released.livemode || released.status !== 'released' || stripeId(released.released_subscription) !== subscriptionId
      || stripeId(released.customer) !== customerId) throw new HttpError(502, 'Erasure schedule release unconfirmed')
    sub = await stripe.subscriptions.retrieve(subscriptionId)
    binding(sub)
    if (sub.schedule) throw new HttpError(409, 'Erasure schedule remains pending')
  }
  // Immediate shutdown on deletion, distinct from normal period-end cancellation.
  // Do not issue refunds, prorations, or a final invoice as a side effect.
  const canceled = await stripe.subscriptions.cancel(subscriptionId, { invoice_now: false, prorate: false }, { idempotencyKey: key })
  binding(canceled)
  if (canceled.status !== 'canceled' || canceled.schedule) throw new HttpError(502, 'Erasure billing cancellation unconfirmed')
  const confirmed = await stripe.subscriptions.retrieve(subscriptionId)
  binding(confirmed)
  if (confirmed.status !== 'canceled' || confirmed.schedule) throw new HttpError(502, 'Erasure billing cancellation unconfirmed')
  return confirmed
}
export async function verifyErasureBillingShutdown(stripe: Stripe, userId: string, customerId: string, subscriptionId: string | null, requestId: string) {
  const customer = await stripe.customers.retrieve(customerId)
  if (customer.deleted || customer.livemode || customer.id !== customerId || customer.metadata.clipt_user_id !== userId) {
    throw new HttpError(409, 'Billing customer ownership could not be verified')
  }
  const subscriptions = await stripe.subscriptions.list({ customer: customerId, status: 'all', limit: 100 })
  if (subscriptions.has_more || subscriptions.data.some((sub: Stripe.Subscription) => sub.livemode || stripeId(sub.customer) !== customerId
    || (!['canceled', 'incomplete_expired'].includes(sub.status) && sub.id !== subscriptionId))) {
    throw new HttpError(409, 'Additional billing requires review before deletion')
  }
  if (subscriptionId) {
    await cancelBillingForErasure(stripe, subscriptionId, userId, customerId, requestId)
    const invoices = await stripe.invoices.list({ customer: customerId, subscription: subscriptionId, limit: 100 })
    if (invoices.has_more || invoices.data.some((invoice: Stripe.Invoice) => invoice.livemode || stripeId(invoice.customer) !== customerId
      || stripeId(invoice.subscription) !== subscriptionId || (['draft', 'open'].includes(invoice.status ?? '') && invoice.auto_advance))) {
      throw new HttpError(409, 'Pending invoice collection requires review before deletion')
    }
  }
  return { customer_id: customerId, subscription_id: subscriptionId, status: subscriptionId ? 'canceled' : 'no_subscription' }
}
export async function subscriptionSnapshot(stripe: Stripe, subscriptionId: string, prices: Record<MembershipPlan, string>, risk = false) {
  const sub = await stripe.subscriptions.retrieve(subscriptionId, { expand: ['latest_invoice'] })
  if (sub.livemode || !/^sub_[A-Za-z0-9]+$/.test(sub.id) || sub.items.data.length !== 1 || sub.items.has_more
    || sub.collection_method !== 'charge_automatically') throw new HttpError(400, 'Unsupported test subscription')
  const item = sub.items.data[0]
  const plan = (Object.keys(prices) as MembershipPlan[]).find(code => prices[code] === item.price.id)
  if (!plan || item.quantity !== 1) throw new HttpError(400, 'Subscription product mismatch')
  await approvedPrice(stripe, plan, prices)
  const userId = sub.metadata.clipt_user_id
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(userId ?? '')) throw new HttpError(400, 'Subscription owner binding missing')
  const snapshot: Record<string, unknown> = {
    user_id: userId, customer_id: stripeId(sub.customer), subscription_id: sub.id,
    status: sub.status, cancel_at_period_end: sub.cancel_at_period_end, risk_hold: risk,
  }
  const invoice = typeof sub.latest_invoice === 'object' ? sub.latest_invoice : null
  const line = invoice?.lines.data[0]
  if (invoice && !invoice.livemode && invoice.status === 'paid' && invoice.currency === 'usd'
    && invoice.amount_paid >= planCents[plan] && stripeId(invoice.customer) === stripeId(sub.customer)
    && stripeId(invoice.subscription) === sub.id && invoice.lines.data.length === 1 && !invoice.lines.has_more
    && line?.price?.id === prices[plan] && line.quantity === 1 && !line.proration
    && Number.isSafeInteger(line.period.start) && Number.isSafeInteger(line.period.end)
    && line.period.start <= Date.now() / 1000 && line.period.end > line.period.start) {
    snapshot.paid_tier = plan
    snapshot.paid_start = new Date(line.period.start * 1000).toISOString()
    snapshot.paid_end = new Date(line.period.end * 1000).toISOString()
  }
  return snapshot
}
