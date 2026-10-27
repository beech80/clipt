import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { assertOwnUser, authenticatedUser, errorResponse, HttpError, jsonResponse, requestBody, requestMethod, requiredString, serverEnv, serviceClient } from '../_shared/request.ts'

const DISCORD_API_ENDPOINT = 'https://discord.com/api/v10'
const statePrefix = 'clipt:discord-oauth-state:'

function encode(bytes: Uint8Array): string {
  return btoa(String.fromCharCode(...bytes)).replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '')
}
function decode(value: string): Uint8Array {
  if (!/^[A-Za-z0-9_-]+$/.test(value)) throw new HttpError(400, 'Invalid OAuth state')
  return Uint8Array.from(atob(value.replaceAll('-', '+').replaceAll('_', '/')), character => character.charCodeAt(0))
}
async function stateKey(secret: string) {
  return crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify'])
}
async function createState(userId: string, secret: string) {
  const payload = encode(new TextEncoder().encode(JSON.stringify({ userId, expiresAt: Date.now() + 10 * 60 * 1000, nonce: crypto.randomUUID() })))
  const signature = await crypto.subtle.sign('HMAC', await stateKey(secret), new TextEncoder().encode(statePrefix + payload))
  return payload + '.' + encode(new Uint8Array(signature))
}
async function verifyState(state: string, userId: string, secret: string) {
  try {
    const parts = state.split('.')
    if (parts.length !== 2) throw new Error('invalid state')
    const verified = await crypto.subtle.verify('HMAC', await stateKey(secret), decode(parts[1]), new TextEncoder().encode(statePrefix + parts[0]))
    if (!verified) throw new Error('invalid signature')
    const payload = JSON.parse(new TextDecoder().decode(decode(parts[0])))
    if (payload.userId !== userId || !Number.isFinite(payload.expiresAt) || payload.expiresAt <= Date.now()) {
      throw new Error('invalid owner or expiry')
    }
  } catch {
    throw new HttpError(403, 'OAuth state is invalid or expired; reconnect Discord from your account')
  }
}

serve(async (req) => {
  const method = requestMethod(req)
  if (method) return method
  try {
    const user = await authenticatedUser(req)
    assertOwnUser(req.headers.get('x-user-id'), user.id)
    const body = await requestBody(req)
    assertOwnUser(body.userId, user.id)
    if (body.action !== 'begin' && body.action !== 'token') throw new HttpError(400, 'Invalid action')
    const clientId = serverEnv('DISCORD_CLIENT_ID')
    const clientSecret = serverEnv('DISCORD_CLIENT_SECRET')
    const redirectUri = new URL(serverEnv('DISCORD_REDIRECT_URI'))
    if (redirectUri.protocol !== 'https:' && !(redirectUri.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(redirectUri.hostname))) {
      throw new HttpError(503, 'Discord callback is not configured')
    }

    if (body.action === 'begin') {
      const url = new URL('https://discord.com/oauth2/authorize')
      url.search = new URLSearchParams({
        client_id: clientId, redirect_uri: redirectUri.toString(), response_type: 'code',
        scope: 'identify', state: await createState(user.id, clientSecret),
      }).toString()
      return jsonResponse({ authorizationUrl: url.toString() })
    }

    const code = requiredString(body.code, 'authorization code', 2048)
    const state = requiredString(body.state, 'OAuth state', 4096)
    await verifyState(state, user.id, clientSecret)
    const tokenResponse = await fetch(DISCORD_API_ENDPOINT + '/oauth2/token', {
      method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: clientId, client_secret: clientSecret, code,
        grant_type: 'authorization_code', redirect_uri: redirectUri.toString(),
      }),
      signal: AbortSignal.timeout(10000),
    })
    if (!tokenResponse.ok) throw new HttpError(502, 'Discord authorization could not be completed')
    const tokenData = await tokenResponse.json()
    if (typeof tokenData.access_token !== 'string' || typeof tokenData.refresh_token !== 'string' || !Number.isFinite(tokenData.expires_in) || tokenData.expires_in <= 0) {
      throw new HttpError(502, 'Discord returned an invalid authorization')
    }
    const userResponse = await fetch(DISCORD_API_ENDPOINT + '/users/@me', {
      headers: { Authorization: 'Bearer ' + tokenData.access_token }, signal: AbortSignal.timeout(10000),
    })
    if (!userResponse.ok) throw new HttpError(502, 'Discord account could not be retrieved')
    const userData = await userResponse.json()
    if (typeof userData.id !== 'string' || typeof userData.username !== 'string') throw new HttpError(502, 'Discord returned an invalid account')
    const { error } = await serviceClient().from('discord_connections').upsert({
      user_id: user.id, discord_id: userData.id, discord_username: userData.username,
      access_token: tokenData.access_token, refresh_token: tokenData.refresh_token,
      expires_at: new Date(Date.now() + tokenData.expires_in * 1000).toISOString(),
    }, { onConflict: 'user_id' })
    if (error) throw error
    return jsonResponse({ success: true, user: { id: userData.id, username: userData.username } })
  } catch (error) {
    return errorResponse(error)
  }
})
