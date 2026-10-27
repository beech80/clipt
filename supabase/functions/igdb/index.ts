
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { authenticatedUser, errorResponse, requestBody, requestMethod, requiredString, serverEnv, jsonResponse } from '../_shared/request.ts'

serve(async (req) => {
  const method = requestMethod(req)
  if (method) return method

  try {
    await authenticatedUser(req)
    const body = await requestBody(req)
    const endpoint = requiredString(body.endpoint, 'endpoint', 64)
    const query = requiredString(body.query, 'query', 12000)
    if (!/^[a-z_]+$/.test(endpoint)) return jsonResponse({ error: 'Invalid endpoint' }, 400)
    const clientId = serverEnv('TWITCH_CLIENT_ID')
    const clientSecret = serverEnv('TWITCH_CLIENT_SECRET')

    // Get access token from Twitch
    const tokenResponse = await fetch(
      'https://id.twitch.tv/oauth2/token',
      { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ client_id: clientId, client_secret: clientSecret, grant_type: 'client_credentials' }) }
    )

    if (!tokenResponse.ok) {
      throw new Error('Failed to get IGDB access token')
    }

    const { access_token } = await tokenResponse.json()

    // Make request to IGDB API
    const igdbResponse = await fetch(`https://api.igdb.com/v4/${endpoint}`, {
      method: 'POST',
      headers: {
        'Client-ID': clientId!,
        'Authorization': `Bearer ${access_token}`,
        'Content-Type': 'text/plain',
      },
      body: query,
    })

    if (!igdbResponse.ok) {
      throw new Error(`IGDB API error: ${igdbResponse.statusText}`)
    }

    const data = await igdbResponse.json()
    return jsonResponse(data)
  } catch (error) {
    return errorResponse(error)
  }
})
