import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Mux from 'https://esm.sh/@mux/mux-node'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const { Video } = new Mux(
  Deno.env.get('MUX_TOKEN_ID')!,
  Deno.env.get('MUX_TOKEN_SECRET')!
)

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { action, assetId, uploadId } = await req.json()

    // Create a Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    switch (action) {
      case 'createUpload': {
        const upload = await Video.Uploads.create({
          new_asset_settings: { playback_policy: 'public' },
          cors_origin: '*',
        })

        // Store upload info in database
        const { error } = await supabaseClient
          .from('mux_uploads')
          .insert({
            upload_id: upload.id,
            url: upload.url,
            status: 'waiting'
          })

        if (error) throw error

        return new Response(
          JSON.stringify({ uploadId: upload.id, url: upload.url }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      case 'getAsset': {
        const asset = await Video.Assets.get(assetId)
        return new Response(
          JSON.stringify(asset),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      case 'getUpload': {
        const upload = await Video.Uploads.get(uploadId)
        return new Response(
          JSON.stringify(upload),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      case 'deleteAsset': {
        await Video.Assets.del(assetId)
        return new Response(
          JSON.stringify({ message: 'Asset deleted' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      default:
        throw new Error('Invalid action')
    }
  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    )
  }
})