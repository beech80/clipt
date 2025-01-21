import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Flag, MoreVertical } from 'lucide-react';

interface ChatMessageActionsProps {
  isModeratorView?: boolean;
  isOwnMessage: boolean;
  onDelete?: (messageId: string) => void;
  onReport: () => void;
  messageId: string;
}

export const ChatMessageActions = ({ 
  isModeratorView, 
  isOwnMessage, 
  onDelete, 
  onReport,
  messageId 
}: ChatMessageActionsProps) => {
  return (
    <div className="flex items-center gap-2">
      {isModeratorView && onDelete && (
        <Button
          onClick={() => onDelete(messageId)}
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
            <DropdownMenuItem onClick={onReport} className="text-destructive">
              <Flag className="h-4 w-4 mr-2" />
              Report Message
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
};