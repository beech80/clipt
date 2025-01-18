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

    const { fileUrl } = await req.json()

    if (!fileUrl) {
      return new Response(
        JSON.stringify({ error: 'File URL is required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Get closest edge location based on user's location
    const userRegion = req.headers.get('cf-ipcountry') || 'US'
    
    // Transform URL to use closest CDN edge
    const cdnUrl = new URL(fileUrl)
    cdnUrl.hostname = `${userRegion.toLowerCase()}.${cdnUrl.hostname}`

    return new Response(
      JSON.stringify({ cdnUrl: cdnUrl.toString() }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})