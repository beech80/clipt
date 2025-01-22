import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

interface ErrorDisplayProps {
  title: string;
  description: string;
  onRetry?: () => void;
}

export const ErrorDisplay = ({ title, description, onRetry }: ErrorDisplayProps) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="max-w-md w-full space-y-4">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>{title}</AlertTitle>
          <AlertDescription>{description}</AlertDescription>
        </Alert>
        {onRetry && (
          <Button onClick={onRetry} className="w-full">
            Try Again
          </Button>
        )}
      </div>
    </div>
  );
};