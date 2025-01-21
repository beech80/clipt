import { motion } from "framer-motion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { useEmotes } from '@/contexts/EmoteContext';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Flag, MoreVertical, Shield } from 'lucide-react';
import { useReportDialog } from '@/hooks/use-report-dialog';
import type { StreamChatMessage } from '@/types/chat';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';

interface ChatMessageProps {
  message: StreamChatMessage;
  isModeratorView?: boolean;
  onDelete?: (messageId: string) => void;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({
  message,
  isModeratorView,
  onDelete 
}) => {
  const { emotes } = useEmotes();
  const { user } = useAuth();
  const { openReportDialog } = useReportDialog();
  
  const renderMessageContent = (content: string) => {
    const words = content.split(' ');
    return words.map((word, index) => {
      const emote = emotes.find(e => e.name === word);
      if (emote) {
        return (
          <motion.img
            key={`${index}-${word}`}
            src={emote.url}
            alt={emote.name}
            className="inline-block h-6 align-middle mx-1"
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            whileHover={{ 
              scale: 1.2,
              transition: { duration: 0.2 }
            }}
            title={emote.name}
          />
        );
      }
      return (
        <span key={`${index}-${word}`} className="mr-1">
          {word}
        </span>
      );
    });
  };

  const handleReport = () => {
    openReportDialog(message.id, 'chat_message');
    toast.success('Report submitted successfully');
  };

  if (message.is_deleted) {
    return (
      <div className="px-4 py-2 text-sm text-muted-foreground italic">
        Message deleted
      </div>
    );
  }

  const isOwnMessage = user?.id === message.user_id;
  const timeAgo = formatDistanceToNow(new Date(message.created_at), { addSuffix: true });

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "group relative flex items-start gap-2 px-4 py-2 hover:bg-accent/50 transition-colors",
        isOwnMessage && "bg-accent/20"
      )}
    >
      <div className="flex-shrink-0">
        <Avatar className="h-8 w-8">
          <AvatarImage src={message.profiles?.avatar_url} />
          <AvatarFallback>
            {message.profiles?.username?.charAt(0).toUpperCase() || 'U'}
          </AvatarFallback>
        </Avatar>
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm">
              {message.profiles?.username}
            </span>
            {message.user?.is_moderator && (
              <Badge variant="secondary" className="px-1 py-0">
                <Shield className="h-3 w-3 mr-1" />
                Mod
              </Badge>
            )}
            <span className="text-xs text-muted-foreground">
              {timeAgo}
            </span>
          </div>
        </div>
        
        <div className="text-sm break-words">
          {renderMessageContent(message.message)}
        </div>

        <div className="flex items-center gap-2">
          {isModeratorView && onDelete && (
            <Button
              onClick={() => onDelete(message.id)}
              variant="ghost"
              size="sm"
              className="opacity-0 group-hover:opacity-100 text-destructive hover:text-destructive/90 hover:bg-destructive/10"
            >
              Delete
            </Button>
          )}

          {!isOwnMessage && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="opacity-0 group-hover:opacity-100 h-6 w-6 p-0"
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                <DropdownMenuItem onClick={handleReport} className="text-destructive">
                  <Flag className="h-4 w-4 mr-2" />
                  Report Message
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default ChatMessage;