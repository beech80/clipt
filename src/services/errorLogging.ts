import { toast } from "sonner";
import { supabase } from '@/lib/supabase';

export interface ErrorDetails {
  message: string;
  stack?: string;
  componentStack?: string;
  additionalInfo?: Record<string, unknown>;
}

class ErrorLoggingService {
  private static instance: ErrorLoggingService;

  private constructor() {}

  public static getInstance(): ErrorLoggingService {
    if (!ErrorLoggingService.instance) {
      ErrorLoggingService.instance = new ErrorLoggingService();
    }
    return ErrorLoggingService.instance;
  }

  private async logToSupabase(level: string, error: Error | string, details?: Partial<ErrorDetails>) {
    try {
      const browserInfo = {
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        language: navigator.language,
        viewport: {
          width: window.innerWidth,
          height: window.innerHeight
        }
      };

      const { error: dbError } = await supabase.from('error_reports').insert({
        error_type: level,
        message: typeof error === 'string' ? error : error.message,
        stack_trace: error instanceof Error ? error.stack : undefined,
        browser_info: browserInfo,
        url: window.location.href,
        component_stack: details?.componentStack
      });

      if (dbError) {
        console.error('Failed to log error to Supabase:', dbError);
      }
    } catch (e) {
      console.error('Error logging failed:', e);
    }
  }

  public async logError(error: Error, details?: Partial<ErrorDetails>) {
    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Error:', error);
      console.error('Details:', details);
    }

    await this.logToSupabase('error', error, details);

    // Show toast notification
    toast.error("An error occurred", {
      description: error.message,
      duration: 5000,
    });
  }

  public async logWarning(message: string, details?: Record<string, unknown>) {
    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.warn('Warning:', message);
      console.warn('Details:', details);
    }

    await this.logToSupabase('warning', message, { additionalInfo: details });

    // Show toast notification
    toast.warning(message, {
      duration: 3000,
    });
  }

  public async logInfo(message: string, details?: Record<string, unknown>) {
    await this.logToSupabase('info', message, { additionalInfo: details });
  }
}

export const errorLogging = ErrorLoggingService.getInstance();