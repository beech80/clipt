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
        <div className="min-h-screen flex items-center justify-center bg-[#0f112a] p-4">
          <div className="max-w-md w-full space-y-4 retro-border p-8">
            <div className="text-center">
              <h2 className="pixel-font text-2xl mb-4 text-[#ff4d4a] retro-text-shadow game-over-text">CONNECTION LOST</h2>
              <div className="mb-6 bg-[#1a1d45] p-4 border border-[#4a4dff]">
                <div className="pixel-font text-[#5ce1ff] mb-2">ERROR CODE: #404</div>
                <p className="text-gray-300 mb-2">Network cable unplugged</p>
                <p className="text-sm text-gray-400">Please check your internet connection and try again.</p>
              </div>
              <Button 
                onClick={() => window.location.reload()} 
                className="retro-button w-full"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                RETRY CONNECTION
              </Button>
            </div>
          </div>
        </div>
      );
    }

    if (this.state.hasError) {
      const errorMessage = this.state.error?.message || 'Critical system error';
      
      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-[#0f112a] text-white p-6">
          <div className="w-full max-w-md flex flex-col items-center space-y-6 retro-border p-8">
            <div className="bug-glitch" data-text="BUG DETECTED">
              <h1 className="text-3xl font-bold text-[#ff4d4a] pixel-font retro-text-shadow mb-2">BUG DETECTED</h1>
            </div>
            
            <div className="w-16 h-16 bg-[#141644] border-2 border-[#4a4dff] flex items-center justify-center mb-4">
              <AlertCircle className="w-10 h-10 text-[#ff4d4a]" />
            </div>
            
            <div className="text-center w-full">
              <div className="bg-[#1a1d45] p-4 border-2 border-[#4a4dff] mb-4">
                <p className="pixel-font text-[#5ce1ff] mb-2">SYSTEM MALFUNCTION</p>
                <p className="mb-2 overflow-hidden text-ellipsis">"{errorMessage}"</p>
                <p className="text-sm text-[#ff4d4a]">PRESS RESTART TO CONTINUE</p>
              </div>
              
              {this.state.error?.stack && (
                <details className="mt-4 text-left">
                  <summary className="cursor-pointer text-[#5ce1ff] hover:text-[#00c3ff] text-sm mb-2 pixel-font">
                    DEBUG INFORMATION
                  </summary>
                  <pre className="text-xs bg-[#141644] p-4 border border-[#4a4dff] overflow-auto max-h-40 font-mono">
                    {this.state.error?.stack}
                  </pre>
                </details>
              )}
            </div>
            
            <div className="mt-6 w-full">
              <Button 
                onClick={this.handleRetry}
                className="retro-button w-full"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                <span className="pixel-font">{window.location.pathname.includes('/profile/') ? 'RETURN TO HOME' : 'RESTART GAME'}</span>
              </Button>
            </div>
          </div>
          
          <div className="mt-6 text-xs text-[#5ce1ff] pixel-font text-center">
            <p>ERROR CODE: CL-01</p>
            <p className="mt-1"> CLIPT 2025 GAME SYSTEM</p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;