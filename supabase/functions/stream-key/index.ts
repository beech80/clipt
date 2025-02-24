
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req: Request) => {
  // Handle CORS preflight requests
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
    let result

    switch (action) {
      case 'generate':
        // Generate new stream key
        const { data, error } = await supabaseClient.rpc('generate_user_stream_key', {
          user_id_param: user.id
        })
        
        if (error) throw error
        result = { streamKey: data }
        break

      case 'get':
        // Get existing stream key
        const { data: keyData, error: keyError } = await supabaseClient
          .from('stream_keys')
          .select('key')
          .eq('user_id', user.id)
          .single()
        
        if (keyError) throw keyError
        result = { streamKey: keyData?.key }
        break

      default:
        throw new Error('Invalid action')
    }

    return new Response(
      JSON.stringify(result),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json'
        } 
      }
    )
  } catch (error) {
    console.error('Error:', error.message)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        } 
      }
    )
  }
})
