import React, { Component, ErrorInfo, ReactNode } from 'react';
import { toast } from "sonner";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error caught by boundary:', error);
    console.error('Error info:', errorInfo);
    
    this.logError(error, errorInfo);
  }

  private logError = async (error: Error, errorInfo: ErrorInfo) => {
    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.group('🚨 Error Boundary Caught Error');
      console.error('Error:', error);
      console.error('Error Info:', errorInfo);
      console.groupEnd();
    }

    // Show toast notification
    toast.error("An error occurred", {
      description: error.message,
      duration: 5000,
      action: {
        label: "Refresh",
        onClick: () => window.location.reload(),
      },
    });

    // Here you could add integration with external error tracking services
    // like Sentry, LogRocket, etc.
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[400px] p-8 bg-[#9BA4B5] border-4 border-[#2B2B2B] rounded-lg shadow-lg m-4">
          <div className="bg-[#2B2B2B] p-6 rounded-lg text-center space-y-4 max-w-md w-full" style={{ 
            fontFamily: "'Press Start 2P', monospace",
            imageRendering: 'pixelated'
          }}>
            <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-lg text-[#86C06C] mb-4">GAME OVER</h2>
            <p className="text-sm text-[#86C06C] mb-6 leading-relaxed">
              {this.state.error?.message || "An unexpected error occurred"}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-[#86C06C] text-[#2B2B2B] rounded hover:bg-[#9BC17D] transition-colors"
              style={{ fontFamily: "'Press Start 2P', monospace" }}
            >
              <RefreshCw className="w-4 h-4" />
              <span className="text-xs">CONTINUE?</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;