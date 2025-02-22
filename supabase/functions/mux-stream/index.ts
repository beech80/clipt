
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
    // Initialize Supabase client with service role key
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
      console.error('User error:', userError)
      throw new Error('Invalid user token')
    }

    console.log('Processing request for user:', user.id)

    // Get request body
    const { action } = await req.json()
    console.log('Action:', action)

    if (action === 'create') {
      // Create new stream record
      const streamKey = Array.from(crypto.getRandomValues(new Uint8Array(24)))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');

      const { data: stream, error: streamError } = await supabaseClient
        .from('streams')
        .insert([{
          user_id: user.id,
          is_live: false,
          viewer_count: 0,
          stream_key: streamKey,
          rtmp_url: 'rtmp://stream.lovable.dev/live',
          title: `${user.email}'s Stream`,
          chat_enabled: true,
          stream_settings: {},
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
        }])
        .select('*')
        .single();

      if (streamError) {
        console.error('Error creating stream:', streamError)
        throw streamError
      }

      console.log('Stream created successfully')

      return new Response(
        JSON.stringify(stream),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (action === 'end') {
      const now = new Date().toISOString();
      const { data: stream, error: streamError } = await supabaseClient
        .from('streams')
        .update({
          is_live: false,
          ended_at: now,
          updated_at: now
        })
        .eq('user_id', user.id)
        .select('*')
        .single();

      if (streamError) {
        console.error('Error ending stream:', streamError)
        throw streamError
      }

      console.log('Stream ended successfully')

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
