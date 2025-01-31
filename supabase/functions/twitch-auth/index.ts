import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { code } = await req.json()

    // Exchange code for access token
    const tokenResponse = await fetch('https://id.twitch.tv/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: Deno.env.get('TWITCH_CLIENT_ID'),
        client_secret: Deno.env.get('TWITCH_CLIENT_SECRET'),
        code,
        grant_type: 'authorization_code',
        redirect_uri: `${Deno.env.get('SITE_URL')}/twitch-callback`
      })
    })

    const tokenData = await tokenResponse.json()

    if (!tokenResponse.ok) {
      throw new Error(tokenData.message)
    }

    // Get user info
    const userResponse = await fetch('https://api.twitch.tv/helix/users', {
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`,
        'Client-Id': Deno.env.get('TWITCH_CLIENT_ID') || '',
      }
    })

    const userData = await userResponse.json()

    if (!userResponse.ok) {
      throw new Error('Failed to get Twitch user data')
    }

    // Store Twitch connection in Supabase
    const { error: dbError } = await supabase
      .from('twitch_connections')
      .upsert({
        user_id: req.headers.get('x-user-id'),
        twitch_id: userData.data[0].id,
        twitch_login: userData.data[0].login,
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token,
        expires_at: new Date(Date.now() + tokenData.expires_in * 1000).toISOString()
      })

    if (dbError) throw dbError

    return new Response(
      JSON.stringify({ success: true }),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json'
        } 
      }
    )

  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json'
        },
        status: 500
      }
    )
  }
})