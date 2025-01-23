import { supabase } from "@/lib/supabase";

interface StreamingConfig {
  cdn_provider: string;
  cdn_config: any;
  cdn_edge_rules: {
    geo_routing: boolean;
    failover_threshold: number;
    latency_threshold_ms: number;
  };
  cdn_failover_endpoints: string[];
  ingest_endpoint: string;
  playback_endpoint: string;
}

export const selectOptimalCDNEndpoint = async (viewerLocation?: string) => {
  const { data: config } = await supabase
    .from('streaming_config')
    .select('*')
    .single();

  if (!config) {
    return config?.playback_endpoint;
  }

  const typedConfig = config as unknown as StreamingConfig;

  // If geo_routing is enabled and we have viewer location, select closest edge
  if (typedConfig.cdn_edge_rules.geo_routing && viewerLocation) {
    const edges = typedConfig.cdn_failover_endpoints;
    // Implementation would select closest edge based on viewer location
    return edges[0] || typedConfig.playback_endpoint;
  }

  return typedConfig.playback_endpoint;
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