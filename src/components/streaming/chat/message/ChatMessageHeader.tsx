import { Badge } from "@/components/ui/badge";
import { Shield } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface ChatMessageHeaderProps {
  username?: string;
  isModerator: boolean;
  createdAt: string;
}

export const ChatMessageHeader = ({ username, isModerator, createdAt }: ChatMessageHeaderProps) => {
  const timeAgo = formatDistanceToNow(new Date(createdAt), { addSuffix: true });

  return (
    <div className="flex items-center justify-between gap-2">
      <div className="flex items-center gap-2">
        <span className="font-semibold text-sm">
          {username}
        </span>
        {isModerator && (
          <Badge variant="secondary" className="px-1 py-0">
            <Shield className="h-3 w-3 mr-1" />
            Mod
          </Badge>
        )}
        <span className="text-xs text-muted-foreground">
          {timeAgo}
        </span>
      </div>
    </div>
  );
};