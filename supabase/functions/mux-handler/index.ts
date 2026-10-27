import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import Mux from 'https://esm.sh/@mux/mux-node@7.3.0'
import { authenticatedUser, errorResponse, HttpError, jsonResponse, requestBody, requestMethod, requiredString, serverEnv, serviceClient } from '../_shared/request.ts'

serve(async (req) => {
  const method = requestMethod(req)
  if (method) return method
  try {
    const user = await authenticatedUser(req)
    const body = await requestBody(req)
    if (!['createUpload', 'getAsset', 'getUpload', 'deleteAsset'].includes(String(body.action))) {
      throw new HttpError(400, 'Invalid action')
    }
    if (body.action === 'createUpload' && Deno.env.get('CLIPT_MUX_UPLOADS_ENABLED') !== 'true') {
      throw new HttpError(503, 'Provider uploads require an approved, quota-controlled configuration')
    }
    const id = body.action === 'createUpload' ? null : requiredString(
      body.action === 'getUpload' ? body.uploadId : body.assetId, 'media ID',
    )
    if (id && !/^[A-Za-z0-9_-]+$/.test(id)) throw new HttpError(400, 'Invalid media ID')
    const { Video } = new Mux(serverEnv('MUX_TOKEN_ID'), serverEnv('MUX_TOKEN_SECRET'))

    if (body.action === 'createUpload') {
      const supabase = serviceClient()
      const upload = await Video.Uploads.create({
        new_asset_settings: { playback_policy: 'public', passthrough: user.id },
        cors_origin: '*',
      })
      const { error } = await supabase.from('mux_uploads').insert({
        upload_id: upload.id, url: upload.url, status: 'waiting', user_id: user.id,
      })
      if (error) {
        // Do not leave an untracked upload URL usable after persistence fails.
        try { await Video.Uploads.cancel(upload.id) } catch { /* Provider cleanup requires reconciliation. */ }
        throw error
      }
      return jsonResponse({ uploadId: upload.id, url: upload.url })
    }

    if (body.action === 'getUpload') {
      const upload = await Video.Uploads.get(id!)
      // Read ownership from Mux, not a browser-writable local asset association.
      if (upload.new_asset_settings?.passthrough !== user.id) {
        throw new HttpError(403, 'This upload is not linked to your account')
      }
      return jsonResponse(upload)
    }

    const asset = await Video.Assets.get(id!)
    if (asset.passthrough !== user.id) {
      throw new HttpError(403, 'This asset is not linked to your account')
    }
    if (body.action === 'deleteAsset') {
      await Video.Assets.del(id!)
      return jsonResponse({ message: 'Asset deleted' })
    }
    return jsonResponse(asset)
  } catch (error) {
    return errorResponse(error)
  }
})
