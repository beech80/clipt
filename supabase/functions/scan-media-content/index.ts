
import { createClient } from 'https://esm.sh/@google-cloud/vision@4.0.2'
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { imageUrl } = await req.json()

    if (!imageUrl) {
      return new Response(
        JSON.stringify({ error: 'No image URL provided' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Initialize Vision client
    const vision = new createClient({
      credentials: JSON.parse(Deno.env.get('GOOGLE_CLOUD_VISION_API_KEY') || '{}'),
    })

    // Perform content moderation
    const [result] = await vision.safeSearchDetection(imageUrl)
    const detections = result.safeSearchAnnotation || {}

    // Check if content is safe
    const isSafe = !['LIKELY', 'VERY_LIKELY'].includes(detections.adult) &&
                  !['LIKELY', 'VERY_LIKELY'].includes(detections.violence) &&
                  !['LIKELY', 'VERY_LIKELY'].includes(detections.racy)

    if (!isSafe) {
      return new Response(
        JSON.stringify({ 
          error: 'Content violates community guidelines',
          details: detections
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    return new Response(
      JSON.stringify({ safe: true, detections }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
