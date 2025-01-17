import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, RefreshCw } from "lucide-react";

interface ErrorFallbackProps {
  error: Error;
  resetErrorBoundary: () => void;
}

export function ErrorFallback({ error, resetErrorBoundary }: ErrorFallbackProps) {
  return (
    <div className="p-4 space-y-4">
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription className="mt-2">
          <p className="text-sm">{error.message}</p>
          {error.stack && (
            <pre className="mt-2 text-xs overflow-auto max-h-40 bg-secondary/10 p-2 rounded">
              {error.stack}
            </pre>
          )}
        </AlertDescription>
      </Alert>
      <div className="flex justify-end">
        <Button
          onClick={resetErrorBoundary}
          variant="outline"
          className="gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Try again
        </Button>
      </div>
    </div>
  );
}