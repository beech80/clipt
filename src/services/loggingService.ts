import { supabase } from '@/lib/supabase';
import { redactLogValue } from '@/lib/log-redaction';

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface LogContext {
  [key: string]: unknown;
}

interface LogMetadata {
  browser?: string;
  os?: string;
  url?: string;
  [key: string]: unknown;
}

class LoggingService {
  private static getBrowserInfo(): LogMetadata {
    return {
      browser: navigator.userAgent,
      os: navigator.platform,
      url: window.location.pathname,
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight
      }
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
        message: String(redactLogValue(message)),
        component,
        context: redactLogValue(context),
        metadata: redactLogValue({
          ...browserInfo,
          ...metadata
        })
      });

      if (error) {
        console.error('Failed to save log:', error);
      }

      // Also log to console in development
      if (process.env.NODE_ENV === 'development') {
        console.log(`[${level.toUpperCase()}]`, redactLogValue({
          component,
          context,
          metadata
        }));
      }
    } catch (err) {
      console.error('Logging failed:', err);
    }
  }

  static async trackMetric(
    metricName: string,
    value: number,
    tags?: Record<string, string>
  ) {
    try {
      const { error } = await supabase.from('performance_metrics').insert({
        metric_name: metricName,
        value,
        tags
      });

      if (error) {
        console.error('Failed to save metric:', error);
      }
    } catch (err) {
      console.error('Metric tracking failed:', err);
    }
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
        message: String(redactLogValue(error.message)),
        stack_trace: String(redactLogValue(error.stack ?? '')),
        component_stack: String(redactLogValue(componentStack ?? '')),
        browser_info: redactLogValue(browserInfo)
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
