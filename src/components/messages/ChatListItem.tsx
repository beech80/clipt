import { ChatUser } from "@/types/message";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface ChatListItemProps {
  chat: ChatUser;
  isSelected: boolean;
  onSelect: (userId: string) => void;
}

export function ChatListItem({ chat, isSelected, onSelect }: ChatListItemProps) {
  return (
    <button
      className={cn(
        "w-full p-3 rounded-lg hover:bg-gaming-800/70 transition-colors text-left flex items-center gap-3",
        isSelected && "bg-gaming-800/70 border border-gaming-600/20"
      )}
      onClick={() => onSelect(chat.id)}
    >
      <Avatar className="border-2 border-gaming-600">
        <AvatarImage src={chat.avatar_url || undefined} />
        <AvatarFallback className="bg-gaming-700 text-white">
          {chat.username?.[0]?.toUpperCase() || '?'}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <span className="font-medium truncate text-white">{chat.username || 'Unknown User'}</span>
        </div>
        {chat.last_message && (
          <p className="text-sm text-gaming-400 truncate">
            {chat.last_message}
          </p>
        )}
      </div>
      {chat.unread_count ? (
        <div className="min-w-[1.5rem] h-6 rounded-full bg-primary text-white text-xs flex items-center justify-center">
          {chat.unread_count}
        </div>
      ) : null}
    </button>
  );
}