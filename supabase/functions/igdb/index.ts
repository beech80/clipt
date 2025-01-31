import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

async function getIGDBAccessToken() {
  const clientId = Deno.env.get('TWITCH_CLIENT_ID')
  const clientSecret = Deno.env.get('TWITCH_CLIENT_SECRET')

  if (!clientId || !clientSecret) {
    throw new Error('Missing Twitch credentials')
  }

  const response = await fetch(
    `https://id.twitch.tv/oauth2/token?client_id=${clientId}&client_secret=${clientSecret}&grant_type=client_credentials`,
    { method: 'POST' }
  )

  if (!response.ok) {
    throw new Error('Failed to get IGDB access token')
  }

  const data = await response.json()
  return data.access_token
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { endpoint, query } = await req.json()
    const accessToken = await getIGDBAccessToken()
    const clientId = Deno.env.get('TWITCH_CLIENT_ID')

    console.log(`Making IGDB request to ${endpoint} with query:`, query)

    const igdbResponse = await fetch(`https://api.igdb.com/v4/${endpoint}`, {
      method: 'POST',
      headers: {
        'Client-ID': clientId!,
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'text/plain',
      },
      body: query,
    })

    if (!igdbResponse.ok) {
      throw new Error(`IGDB API error: ${igdbResponse.statusText}`)
    }

    const data = await igdbResponse.json()
    console.log(`IGDB response for ${endpoint}:`, data)

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Error in IGDB function:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})