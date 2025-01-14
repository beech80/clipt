import { cn } from "@/lib/utils";
import { Message } from "@/types/message";
import { useAuth } from "@/contexts/AuthContext";

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
          "inline-block p-3 rounded-lg max-w-[80%]",
          isOwn ? "bg-primary text-primary-foreground" : "bg-muted"
        )}
      >
        {message.content}
      </div>
      <div className="text-xs text-muted-foreground mt-1">
        {new Date(message.created_at).toLocaleTimeString()}
      </div>
    </div>
  );
}