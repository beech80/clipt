
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      SUPABASE_URL!,
      SUPABASE_SERVICE_ROLE_KEY!
    )

    // Get the JWT from the Authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('Missing Authorization header')
    }

    // Verify the JWT and get the user
    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    )

    if (authError || !user) {
      throw new Error('Invalid token')
    }

    // Parse the request body
    const { action } = await req.json()

    switch (action) {
      case 'create':
        // Create a new stream
        const { data: stream, error: createError } = await supabase
          .from('streams')
          .insert([
            {
              user_id: user.id,
              is_live: false,
              title: 'New Stream',
              stream_key: crypto.randomUUID(), // Temporary stream key
              stream_url: `rtmp://stream.lovable.dev/live`, // Your RTMP server URL
            }
          ])
          .select()
          .single()

        if (createError) throw createError
        return new Response(
          JSON.stringify(stream),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

      case 'end':
        // End the stream
        const { data: endedStream, error: endError } = await supabase
          .from('streams')
          .update({
            is_live: false,
            ended_at: new Date().toISOString()
          })
          .eq('user_id', user.id)
          .eq('is_live', true)
          .select()
          .single()

        if (endError) throw endError
        return new Response(
          JSON.stringify(endedStream),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

      default:
        throw new Error('Invalid action')
    }
  } catch (error) {
    console.error('Error:', error.message)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
