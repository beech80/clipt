import { cn } from "@/lib/utils";
import { Message } from "@/types/message";
import { useAuth } from "@/contexts/AuthContext";
import { Check, CheckCheck, Flag } from "lucide-react";
import { useEmotes } from "@/contexts/EmoteContext";
import { useReportDialog } from "@/hooks/use-report-dialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface MessageBubbleProps {
  message: Message;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const { user } = useAuth();
  const { emotes } = useEmotes();
  const { openReportDialog } = useReportDialog();
  const isOwn = message.sender_id === user?.id;

  const renderMessageContent = (content: string) => {
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
    <div className={cn("mb-4 group", isOwn ? "text-right" : "text-left")}>
      <div className="relative inline-block">
        <div
          className={cn(
            "p-3 rounded-lg max-w-[80%]",
            isOwn ? "bg-primary text-primary-foreground" : "bg-muted"
          )}
        >
          {renderMessageContent(message.content)}
        </div>
        {!isOwn && (
          <div className="absolute -right-8 top-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-6 w-6">
                  <Flag className="h-3 w-3 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleReport}>
                  Report Message
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
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