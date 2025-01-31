import { supabase } from '@/lib/supabase';

export interface CloudflareCheckResult {
  status: 'healthy' | 'degraded' | 'unhealthy';
  latency: number;
  region: string;
  details?: {
    pop: string;
    protocol: string;
  };
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
      console.error('Failed to perform Cloudflare system check:', error);
      throw error;
    }
  }
};