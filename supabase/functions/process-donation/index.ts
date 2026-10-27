import { serve } from 'https://deno.land/std@0.190.0/http/server.ts'
import Stripe from 'https://esm.sh/stripe@14.21.0'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'
import { assertOwnUser, authenticatedUser, errorResponse, HttpError, jsonResponse, requestBody, requestMethod, serverEnv } from '../_shared/request.ts'

serve(async (req) => {
  const method = requestMethod(req)
  if (method) return method
  try {
    const user = await authenticatedUser(req)
    if (serverEnv('SUPABASE_URL') === 'https://slnjliheyiiummxhrgmk.supabase.co') {
      throw new HttpError(503, 'Payments are disabled for the free beta')
    }
    const body = await requestBody(req)
    assertOwnUser(body.userId, user.id)
    const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    if (typeof body.streamId !== 'string' || !uuid.test(body.streamId) || typeof body.requestId !== 'string' || !uuid.test(body.requestId)) throw new HttpError(400, 'Valid stream and request IDs are required')
    if (typeof body.amountCents !== 'number' || !Number.isSafeInteger(body.amountCents) || body.amountCents < 100 || body.amountCents > 50000) throw new HttpError(400, 'Amount must be between 100 and 50000 USD cents')
    if (body.message !== undefined && (typeof body.message !== 'string' || body.message.length > 200)) throw new HttpError(400, 'Message must be 200 characters or fewer')
    // Fail closed unless the owner has explicitly provisioned a TEST workflow.
    // Never fall back to a live key or infer fulfillment from intent creation.
    const key = serverEnv('STRIPE_SECRET_KEY')
    if (Deno.env.get('CLIPT_PAYMENTS_MODE') !== 'test' || !/^(sk|rk)_test_/.test(key) || !Deno.env.get('STRIPE_WEBHOOK_SECRET')) throw new HttpError(503, 'Test donations are not configured')
    if (Deno.env.get('CLIPT_DONATIONS_VERIFIED') !== 'true' && Deno.env.get('CLIPT_DONATION_TEST_USER_ID') !== user.id) {
      throw new HttpError(503, 'Sandbox donations await recipient and payment lifecycle verification')
    }
    const client = createClient(serverEnv('SUPABASE_URL'), serverEnv('SUPABASE_ANON_KEY'), {
      global: { headers: { Authorization: req.headers.get('Authorization')! } },
      auth: { persistSession: false, autoRefreshToken: false },
    })
    const { data: stream, error } = await client.from('streams').select('id,user_id,is_live').eq('id', body.streamId).maybeSingle()
    if (error) throw error
    if (!stream?.is_live || stream.user_id === user.id) throw new HttpError(403, 'This stream is not eligible for a donation')
    const stripe = new Stripe(key, { apiVersion: '2023-10-16' })
    const intent = await stripe.paymentIntents.create({
      amount: body.amountCents, currency: 'usd',
      metadata: { clipt_user_id: user.id, stream_id: stream.id, recipient_id: stream.user_id, message: String(body.message ?? ''), type: 'stream_donation' },
    }, { idempotencyKey: `clipt-donation:${user.id}:${body.requestId}` })
    if (intent.livemode || !intent.client_secret) throw new HttpError(502, 'Test payment creation was not confirmed')
    return jsonResponse({ clientSecret: intent.client_secret, paymentStatus: 'requires_confirmation', fulfillmentStatus: 'unverified', testMode: true })
  } catch (error) { return errorResponse(error) }
})
