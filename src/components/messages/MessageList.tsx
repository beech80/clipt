import { Message } from "@/types/message";
import { MessageBubble } from "./MessageBubble";
import { useEffect, useRef } from "react";

interface MessageListProps {
  userId: string;
}

export function MessageList({ userId }: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [userId]);

  // Sample messages for preview
  const sampleMessages = [
    {
      id: "1",
      content: "Hey, how's it going?",
      sender_id: "1",
      created_at: new Date().toISOString(),
      read: true
    },
    {
      id: "2",
      content: "Great! Want to join my stream later?",
      sender_id: "2",
      created_at: new Date().toISOString(),
      read: false
    }
  ];

  return (
    <div className="flex-1 p-4 overflow-y-auto space-y-4">
      {sampleMessages.map((message) => (
        <MessageBubble key={message.id} message={message} />
      ))}
      <div ref={bottomRef} />
    </div>
  );
}