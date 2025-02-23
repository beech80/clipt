
import { serve } from "https://deno.fresh.dev/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AuthorizationRequest {
  client_id: string;
  redirect_uri: string;
  response_type: string;
  scope: string;
  state: string;
}

interface TokenRequest {
  grant_type: string;
  code?: string;
  refresh_token?: string;
  client_id: string;
  redirect_uri?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(req.url);
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  try {
    // Authorization endpoint
    if (url.pathname === '/oauth/authorize') {
      const params = Object.fromEntries(url.searchParams) as AuthorizationRequest;
      
      // Validate required parameters
      if (!params.client_id || !params.redirect_uri || params.response_type !== 'code') {
        throw new Error('Invalid authorization request');
      }

      // Store authorization request parameters in session
      const authCode = crypto.randomUUID();
      
      // Generate authorization code and redirect
      const redirectUrl = new URL(params.redirect_uri);
      redirectUrl.searchParams.set('code', authCode);
      redirectUrl.searchParams.set('state', params.state);

      return new Response(null, {
        status: 302,
        headers: {
          ...corsHeaders,
          'Location': redirectUrl.toString()
        }
      });
    }

    // Token endpoint
    if (url.pathname === '/oauth/token' && req.method === 'POST') {
      const request: TokenRequest = await req.json();
      
      if (request.grant_type === 'authorization_code' && request.code) {
        // Exchange authorization code for tokens
        const { data: { user }, error } = await supabase.auth.getUser(
          request.code
        );

        if (error || !user) {
          throw new Error('Invalid authorization code');
        }

        // Generate streaming tokens using our database function
        const { data, error: tokenError } = await supabase.rpc(
          'generate_streaming_token',
          { user_id_param: user.id }
        );

        if (tokenError) throw tokenError;

        return new Response(JSON.stringify(data), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      if (request.grant_type === 'refresh_token' && request.refresh_token) {
        // Refresh the token using our database function
        const { data, error } = await supabase.rpc(
          'refresh_streaming_token',
          { refresh_token_param: request.refresh_token }
        );

        if (error) throw error;

        return new Response(JSON.stringify(data), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      throw new Error('Invalid token request');
    }

    // Token validation endpoint
    if (url.pathname === '/oauth/validate' && req.method === 'POST') {
      const { token } = await req.json();
      
      if (!token) {
        throw new Error('Token is required');
      }

      // Validate token using our database function
      const { data, error } = await supabase.rpc(
        'validate_streaming_token',
        { token_param: token }
      );

      if (error) throw error;

      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    return new Response('Not found', { status: 404 });

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
