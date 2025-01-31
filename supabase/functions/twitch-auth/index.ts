import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const TWITCH_CLIENT_ID = Deno.env.get('TWITCH_CLIENT_ID')
const TWITCH_CLIENT_SECRET = Deno.env.get('TWITCH_CLIENT_SECRET')

if (!TWITCH_CLIENT_ID || !TWITCH_CLIENT_SECRET) {
  throw new Error('Missing required Twitch credentials')
}

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
    const { code } = await req.json()

    if (!code) {
      throw new Error('Authorization code is required')
    }

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
      throw new Error(`Failed to exchange code: ${tokenData.message}`)
    }

    // Get user info
    const userResponse = await fetch('https://api.twitch.tv/helix/users', {
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`,
        'Client-Id': TWITCH_CLIENT_ID,
      },
    })

    const userData = await userResponse.json()

    if (!userResponse.ok) {
      throw new Error(`Failed to get user info: ${userData.message}`)
    }

    console.log('Successfully authenticated with Twitch')

    return new Response(
      JSON.stringify({
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token,
        expires_in: tokenData.expires_in,
        user: userData.data[0],
      }),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json'
        } 
      }
    )
  } catch (error) {
    console.error('Error in Twitch auth:', error)
    
    return new Response(
      JSON.stringify({
        error: 'Failed to authenticate with Twitch',
        details: error.message
      }),
      { 
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    )
  }
})