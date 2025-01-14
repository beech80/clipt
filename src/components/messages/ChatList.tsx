import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { ChatUser } from "@/types/message";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface ChatListProps {
  chats: ChatUser[];
  selectedChat: string | null;
  onSelectChat: (userId: string) => void;
}

export function ChatList({ chats, selectedChat, onSelectChat }: ChatListProps) {
  return (
    <div className="border-r border-border">
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input className="pl-9" placeholder="Search messages..." />
      </div>
      
      <div className="space-y-2">
        {chats.map((chat) => (
          <button
            key={chat.id}
            className={cn(
              "w-full p-3 rounded-lg hover:bg-accent transition-colors text-left flex items-center gap-3",
              selectedChat === chat.id && "bg-accent"
            )}
            onClick={() => onSelectChat(chat.id)}
          >
            <Avatar>
              <AvatarImage src={chat.avatar_url || undefined} />
              <AvatarFallback>{chat.username?.[0]?.toUpperCase() || '?'}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="font-medium truncate">{chat.username || 'Unknown User'}</span>
              </div>
              {chat.last_message && (
                <p className="text-sm text-muted-foreground truncate">
                  {chat.last_message}
                </p>
              )}
            </div>
            {chat.unread_count ? (
              <div className="min-w-[1.5rem] h-6 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center">
                {chat.unread_count}
              </div>
            ) : null}
          </button>
        ))}
      </div>
    </div>
  );
}