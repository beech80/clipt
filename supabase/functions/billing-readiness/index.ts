import { serve } from 'https://deno.land/std@0.190.0/http/server.ts'
import Stripe from 'https://esm.sh/stripe@14.21.0'
import { assertOwnUser, authenticatedUser, errorResponse, HttpError, jsonResponse, requestBody, requestMethod, serverEnv } from '../_shared/request.ts'
import { approvedPrice } from '../_shared/subscription.ts'
import { billingReturnReview } from '../_shared/billing-return-review.ts'

// Read-only development diagnostic for the identity explicitly designated by
// the owner. This is NOT the Checkout allowlist and never grants membership.
const developmentUrl = 'https://akiksrlzdqvipqbbjxpw.supabase.co'
const diagnosticUser = '1b0ea76e-a629-4f54-8ec5-1e4ae0e7a251'
const events = ['checkout.session.completed','invoice.paid','invoice.payment_failed',
 'customer.subscription.created','customer.subscription.updated','customer.subscription.deleted',
 'charge.refunded','charge.dispute.created']

serve(async req => {
 const method = requestMethod(req); if (method) return method
 try {
  const user = await authenticatedUser(req)
  const configuredTestUser = Deno.env.get('CLIPT_SUBSCRIPTION_TEST_USER_ID')
  const configuredTestAccess = typeof configuredTestUser === 'string'
   && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(configuredTestUser)
   && user.id === configuredTestUser
  if ((user.id !== diagnosticUser && !configuredTestAccess) || user.is_anonymous) throw new HttpError(403, 'Use the designated development test account')
  const body = await requestBody(req); assertOwnUser(body.userId, user.id)
  if (serverEnv('SUPABASE_URL') !== developmentUrl) throw new HttpError(403, 'Development project only')
  if (Deno.env.get('CLIPT_SUBSCRIPTIONS_VERIFIED') !== 'false') throw new HttpError(503, 'Keep CLIPT_SUBSCRIPTIONS_VERIFIED=false during readiness checks')
  if (Deno.env.get('CLIPT_PAYMENTS_MODE') !== 'test') throw new HttpError(503, 'Test payments mode required')
  const names = ['STRIPE_SECRET_KEY','STRIPE_PREMIUM_PRICE_ID','STRIPE_MAXED_PRICE_ID','STRIPE_WEBHOOK_SECRET','CLIPT_PAYMENT_RETURN_ORIGIN']
  const missingFields = names.filter(name => !Deno.env.get(name))
  const key = Deno.env.get('STRIPE_SECRET_KEY')
  if (!key || !/^(sk|rk)_test_/.test(key)) throw new HttpError(503, 'A sandbox API key is required')
  const prices = {premium:Deno.env.get('STRIPE_PREMIUM_PRICE_ID') ?? '',maxed:Deno.env.get('STRIPE_MAXED_PRICE_ID') ?? ''}
  if (prices.premium === prices.maxed || Object.values(prices).some(id => !/^price_[A-Za-z0-9]+$/.test(id))) {
   return jsonResponse({testMode:true,generalCheckoutVerified:false,missingFields,pricesVerified:false,webhookConfigured:false,returnOriginValid:false})
  }
  const stripe = new Stripe(key,{apiVersion:'2023-10-16'})
  const checked = await Promise.allSettled([approvedPrice(stripe,'premium',prices),approvedPrice(stripe,'maxed',prices)])
  const premiumVerified = checked[0].status === 'fulfilled', maxedVerified = checked[1].status === 'fulfilled'
  const {returnOriginValid,returnOriginMatchesCurrentPreview} = billingReturnReview(Deno.env.get('CLIPT_PAYMENT_RETURN_ORIGIN'))
  let webhookConfigured = false
  try {
   const endpoints = await stripe.webhookEndpoints.list({limit:100})
   webhookConfigured = endpoints.data.some((endpoint: Stripe.WebhookEndpoint) => endpoint.livemode === false && endpoint.status === 'enabled'
    && endpoint.url === developmentUrl + '/functions/v1/stripe-webhook'
    && (endpoint.enabled_events.includes('*') || events.every(event => endpoint.enabled_events.some((value:string)=>value===event))))
  } catch { /* Missing API permission is an unverified check, not a pass. */ }
  return jsonResponse({testMode:true,generalCheckoutVerified:false,missingFields,
   pricesVerified:premiumVerified&&maxedVerified,premiumVerified,maxedVerified,
   premiumMonthlyCents:499,maxedMonthlyCents:1499,webhookConfigured,returnOriginValid,returnOriginMatchesCurrentPreview,
   lifecycleVerified:false,webhookSignatureVerified:false,
   isolatedCheckoutAllowed:Deno.env.get('CLIPT_SUBSCRIPTION_TEST_USER_ID')===user.id})
 } catch(error) {return errorResponse(error)}
})
