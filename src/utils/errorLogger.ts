type ErrorSeverity = 'low' | 'medium' | 'high' | 'critical';

interface ErrorLog {
  message: string;
  stack?: string;
  severity: ErrorSeverity;
  timestamp: string;
  userId?: string;
  metadata?: Record<string, any>;
}

class ErrorLogger {
  private static instance: ErrorLogger;
  private logs: ErrorLog[] = [];

  private constructor() {}

  static getInstance(): ErrorLogger {
    if (!ErrorLogger.instance) {
      ErrorLogger.instance = new ErrorLogger();
    }
    return ErrorLogger.instance;
  }

  log(error: Error, severity: ErrorSeverity = 'medium', metadata?: Record<string, any>) {
    const errorLog: ErrorLog = {
      message: error.message,
      stack: error.stack,
      severity,
      timestamp: new Date().toISOString(),
      metadata
    };

    this.logs.push(errorLog);
    console.error('Error logged:', errorLog);

    // In production, you would send this to your error tracking service
    if (process.env.NODE_ENV === 'production') {
      // Send to error tracking service
    }
  }

  getLogs(): ErrorLog[] {
    return this.logs;
  }

  clearLogs() {
    this.logs = [];
  }
}

export const errorLogger = ErrorLogger.getInstance();