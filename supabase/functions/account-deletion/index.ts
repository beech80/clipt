import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { assertOwnUser, authenticatedUser, errorResponse, HttpError, jsonResponse, requestBody, requestMethod, serviceClient } from '../_shared/request.ts'
import {endOwnerObsBeforeErasure} from '../_shared/obs-beta-erasure.ts'
import Stripe from 'https://esm.sh/stripe@14.21.0'
import { billingCommand, releaseExpiredErasureCheckouts, subscriptionConfig, verifyErasureBillingShutdown } from '../_shared/subscription.ts'

serve(async (req) => {
  const method = requestMethod(req)
  if (method) return method
  try {
    const body = await requestBody(req)
    let userId: string | null = null
    if (body.action === 'begin') {
      const user = await authenticatedUser(req, { accountManagement: true })
      assertOwnUser(body.userId, user.id)
      userId = user.id
      if (body.confirmation !== 'DELETE') throw new HttpError(400, 'Confirm account deletion')
    } else if (body.action !== 'resume') throw new HttpError(400, 'Invalid deletion action')
    if (typeof body.requestId !== 'string' || !/^[a-f0-9-]{36}$/i.test(body.requestId)
      || typeof body.receipt !== 'string' || !/^[a-f0-9]{64}$/.test(body.receipt)) {
      throw new HttpError(400, 'Invalid deletion receipt')
    }
    if (body.action === 'begin') await endOwnerObsBeforeErasure(req)
    const admin = serviceClient()
    let billingReserved = false
    // Only the isolated development backend has this staged integration.
    // Production's existing erasure path and fail-closed billing guard stay unchanged.
    if (Deno.env.get('SUPABASE_URL') === 'https://akiksrlzdqvipqbbjxpw.supabase.co') {
      if (body.action === 'begin' && userId) {
        const account = await billingCommand('account', { user_id: userId })
        if (account?.customer_id) {
          const config = subscriptionConfig()
          const stripe = new Stripe(config.key, { apiVersion: '2023-10-16' })
          await releaseExpiredErasureCheckouts(stripe, userId)
        }
      }
      const billingArgs = { p_stage: 'prepare', p_user: userId, p_request: body.requestId, p_receipt: body.receipt }
      const reserved = await admin.rpc('sandbox_billing_erasure', billingArgs)
      if (reserved.error) throw new HttpError(reserved.error.code === '42501' ? 403 : 409, 'Billing deletion requires review; no account deletion was committed')
      if (reserved.data) {
        billingReserved = true
        try {
          const config = subscriptionConfig()
          const stripe = new Stripe(config.key, { apiVersion: '2023-10-16' })
          const proof = await verifyErasureBillingShutdown(stripe, reserved.data.user_id, reserved.data.customer_id, reserved.data.subscription_id, String(body.requestId))
          const verified = await admin.rpc('sandbox_billing_erasure', { ...billingArgs, p_stage: 'verify', p_proof: proof })
          if (verified.error || verified.data?.state !== 'verified') throw new Error('Unconfirmed')
        } catch {
          // A reservation is already durable. Never return a definitive rejection
          // that makes the browser discard the only retry capability.
          throw new HttpError(503, 'Billing shutdown unconfirmed; keep this tab and retry the original deletion request')
        }
      }
    }
    const args = { p_action: body.action === 'begin' ? 'begin' : 'status', p_user_id: userId,
      p_request_id: body.requestId, p_receipt: body.receipt }
    const { data: job, error } = await admin.rpc('account_erasure', args)
    if (error) {
      if (error.code === '42501') throw new HttpError(403, 'Deletion receipt rejected')
      if (body.action === 'begin' && error.code === '55000'
        && String(error.message).includes('Photo review in progress')) {
        throw new HttpError(billingReserved ? 503 : 409, billingReserved
          ? 'Billing shutdown is recorded; photo review still blocks deletion. Keep the original deletion receipt.'
          : 'Photo review is in progress. No account deletion was committed; retry after review finishes.')
      }
      if (error.code === 'P0001' || error.code === '23505') throw new HttpError(billingReserved ? 503 : 409, billingReserved
        ? 'Billing shutdown is recorded; deletion still requires resource review. Keep the original deletion receipt.'
        : 'Deletion requires review of an active subscription, shared resource, provider media or hold. No deletion was committed by this request.')
      throw error
    }
    if (job?.state === 'complete') return jsonResponse({ state: 'complete' })
    if (job?.state !== 'cleanup' || !job.user_id || !Array.isArray(job.objects)) throw new HttpError(503, 'Deletion state unavailable')
    // SQL erasure is already committed; never claim completion on partial cleanup.
    // All subsequent operations are retryable using the secret receipt.
    const existing = await admin.auth.admin.getUserById(job.user_id)
    if (existing.data?.user) {
      const banned = await admin.auth.admin.updateUserById(job.user_id, { ban_duration: '876000h' })
      if (banned.error) return jsonResponse({ state: 'cleanup' }, 202)
    } else if (existing.error && existing.error.status !== 404) return jsonResponse({ state: 'cleanup' }, 202)
    for (const object of job.objects) {
      const removed = await admin.storage.from(object.bucket).remove([object.path])
      if (removed.error) return jsonResponse({ state: 'cleanup' }, 202)
    }
    if (existing.data?.user) {
      const removed = await admin.auth.admin.deleteUser(job.user_id)
      if (removed.error) {
        const recheck = await admin.auth.admin.getUserById(job.user_id)
        if (recheck.data?.user || recheck.error?.status !== 404) return jsonResponse({ state: 'cleanup' }, 202)
      }
    }
    const completed = await admin.rpc('account_erasure', { ...args, p_action: 'complete', p_user_id: null })
    if (completed.error || completed.data?.state !== 'complete') return jsonResponse({ state: 'cleanup' }, 202)
    return jsonResponse({ state: 'complete' })
  } catch (error) {
    return errorResponse(error)
  }
})
