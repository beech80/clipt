import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

export const requestHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-user-id',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Cache-Control': 'no-store',
  'Content-Type': 'application/json',
}

export class HttpError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

export function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: requestHeaders })
}

export function requestMethod(req: Request): Response | null {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: requestHeaders })
  if (req.method !== 'POST') return jsonResponse({ error: 'Use POST for this endpoint' }, 405)
  return null
}

export function errorResponse(error: unknown) {
  if (error instanceof HttpError) return jsonResponse({ error: error.message }, error.status)
  // Never return provider/database details, tokens or request bodies.
  return jsonResponse({ error: 'The operation could not be completed' }, 500)
}

export function serverEnv(name: string) {
  const value = Deno.env.get(name)
  if (!value) throw new HttpError(503, 'This service is not configured')
  return value
}

export function serviceClient() {
  return createClient(serverEnv('SUPABASE_URL'), serverEnv('SUPABASE_SERVICE_ROLE_KEY'), {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

export async function authenticatedUser(req: Request, options: { accountManagement?: boolean } = {}) {
  const match = req.headers.get('Authorization')?.match(/^Bearer ([^\s,]+)$/i)
  if (!match || match[1].length > 8192) throw new HttpError(401, 'Authentication required')
  const client = createClient(serverEnv('SUPABASE_URL'), serverEnv('SUPABASE_ANON_KEY'), {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: `Bearer ${match[1]}` } },
  })
  const { data, error } = await client.auth.getUser(match[1])
  if (error || !data.user?.id) throw new HttpError(401, 'Invalid or expired session')
  // getUser has validated this exact token. Enrollment comes from Auth, never
  // user-editable metadata; a password-only session must not bypass the MFA UI.
  if (data.user.factors?.some(factor => factor.status === 'verified')) {
    let aal: unknown
    try {
      aal = JSON.parse(atob(match[1].split('.')[1].replace(/-/g, '+').replace(/_/g, '/'))).aal
    } catch {
      throw new HttpError(403, 'Verify your authenticator to continue')
    }
    if (aal !== 'aal2') throw new HttpError(403, 'Verify your authenticator to continue')
  }
  // The live database controls activation. A missing or stale deployment flag
  // must not bypass an enabled invitation gate. Own-account rights remain exempt.
  if (!options.accountManagement) {
    const { data: approved, error: approvalError } = await client.rpc('clipt_beta_access')
    if (approvalError) throw new HttpError(503, 'Beta access could not be verified')
    if (approved !== true) throw new HttpError(403, 'A beta invitation is required')
  }
  return data.user
}

export function assertOwnUser(suppliedId: unknown, authenticatedId: string) {
  if (suppliedId !== undefined && suppliedId !== null && suppliedId !== authenticatedId) {
    throw new HttpError(403, 'You can only manage your own account')
  }
}

export function requiredString(value: unknown, name: string, maxLength = 256): string {
  if (typeof value !== 'string' || !value.trim() || value.length > maxLength) throw new HttpError(400, `Invalid ${name}`)
  return value
}

export async function requestBody(req: Request): Promise<Record<string, unknown>> {
  if (req.headers.get('Content-Type')?.split(';')[0].trim().toLowerCase() !== 'application/json') {
    throw new HttpError(415, 'Send application/json')
  }
  const reader = req.body?.getReader()
  if (!reader) throw new HttpError(400, 'A JSON object is required')
  const chunks: Uint8Array[] = []
  let size = 0
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    size += value.byteLength
    if (size > 16 * 1024) {
      await reader.cancel()
      throw new HttpError(413, 'Request body is too large')
    }
    chunks.push(value)
  }
  const bytes = new Uint8Array(size)
  let offset = 0
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength }
  try {
    const parsed = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes))
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('object required')
    return parsed
  } catch {
    throw new HttpError(400, 'A valid JSON object is required')
  }
}
