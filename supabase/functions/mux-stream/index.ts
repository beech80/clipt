
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
      // Call our database function to create/update stream
      const { data: stream, error: streamError } = await supabaseClient
        .rpc('create_or_update_stream', {
          user_id_input: user.id
        })

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
