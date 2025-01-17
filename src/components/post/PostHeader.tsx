import { formatDistanceToNow } from "date-fns";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import PostMenu from "./PostMenu";
import { PostHeaderProps } from "@/types/post";

export const PostHeader = ({ post, commentsCount }: PostHeaderProps) => {
  return (
    <div className="flex items-center justify-between w-full">
      <div className="flex items-center gap-2">
        <Avatar>
          <AvatarImage src={post.profiles.avatar_url || ""} />
          <AvatarFallback>{post.profiles.username?.[0]?.toUpperCase()}</AvatarFallback>
        </Avatar>
        <div>
          <p className="font-semibold text-sm">{post.profiles.username}</p>
          <p className="text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
          </p>
        </div>
      </div>
      <PostMenu 
        postId={post.id} 
        userId={post.user_id} 
        content={post.content} 
        imageUrl={post.image_url}
        videoUrl={post.video_url}
      />
    </div>
  );
};