import { useState } from "react";
import PostContent from "./post/PostContent";
import CommentList from "./post/CommentList";
import { useAuth } from "@/contexts/AuthContext";
import { MessageSquare, UserPlus, Heart, Trophy } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

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
    clip_votes?: { count: number }[];
  };
}

const PostItem = ({ post }: PostItemProps) => {
  const [showComments, setShowComments] = useState(false);
  const voteCount = post.clip_votes?.[0]?.count || 0;
  const { user } = useAuth();
  const [isFollowing, setIsFollowing] = useState(false);

  const handleFollow = async () => {
    if (!user) {
      toast.error("Please login to follow users");
      return;
    }

    try {
      const { error } = await supabase
        .from('follows')
        .insert({
          follower_id: user.id,
          following_id: post.user_id
        });

      if (error) {
        if (error.code === '23505') {
          toast.error("You're already following this user!");
        } else {
          throw error;
        }
      } else {
        setIsFollowing(true);
        toast.success("Following user!");
      }
    } catch (error) {
      toast.error("Error following user");
    }
  };

  return (
    <div className="relative h-full w-full bg-black">
      <PostContent
        content={post.content}
        imageUrl={post.image_url}
        videoUrl={post.video_url}
      />
      
      {/* Vertical action buttons */}
      <div className="absolute right-4 bottom-24 flex flex-col gap-6 items-center">
        <button 
          className="p-2 hover:scale-110 transition-transform"
          onClick={() => setShowComments(!showComments)}
        >
          <MessageSquare className="w-8 h-8 text-white" />
          <span className="text-xs text-white mt-1">Comment</span>
        </button>
        <button 
          className="p-2 hover:scale-110 transition-transform"
          onClick={handleFollow}
        >
          <UserPlus className={`w-8 h-8 ${isFollowing ? 'text-gaming-400' : 'text-white'}`} />
          <span className="text-xs text-white mt-1">Follow</span>
        </button>
        <button className="p-2 hover:scale-110 transition-transform">
          <Heart className="w-8 h-8 text-white" />
          <span className="text-xs text-white mt-1">Like</span>
        </button>
        <button className="p-2 hover:scale-110 transition-transform">
          <Trophy className="w-8 h-8 text-white" />
          <span className="text-xs text-white mt-1">Vote ({voteCount})</span>
        </button>
      </div>

      {/* User info and description overlay */}
      <div className="absolute bottom-24 left-4 right-20 text-white">
        <h3 className="font-bold">@{post.profiles?.username}</h3>
        <p className="text-sm mt-2 line-clamp-2">{post.content}</p>
      </div>

      {showComments && (
        <div className="absolute bottom-0 left-0 right-0 bg-black/90 h-2/3 rounded-t-xl overflow-hidden">
          <CommentList postId={post.id} />
        </div>
      )}
    </div>
  );
};

export default PostItem;