import React from 'react';

export const StreamChatError = () => {
  return (
    <div className="flex flex-col h-[600px] border rounded-lg">
      <div className="p-4 text-center text-destructive">
        Failed to load chat messages
      </div>
    </div>
  );
};