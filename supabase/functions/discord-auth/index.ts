import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const DISCORD_API_ENDPOINT = 'https://discord.com/api/v10'
const REDIRECT_URI = 'http://localhost:5173/auth/discord/callback' // We'll update this later

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { code, action } = await req.json()
    const clientId = Deno.env.get('DISCORD_CLIENT_ID')
    const clientSecret = Deno.env.get('DISCORD_CLIENT_SECRET')
    
    if (!clientId || !clientSecret) {
      throw new Error('Discord credentials not configured')
    }

    if (action === 'token') {
      const tokenParams = new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        code,
        grant_type: 'authorization_code',
        redirect_uri: REDIRECT_URI,
      })

      const tokenResponse = await fetch(`${DISCORD_API_ENDPOINT}/oauth2/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: tokenParams,
      })

      const tokenData = await tokenResponse.json()

      if (!tokenResponse.ok) {
        throw new Error('Failed to get Discord token')
      }

      // Get user data
      const userResponse = await fetch(`${DISCORD_API_ENDPOINT}/users/@me`, {
        headers: {
          Authorization: `Bearer ${tokenData.access_token}`,
        },
      })

      const userData = await userResponse.json()

      if (!userResponse.ok) {
        throw new Error('Failed to get Discord user data')
      }

      // Store Discord connection in database
      const supabase = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      )

      const { error: upsertError } = await supabase
        .from('discord_connections')
        .upsert({
          user_id: req.headers.get('x-user-id'),
          discord_id: userData.id,
          discord_username: userData.username,
          access_token: tokenData.access_token,
          refresh_token: tokenData.refresh_token,
          expires_at: new Date(Date.now() + tokenData.expires_in * 1000).toISOString(),
        })

      if (upsertError) {
        throw upsertError
      }

      return new Response(
        JSON.stringify({ success: true, user: userData }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )

  } catch (error) {
    console.error('Discord auth error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})