import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { ChatUser } from "@/types/message";
import { ChatListItem } from "./ChatListItem";

interface ChatListProps {
  chats: ChatUser[];
  selectedChat: string | null;
  onSelectChat: (userId: string) => void;
}

export function ChatList({ chats, selectedChat, onSelectChat }: ChatListProps) {
  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gaming-400" />
        <Input 
          className="pl-9 bg-gaming-800/50 border-gaming-600/20 text-white placeholder:text-gaming-400"
          placeholder="Search messages..." 
        />
      </div>
      
      <div className="space-y-2">
        {chats.map((chat) => (
          <ChatListItem
            key={chat.id}
            chat={chat}
            isSelected={selectedChat === chat.id}
            onSelect={onSelectChat}
          />
        ))}
      </div>
    </div>
  );
}