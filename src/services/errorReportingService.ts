import LoggingService from './loggingService';
import { supabase } from '@/lib/supabase';

interface ErrorDetails {
  error: Error;
  context?: string;
  componentStack?: string;
  additionalInfo?: Record<string, unknown>;
}

class ErrorReportingService {
  private static instance: ErrorReportingService;

  private constructor() {}

  public static getInstance(): ErrorReportingService {
    if (!ErrorReportingService.instance) {
      ErrorReportingService.instance = new ErrorReportingService();
    }
    return ErrorReportingService.instance;
  }

  public async reportError({ error, context, componentStack, additionalInfo }: ErrorDetails): Promise<void> {
    // Log to our logging service
    LoggingService.reportError(error, context || 'unspecified', componentStack);

    // Store in Supabase for analysis
    try {
      await supabase.from('error_reports').insert({
        error_type: additionalInfo?.errorType || 'unknown',
        message: error.message,
        stack_trace: error.stack,
        component_stack: componentStack,
        browser_info: {
          userAgent: navigator.userAgent,
          platform: navigator.platform,
          language: navigator.language,
        },
        metadata: additionalInfo
      });
    } catch (e) {
      console.error('Failed to store error report:', e);
    }
  }

  public async reportWarning(message: string, details?: Record<string, unknown>): Promise<void> {
    LoggingService.logWarning(message, details);
  }
}

export const errorReportingService = ErrorReportingService.getInstance();