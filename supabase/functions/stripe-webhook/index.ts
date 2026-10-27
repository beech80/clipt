import { serve } from 'https://deno.land/std@0.190.0/http/server.ts'
import Stripe from 'https://esm.sh/stripe@14.21.0'
import { errorResponse, HttpError, jsonResponse, requestMethod, serverEnv } from '../_shared/request.ts'
import { billingCommand, stripeId, subscriptionConfig, subscriptionSnapshot } from '../_shared/subscription.ts'
serve(async req => {
  const method = requestMethod(req)
  if (method) return method
  try {
    const signature = req.headers.get('stripe-signature')
    if (!signature || signature.length > 4096) throw new HttpError(400, 'Valid webhook signature required')
    const key = serverEnv('STRIPE_SECRET_KEY')
    if (Deno.env.get('CLIPT_PAYMENTS_MODE') !== 'test' || !/^(sk|rk)_test_/.test(key)) throw new HttpError(503, 'Test payments are not configured')
    const secret = serverEnv('STRIPE_WEBHOOK_SECRET')
    const reader = req.body?.getReader()
    if (!reader) throw new HttpError(400, 'Webhook body required')
    const chunks: Uint8Array[] = []; let length = 0
    while (true) {
      const { value, done } = await reader.read()
      if (done) break
      length += value.byteLength
      if (length > 65536) { await reader.cancel(); throw new HttpError(413, 'Webhook body too large') }
      chunks.push(value)
    }
    const bytes = new Uint8Array(length); let offset = 0
    for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength }
    const stripe = new Stripe(key, { apiVersion: '2023-10-16' })
    let event: Stripe.Event
    try { event = await stripe.webhooks.constructEventAsync(new TextDecoder('utf-8', { fatal: true }).decode(bytes), signature, secret, undefined, Stripe.createSubtleCryptoProvider()) }
    catch { throw new HttpError(400, 'Invalid webhook signature') }
    if (event.livemode !== false) throw new HttpError(400, 'Live payment events are disabled')
    const supported = ['checkout.session.completed','checkout.session.async_payment_succeeded','invoice.paid','invoice.payment_failed','customer.subscription.created','customer.subscription.updated','customer.subscription.deleted','charge.refunded','charge.dispute.created']
    if (!supported.includes(event.type)) return jsonResponse({ received: true, fulfilled: false })
    const config = subscriptionConfig()
    let subscriptionId: string | undefined
    let risk = false
    const object = event.data.object
    if (event.type === 'checkout.session.completed' || event.type === 'checkout.session.async_payment_succeeded') {
      const session = await stripe.checkout.sessions.retrieve((object as Stripe.Checkout.Session).id)
      // One-time payments (including donations) never grant membership or Tokens.
      if (session.mode !== 'subscription') return jsonResponse({ received: true, fulfilled: false })
      if (event.type === 'checkout.session.async_payment_succeeded' && session.payment_status !== 'paid') return jsonResponse({ received: true, fulfilled: false })
      if (session.livemode || session.metadata?.clipt_user_id !== session.client_reference_id) throw new HttpError(400, 'Checkout binding mismatch')
      subscriptionId = stripeId(session.subscription)
    } else if (event.type.startsWith('customer.subscription.')) subscriptionId = (object as Stripe.Subscription).id
    else if (event.type.startsWith('invoice.')) {
      const invoice = await stripe.invoices.retrieve((object as Stripe.Invoice).id)
      if (invoice.livemode) throw new HttpError(400, 'Live invoice disabled')
      subscriptionId = stripeId(invoice.subscription)
    } else {
      const chargeId = event.type === 'charge.refunded' ? (object as Stripe.Charge).id : stripeId((object as Stripe.Dispute).charge)
      if (!chargeId) throw new HttpError(400, 'Risk event charge missing')
      const charge = await stripe.charges.retrieve(chargeId)
      if (charge.livemode) throw new HttpError(400, 'Live charge disabled')
      const invoiceId = stripeId(charge.invoice)
      if (!invoiceId) return jsonResponse({ received: true, fulfilled: false })
      const invoice = await stripe.invoices.retrieve(invoiceId)
      subscriptionId = stripeId(invoice.subscription)
      risk = charge.amount_refunded > 0 || charge.disputed
    }
    if (!subscriptionId) return jsonResponse({ received: true, fulfilled: false })
    const snapshot = await subscriptionSnapshot(stripe, subscriptionId, config.prices, risk)
    const applied = await billingCommand('reconcile', { event_id: event.id, event_created: event.created, snapshot })
    return jsonResponse({ received: true, fulfilled: applied === true, duplicateOrStale: applied === false })
  } catch (error) { return errorResponse(error) }
})
