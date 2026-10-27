import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { authenticatedUser, errorResponse, HttpError, requestMethod } from '../_shared/request.ts'

// The legacy relay created untracked provider assets in caller-selected folders.
// Keep it closed until quotas, ownership and provider erasure are implemented.
// Existing clients retain their owner-scoped Supabase Storage fallback.
serve(async (req) => {
  const method = requestMethod(req)
  if (method) return method
  try {
    await authenticatedUser(req)
    throw new HttpError(503, 'Cloudinary uploads are unavailable; use the supported Clipt upload flow')
  } catch (error) {
    return errorResponse(error)
  }
})
