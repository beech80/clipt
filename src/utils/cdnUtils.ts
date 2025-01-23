import { supabase } from "@/lib/supabase";

export const selectOptimalCDNEndpoint = async (viewerLocation?: string) => {
  const { data: config } = await supabase
    .from('streaming_config')
    .select('*')
    .single();

  if (!config || !config.cdn_edge_rules) {
    return config?.cdn_url;
  }

  // If geo_routing is enabled and we have viewer location, select closest edge
  if (config.cdn_edge_rules.geo_routing && viewerLocation) {
    const edges = config.cdn_failover_endpoints;
    // Implementation would select closest edge based on viewer location
    return edges[0] || config.cdn_url;
  }

  return config.cdn_url;
};

export const monitorCDNHealth = async (endpoint: string) => {
  try {
    const start = performance.now();
    const response = await fetch(endpoint, { method: 'HEAD' });
    const latency = performance.now() - start;

    return {
      healthy: response.ok,
      latency,
      status: response.status
    };
  } catch (error) {
    return {
      healthy: false,
      latency: 0,
      status: 0
    };
  }
};