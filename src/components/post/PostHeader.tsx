import { formatDistanceToNow } from "date-fns";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import PostMenu from "./PostMenu";
import { PostHeaderProps } from "@/types/post";
import { Heart, MessageCircle, Trophy } from "lucide-react";
import LikeButton from "./actions/LikeButton";

export const PostHeader = ({ post, commentsCount }: PostHeaderProps) => {
  return (
    <div className="flex items-center gap-3">
      <Avatar className="w-8 h-8">
        <AvatarImage src={post.profiles.avatar_url || ""} />
        <AvatarFallback>{post.profiles.username?.[0]?.toUpperCase()}</AvatarFallback>
      </Avatar>
      
      <div className="flex items-center gap-2 text-sm">
        <span className="font-semibold text-[#9b87f5]">{post.profiles.username}</span>
        <div className="flex items-center gap-2 text-muted-foreground">
          <Heart className="w-4 h-4 text-red-500" />
          <span>{post.likes_count || 0}</span>
          <MessageCircle className="w-4 h-4" />
          <span>{commentsCount || 0}</span>
          <Trophy className="w-4 h-4 text-[#FFD700]" />
          <span>{post.clip_votes?.[0]?.count || 0}</span>
        </div>
        <span className="text-muted-foreground">·</span>
        <span className="text-muted-foreground">
          {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
        </span>
      </div>

      <div className="ml-auto">
        <PostMenu 
          postId={post.id} 
          userId={post.user_id} 
          content={post.content} 
          imageUrl={post.image_url}
          videoUrl={post.video_url}
        />
      </div>
    </div>
  );
};