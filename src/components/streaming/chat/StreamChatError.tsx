import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

export function StreamChatError() {
  return (
    <div className="flex flex-col items-center justify-center h-full p-4 space-y-4">
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>Failed to load chat messages</AlertDescription>
      </Alert>
      <Button 
        onClick={() => window.location.reload()}
        variant="outline"
      >
        Try Again
      </Button>
    </div>
  );
}