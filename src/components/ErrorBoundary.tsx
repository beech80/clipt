import React, { Component, ErrorInfo, ReactNode } from 'react';
import LoggingService from '@/services/loggingService';
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  isOffline: boolean;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
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

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    LoggingService.reportError(error, 'react_error', errorInfo.componentStack);
  }

  private handleRetry = () => {
    this.setState({ hasError: false });
    window.location.reload();
  };

  public render() {
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
      return this.props.fallback || (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
          <div className="max-w-md w-full space-y-4">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Something went wrong</AlertTitle>
              <AlertDescription>
                {this.state.error?.message || 'An unexpected error occurred'}
              </AlertDescription>
            </Alert>
            <Button 
              onClick={this.handleRetry} 
              className="w-full"
            >
              Try Again
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;