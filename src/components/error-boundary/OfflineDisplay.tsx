import { AlertCircle, RefreshCw } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

interface OfflineDisplayProps {
  onRetry: () => void;
}

export const OfflineDisplay = ({ onRetry }: OfflineDisplayProps) => {
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
          onClick={onRetry} 
          className="w-full"
          variant="default"
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          Retry Connection
        </Button>
      </div>
    </div>
  );
};