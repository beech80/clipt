import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { MessageSquarePlus, Users } from "lucide-react";
import { ChatList } from "@/components/messages/ChatList";
import { MessageList } from "@/components/messages/MessageList";
import { MessageInput } from "@/components/messages/MessageInput";
import { useMessages } from "@/contexts/MessagesContext";
import { BackButton } from "@/components/ui/back-button";

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
    <div className="min-h-screen bg-gaming-900/95 text-white">
      <div className="container mx-auto p-4">
        <div className="flex items-center mb-6 gap-4">
          <BackButton />
          <h1 className="text-2xl font-bold gaming-gradient">Messages</h1>
        </div>
        
        <div className="flex gap-4 justify-center mb-6">
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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[calc(100vh-12rem)]">
          <div className="md:col-span-1 glass-card p-4 overflow-y-auto">
            <ChatList 
              chats={chats} 
              selectedChat={selectedChat} 
              onSelectChat={setSelectedChat} 
            />
          </div>
          <div className="md:col-span-2 glass-card flex flex-col">
            {selectedChat ? (
              <>
                <div className="flex-1 overflow-y-auto p-4">
                  <MessageList messages={messages} />
                </div>
                <div className="border-t border-gaming-600/20 p-4 bg-gaming-800/50">
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
    </div>
  );
};

export default Messages;