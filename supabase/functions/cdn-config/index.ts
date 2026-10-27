import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { authenticatedUser, errorResponse, HttpError, requestMethod } from '../_shared/request.ts'

// No verified regional CDN is configured. Never rewrite a private/signed media
// URL onto an invented host or initialize an unnecessary service-role client.
serve(async (req) => {
  const method = requestMethod(req)
  if (method) return method
  try {
    await authenticatedUser(req)
    throw new HttpError(503, 'Regional CDN routing is not configured')
  } catch (error) {
    return errorResponse(error)
  }
})
