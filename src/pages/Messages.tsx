import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { MessageSquarePlus, Users } from "lucide-react";
import { ChatList } from "@/components/messages/ChatList";
import { MessageList } from "@/components/messages/MessageList";
import { MessageInput } from "@/components/messages/MessageInput";
import { useMessages } from "@/contexts/MessagesContext";

const Messages = () => {
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  const navigate = useNavigate();
  const { chats, messages, sendMessage } = useMessages();

  const handleSendMessage = (content: string) => {
    if (selectedChat) {
      sendMessage(content, selectedChat);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Messages</h1>
      
      <div className="flex gap-2 justify-center mb-4">
        <Button 
          variant="outline"
          onClick={() => navigate("/group-chat")}
        >
          <Users className="h-4 w-4 mr-2" />
          Group Chats
        </Button>
        <Button>
          <MessageSquarePlus className="h-4 w-4 mr-2" />
          New Message
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-[calc(100vh-12rem)]">
        <div className="md:col-span-1 border rounded-lg p-4 overflow-y-auto">
          <ChatList 
            chats={chats} 
            selectedChat={selectedChat} 
            onSelectChat={setSelectedChat} 
          />
        </div>
        <div className="md:col-span-2 border rounded-lg flex flex-col">
          {selectedChat ? (
            <>
              <div className="flex-1 overflow-y-auto p-4">
                <MessageList messages={messages} />
              </div>
              <div className="border-t p-4">
                <MessageInput onSendMessage={handleSendMessage} />
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