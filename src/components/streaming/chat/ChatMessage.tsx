import { useState } from "react";
import { format } from "date-fns";
import { MoreHorizontal, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import type { StreamChatMessage } from "@/types/chat";

interface ChatMessageProps {
  message: StreamChatMessage;
  onDelete?: (messageId: string) => void;
  isModeratorView?: boolean;
}

export function ChatMessage({ message, onDelete, isModeratorView }: ChatMessageProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!onDelete) return;
    
    try {
      setIsDeleting(true);
      await onDelete(message.id);
      toast.success("Message deleted successfully");
    } catch (error) {
      toast.error("Failed to delete message");
      console.error("Error deleting message:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  if (message.is_deleted) {
    return (
      <div className="px-4 py-2 text-sm text-muted-foreground italic">
        Message deleted
      </div>
    );
  }

  return (
    <div className="group px-4 py-2 hover:bg-muted/50 flex items-start gap-2">
      <Avatar className="h-8 w-8">
        <AvatarImage src={message.profiles.avatar_url} />
        <AvatarFallback>
          {message.profiles.username.charAt(0).toUpperCase()}
        </AvatarFallback>
      </Avatar>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-sm">
            {message.profiles.username}
          </span>
          <span className="text-xs text-muted-foreground">
            {format(new Date(message.created_at), 'HH:mm')}
          </span>
        </div>
        
        <p className="text-sm break-words">
          {message.message}
        </p>
      </div>

      {(onDelete && (isModeratorView || message.user_id === message.profiles.id)) && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="ghost" 
              size="sm"
              className="opacity-0 group-hover:opacity-100"
              disabled={isDeleting}
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={handleDelete}
              className="text-destructive"
            >
              Delete Message
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
}