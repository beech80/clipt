import { supabase } from '@/lib/supabase';
import DOMPurify from 'dompurify';

export class SecurityService {
  private static instance: SecurityService;
  private rateLimitCache: Map<string, number> = new Map();

  private constructor() {}

  public static getInstance(): SecurityService {
    if (!SecurityService.instance) {
      SecurityService.instance = new SecurityService();
    }
    return SecurityService.instance;
  }

  public async checkRateLimit(endpoint: string, ip: string): Promise<boolean> {
    try {
      const { data, error } = await supabase.rpc('check_rate_limit', {
        check_ip: ip,
        check_endpoint: endpoint,
        max_requests: 100,
        window_minutes: 15
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Rate limit check failed:', error);
      return false;
    }
  }

  public sanitizeInput(input: string): string {
    return DOMPurify.sanitize(input, {
      ALLOWED_TAGS: [], // No HTML tags allowed
      ALLOWED_ATTR: [] // No attributes allowed
    });
  }

  public validateInput(input: string, maxLength: number = 1000): boolean {
    if (!input || input.length > maxLength) return false;
    
    // Check for common malicious patterns
    const maliciousPatterns = [
      /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
      /javascript:/gi,
      /data:/gi,
      /vbscript:/gi,
      /onload=/gi,
      /onerror=/gi
    ];

    return !maliciousPatterns.some(pattern => pattern.test(input));
  }

  public async logSecurityEvent(
    eventType: string,
    severity: 'low' | 'medium' | 'high' | 'critical',
    userId?: string | null,
    details: Record<string, any> = {}
  ): Promise<void> {
    try {
      const { error } = await supabase.rpc('log_security_event', {
        event_type: eventType,
        severity,
        user_id: userId,
        ip_address: null, // We'll get this from the server
        user_agent: navigator.userAgent,
        details
      });
      
      if (error) {
        console.error('Failed to log security event:', error);
      }
    } catch (error) {
      console.error('Failed to log security event:', error);
    }
  }

  public getSecurityHeaders(): Record<string, string> {
    return {
      'Content-Security-Policy': 
        "default-src 'self'; " +
        "script-src 'self' 'unsafe-inline' 'unsafe-eval'; " +
        "style-src 'self' 'unsafe-inline'; " +
        "img-src 'self' data: blob: https:; " +
        "font-src 'self'; " +
        "connect-src 'self' https://*.supabase.co",
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Permissions-Policy': 'geolocation=(), microphone=(), camera=()'
    };
  }
}

export const securityService = SecurityService.getInstance();