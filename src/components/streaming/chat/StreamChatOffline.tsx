import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export function StreamChatOffline() {
  return (
    <div className="flex items-center justify-center h-full p-4">
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Chat is currently offline. The stream may have ended or chat might be disabled.
        </AlertDescription>
      </Alert>
    </div>
  );
}