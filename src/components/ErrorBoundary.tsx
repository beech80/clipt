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
  isOffline: boolean;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
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

  private handleError = (error: Error, errorInfo: ErrorInfo) => {
    errorReportingService.reportError({
      error,
      context: 'react_error',
      componentStack: errorInfo.componentStack
    });
  };

  private handleRetry = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.isOffline) {
      return <OfflineDisplay />;
    }

    return (
      <ErrorBoundaryCore onError={this.handleError}>
        {this.props.fallback ? (
          this.props.fallback
        ) : (
          <ErrorDisplay
            title="Something went wrong"
            description="An unexpected error occurred"
            onRetry={this.handleRetry}
          />
        )}
        {this.props.children}
      </ErrorBoundaryCore>
    );
  }
}

export default ErrorBoundary;