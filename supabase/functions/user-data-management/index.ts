import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { assertOwnUser, authenticatedUser, errorResponse, HttpError, jsonResponse, requestBody, requestMethod, serviceClient } from '../_shared/request.ts'

serve(async (req) => {
  const method = requestMethod(req)
  if (method) return method
  try {
    const user = await authenticatedUser(req, { accountManagement: true })
    const body = await requestBody(req)
    assertOwnUser(body.userId, user.id)
    if (body.action !== 'export' && body.action !== 'delete') throw new HttpError(400, 'Invalid action')
    if (body.action === 'delete') throw new HttpError(409, 'Use the account deletion confirmation flow')
    const supabase = serviceClient()
    const { data, error } = await supabase.rpc('get_user_data_export', { user_id_param: user.id })
    if (error) throw error
    if (data === null || data === undefined) throw new HttpError(409, 'Account export was not returned')
    // Allow-list stream fields: the legacy RPC includes credentials and provider
    // settings. Never include those in a downloadable account-data artifact.
    const streamFields = ['id', 'user_id', 'title', 'description', 'is_live',
      'started_at', 'ended_at', 'created_at', 'chat_enabled', 'scheduled_start_time',
      'scheduled_duration', 'schedule_status', 'vod_enabled', 'vod_processing_status']
    const safeData = { ...data, streams: Array.isArray(data.streams)
      ? data.streams.map((stream: Record<string, unknown>) => Object.fromEntries(
        streamFields.filter(key => Object.hasOwn(stream, key)).map(key => [key, stream[key]]),
      )) : [] }
    return jsonResponse({ data: safeData })
  } catch (error) {
    return errorResponse(error)
  }
})
