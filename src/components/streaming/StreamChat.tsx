import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Message } from "@/types/message";
import { ChatHeader } from "./chat/ChatHeader";
import { ChatPresence } from "./chat/ChatPresence";
import { ChatTimeouts } from "./chat/ChatTimeouts";
import { ChatMessages } from "./chat/ChatMessages";
import { useChatMessages } from "@/hooks/useChatMessages";

interface StreamChatProps {
  streamId: string;
  isLive: boolean;
}

export const StreamChat = ({ streamId, isLive }: StreamChatProps) => {
  const { user } = useAuth();
  const [timeouts, setTimeouts] = useState<Record<string, string>>({});
  const [activeUsers, setActiveUsers] = useState<Set<string>>(new Set());
  const [presenceState, setPresenceState] = useState<RealtimePresenceState>({});
  
  const { messages, setMessages } = useChatMessages(streamId);

  return (
    <div className="flex flex-col h-[600px] border rounded-lg">
      <ChatHeader activeUsers={activeUsers} />
      
      <ChatPresence
        streamId={streamId}
        userId={user?.id}
        onPresenceChange={setPresenceState}
        onActiveUsersChange={setActiveUsers}
      />
      
      <ChatTimeouts
        streamId={streamId}
        userId={user?.id}
        onTimeoutChange={setTimeouts}
      />
      
      <ChatMessages
        streamId={streamId}
        userId={user?.id}
        isLive={isLive}
        messages={messages}
        timeouts={timeouts}
        onMessagesChange={setMessages}
      />
    </div>
  );
};