import { useVirtualizer } from '@tanstack/react-virtual';
import { useRef } from 'react';
import { StreamChatMessage } from "@/types/chat";
import { ChatMessage } from './ChatMessage';

interface ChatMessageListProps {
  messages: StreamChatMessage[];
  isModeratorView?: boolean;
  onDeleteMessage?: (messageId: string) => void;
}

export const ChatMessageList = ({ messages, isModeratorView, onDeleteMessage }: ChatMessageListProps) => {
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: messages.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 64,
    overscan: 5,
  });

  return (
    <div 
      ref={parentRef}
      className="flex-1 overflow-auto"
    >
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {virtualizer.getVirtualItems().map((virtualItem) => {
          const message = messages[virtualItem.index];
          return (
            <div
              key={message.id}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                transform: `translateY(${virtualItem.start}px)`,
              }}
            >
              <ChatMessage
                message={message}
                isModeratorView={isModeratorView}
                onDelete={onDeleteMessage}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};