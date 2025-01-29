import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { ChatUser } from "@/types/message";
import { cn } from "@/lib/utils";
import { ChatListItem } from "./ChatListItem";
import { CreateGroupChat } from "../chat/CreateGroupChat";

interface ChatListProps {
  onSelectUser: (userId: string) => void;
}

export function ChatList({ onSelectUser }: ChatListProps) {
  return (
    <div className="border-r border-border">
      <CreateGroupChat />
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input className="pl-9" placeholder="Search messages..." />
      </div>
      
      <div className="space-y-2">
        {/* Sample data for preview */}
        {[
          {
            id: "1",
            username: "User 1",
            avatar_url: null,
            last_message: "Hey there!",
            unread_count: 2
          },
          {
            id: "2",
            username: "User 2",
            avatar_url: null,
            last_message: "How are you?",
            unread_count: 0
          }
        ].map((chat) => (
          <ChatListItem
            key={chat.id}
            chat={chat}
            isSelected={false}
            onSelect={() => onSelectUser(chat.id)}
          />
        ))}
      </div>
    </div>
  );
}