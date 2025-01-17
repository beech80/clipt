import { formatDistanceToNow } from "date-fns";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import PostMenu from "./PostMenu";
import { PostHeaderProps } from "@/types/post";
import { Heart, MessageCircle, Trophy } from "lucide-react";
import LikeButton from "./actions/LikeButton";

export const PostHeader = ({ post, commentsCount }: PostHeaderProps) => {
  return (
    <div className="flex items-center justify-between w-full">
      <div className="flex items-center gap-4">
        <Avatar>
          <AvatarImage src={post.profiles.avatar_url || ""} />
          <AvatarFallback>{post.profiles.username?.[0]?.toUpperCase()}</AvatarFallback>
        </Avatar>
        <div className="flex items-center gap-4">
          <p className="font-semibold text-sm">{post.profiles.username}</p>
          
          <div className="flex items-center gap-4 text-muted-foreground">
            <div className="flex items-center gap-1">
              <LikeButton postId={post.id} />
              <span className="text-xs">{post.likes_count || 0}</span>
            </div>
            
            <div className="flex items-center gap-1">
              <MessageCircle className="w-4 h-4" />
              <span className="text-xs">{commentsCount || 0}</span>
            </div>
            
            <div className="flex items-center gap-1">
              <Trophy className="w-4 h-4 text-[#FFD700]" />
              <span className="text-xs">{post.clip_votes?.[0]?.count || 0}</span>
            </div>
          </div>

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