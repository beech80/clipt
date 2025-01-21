import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface ChatMessageAvatarProps {
  avatarUrl?: string | null;
  username?: string | null;
}

export const ChatMessageAvatar = ({ avatarUrl, username }: ChatMessageAvatarProps) => {
  return (
    <div className="flex-shrink-0">
      <Avatar className="h-8 w-8">
        <AvatarImage src={avatarUrl} />
        <AvatarFallback>
          {username?.[0]?.toUpperCase() || 'U'}
        </AvatarFallback>
      </Avatar>
    </div>
  );
};