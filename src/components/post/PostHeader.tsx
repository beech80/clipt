import { formatDistanceToNow } from "date-fns";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import PostMenu from "./PostMenu";
import { PostHeaderProps } from "@/types/post";
import { Heart, MessageCircle, Trophy } from "lucide-react";

export const PostHeader = ({ post, commentsCount }: PostHeaderProps) => {
  // Add null checks and provide fallback values
  const username = post.profiles?.username || 'Anonymous';
  const avatarUrl = post.profiles?.avatar_url || '';
  const firstLetter = username[0]?.toUpperCase() || 'A';

  return (
    <div className="flex items-center gap-3 bg-[#1A1F2C]/80 backdrop-blur-sm p-3 border-b border-[#403E43]">
      <Avatar className="w-10 h-10 ring-2 ring-[#403E43] ring-offset-2 ring-offset-[#1A1F2C]">
        <AvatarImage src={avatarUrl} />
        <AvatarFallback>{firstLetter}</AvatarFallback>
      </Avatar>
      
      <div className="flex flex-col">
        <div className="flex items-center gap-4">
          <span className="font-semibold text-[#9b87f5]">{username}</span>
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1">
              <Heart className="w-4 h-4 text-[#ea384c]" />
              <span className="text-white">{post.likes_count || 0}</span>
            </div>
            <div className="flex items-center gap-1">
              <MessageCircle className="w-4 h-4 text-[#1EAEDB]" />
              <span className="text-white">{commentsCount || 0}</span>
            </div>
            <div className="flex items-center gap-1">
              <Trophy className="w-4 h-4 text-[#F97316]" />
              <span className="text-white">{post.clip_votes?.[0]?.count || 0}</span>
            </div>
          </div>
        </div>
        <span className="text-sm text-[#8E9196]">
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