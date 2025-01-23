import { cn } from "@/lib/utils";
import { Message } from "@/types/message";
import { useAuth } from "@/contexts/AuthContext";
import { Check, CheckCheck, Flag, Clock } from "lucide-react";
import { useEmotes } from "@/contexts/EmoteContext";
import { useReportDialog } from "@/hooks/use-report-dialog";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface MessageBubbleProps {
  message: Message;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const { user } = useAuth();
  const { emotes } = useEmotes();
  const { openReportDialog } = useReportDialog();
  const isOwn = message.sender_id === user?.id;

  const renderMessageContent = (content: string) => {
    // Handle attachments
    if (content.startsWith('[Attachment]')) {
      const url = content.match(/\((.*?)\)/)?.[1];
      if (!url) return content;

      if (url.match(/\.(jpg|jpeg|png|gif)$/i)) {
        return <img src={url} alt="attachment" className="max-w-xs rounded-lg" />;
      }
      return <a href={url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">View Attachment</a>;
    }

    // Handle emotes
    const parts = content.split(/(:[a-zA-Z0-9_]+:)/g);
    return parts.map((part, index) => {
      if (part.match(/^:[a-zA-Z0-9_]+:$/)) {
        const emoteName = part.slice(1, -1);
        const emote = emotes.find(e => e.name === emoteName);
        if (emote) {
          return (
            <img
              key={index}
              src={emote.url}
              alt={emoteName}
              className="inline-block h-6 w-6 align-middle"
            />
          );
        }
      }
      return <span key={index}>{part}</span>;
    });
  };

  const handleReport = () => {
    openReportDialog(message.id, 'chat_message');
  };

  return (
    <div className={cn(
      "mb-4 group flex gap-2",
      isOwn ? "flex-row-reverse" : "flex-row"
    )}>
      <Avatar className="h-8 w-8 flex-shrink-0">
        <AvatarImage src={isOwn ? message.sender?.avatar_url : message.receiver?.avatar_url} />
        <AvatarFallback>
          {(isOwn ? message.sender?.username : message.receiver?.username)?.[0]?.toUpperCase() || '?'}
        </AvatarFallback>
      </Avatar>

      <div className="flex flex-col max-w-[70%]">
        <div className={cn(
          "px-3 py-2 rounded-lg",
          isOwn ? "bg-primary text-primary-foreground" : "bg-muted"
        )}>
          {renderMessageContent(message.content)}
        </div>
        
        <div className={cn(
          "flex items-center gap-1 mt-1 text-xs text-muted-foreground",
          isOwn ? "justify-end" : "justify-start"
        )}>
          {format(new Date(message.created_at), 'HH:mm')}
          {isOwn && (
            message.read ? (
              <CheckCheck className="h-3 w-3" />
            ) : (
              <Check className="h-3 w-3" />
            )
          )}
        </div>
      </div>

      {!isOwn && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <Flag className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={handleReport}>
              Report Message
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
}