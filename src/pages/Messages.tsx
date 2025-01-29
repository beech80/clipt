import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Users, MessageSquarePlus } from "lucide-react";
import { ChatList } from "@/components/messages/ChatList";
import { MessageList } from "@/components/messages/MessageList";
import { MessageInput } from "@/components/messages/MessageInput";
import { useMessages } from "@/contexts/MessagesContext";

const Messages = () => {
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  const navigate = useNavigate();
  const { chats, messages, handleSendMessage } = useMessages();

  // Sample chat data for preview
  const sampleChats = [
    {
      id: "1",
      username: "GamerPro",
      avatar_url: null,
      last_message: "Hey, want to join my stream?",
      unread_count: 2
    },
    {
      id: "2",
      username: "StreamMaster",
      avatar_url: null,
      last_message: "Great game yesterday!",
      unread_count: 0
    }
  ];

  return (
    <div className="container mx-auto p-4">
      <div className="gameboy-header">
        <h1 className="gameboy-title">MESSAGES</h1>
      </div>

      <div className="mt-20">
        <div className="flex gap-2 justify-center mb-4">
          <Button 
            variant="outline"
            onClick={() => navigate("/group-chat")}
            className="gaming-button"
          >
            <Users className="h-4 w-4 mr-2" />
            Group Chats
          </Button>
          <Button className="gaming-button">
            <MessageSquarePlus className="h-4 w-4 mr-2" />
            New Message
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-[calc(100vh-12rem)]">
          <div className="md:col-span-1 gaming-card">
            <ChatList 
              chats={sampleChats} 
              selectedChat={selectedChat} 
              onSelectChat={setSelectedChat} 
            />
          </div>
          <div className="md:col-span-2 gaming-card flex flex-col">
            {selectedChat ? (
              <>
                <div className="flex-1 overflow-y-auto p-4">
                  <MessageList messages={messages} />
                </div>
                <div className="border-t border-gaming-400 p-4">
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
    </div>
  );
};

export default Messages;