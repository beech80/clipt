import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { assertOwnUser, authenticatedUser, errorResponse, HttpError, jsonResponse, requestBody, requestMethod, requiredString, serverEnv, serviceClient } from '../_shared/request.ts'

serve(async (req) => {
  const method = requestMethod(req)
  if (method) return method
  try {
    const user = await authenticatedUser(req)
    const body = await requestBody(req)
    assertOwnUser(body.userId, user.id)
    if (!['initialize_stream', 'validate_token', 'end_stream', 'get_stream_credentials'].includes(String(body.action))) {
      throw new HttpError(400, 'Invalid action')
    }

    const streamId = body.streamId === undefined ? null : requiredString(body.streamId, 'stream ID', 64)
    if (body.action === 'get_stream_credentials') {
      if (!streamId) throw new HttpError(400, 'Stream ID is required')
      const { data: stream, error } = await serviceClient().from('streams')
        .select('id, rtmp_url, stream_key, encrypted_stream_key').eq('id', streamId).eq('user_id', user.id).maybeSingle()
      if (error) throw error
      if (!stream) throw new HttpError(404, 'Stream not found')
      let streamKey = stream.stream_key
      if (!streamKey && stream.encrypted_stream_key) {
        // Legacy storage uses encoding, not encryption. The decoding RPC is
        // backend-only; never expose the stored value or a general decode API.
        const { data, error: keyError } = await serviceClient().rpc('decrypt_stream_key', {
          encrypted_key: stream.encrypted_stream_key,
        })
        if (keyError) throw keyError
        streamKey = data
      }
      if (!stream.rtmp_url || !streamKey) throw new HttpError(503, 'Stream ingestion is not configured')
      return jsonResponse({ id: stream.id, rtmp_url: stream.rtmp_url, stream_key: streamKey })
    }

    if (streamId && body.action !== 'validate_token') {
      const { data: ownedStream, error } = await serviceClient().from('streams')
        .select('id').eq('id', streamId).eq('user_id', user.id).maybeSingle()
      if (error) throw error
      if (!ownedStream) throw new HttpError(404, 'Stream not found')
    }

    if (body.action === 'initialize_stream') {
      const ingest = new URL(serverEnv('STREAM_INGEST_URL'))
      if (!['rtmp:', 'rtmps:'].includes(ingest.protocol)) throw new HttpError(503, 'Stream ingestion is not configured')
      const supabase = serviceClient()
      const { data: tokenData, error: tokenError } = await supabase.rpc('generate_streaming_token', { user_id_param: user.id })
      if (tokenError) throw tokenError
      if (!tokenData || typeof tokenData.access_token !== 'string' || typeof tokenData.token_id !== 'string') {
        throw new HttpError(502, 'Stream token creation was not confirmed')
      }
      ingest.searchParams.set('access_token', tokenData.access_token)
      const streamValues = {
        user_id: user.id, is_live: false, streaming_url: ingest.toString(),
        oauth_token_id: tokenData.token_id, started_at: null, ended_at: null,
      }
      const streamQuery = streamId
        ? supabase.from('streams').update(streamValues).eq('id', streamId).eq('user_id', user.id)
        : supabase.from('streams').insert(streamValues)
      const { data: stream, error } = await streamQuery.select().single()
      if (error) throw error
      if (!stream) throw new HttpError(409, 'Stream initialization was not confirmed')
      return jsonResponse({ stream })
    }

    if (body.action === 'validate_token') {
      const accessToken = requiredString(body.access_token, 'stream token', 4096)
      const supabase = serviceClient()
      const { data: ownedToken, error } = await supabase.from('stream_oauth_tokens')
        .select('id').eq('user_id', user.id).eq('access_token', accessToken)
        .eq('is_revoked', false).gt('expires_at', new Date().toISOString()).maybeSingle()
      if (error) throw error
      if (!ownedToken) throw new HttpError(404, 'Stream token not found')
      const { data: validation, error: validationError } = await supabase.rpc('validate_streaming_token', { token_param: accessToken })
      if (validationError) throw validationError
      return jsonResponse(validation)
    }

    const supabase = serviceClient()
    // Revoke first: a failed metadata update must not leave a stopped stream's token valid.
    let tokenId: string | null = null
    if (streamId) {
      const { data: target, error } = await supabase.from('streams').select('oauth_token_id')
        .eq('id', streamId).eq('user_id', user.id).single()
      if (error) throw error
      tokenId = target.oauth_token_id
    }
    const revokeQuery = supabase.from('stream_oauth_tokens')
      .update({ is_revoked: true }).eq('user_id', user.id).eq('is_revoked', false)
    if (!streamId || tokenId) {
      const { error } = await (tokenId ? revokeQuery.eq('id', tokenId) : revokeQuery)
      if (error) throw error
    }
    const updateQuery = supabase.from('streams').update({
      is_live: false, ended_at: new Date().toISOString(), streaming_url: null, oauth_token_id: null,
    }).eq('user_id', user.id)
    const { error: updateError } = await (streamId ? updateQuery.eq('id', streamId) : updateQuery)
    if (updateError) throw updateError
    return jsonResponse({ success: true })
  } catch (error) {
    return errorResponse(error)
  }
})
