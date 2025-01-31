import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const TWITCH_CLIENT_ID = Deno.env.get('TWITCH_CLIENT_ID')
const TWITCH_CLIENT_SECRET = Deno.env.get('TWITCH_CLIENT_SECRET')

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  // Handle GET request for client ID
  if (req.method === 'GET') {
    return new Response(
      JSON.stringify({ clientId: TWITCH_CLIENT_ID }),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json'
        } 
      }
    )
  }

  try {
    const { action, code, username } = await req.json()

    switch (action) {
      case 'get-stream-info': {
        // Get stream info using Twitch API
        const response = await fetch(
          `https://api.twitch.tv/helix/streams?user_login=${username}`,
          {
            headers: {
              'Client-ID': TWITCH_CLIENT_ID,
              'Authorization': `Bearer ${TWITCH_CLIENT_SECRET}`,
            },
          }
        )

        const data = await response.json()
        return new Response(JSON.stringify(data), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      case 'link-account': {
        // Exchange code for access token
        const tokenResponse = await fetch('https://id.twitch.tv/oauth2/token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            client_id: TWITCH_CLIENT_ID,
            client_secret: TWITCH_CLIENT_SECRET,
            code,
            grant_type: 'authorization_code',
            redirect_uri: `${req.headers.get('origin')}/twitch-callback`,
          }),
        })

        const tokenData = await tokenResponse.json()

        if (!tokenResponse.ok) {
          throw new Error('Failed to exchange code for token')
        }

        // Get user info
        const userResponse = await fetch('https://api.twitch.tv/helix/users', {
          headers: {
            'Client-ID': TWITCH_CLIENT_ID,
            'Authorization': `Bearer ${tokenData.access_token}`,
          },
        })

        const userData = await userResponse.json()

        return new Response(
          JSON.stringify({
            access_token: tokenData.access_token,
            refresh_token: tokenData.refresh_token,
            user: userData.data[0],
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        )
      }

      default:
        return new Response(JSON.stringify({ error: 'Invalid action' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
    }
  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})