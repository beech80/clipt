import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { authenticatedUser, errorResponse, HttpError, requestMethod } from '../_shared/request.ts'

// Do not publish privileged profile/post listings from a publicly callable endpoint.
serve(async (req) => {
  const method = requestMethod(req)
  if (method) return method
  try {
    await authenticatedUser(req)
    throw new HttpError(503, 'Sitemap publication is unavailable in the private preview')
  } catch (error) {
    return errorResponse(error)
  }
})
