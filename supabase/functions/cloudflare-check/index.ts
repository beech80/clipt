import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

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
    // Simulate Cloudflare check (in a real implementation, you would make actual checks)
    const startTime = performance.now();
    
    // Perform basic connectivity test
    const response = await fetch('https://1.1.1.1/cdn-cgi/trace');
    const data = await response.text();
    
    const endTime = performance.now();
    const latency = endTime - startTime;

    // Parse the trace data
    const parsedData = Object.fromEntries(
      data.trim().split('\n').map(line => line.split('='))
    );

    const result = {
      status: latency < 100 ? 'healthy' : latency < 300 ? 'degraded' : 'unhealthy',
      latency,
      region: parsedData.loc || 'unknown',
      details: {
        pop: parsedData.colo || 'unknown',
        protocol: parsedData.http || 'unknown'
      }
    };

    console.log('Cloudflare check completed:', result);

    return new Response(
      JSON.stringify(result),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json'
        } 
      }
    );
  } catch (error) {
    console.error('Error performing Cloudflare check:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Failed to perform Cloudflare system check',
        details: error.message 
      }),
      { 
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    );
  }
})