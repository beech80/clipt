
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req: Request) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get auth user
    const authHeader = req.headers.get('Authorization')!
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(authHeader.split(' ')[1])
    
    if (userError || !user) {
      throw new Error('Unauthorized')
    }

    const { action } = await req.json()

    switch (action) {
      case 'initialize_stream': {
        console.log('Initializing stream for user:', user.id)
        
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

        return new Response(
          JSON.stringify({ stream }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      case 'end_stream': {
        console.log('Ending stream for user:', user.id)
        
        const { data, error } = await supabaseClient
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

        if (error) throw error

        // Revoke the OAuth token
        const { error: revokeError } = await supabaseClient
          .from('stream_oauth_tokens')
          .update({ is_revoked: true })
          .eq('user_id', user.id)

        if (revokeError) throw revokeError

        return new Response(
          JSON.stringify({ success: true, stream: data }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

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
