import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDistanceToNow } from "date-fns";
import { Heart, MessageCircle, Trophy } from "lucide-react";
import { PostHeaderProps } from "@/types/post";
import PostMenu from "./PostMenu";

export const PostHeader = ({ post, commentsCount }: PostHeaderProps) => {
  // Get username from profiles, fallback to display_name, then to 'Anonymous'
  const username = post.profiles?.display_name || post.profiles?.username || 'Anonymous';
  const avatarUrl = post.profiles?.avatar_url || '';
  const firstLetter = username[0]?.toUpperCase() || 'A';

  return (
    <div>
      <div className="flex items-center space-x-4">
        <Avatar className="ring-2 ring-gaming-500 ring-offset-2 ring-offset-background">
          <AvatarImage src={avatarUrl} />
          <AvatarFallback>{firstLetter}</AvatarFallback>
        </Avatar>
        
        <div className="space-y-1">
          <div className="flex flex-col space-y-2">
            <span className="font-semibold text-lg text-gaming-400">{username}</span>
            <div className="flex items-center space-x-4 text-sm">
              <div className="flex items-center space-x-1">
                <Heart className="w-4 h-4 text-red-500" />
                <span className="font-medium">{post.likes_count || 0}</span>
              </div>
              <div className="flex items-center space-x-1">
                <MessageCircle className="w-4 h-4 text-gaming-400" />
                <span className="font-medium">{commentsCount}</span>
              </div>
              <div className="flex items-center space-x-1">
                <Trophy className="w-4 h-4 text-yellow-500" />
                <span className="font-medium">{post.clip_votes?.[0]?.count || 0}</span>
              </div>
            </div>
          </div>
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

export default PostHeader;