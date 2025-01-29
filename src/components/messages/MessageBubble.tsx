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
    <div className={cn("mb-4 group", isOwn ? "text-right" : "text-left")}>
      <div className="relative inline-block">
        <div
          className={cn(
            "p-3 rounded-lg max-w-[80%] border",
            isOwn 
              ? "bg-gaming-700 text-gaming-100 border-gaming-600" 
              : "bg-gaming-800 border-gaming-700"
          )}
        >
          {message.content}
        </div>
        {isOwn && (
          <span className="absolute -bottom-4 right-0 text-gaming-400">
            {message.read ? (
              <CheckCheck className="h-4 w-4" />
            ) : (
              <Check className="h-4 w-4" />
            )}
          </span>
        )}
      </div>
      <div className="text-xs text-gaming-400 mt-1">
        {new Date(message.created_at).toLocaleTimeString()}
      </div>
    </div>
  );
}