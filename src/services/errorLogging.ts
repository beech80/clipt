import { toast } from "sonner";

interface ErrorDetails {
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

  public logError(error: Error, details?: ErrorDetails) {
    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Error:', error);
      console.error('Details:', details);
    }

    // Show toast notification
    toast.error("An error occurred", {
      description: error.message,
      duration: 5000,
    });

    // Here you could add integration with external error tracking services
    // like Sentry, LogRocket, etc.
  }

  public logWarning(message: string, details?: Record<string, unknown>) {
    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.warn('Warning:', message);
      console.warn('Details:', details);
    }

    // Show toast notification
    toast.warning(message, {
      duration: 3000,
    });
  }
}

export const errorLogging = ErrorLoggingService.getInstance();