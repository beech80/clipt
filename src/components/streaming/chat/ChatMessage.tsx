import { motion } from "framer-motion";
import { useAuth } from '@/contexts/AuthContext';
import { useReportDialog } from '@/hooks/use-report-dialog';
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { StreamChatMessage } from '@/types/chat';
import { ChatMessageAvatar } from "./message/ChatMessageAvatar";
import { ChatMessageHeader } from "./message/ChatMessageHeader";
import { ChatMessageContent } from "./message/ChatMessageContent";
import { ChatMessageActions } from "./message/ChatMessageActions";

interface ChatMessageProps {
  message: StreamChatMessage;
  isModeratorView?: boolean;
  onDelete?: (messageId: string) => void;
}

export const ChatMessage = ({
  message,
  isModeratorView,
  onDelete 
}: ChatMessageProps) => {
  const { user } = useAuth();
  const { openReportDialog } = useReportDialog();
  
  // Early return for deleted messages
  if (message.is_deleted) {
    return (
      <div className="px-4 py-2 text-sm text-muted-foreground italic">
        Message deleted
      </div>
    );
  }

  const handleReport = () => {
    openReportDialog(message.id, 'chat_message');
    toast.success('Report submitted successfully');
  };

  const isOwnMessage = user?.id === message.user_id;
  const isModerator = message.profiles?.is_moderator ?? false;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "group relative flex items-start gap-2 px-4 py-2 hover:bg-accent/50 transition-colors",
        isOwnMessage && "bg-accent/20"
      )}
    >
      <ChatMessageAvatar 
        avatarUrl={message.profiles?.avatar_url}
        username={message.profiles?.username}
      />

      <div className="flex-1 min-w-0">
        <ChatMessageHeader 
          username={message.profiles?.username}
          isModerator={isModerator}
          createdAt={message.created_at}
        />
        
        <ChatMessageContent content={message.message} />

        <ChatMessageActions 
          isModeratorView={isModeratorView}
          isOwnMessage={isOwnMessage}
          onDelete={onDelete}
          onReport={handleReport}
          messageId={message.id}
        />
      </div>
    </motion.div>
  );
};

export default ChatMessage;