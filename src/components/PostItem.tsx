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
    <div className="flex flex-col w-full max-w-[640px] mx-auto bg-[#222222] rounded-lg overflow-hidden shadow-xl">
      {/* Top Screen - Main Content */}
      <div className="relative w-full aspect-square bg-[#1A1F2C] border-4 border-[#333333]">
        {/* Header */}
        <div className="absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/60 to-transparent z-20">
          <div className="flex items-center space-x-2">
            <Avatar className="h-8 w-8 ring-2 ring-gaming-400">
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
      </div>

      {/* Hinge Area */}
      <div className="h-4 bg-[#333333] flex items-center justify-center">
        <div className="w-16 h-2 bg-[#444444] rounded-full"></div>
      </div>

      {/* Bottom Screen - Controls & Comments */}
      <div className="bg-[#1A1F2C] border-4 border-[#333333]">
        {/* Action Buttons - Gaming style */}
        <div className="grid grid-cols-3 gap-2 p-4 border-b border-gaming-700 bg-[#222222]">
          <button className="flex flex-col items-center justify-center p-2 rounded-lg bg-gaming-800 hover:bg-gaming-700 transition-colors">
            <Heart className="w-6 h-6 text-red-500 mb-1" />
            <span className="text-xs text-white">{post.likes_count || 0}</span>
          </button>
          
          <button 
            className="flex flex-col items-center justify-center p-2 rounded-lg bg-gaming-800 hover:bg-gaming-700 transition-colors"
            onClick={handleCommentClick}
          >
            <MessageCircle className="w-6 h-6 text-blue-500 mb-1" />
            <span className="text-xs text-white">{commentsCount}</span>
          </button>
          
          <button className="flex flex-col items-center justify-center p-2 rounded-lg bg-gaming-800 hover:bg-gaming-700 transition-colors">
            <Trophy className="w-6 h-6 text-yellow-500 mb-1" />
            <span className="text-xs text-white">{post.clip_votes?.[0]?.count || 0}</span>
          </button>
        </div>

        {/* Comments Area - Gaming style */}
        <div className="max-h-[200px] overflow-y-auto p-4 space-y-4 bg-[#1A1F2C]">
          {/* Comment Input */}
          <div className="flex items-center gap-2">
            <Avatar className="h-8 w-8 ring-2 ring-gaming-600">
              <AvatarImage src={user?.user_metadata?.avatar_url} />
              <AvatarFallback>
                {user?.user_metadata?.username?.[0]?.toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            <input
              type="text"
              placeholder="Add a comment..."
              className="flex-1 bg-gaming-800 border border-gaming-600 rounded-lg px-4 py-2 text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gaming-500"
              onClick={handleCommentClick}
            />
          </div>

          {/* View All Comments Button */}
          <button
            onClick={handleCommentClick}
            className="w-full text-center text-sm bg-gaming-700 hover:bg-gaming-600 text-white py-2 rounded-lg transition-colors"
          >
            View all {commentsCount} comments
          </button>
        </div>
      </div>
    </div>
  );
};

export default PostItem;