import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Users, MessageSquare } from "lucide-react";
import { ChatList } from "@/components/messages/ChatList";
import { MessageList } from "@/components/messages/MessageList";
import { MessageInput } from "@/components/messages/MessageInput";
import { useMessages } from "@/contexts/MessagesContext";
import GameBoyControls from "@/components/GameBoyControls";

const Messages = () => {
  const navigate = useNavigate();
  const { chats, selectedChat, setSelectedChat, handleSendMessage } = useMessages();

  return (
    <div className="container mx-auto p-4 min-h-screen relative pb-[200px]">
      <div className="mt-20 mb-4">
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
            <MessageSquare className="h-4 w-4 mr-2" />
            New Message
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-[calc(100vh-12rem)]">
          <div className="md:col-span-1 gaming-card overflow-y-auto">
            <ChatList 
              chats={chats} 
              selectedChat={selectedChat} 
              onSelectChat={setSelectedChat} 
            />
          </div>
          <div className="md:col-span-2 gaming-card flex flex-col">
            {selectedChat ? (
              <>
                <div className="flex-1 overflow-y-auto">
                  <MessageList messages={[]} />
                </div>
                <div className="border-t border-gaming-400 p-4">
                  <MessageInput onSendMessage={handleSendMessage} />
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-full text-gaming-400">
                Select a conversation to start chatting
              </div>
            )}
          </div>
        </div>
      </div>

      <GameBoyControls />
    </div>
  );
};

export default Messages;