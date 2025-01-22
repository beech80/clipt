import { supabase } from '@/lib/supabase';

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface LogContext {
  [key: string]: any;
}

interface LogMetadata {
  browser?: string;
  os?: string;
  url?: string;
  [key: string]: any;
}

class LoggingService {
  private static getBrowserInfo(): LogMetadata {
    return {
      browser: navigator.userAgent,
      os: navigator.platform,
      url: window.location.href,
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight
      },
      connection: navigator.connection ? {
        effectiveType: (navigator.connection as any).effectiveType,
        downlink: (navigator.connection as any).downlink,
        rtt: (navigator.connection as any).rtt
      } : null
    };
  }

  static async log(
    level: LogLevel,
    message: string,
    component?: string,
    context?: LogContext,
    metadata?: LogMetadata
  ) {
    try {
      const browserInfo = this.getBrowserInfo();
      const { error } = await supabase.from('application_logs').insert({
        level,
        message,
        component,
        context,
        metadata: {
          ...browserInfo,
          ...metadata
        }
      });

      if (error) {
        console.error('Failed to save log:', error);
      }

      if (process.env.NODE_ENV === 'development') {
        console.log(`[${level.toUpperCase()}] ${message}`, {
          component,
          context,
          metadata
        });
      }
    } catch (err) {
      console.error('Logging failed:', err);
    }
  }

  static async trackMetric(
    metricName: string,
    value: number,
    tags?: Record<string, any>
  ) {
    try {
      const browserInfo = this.getBrowserInfo();
      const { error } = await supabase.from('performance_metrics_enhanced').insert({
        metric_name: metricName,
        value,
        browser_info: browserInfo,
        metadata: tags,
        component: tags?.component,
        page_url: window.location.href
      });

      if (error) {
        console.error('Failed to save metric:', error);
      }
    } catch (err) {
      console.error('Metric tracking failed:', err);
    }
  }

  static async logWarning(message: string, details?: Record<string, unknown>) {
    await this.log('warn', message, undefined, details);
  }

  static async reportError(
    error: Error,
    errorType: string,
    componentStack?: string
  ) {
    try {
      const browserInfo = this.getBrowserInfo();
      const { error: dbError } = await supabase.from('error_reports').insert({
        error_type: errorType,
        message: error.message,
        stack_trace: error.stack,
        component_stack: componentStack,
        browser_info: browserInfo
      });

      if (dbError) {
        console.error('Failed to save error report:', dbError);
      }
    } catch (err) {
      console.error('Error reporting failed:', err);
    }
  }
}

export default LoggingService;