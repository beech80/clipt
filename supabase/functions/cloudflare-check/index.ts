import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface CloudflareCheck {
  region: string;
  latency: number;
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  details?: {
    pop: string;
    rayID: string;
    serverIP: string;
    protocol: string;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get client IP and Cloudflare headers
    const clientIP = req.headers.get('cf-connecting-ip')
    const cfRay = req.headers.get('cf-ray')
    const cfPop = req.headers.get('cf-ipcountry')
    const protocol = req.headers.get('x-forwarded-proto')

    // Measure latency
    const start = performance.now()
    const latencyCheck = await fetch('https://1.1.1.1/cdn-cgi/trace')
    const latency = performance.now() - start

    const checkResult: CloudflareCheck = {
      region: cfPop || 'unknown',
      latency,
      status: latency < 100 ? 'healthy' : latency < 300 ? 'degraded' : 'unhealthy',
      timestamp: new Date().toISOString(),
      details: {
        pop: cfPop || 'unknown',
        rayID: cfRay || 'unknown',
        serverIP: clientIP || 'unknown',
        protocol: protocol || 'unknown'
      }
    }

    // Log the check in Supabase
    const { error } = await supabase
      .from('performance_metrics')
      .insert({
        metric_name: 'cloudflare_check',
        value: latency,
        tags: checkResult
      })

    if (error) throw error

    return new Response(
      JSON.stringify(checkResult),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json'
        } 
      }
    )

  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json'
        },
        status: 500
      }
    )
  }
})