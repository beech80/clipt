import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { authenticatedUser, errorResponse, HttpError, requestMethod } from '../_shared/request.ts'

serve(async (req) => {
  const method = requestMethod(req)
  if (method) return method
  try {
    await authenticatedUser(req)
    // No verified notification purpose, recipient binding or rate-limited delivery
    // workflow exists yet. Never expose a caller-controlled paid SMS relay.
    throw new HttpError(501, 'SMS delivery is unavailable until a verified notification workflow is configured')
  } catch (error) {
    return errorResponse(error)
  }
})
