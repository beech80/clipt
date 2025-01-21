import React from 'react';
import { motion } from 'framer-motion';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { useEmotes } from '@/contexts/EmoteContext';
import type { StreamChatMessage } from '@/types/chat';

interface ChatMessageProps {
  message: StreamChatMessage;
  isHighlighted?: boolean;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ message, isHighlighted }) => {
  const { emotes } = useEmotes();
  
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

  if (message.is_deleted) {
    return (
      <div className="px-4 py-2 text-sm text-muted-foreground italic">
        Message deleted
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "px-4 py-2 hover:bg-gaming-400/5 transition-colors group",
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
              {new Date().toLocaleTimeString()}
            </span>
          </div>
          
          <div className="text-sm mt-1 break-words">
            {renderMessageContent(message.message)}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default ChatMessage;