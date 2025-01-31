import { supabase } from '@/lib/supabase';

export interface CloudflareCheckResult {
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

export const cloudflareService = {
  async performSystemCheck(): Promise<CloudflareCheckResult> {
    try {
      const { data, error } = await supabase.functions.invoke('cloudflare-check', {
        method: 'POST'
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Cloudflare check failed:', error);
      throw error;
    }
  },

  async getLatestChecks(limit: number = 10) {
    const { data, error } = await supabase
      .from('performance_metrics')
      .select('*')
      .eq('metric_name', 'cloudflare_check')
      .order('timestamp', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data;
  }
};