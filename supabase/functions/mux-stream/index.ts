import { serve } from 'https://deno.land/std@0.190.0/http/server.ts'
import { assertOwnUser, authenticatedUser, errorResponse, HttpError, requestBody, requestMethod } from '../_shared/request.ts'

// Legacy endpoint has no provider-backed provisioning or lifecycle verifier.
// Existing oauth flow owns setup/end; never mint pretend ingest credentials.
serve(async req => {
  const method = requestMethod(req)
  if (method) return method
  try {
    const user = await authenticatedUser(req)
    const body = await requestBody(req)
    assertOwnUser(body.userId, user.id)
    throw new HttpError(503, 'Legacy stream provisioning is unavailable. Use the configured stream setup workflow.')
  } catch (error) { return errorResponse(error) }
})
