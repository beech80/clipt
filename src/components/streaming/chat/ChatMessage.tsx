import React from 'react';
import { motion } from 'framer-motion';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { useEmotes } from '@/contexts/EmoteContext';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Flag, MoreVertical } from 'lucide-react';
import { useReportDialog } from '@/hooks/use-report-dialog';
import type { StreamChatMessage } from '@/types/chat';
import { toast } from 'sonner';

interface ChatMessageProps {
  message: StreamChatMessage;
  isHighlighted?: boolean;
  isModeratorView?: boolean;
  onDelete?: (messageId: string) => void;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ 
  message, 
  isHighlighted,
  isModeratorView,
  onDelete 
}) => {
  const { emotes } = useEmotes();
  const { user } = useAuth();
  const { openReportDialog } = useReportDialog();
  
  const renderMessageContent = (content: string) => {
    const words = content.split(' ');
    
    return words.map((word, index) => {
      const emote = emotes.find(e => `:${e.name}:` === word);
      
      if (emote) {
        return (
          <motion.img
            key={`${index}-${emote.id}`}
            src={emote.url}
            alt={emote.name}
            className="inline-block w-6 h-6 mx-1 align-middle"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            whileHover={{ scale: 1.2 }}
            transition={{ type: "spring", stiffness: 400, damping: 10 }}
          />
        );
      }
      
      return <span key={index}>{word} </span>;
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

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "px-4 py-2 hover:bg-gaming-400/5 transition-colors group relative",
        isHighlighted && "bg-gaming-400/10"
      )}
    >
      <div className="flex items-start gap-2">
        <Avatar className="w-6 h-6">
          <AvatarImage src={message.profiles?.avatar_url} />
          <AvatarFallback>{message.profiles?.username?.[0]}</AvatarFallback>
        </Avatar>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2">
            <span className="font-medium text-sm text-gaming-400">
              {message.profiles?.username}
            </span>
            <span className="text-xs text-muted-foreground">
              {new Date(message.created_at).toLocaleTimeString()}
            </span>
          </div>
          
          <div className="text-sm mt-1 break-words">
            {renderMessageContent(message.message)}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isModeratorView && onDelete && (
            <Button
              onClick={() => onDelete(message.id)}
              variant="ghost"
              size="sm"
              className="opacity-0 group-hover:opacity-100 text-xs text-red-500 hover:text-red-600 transition-opacity"
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
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleReport}>
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