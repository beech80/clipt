import { Heart, MessageCircle, Trophy } from "lucide-react";
import { PostActionsProps } from "@/types/post";

export const PostActions = ({ post, commentsCount, onCommentClick }: PostActionsProps) => {
  return (
    <div className="flex justify-around items-center p-4 border-t border-[#2A2E3B] bg-[#1A1F2C]">
      <button className="flex items-center gap-2 text-[#FF6B6B]">
        <Heart className="w-5 h-5" />
        <span className="text-sm font-medium">{post.likes_count || 0}</span>
      </button>
      <button 
        onClick={onCommentClick}
        className="flex items-center gap-2 text-[#4CAF50] cursor-pointer"
      >
        <MessageCircle className="w-5 h-5" />
        <span className="text-sm font-medium">{commentsCount}</span>
      </button>
      <button className="flex items-center gap-2 text-[#FFD700]">
        <Trophy className="w-5 h-5" />
        <span className="text-sm font-medium">{post.clip_votes?.[0]?.count || 0}</span>
      </button>
    </div>
  );
};