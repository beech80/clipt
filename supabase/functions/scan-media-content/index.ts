import { serve } from 'https://deno.land/std@0.190.0/http/server.ts'
import { assertOwnUser, authenticatedUser, errorResponse, HttpError, requestBody, requestMethod } from '../_shared/request.ts'

// Never approve content from absent provider annotations or accept arbitrary
// caller URLs. Owned-object moderation needs a verified server-side pipeline.
// File signature validation is not semantic content moderation.
serve(async req => {
  const method = requestMethod(req)
  if (method) return method
  try {
    const user = await authenticatedUser(req)
    if (user.is_anonymous) throw new HttpError(403, 'A verified account is required')
    const body = await requestBody(req)
    assertOwnUser(body.userId, user.id)
    throw new HttpError(503, 'Media moderation is not configured. No safety approval was issued.')
  } catch (error) {
    return errorResponse(error)
  }
})
