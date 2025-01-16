import { useState, useEffect } from "react";
import PostContent from "./post/PostContent";
import { useAuth } from "@/contexts/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { formatDistanceToNow } from 'date-fns';
import { MessageCircle, Heart, Trophy } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";

interface PostItemProps {
  post: {
    id: string;
    content: string;
    image_url: string | null;
    video_url: string | null;
    created_at: string;
    user_id: string;
    profiles: {
      username: string;
      avatar_url: string;
    };
    likes_count: number;
    clip_votes: { count: number }[];
  };
}

const PostItem = ({ post }: PostItemProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [commentsCount, setCommentsCount] = useState(0);

  useEffect(() => {
    const fetchCommentsCount = async () => {
      const { count } = await supabase
        .from('comments')
        .select('*', { count: 'exact' })
        .eq('post_id', post.id);
      setCommentsCount(count || 0);
    };
    fetchCommentsCount();
  }, [post.id]);

  const handleCommentClick = () => {
    navigate(`/comments/${post.id}`);
  };

  return (
    <div className="relative h-full w-full bg-[#1A1F2C]">
      <div className="absolute inset-0 flex flex-col">
        {/* Header */}
        <div className="p-4 bg-[#1A1F2C] border-b border-[#2A2E3B]">
          <div className="flex items-center space-x-2">
            <Avatar className="h-8 w-8">
              <AvatarImage src={post.profiles?.avatar_url} />
              <AvatarFallback>{post.profiles?.username?.[0]?.toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <p className="font-semibold text-[#1EAEDB]">{post.profiles?.username}</p>
              <p className="text-xs text-gray-400">
                {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
              </p>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 relative">
          <PostContent
            content={post.content}
            imageUrl={post.image_url}
            videoUrl={post.video_url}
            postId={post.id}
          />
        </div>

        {/* Side Action Buttons */}
        <div className="fixed right-4 top-1/2 -translate-y-1/2 flex flex-col gap-6">
          <div className="action-button">
            <div className="relative">
              <Heart className="w-5 h-5 text-[#FF6B6B]" />
              <span className="absolute -top-2 -right-2 text-xs font-medium text-[#FF6B6B]">{post.likes_count || 0}</span>
            </div>
          </div>
          <div 
            onClick={handleCommentClick}
            className="action-button cursor-pointer"
          >
            <div className="relative">
              <MessageCircle className="w-5 h-5 text-[#4CAF50]" />
              <span className="absolute -top-2 -right-2 text-xs font-medium text-[#4CAF50]">{commentsCount}</span>
            </div>
          </div>
          <div className="action-button">
            <div className="relative">
              <Trophy className="w-5 h-5 text-[#FFD700]" />
              <span className="absolute -top-2 -right-2 text-xs font-medium text-[#FFD700]">{post.clip_votes?.[0]?.count || 0}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PostItem;