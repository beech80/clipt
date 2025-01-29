import { useState } from "react";
import { ChatList } from "@/components/messages/ChatList";
import { MessageList } from "@/components/messages/MessageList";
import { CreateGroupChat } from "@/components/chat/CreateGroupChat";
import GameBoyControls from "@/components/GameBoyControls";

const Messages = () => {
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  return (
    <div className="container mx-auto p-4 min-h-screen relative pb-[200px]">
      <div className="gameboy-header">
        <h1 className="gameboy-title">MESSAGES</h1>
      </div>

      <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-4 h-[calc(100vh-8rem)]">
        <div className="md:col-span-1 gaming-card overflow-y-auto">
          <CreateGroupChat />
          <ChatList onSelectUser={setSelectedUserId} />
        </div>
        <div className="md:col-span-2 gaming-card">
          {selectedUserId ? (
            <MessageList userId={selectedUserId} />
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              Select a chat to start messaging
            </div>
          )}
        </div>
      </div>

      <GameBoyControls />
    </div>
  );
};

export default Messages;