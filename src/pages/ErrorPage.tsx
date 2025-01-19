import { Button } from "@/components/ui/button";
import { AlertOctagon, RefreshCw, Home } from "lucide-react";
import { Link } from "react-router-dom";

interface ErrorPageProps {
  error?: Error;
  resetErrorBoundary?: () => void;
}

const ErrorPage = ({ error, resetErrorBoundary }: ErrorPageProps) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="max-w-md w-full space-y-8 text-center">
        <div className="space-y-4">
          <AlertOctagon className="mx-auto h-12 w-12 text-red-500" />
          <h1 className="text-2xl font-bold">Something Went Wrong</h1>
          <p className="text-muted-foreground">
            {error?.message || "An unexpected error occurred. Please try again."}
          </p>
          {process.env.NODE_ENV === 'development' && error?.stack && (
            <pre className="mt-4 p-4 bg-muted rounded-lg text-left text-sm overflow-auto max-h-48">
              {error.stack}
            </pre>
          )}
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button 
            onClick={resetErrorBoundary} 
            variant="outline"
            className="gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Try Again
          </Button>
          <Button asChild variant="outline">
            <Link to="/" className="flex items-center gap-2">
              <Home className="h-4 w-4" />
              Go Home
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ErrorPage;