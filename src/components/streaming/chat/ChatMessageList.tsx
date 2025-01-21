import { useVirtualizer } from '@tanstack/react-virtual';
import { useRef, useEffect } from 'react';
import { useInView } from 'react-intersection-observer';
import { StreamChatMessage } from "@/types/chat";
import ChatMessage from './ChatMessage';

interface ChatMessageListProps {
  messages: StreamChatMessage[];
  isModeratorView?: boolean;
  onDeleteMessage?: (messageId: string) => void;
}

const ChatMessageList = ({ messages, isModeratorView, onDeleteMessage }: ChatMessageListProps) => {
  const parentRef = useRef<HTMLDivElement>(null);
  const { ref: bottomRef, inView } = useInView();

  const virtualizer = useVirtualizer({
    count: messages.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 64,
    overscan: 5,
  });

  // Auto-scroll to bottom when new messages arrive and user is at bottom
  useEffect(() => {
    if (inView) {
      virtualizer.scrollToIndex(messages.length - 1);
    }
  }, [messages.length, inView, virtualizer]);

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
      <div ref={bottomRef} style={{ height: 1 }} />
    </div>
  );
};

export default ChatMessageList;
