import { useMessages, MessagesProvider } from "@/contexts/MessagesContext";
import { MessageList } from "@/components/messages/MessageList";
import { ChatList } from "@/components/messages/ChatList";
import { MessageInput } from "@/components/messages/MessageInput";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Gamepad, Users } from "lucide-react";

function MessagesContent() {
  const { selectedChat, setSelectedChat, messages, chats, isLoading, handleSendMessage } = useMessages();

  const recentGamers = [
    { id: '1', tag: 'ProGamer123', avatar: 'https://images.unsplash.com/photo-1568602471122-7832951cc4c5?w=200&h=200&fit=crop' },
    { id: '2', tag: 'NinjaWarrior', avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&h=200&fit=crop' },
    { id: '3', tag: 'PixelQueen', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop' },
  ];

  return (
    <div className="mx-auto max-w-4xl h-[calc(100vh-4rem)]">
      <div className="h-full border rounded-lg grid grid-cols-1 md:grid-cols-3 divide-x">
        <div className="p-4 flex flex-col space-y-6">
          {/* Welcome Message */}
          <div className="bg-gaming-900/50 rounded-lg p-4 border border-gaming-500/20">
            <div className="flex items-center space-x-2 mb-2">
              <Gamepad className="w-5 h-5 text-gaming-500" />
              <h3 className="font-bold text-gaming-100">Game Chat Hub</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Connect with fellow gamers and coordinate your next epic battle!
            </p>
          </div>

          {/* Recent Gamers */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Users className="w-4 h-4 text-gaming-500" />
              <h4 className="text-sm font-semibold">Recent Players</h4>
            </div>
            <div className="flex flex-wrap gap-2">
              {recentGamers.map((gamer) => (
                <div 
                  key={gamer.id}
                  className="flex items-center space-x-2 bg-gaming-900/30 p-2 rounded-lg hover:bg-gaming-900/50 transition-colors cursor-pointer"
                >
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={gamer.avatar} alt={gamer.tag} />
                    <AvatarFallback>{gamer.tag.slice(0, 2)}</AvatarFallback>
                  </Avatar>
                  <span className="text-xs text-gaming-100">{gamer.tag}</span>
                </div>
              ))}
            </div>
          </div>

          <ChatList
            chats={chats}
            selectedChat={selectedChat}
            onSelectChat={setSelectedChat}
          />
        </div>

        <div className="col-span-2 flex flex-col h-full">
          {isLoading ? (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              Loading messages...
            </div>
          ) : selectedChat ? (
            <>
              <MessageList messages={messages} />
              <MessageInput onSendMessage={handleSendMessage} />
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center space-y-2">
                <Gamepad className="w-12 h-12 mx-auto text-gaming-500 opacity-50" />
                <p className="text-muted-foreground">Select a chat to start messaging</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Messages() {
  return (
    <MessagesProvider>
      <MessagesContent />
    </MessagesProvider>
  );
}