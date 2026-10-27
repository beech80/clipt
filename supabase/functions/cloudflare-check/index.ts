import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { authenticatedUser, errorResponse, requestMethod, jsonResponse } from '../_shared/request.ts'

serve(async (req) => {
  const method = requestMethod(req)
  if (method) return method

  try {
    await authenticatedUser(req)
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

    return jsonResponse(result);
  } catch (error) {
    return errorResponse(error);
  }
})
