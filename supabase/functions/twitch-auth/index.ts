import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { assertOwnUser, authenticatedUser, errorResponse, HttpError, requestBody, requestMethod } from '../_shared/request.ts'

// Legacy linking trusted Origin, had no OAuth state and returned provider tokens.
// Re-enable only with server-owned callback/state, credential storage and revocation.
serve(async (req) => {
  const method = requestMethod(req)
  if (method) return method
  try {
    const user = await authenticatedUser(req)
    const body = await requestBody(req)
    assertOwnUser(body.userId, user.id)
    if (!['link-account', 'get-stream-info', 'get-client-id'].includes(String(body.action))) {
      throw new HttpError(400, 'Invalid action')
    }
    throw new HttpError(503, 'Twitch connection is unavailable until secure provider configuration is complete')
  } catch (error) {
    return errorResponse(error)
  }
})
