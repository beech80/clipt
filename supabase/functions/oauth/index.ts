
import { serve } from "https://deno.fresh.dev/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { action, userId, access_token } = await req.json();

    switch (action) {
      case 'initialize_stream': {
        // Generate new streaming token using our database function
        const { data: tokenData, error: tokenError } = await supabase.rpc(
          'generate_streaming_token',
          { user_id_param: userId }
        );

        if (tokenError) throw tokenError;

        // Create or update stream with the new token
        const streamingUrl = `rtmp://stream.clipt.com/live?access_token=${tokenData.access_token}`;
        
        const { data: stream, error: streamError } = await supabase
          .from('streams')
          .upsert({
            user_id: userId,
            is_live: false,
            streaming_url: streamingUrl,
            oauth_token_id: tokenData.token_id,
            started_at: null,
            ended_at: null
          })
          .select()
          .single();

        if (streamError) throw streamError;

        return new Response(
          JSON.stringify({ stream }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'validate_token': {
        if (!access_token) {
          throw new Error('Access token is required');
        }

        const { data: validation, error: validationError } = await supabase.rpc(
          'validate_streaming_token',
          { token_param: access_token }
        );

        if (validationError) throw validationError;

        return new Response(
          JSON.stringify(validation),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'end_stream': {
        const { error: updateError } = await supabase
          .from('streams')
          .update({
            is_live: false,
            ended_at: new Date().toISOString(),
            streaming_url: null,
            oauth_token_id: null
          })
          .eq('user_id', userId);

        if (updateError) throw updateError;

        // Revoke the access token
        const { error: revokeError } = await supabase
          .from('stream_oauth_tokens')
          .update({ is_revoked: true })
          .eq('user_id', userId)
          .eq('is_revoked', false);

        if (revokeError) throw revokeError;

        return new Response(
          JSON.stringify({ success: true }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      default:
        throw new Error('Invalid action');
    }
  } catch (error) {
    console.error('OAuth error:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Internal server error',
        error_description: error.description || 'An unexpected error occurred'
      }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
