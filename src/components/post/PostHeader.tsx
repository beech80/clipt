import { Button } from "@/components/ui/button";
import { MoreVertical } from "lucide-react";

interface PostHeaderProps {
  avatarUrl: string;
  username: string;
  createdAt: string;
}

const PostHeader = ({ avatarUrl, username, createdAt }: PostHeaderProps) => {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <img
          src={avatarUrl || "/placeholder.svg"}
          alt={username || "User"}
          className="w-10 h-10 rounded-full object-cover"
        />
        <div>
          <h3 className="font-semibold">{username || "Anonymous"}</h3>
          <p className="text-sm text-muted-foreground">
            {new Date(createdAt).toLocaleDateString(undefined, {
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </p>
        </div>
      </div>
      <Button variant="ghost" size="icon">
        <MoreVertical className="w-4 h-4" />
      </Button>
    </div>
  );
};

export default PostHeader;