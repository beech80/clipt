import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw } from "lucide-react";

const MaintenanceMode = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="max-w-md w-full space-y-8 text-center">
        <div className="space-y-4">
          <AlertTriangle className="mx-auto h-12 w-12 text-yellow-500" />
          <h1 className="text-2xl font-bold">Under Maintenance</h1>
          <p className="text-muted-foreground">
            We're currently performing scheduled maintenance to improve your experience.
            Please check back soon.
          </p>
          <p className="text-sm text-muted-foreground">
            Estimated completion: ~30 minutes
          </p>
        </div>
        
        <Button 
          onClick={() => window.location.reload()} 
          variant="outline"
          className="gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Check Again
        </Button>
      </div>
    </div>
  );
};

export default MaintenanceMode;