import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface PostListErrorProps {
  error: Error | null;
  onRetry: () => void;
}

export const PostListError = ({ error, onRetry }: PostListErrorProps) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] p-4">
      <Alert variant="destructive" className="mb-4 max-w-md w-full">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          {error?.message || "Error loading posts"}
        </AlertDescription>
      </Alert>
      <Button 
        onClick={onRetry}
        variant="secondary"
        className="mt-4"
      >
        Try Again
      </Button>
    </div>
  );
};