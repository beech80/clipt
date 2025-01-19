import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { MessageSquareplus, Users } from "lucide-react";
import { ChatList } from "@/components/messages/ChatList";
import { MessageList } from "@/components/messages/MessageList";
import { MessageInput } from "@/components/messages/MessageInput";

const Messages = () => {
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  const navigate = useNavigate();

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Messages</h1>
        <div className="space-x-2">
          <Button 
            variant="outline"
            onClick={() => navigate("/group-chat")}
          >
            <Users className="h-4 w-4 mr-2" />
            Group Chats
          </Button>
          <Button>
            <MessageSquareplus className="h-4 w-4 mr-2" />
            New Message
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-[calc(100vh-8rem)]">
        <div className="md:col-span-1 border rounded-lg p-4 overflow-y-auto">
          <ChatList onSelectChat={setSelectedChat} selectedChat={selectedChat} />
        </div>
        <div className="md:col-span-2 border rounded-lg flex flex-col">
          {selectedChat ? (
            <>
              <div className="flex-1 overflow-y-auto p-4">
                <MessageList chatId={selectedChat} />
              </div>
              <div className="border-t p-4">
                <MessageInput chatId={selectedChat} />
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              Select a conversation to start chatting
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Messages;