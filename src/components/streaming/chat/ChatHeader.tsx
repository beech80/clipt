import { Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface ChatHeaderProps {
  activeUsers: Set<string>;
}

export const ChatHeader = ({ activeUsers }: ChatHeaderProps) => {
  return (
    <div className="p-4 border-b bg-muted flex items-center justify-between">
      <h3 className="font-semibold">Stream Chat</h3>
      <div className="flex items-center gap-2">
        <Users className="h-4 w-4" />
        <Badge variant="secondary">
          {activeUsers.size} watching
        </Badge>
      </div>
    </div>
  );
};