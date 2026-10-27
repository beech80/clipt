import { serve } from 'https://deno.land/std@0.190.0/http/server.ts'
import Stripe from 'https://esm.sh/stripe@14.21.0'
import { authenticatedUser, errorResponse, HttpError, jsonResponse, requestBody, requestMethod, requiredString, serverEnv } from '../_shared/request.ts'

serve(async (req) => {
  const method = requestMethod(req)
  if (method) return method
  try {
    const user = await authenticatedUser(req)
    const body = await requestBody(req)
    const sessionId = requiredString(body.sessionId, 'session ID')
    if (!/^cs_(?:test_|live_)?[A-Za-z0-9]+$/.test(sessionId)) throw new HttpError(400, 'Invalid session ID')
    const stripe = new Stripe(serverEnv('STRIPE_SECRET_KEY'), { apiVersion: '2023-10-16' })
    const session = await stripe.checkout.sessions.retrieve(sessionId)
    // Written by create-checkout, never accepted from the browser. Older unbound
    // sessions need reconciliation through a trusted support workflow.
    if (session.client_reference_id !== user.id || session.metadata?.clipt_user_id !== user.id) {
      throw new HttpError(403, 'This payment session is not linked to your account')
    }
    return jsonResponse({
      success: session.payment_status === 'paid',
      paymentStatus: session.payment_status,
      fulfillmentStatus: 'unverified',
    })
  } catch (error) {
    return errorResponse(error)
  }
})
