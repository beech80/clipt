import { useState } from "react";
import { GroupChatList } from "@/components/chat/GroupChatList";
import { GroupChatMessages } from "@/components/chat/GroupChatMessages";

const GroupChat = () => {
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);

  return (
    <div className="container mx-auto p-4 min-h-screen relative pb-[200px]">
      <div className="gameboy-header">
        <h1 className="gameboy-title">GROUP CHAT</h1>
      </div>

      <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-4 h-[calc(100vh-8rem)]">
        <div className="md:col-span-1 gaming-card overflow-y-auto">
          <GroupChatList />
        </div>
        <div className="md:col-span-2 gaming-card">
          {selectedGroupId ? (
            <GroupChatMessages groupId={selectedGroupId} />
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              Select a group to start chatting
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GroupChat;