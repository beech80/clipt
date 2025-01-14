import { cn } from "@/lib/utils";
import { Message } from "@/types/message";
import { useAuth } from "@/contexts/AuthContext";
import { Check, CheckCheck } from "lucide-react";

interface MessageBubbleProps {
  message: Message;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const { user } = useAuth();
  const isOwn = message.sender_id === user?.id;

  return (
    <div className={cn("mb-4", isOwn ? "text-right" : "text-left")}>
      <div
        className={cn(
          "inline-block p-3 rounded-lg max-w-[80%] relative",
          isOwn ? "bg-primary text-primary-foreground" : "bg-muted"
        )}
      >
        {message.content}
        {isOwn && (
          <span className="absolute -bottom-4 right-0 text-muted-foreground">
            {message.read ? (
              <CheckCheck className="h-4 w-4" />
            ) : (
              <Check className="h-4 w-4" />
            )}
          </span>
        )}
      </div>
      <div className="text-xs text-muted-foreground mt-1">
        {new Date(message.created_at).toLocaleTimeString()}
      </div>
    </div>
  );
}