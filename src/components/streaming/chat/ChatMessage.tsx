import { StreamChatMessage } from "@/types/chat";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDistanceToNow } from "date-fns";

interface ChatMessageProps {
  message: StreamChatMessage;
  isModeratorView?: boolean;
  onDelete?: (messageId: string) => void;
}

export const ChatMessage = ({ message, isModeratorView, onDelete }: ChatMessageProps) => {
  const formattedTime = formatDistanceToNow(new Date(message.created_at), { addSuffix: true });

  return (
    <div className="group flex items-start gap-2 p-2 hover:bg-muted/50 rounded-lg transition-colors">
      <Avatar className="h-8 w-8">
        <AvatarImage src={message.profiles?.avatar_url || ''} />
        <AvatarFallback>{message.profiles?.username?.[0]?.toUpperCase()}</AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-sm">{message.profiles?.username}</span>
          <span className="text-xs text-muted-foreground">{formattedTime}</span>
        </div>
        <p className="text-sm break-words">{message.message}</p>
      </div>
      {isModeratorView && !message.is_deleted && (
        <button
          onClick={() => onDelete?.(message.id)}
          className="opacity-0 group-hover:opacity-100 text-destructive hover:text-destructive/80 text-xs transition-opacity"
        >
          Delete
        </button>
      )}
    </div>
  );
};