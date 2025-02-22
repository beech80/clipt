
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get the authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('Missing authorization header')
    }

    // Get the user
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(
      authHeader.replace('Bearer ', '')
    )

    if (userError || !user) {
      throw new Error('Invalid user token')
    }

    console.log('Authenticated user:', user.id)

    // Get request body
    const { action } = await req.json()
    console.log('Action:', action)

    if (action === 'create') {
      // Generate stream key
      const streamKey = crypto.randomUUID()
      console.log('Generated stream key:', streamKey)

      const now = new Date().toISOString();
      const rtmpUrl = "rtmp://stream.lovable.dev/live";

      // Create or update stream
      const { data: stream, error: streamError } = await supabaseClient
        .from('streams')
        .upsert({
          user_id: user.id,
          stream_key: streamKey,
          rtmp_url: rtmpUrl,
          rtmp_key: streamKey,
          is_live: false,
          viewer_count: 0,
          title: 'New Stream',
          created_at: now,
          updated_at: now,
          chat_settings: {
            slow_mode: false,
            slow_mode_interval: 0,
            subscriber_only: false,
            follower_only: false,
            follower_time_required: 0,
            emote_only: false,
            auto_mod_settings: {
              enabled: true,
              spam_detection: true,
              link_protection: true,
              caps_limit_percent: 80,
              max_emotes: 10,
              blocked_terms: []
            }
          }
        }, {
          onConflict: 'user_id'
        })
        .select()
        .single();

      if (streamError) {
        console.error('Error creating/updating stream:', streamError)
        throw streamError
      }

      console.log('Stream created/updated successfully:', stream)

      return new Response(
        JSON.stringify(stream),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (action === 'end') {
      const { data: stream, error: streamError } = await supabaseClient
        .from('streams')
        .update({
          is_live: false,
          ended_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id)
        .select()
        .single();

      if (streamError) {
        console.error('Error ending stream:', streamError)
        throw streamError
      }

      console.log('Stream ended successfully:', stream)

      return new Response(
        JSON.stringify(stream),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    throw new Error(`Invalid action: ${action}`)

  } catch (error) {
    console.error('Error:', error.message)
    return new Response(
      JSON.stringify({
        error: error.message
      }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
