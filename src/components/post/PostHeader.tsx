import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDistanceToNow } from 'date-fns';
import { Heart, MessageCircle, Trophy } from "lucide-react";
import { PostHeaderProps } from "@/types/post";

export const PostHeader = ({ post, commentsCount }: PostHeaderProps) => {
  return (
    <div className="flex items-center space-x-2">
      <Avatar className="h-8 w-8">
        <AvatarImage src={post.profiles?.avatar_url} />
        <AvatarFallback>{post.profiles?.username?.[0]?.toUpperCase()}</AvatarFallback>
      </Avatar>
      <div className="flex-1">
        <div className="flex items-center gap-4">
          <p className="font-semibold text-[#1EAEDB]">{post.profiles?.username}</p>
          <div className="flex items-center gap-3 text-xs text-gray-400">
            <span className="flex items-center gap-1">
              <Heart className="w-3 h-3 text-[#FF6B6B]" />
              {post.likes_count || 0}
            </span>
            <span className="flex items-center gap-1">
              <MessageCircle className="w-3 h-3 text-[#4CAF50]" />
              {commentsCount}
            </span>
            <span className="flex items-center gap-1">
              <Trophy className="w-3 h-3 text-[#FFD700]" />
              {post.clip_votes?.[0]?.count || 0}
            </span>
          </div>
        </div>
        <p className="text-xs text-gray-400">
          {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
        </p>
      </div>
    </div>
  );
};