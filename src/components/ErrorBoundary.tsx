import { Component, ErrorInfo, ReactNode } from 'react';
import ErrorBoundaryCore from './error-boundary/ErrorBoundaryCore';
import { ErrorDisplay } from './error-boundary/ErrorDisplay';
import { OfflineDisplay } from './error-boundary/OfflineDisplay';
import { errorReportingService } from '@/services/errorReportingService';
import { toast } from "sonner";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  isOffline: boolean;
  retryCount: number;
  errorCategory: 'network' | 'runtime' | 'resource' | 'unknown';
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    isOffline: !navigator.onLine,
    retryCount: 0,
    errorCategory: 'unknown'
  };

  private maxRetries = 3;
  private retryDelay = 2000; // 2 seconds

  private handleOnline = () => {
    this.setState({ isOffline: false });
    if (this.state.errorCategory === 'network') {
      this.handleRetry();
    }
  };

  private handleOffline = () => {
    this.setState({ isOffline: true });
  };

  public componentDidMount() {
    window.addEventListener('online', this.handleOnline);
    window.addEventListener('offline', this.handleOffline);
  }

  public componentWillUnmount() {
    window.removeEventListener('online', this.handleOnline);
    window.removeEventListener('offline', this.handleOffline);
  }

  public static getDerivedStateFromError(error: Error): Partial<State> {
    // Categorize the error
    let errorCategory: State['errorCategory'] = 'runtime';
    
    if (error instanceof TypeError && error.message.includes('network')) {
      errorCategory = 'network';
    } else if (error.message.includes('loading') || error.message.includes('fetch')) {
      errorCategory = 'resource';
    }

    return { 
      hasError: true, 
      error,
      errorCategory,
      isOffline: !navigator.onLine 
    };
  }

  private categorizeError(error: Error): State['errorCategory'] {
    if (error.name === 'NetworkError' || error.message.includes('network')) {
      return 'network';
    }
    if (error.name === 'TypeError' || error.name === 'ReferenceError') {
      return 'runtime';
    }
    if (error.message.includes('loading') || error.message.includes('fetch')) {
      return 'resource';
    }
    return 'unknown';
  }

  private handleError = async (error: Error, errorInfo: ErrorInfo) => {
    const errorCategory = this.categorizeError(error);
    
    console.error('ErrorBoundary caught an error:', {
      error,
      errorInfo,
      category: errorCategory,
      retryCount: this.state.retryCount
    });

    await errorReportingService.reportError({
      error,
      context: 'react_error',
      componentStack: errorInfo.componentStack,
      additionalInfo: {
        errorType: errorCategory,
        retryCount: this.state.retryCount,
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString()
      }
    });

    // Show user-friendly toast for specific error categories
    if (errorCategory === 'network') {
      toast.error('Network connection issue. Retrying...');
    } else if (errorCategory === 'resource') {
      toast.error('Failed to load resource. Please try again.');
    }
  };

  private handleRetry = async () => {
    if (this.state.retryCount >= this.maxRetries) {
      toast.error('Maximum retry attempts reached. Please refresh the page.');
      return;
    }

    this.setState(prevState => ({
      retryCount: prevState.retryCount + 1
    }));

    // Implement exponential backoff
    const delay = this.retryDelay * Math.pow(2, this.state.retryCount);
    
    toast.loading('Retrying...');
    
    await new Promise(resolve => setTimeout(resolve, delay));
    
    this.setState({
      hasError: false,
      error: null
    });
  };

  public render() {
    if (this.state.isOffline) {
      return <OfflineDisplay onRetry={this.handleRetry} />;
    }

    if (this.state.hasError) {
      return this.props.fallback ? (
        this.props.fallback
      ) : (
        <ErrorDisplay
          title={this.getErrorTitle()}
          description={this.getErrorDescription()}
          onRetry={this.state.retryCount < this.maxRetries ? this.handleRetry : undefined}
          category={this.state.errorCategory}
          retryCount={this.state.retryCount}
          maxRetries={this.maxRetries}
        />
      );
    }

    return (
      <ErrorBoundaryCore onError={this.handleError}>
        {this.props.children}
      </ErrorBoundaryCore>
    );
  }

  private getErrorTitle(): string {
    switch (this.state.errorCategory) {
      case 'network':
        return 'Network Error';
      case 'runtime':
        return 'Application Error';
      case 'resource':
        return 'Resource Loading Error';
      default:
        return 'Something went wrong';
    }
  }

  private getErrorDescription(): string {
    const baseMessage = this.state.error?.message || "An unexpected error occurred";
    const retryMessage = this.state.retryCount < this.maxRetries 
      ? `\nRetrying... (Attempt ${this.state.retryCount + 1}/${this.maxRetries})`
      : '\nMaximum retry attempts reached. Please refresh the page.';
    
    return `${baseMessage}${retryMessage}`;
  }
}

export default ErrorBoundary;
