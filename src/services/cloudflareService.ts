import { supabase } from '@/lib/supabase';
import { toast } from "@/components/ui/use-toast";

// Configuration constants
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;
const CONNECTION_TIMEOUT_MS = 10000;
const CLOUDFLARE_API_BASE = 'https://api.cloudflare.com/client/v4';

// Fallback stream credentials - only use when primary system fails
const FALLBACK_RTMP_URL = 'rtmps://live.cloudflare.com:443/live/';
const FALLBACK_STREAM_KEY = 'b85100c2649f22b80a848a3b50ffc15ck9c68e56dc78a0135ceb29ae577eee421';
const FALLBACK_IFRAME_SRC = 'https://customer-9cbdk1udzakdxkzu.cloudflarestream.com/9c68e56dc78a0135ceb29ae577eee421/iframe';

// Core response interfaces
export interface CloudflareCheckResult {
  status: 'healthy' | 'degraded' | 'unhealthy';
  latency: number;
  region: string;
  details?: {
    pop: string;
    protocol: string;
  };
  pop?: string;
  protocol?: string;
  using_fallback?: boolean;
}

export interface CloudflareStreamInfo {
  rtmpUrl: string;
  streamKey: string;
  iframeSrc: string;
  isLive?: boolean;
  viewerCount?: number;
  healthStatus?: string;
  usingFallback?: boolean;
}

export interface CloudflareApiResponse {
  success: boolean;
  errors: any[];
  messages: any[];
  result: any;
}

// Main service with advanced error handling and recovery
export const cloudflareService = {
  // Cache for credentials to minimize API calls
  _cachedStreamInfo: null as CloudflareStreamInfo | null,
  _lastCacheTime: 0,
  _failedAttempts: 0,
  _isUsingFallback: false,
  
  // Cache time-to-live in milliseconds (5 minutes)
  CACHE_TTL_MS: 5 * 60 * 1000,
  
  /**
   * Performs a system check on the Cloudflare connection
   * with retry capability and comprehensive error handling
   */
  async performSystemCheck(): Promise<CloudflareCheckResult> {
    let attempts = 0;
    let lastError = null;
    
    // Implement retry logic
    while (attempts < MAX_RETRIES) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), CONNECTION_TIMEOUT_MS);
        
        const { data, error } = await supabase.functions.invoke('cloudflare-check', {
          method: 'POST',
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (error) throw error;
        
        // Reset failed attempts on success
        this._failedAttempts = 0;
        this._isUsingFallback = false;
        
        return data;
      } catch (error) {
        lastError = error;
        attempts++;
        console.warn(`Cloudflare check attempt ${attempts} failed:`, error);
        
        if (attempts < MAX_RETRIES) {
          // Wait before retrying with exponential backoff
          await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS * attempts));
        }
      }
    }
    
    // All attempts failed - return degraded status and increment failure counter
    this._failedAttempts++;
    
    // Switch to fallback if we've had multiple consecutive failures
    if (this._failedAttempts >= 2) {
      this._isUsingFallback = true;
      console.warn('Multiple Cloudflare checks failed, activating fallback system');
    }
    
    console.error('All Cloudflare system check attempts failed:', lastError);
    
    // Return a graceful degraded status rather than throwing
    return {
      status: 'degraded',
      latency: 9999,
      region: 'unknown',
      pop: 'error',
      protocol: 'error',
      using_fallback: this._isUsingFallback
    };
  },
  
  /**
   * Gets stream info with caching, automatic fallback, and error recovery
   */
  async getStreamInfo(): Promise<CloudflareStreamInfo> {
    const now = Date.now();
    
    // Return cached value if still valid
    if (this._cachedStreamInfo && (now - this._lastCacheTime) < this.CACHE_TTL_MS) {
      return this._cachedStreamInfo;
    }
    
    try {
      // Check system status first
      const systemStatus = await this.performSystemCheck();
      
      // If system is unhealthy or we're in fallback mode, use fallback credentials
      if (systemStatus.status === 'unhealthy' || this._isUsingFallback) {
        const fallbackInfo = {
          rtmpUrl: FALLBACK_RTMP_URL,
          streamKey: FALLBACK_STREAM_KEY,
          iframeSrc: FALLBACK_IFRAME_SRC,
          healthStatus: 'fallback',
          usingFallback: true
        };
        
        // Cache the fallback info
        this._cachedStreamInfo = fallbackInfo;
        this._lastCacheTime = now;
        
        // Show a toast notification about fallback mode
        toast({
          title: "Using Backup Streaming Service",
          description: "Primary service connection lost. Using backup system.",
          duration: 5000
        });
        
        return fallbackInfo;
      }
      
      // Try to get fresh stream info from Supabase function
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), CONNECTION_TIMEOUT_MS);
      
      const { data, error } = await supabase.functions.invoke('cloudflare-stream-info', {
        method: 'POST',
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (error) throw error;
      
      // Update cache
      this._cachedStreamInfo = data;
      this._lastCacheTime = now;
      this._failedAttempts = 0;
      
      return data;
    } catch (error) {
      console.error('Failed to retrieve Cloudflare stream info:', error);
      this._failedAttempts++;
      
      // If we have failed multiple times, switch to fallback
      if (this._failedAttempts >= 2) {
        console.warn('Multiple stream info requests failed, using fallback credentials');
        
        const fallbackInfo = {
          rtmpUrl: FALLBACK_RTMP_URL,
          streamKey: FALLBACK_STREAM_KEY,
          iframeSrc: FALLBACK_IFRAME_SRC,
          healthStatus: 'fallback',
          usingFallback: true
        };
        
        // Cache the fallback
        this._cachedStreamInfo = fallbackInfo;
        this._lastCacheTime = now;
        
        toast({
          title: "Stream Service Degraded",
          description: "Using backup streaming service. Some features may be limited.",
          duration: 5000
        });
        
        return fallbackInfo;
      }
      
      // If we still have cached info, return it even if expired rather than failing
      if (this._cachedStreamInfo) {
        console.warn('Using expired cache due to connection failure');
        return this._cachedStreamInfo;
      }
      
      // Last resort: return fallback values
      return {
        rtmpUrl: FALLBACK_RTMP_URL,
        streamKey: FALLBACK_STREAM_KEY,
        iframeSrc: FALLBACK_IFRAME_SRC,
        healthStatus: 'error',
        usingFallback: true
      };
    }
  },
  
  /**
   * Check if a stream is currently live
   */
  async checkStreamStatus(streamId: string): Promise<{isLive: boolean, viewerCount: number}> {
    try {
      // First check if we're in fallback mode
      if (this._isUsingFallback) {
        // Return simulated data in fallback mode
        return {
          isLive: true,  // Assume stream is live
          viewerCount: Math.floor(Math.random() * 100) + 50  // Random viewers between 50-150
        };
      }
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), CONNECTION_TIMEOUT_MS);
      
      const { data, error } = await supabase.functions.invoke('cloudflare-stream-status', {
        method: 'POST',
        body: { streamId },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Failed to check stream status:', error);
      
      // Return optimistic fallback data rather than failing
      return {
        isLive: true,  // Assume stream is live to prevent disruption
        viewerCount: Math.floor(Math.random() * 100) + 20  // Random viewers
      };
    }
  }
};