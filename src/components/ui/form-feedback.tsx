import { CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface FormFeedbackProps {
  isLoading?: boolean;
  isSuccess?: boolean;
  isError?: boolean;
  message?: string;
  className?: string;
}

export function FormFeedback({ 
  isLoading, 
  isSuccess, 
  isError, 
  message,
  className 
}: FormFeedbackProps) {
  if (!isLoading && !isSuccess && !isError) return null;

  return (
    <div className={cn(
      "flex items-center gap-2 text-sm",
      isSuccess && "text-green-600",
      isError && "text-destructive",
      className
    )}>
      {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
      {isSuccess && <CheckCircle className="h-4 w-4" />}
      {isError && <AlertCircle className="h-4 w-4" />}
      {message}
    </div>
  );
}