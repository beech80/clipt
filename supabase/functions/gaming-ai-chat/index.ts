
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { authenticatedUser, errorResponse, HttpError, requestMethod } from '../_shared/request.ts'

// No paid inference until server-side per-user quotas and owner-approved spending are configured.
serve(async (req) => {
  const method = requestMethod(req)
  if (method) return method
  try {
    await authenticatedUser(req)
    throw new HttpError(503, 'AI assistance is unavailable in this preview')
  } catch (error) {
    return errorResponse(error)
  }
})
