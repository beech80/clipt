import { serve } from 'https://deno.land/std@0.190.0/http/server.ts'
import Stripe from 'https://esm.sh/stripe@14.21.0'
import { assertOwnUser, authenticatedUser, errorResponse, HttpError, jsonResponse, requestBody, requestMethod } from '../_shared/request.ts'
import { approvedPrice, billingCommand, checkoutAllowed, sandboxFixtureClock, stripeId, subscriptionConfig } from '../_shared/subscription.ts'
serve(async req => {
  const method = requestMethod(req)
  if (method) return method
  try {
    const user = await authenticatedUser(req)
    if (user.is_anonymous) throw new HttpError(403, 'Verified account required')
    const body = await requestBody(req)
    assertOwnUser(body.userId, user.id)
    if (body.plan !== 'premium' && body.plan !== 'maxed') throw new HttpError(400, 'Select Premium or Maxed')
    const config = subscriptionConfig()
    checkoutAllowed(user.id)
    if (typeof body.requestId !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(body.requestId)) throw new HttpError(400, 'Valid request identity required')
    const stripe = new Stripe(config.key, { apiVersion: '2023-10-16' })
    await approvedPrice(stripe, body.plan, config.prices)
    const fixtureClock = await sandboxFixtureClock(stripe, user.id)
    const lease = await billingCommand('reserve', { user_id: user.id, request_id: body.requestId, plan: body.plan })
    if (!lease || lease.request_id !== body.requestId || lease.plan !== body.plan) throw new HttpError(503, 'Checkout reservation unavailable')
    if (lease.session_id) {
      const existing = await stripe.checkout.sessions.retrieve(lease.session_id)
      if (existing.livemode || existing.client_reference_id !== user.id || existing.mode !== 'subscription') throw new HttpError(409, 'Checkout binding conflict')
      if (existing.status === 'expired') {
        await billingCommand('release', { user_id: user.id, session_id: existing.id })
        throw new HttpError(409, 'Original checkout expired; refresh and start a new request')
      }
      if (existing.status !== 'open' || !existing.url || new URL(existing.url).origin !== 'https://checkout.stripe.com') throw new HttpError(409, 'Original checkout is complete or awaiting confirmation')
      return jsonResponse({ url: existing.url, testMode: true, fulfillmentStatus: 'unverified' })
    }
    const customer = lease.customer_id ? await stripe.customers.retrieve(lease.customer_id)
      : await stripe.customers.create({ metadata: { clipt_user_id: user.id }, email: user.email,
          ...(fixtureClock ? { test_clock: fixtureClock } : {}) },
        { idempotencyKey: 'clipt-sandbox-customer:' + user.id })
    if (customer.deleted || customer.livemode || customer.metadata.clipt_user_id !== user.id) throw new HttpError(409, 'Customer binding conflict')
    if (stripeId(customer.test_clock) !== fixtureClock) throw new HttpError(409, 'Customer test clock binding conflict')
    const session = await stripe.checkout.sessions.create({
      customer: customer.id, client_reference_id: user.id, mode: 'subscription', payment_method_types: ['card'],
      metadata: { clipt_user_id: user.id }, subscription_data: { metadata: { clipt_user_id: user.id } },
      line_items: [{ price: config.prices[body.plan], quantity: 1 }],
      success_url: config.origin + '/payment-success?session_id={CHECKOUT_SESSION_ID}',
      cancel_url: config.origin + '/subscription?checkout=cancelled',
    }, { idempotencyKey: 'clipt-sandbox-subscription:' + user.id + ':' + body.requestId })
    if (session.livemode || !session.id.startsWith('cs_test_') || !session.url || new URL(session.url).origin !== 'https://checkout.stripe.com') throw new HttpError(502, 'Test checkout creation unconfirmed')
    await billingCommand('bind', { user_id: user.id, request_id: body.requestId, customer_id: customer.id, session_id: session.id, session_url: session.url })
    return jsonResponse({ url: session.url, testMode: true, fulfillmentStatus: 'unverified' })
  } catch (error) { return errorResponse(error) }
})
