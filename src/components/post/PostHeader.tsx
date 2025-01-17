import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDistanceToNow } from "date-fns";
import PostMenu from "./PostMenu";

interface PostHeaderProps {
  post: {
    id: string;
    user_id: string;
    content: string | null;
    image_url: string | null;
    video_url: string | null;
    created_at: string;
    profiles?: {
      username: string | null;
      avatar_url: string | null;
    } | null;
  };
  commentsCount: number;
}

export const PostHeader = ({ post, commentsCount }: PostHeaderProps) => {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center space-x-4">
        <Avatar>
          <AvatarImage src={post.profiles?.avatar_url || undefined} />
          <AvatarFallback>{post.profiles?.username?.[0]?.toUpperCase()}</AvatarFallback>
        </Avatar>
        <div>
          <p className="font-semibold">{post.profiles?.username}</p>
          <p className="text-sm text-muted-foreground">
            {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
          </p>
        </div>
      </div>
      <PostMenu 
        postId={post.id}
        userId={post.user_id}
        content={post.content || ""}
        imageUrl={post.image_url}
        videoUrl={post.video_url}
      />
    </div>
  );
};