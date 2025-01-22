import { Component, ErrorInfo, ReactNode } from 'react';
import ErrorBoundaryCore from './error-boundary/ErrorBoundaryCore';
import { ErrorDisplay } from './error-boundary/ErrorDisplay';
import { OfflineDisplay } from './error-boundary/OfflineDisplay';
import { errorReportingService } from '@/services/errorReportingService';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  isOffline: boolean;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    isOffline: !navigator.onLine
  };

  private handleOnline = () => {
    this.setState({ isOffline: false });
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

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, isOffline: !navigator.onLine };
  }

  private handleError = (error: Error, errorInfo: ErrorInfo) => {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    errorReportingService.reportError({
      error,
      context: 'react_error',
      componentStack: errorInfo.componentStack
    });
  };

  private handleRetry = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public render() {
    if (this.state.isOffline) {
      return <OfflineDisplay />;
    }

    if (this.state.hasError) {
      return this.props.fallback ? (
        this.props.fallback
      ) : (
        <ErrorDisplay
          title="Something went wrong"
          description={this.state.error?.message || "An unexpected error occurred"}
          onRetry={this.handleRetry}
        />
      );
    }

    return (
      <ErrorBoundaryCore onError={this.handleError}>
        {this.props.children}
      </ErrorBoundaryCore>
    );
  }
}

export default ErrorBoundary;