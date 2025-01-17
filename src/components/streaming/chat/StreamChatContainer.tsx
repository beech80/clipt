import React from 'react';
import { useStreamChat } from '@/hooks/use-stream-chat';
import { StreamChatHeader } from './StreamChatHeader';
import StreamChatMessageList from './ChatMessageList';
import StreamChatInput from './ChatInput';
import { StreamChatError } from './StreamChatError';
import { StreamChatOffline } from './StreamChatOffline';
import { Loader2 } from 'lucide-react';

interface StreamChatContainerProps {
  streamId: string;
  isLive: boolean;
}

const StreamChatContainer = ({ streamId, isLive }: StreamChatContainerProps) => {
  const {
    messages,
    isLoading,
    error,
    sendMessage,
    deleteMessage,
    isChatEnabled,
  } = useStreamChat(streamId);

  if (error) return <StreamChatError />;
  if (!isLive) return <StreamChatOffline />;
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[600px] bg-[#9BA4B5] border-4 border-[#2B2B2B] rounded-lg">
        <Loader2 className="w-8 h-8 animate-spin text-[#86C06C]" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[600px] bg-[#9BA4B5] border-4 border-[#2B2B2B] rounded-lg">
      <StreamChatHeader messageCount={messages?.length || 0} />
      <StreamChatMessageList 
        messages={messages || []}
        onDeleteMessage={deleteMessage}
      />
      {isChatEnabled && (
        <StreamChatInput onSendMessage={sendMessage} />
      )}
    </div>
  );
};

export default StreamChatContainer;