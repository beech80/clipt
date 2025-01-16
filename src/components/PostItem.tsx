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
    <div className="relative w-[1080px] h-[1080px] mx-auto bg-[#1A1F2C] overflow-hidden">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/60 to-transparent z-20">
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
      <div className="absolute inset-0">
        <PostContent
          content={post.content}
          imageUrl={post.image_url}
          videoUrl={post.video_url}
          postId={post.id}
        />
      </div>

      {/* Footer Actions */}
      <div className="absolute bottom-0 left-0 right-0 flex justify-center items-center p-4 bg-gradient-to-t from-black/60 to-transparent z-20">
        <div className="flex items-center gap-8">
          <button className="clip-button flex items-center gap-2">
            <Heart className="clip-button-icon" />
            <span className="text-xs text-white">{post.likes_count || 0}</span>
          </button>
          
          <button 
            className="clip-button flex items-center gap-2"
            onClick={handleCommentClick}
          >
            <MessageCircle className="clip-button-icon" />
            <span className="text-xs text-white">{commentsCount}</span>
          </button>
          
          <button className="clip-button flex items-center gap-2">
            <Trophy className="clip-button-icon" />
            <span className="text-xs text-white">{post.clip_votes?.[0]?.count || 0}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default PostItem;