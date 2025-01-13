import { useState } from "react";
import { Search, Send } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const MOCK_CHATS = [
  {
    id: 1,
    username: "ProGamer123",
    lastMessage: "GG! That was an amazing play!",
    time: "2m ago",
    unread: 2,
    avatar: "https://images.unsplash.com/photo-1568602471122-7832951cc4c5?w=200&h=200&fit=crop",
    online: true,
  },
  {
    id: 2,
    username: "GameMaster",
    lastMessage: "Want to team up for the next match?",
    time: "1h ago",
    unread: 0,
    avatar: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=200&h=200&fit=crop",
    online: false,
  },
];

const Messages = () => {
  const [selectedChat, setSelectedChat] = useState<number | null>(null);
  const [message, setMessage] = useState("");

  const handleSendMessage = () => {
    if (message.trim()) {
      toast.success("Message sent!");
      setMessage("");
    }
  };

  return (
    <div className="mx-auto max-w-4xl">
      <div className="gaming-card grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Chat List */}
        <div className="border-r border-gaming-700/50">
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input className="pl-9" placeholder="Search messages..." />
          </div>
          
          <div className="space-y-2">
            {MOCK_CHATS.map((chat) => (
              <button
                key={chat.id}
                className={`w-full p-3 rounded-lg hover:bg-gaming-700/20 transition-colors text-left flex items-center gap-3 ${
                  selectedChat === chat.id ? "bg-gaming-700/30" : ""
                }`}
                onClick={() => setSelectedChat(chat.id)}
              >
                <div className="relative">
                  <img 
                    src={chat.avatar} 
                    alt={chat.username}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                  {chat.online && (
                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-background" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-medium truncate">{chat.username}</span>
                    <span className="text-xs text-muted-foreground">{chat.time}</span>
                  </div>
                  <p className="text-sm text-muted-foreground truncate">
                    {chat.lastMessage}
                  </p>
                </div>
                {chat.unread > 0 && (
                  <div className="min-w-[1.5rem] h-6 rounded-full bg-gaming-400 text-white text-xs flex items-center justify-center">
                    {chat.unread}
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Chat Area */}
        <div className="col-span-2 flex flex-col h-[600px]">
          {selectedChat ? (
            <>
              <div className="flex-1 p-4">
                <div className="text-center text-sm text-muted-foreground">
                  Messages will appear here
                </div>
              </div>
              <div className="p-4 border-t border-gaming-700/50">
                <div className="flex gap-2">
                  <Input
                    placeholder="Type a message..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                  />
                  <Button 
                    className="gaming-button"
                    onClick={handleSendMessage}
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              Select a chat to start messaging
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Messages;