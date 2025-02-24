
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req: Request) => {
  try {
    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders })
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase environment variables')
    }

    const supabaseClient = createClient(supabaseUrl, supabaseKey)

    // Get auth user
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('No authorization header')
    }

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(
      authHeader.split(' ')[1]
    )
    
    if (userError || !user) {
      throw new Error('Unauthorized')
    }

    const { action } = await req.json()
    console.log(`Processing ${action} for user ${user.id}`)

    switch (action) {
      case 'initialize_stream': {
        // Generate streaming tokens
        const { data: tokenData, error: tokenError } = await supabaseClient.rpc(
          'generate_streaming_token',
          { user_id_param: user.id }
        )
        
        if (tokenError) {
          console.error('Token generation error:', tokenError)
          throw tokenError
        }

        // Create or update stream record
        const { data: stream, error: streamError } = await supabaseClient
          .from('streams')
          .upsert({
            user_id: user.id,
            is_live: false,
            streaming_url: `rtmp://stream.lovable.dev/live?access_token=${tokenData.access_token}`,
            oauth_token_id: tokenData.token_id
          })
          .select()
          .single()

        if (streamError) {
          console.error('Stream creation error:', streamError)
          throw streamError
        }

        console.log('Stream initialized successfully:', stream)
        return new Response(
          JSON.stringify({ stream }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      case 'end_stream': {
        // End stream and revoke token
        const { data: stream, error: streamError } = await supabaseClient
          .from('streams')
          .update({
            is_live: false,
            ended_at: new Date().toISOString(),
            streaming_url: null,
            oauth_token_id: null
          })
          .eq('user_id', user.id)
          .select()
          .single()

        if (streamError) {
          console.error('Stream update error:', streamError)
          throw streamError
        }

        // Revoke the OAuth token
        const { error: revokeError } = await supabaseClient
          .from('stream_oauth_tokens')
          .update({ is_revoked: true })
          .eq('user_id', user.id)

        if (revokeError) {
          console.error('Token revocation error:', revokeError)
          throw revokeError
        }

        console.log('Stream ended successfully')
        return new Response(
          JSON.stringify({ success: true, stream }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      default:
        throw new Error(`Invalid action: ${action}`)
    }
  } catch (error) {
    console.error('Error in oauth function:', error.message)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
