import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  isOffline: boolean;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      isOffline: !navigator.onLine
    };
  }

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

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error,
      errorInfo: null,
      isOffline: !navigator.onLine
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log the error to console
    console.error('Error caught by ErrorBoundary:', error, errorInfo);
    this.setState({
      error,
      errorInfo
    });
  }

  handleRetry = (): void => {
    // If on a profile page, navigate home instead
    if (window.location.pathname.includes('/profile/')) {
      window.location.href = '/';
      return;
    }
    
    // Otherwise refresh the page to retry
    window.location.reload();
  };

  render(): ReactNode {
    if (this.state.isOffline) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
          <div className="max-w-md w-full space-y-4">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>You're Offline</AlertTitle>
              <AlertDescription>
                Please check your internet connection and try again.
              </AlertDescription>
            </Alert>
            <Button 
              onClick={() => window.location.reload()} 
              className="w-full"
            >
              Retry Connection
            </Button>
          </div>
        </div>
      );
    }

    if (this.state.hasError) {
      const errorMessage = this.state.error?.message || 'Something went wrong';
      
      // Custom fallback UI
      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gaming-950 text-white p-6">
          <div className="w-full max-w-md flex flex-col items-center space-y-6 bg-gaming-900 border border-gaming-700 rounded-xl p-8 shadow-lg">
            <AlertCircle className="w-16 h-16 text-red-500" />
            <h1 className="text-2xl font-bold text-red-400">Something went wrong</h1>
            <div className="text-gray-300 text-center">
              <p className="text-sm mb-4">{errorMessage}</p>
              {this.state.error?.stack && (
                <details className="mt-4 text-left">
                  <summary className="cursor-pointer text-gaming-300 hover:text-gaming-200 text-sm mb-2">
                    Error Details
                  </summary>
                  <pre className="text-xs bg-gaming-950 p-4 rounded overflow-auto max-h-40">
                    {this.state.error?.stack}
                  </pre>
                </details>
              )}
            </div>
            <div className="flex space-x-4">
              <Button 
                onClick={this.handleRetry}
                className="bg-gaming-600 hover:bg-gaming-500 text-white flex items-center space-x-2"
              >
                <RefreshCw className="w-4 h-4" />
                <span>{window.location.pathname.includes('/profile/') ? 'Go Home' : 'Try Again'}</span>
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;