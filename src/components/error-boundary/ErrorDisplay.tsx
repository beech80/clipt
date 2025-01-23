import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

interface ErrorDisplayProps {
  title: string;
  description: string;
  onRetry?: () => void;
  category: 'network' | 'runtime' | 'resource' | 'unknown';
  retryCount: number;
  maxRetries: number;
}

export const ErrorDisplay = ({ 
  title, 
  description, 
  onRetry,
  category,
  retryCount,
  maxRetries
}: ErrorDisplayProps) => {
  const progress = (retryCount / maxRetries) * 100;

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="max-w-md w-full space-y-4">
        <Alert variant={category === 'runtime' ? 'destructive' : 'default'}>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle className="flex items-center gap-2">
            {title}
            <span className="text-xs px-2 py-0.5 rounded-full bg-muted">
              {category}
            </span>
          </AlertTitle>
          <AlertDescription className="mt-2 space-y-4">
            <p>{description}</p>
            {retryCount > 0 && (
              <Progress value={progress} className="h-1" />
            )}
          </AlertDescription>
        </Alert>
        {onRetry && (
          <Button 
            onClick={onRetry} 
            className="w-full"
            disabled={retryCount >= maxRetries}
          >
            Try Again
          </Button>
        )}
      </div>
    </div>
  );
};