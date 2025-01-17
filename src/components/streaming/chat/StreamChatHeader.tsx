import React from 'react';

interface StreamChatHeaderProps {
  messageCount: number;
}

export const StreamChatHeader = ({ messageCount }: StreamChatHeaderProps) => {
  return (
    <div className="p-4 border-b bg-muted">
      <h3 className="font-semibold">Stream Chat ({messageCount} messages)</h3>
    </div>
  );
};