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
        "w-full p-3 rounded-lg hover:bg-accent transition-colors text-left flex items-center gap-3",
        isSelected && "bg-accent"
      )}
      onClick={() => onSelect(chat.id)}
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
  );
}