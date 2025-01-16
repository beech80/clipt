import { useState, useEffect } from "react";
import PostContent from "./post/PostContent";
import CommentList from "./post/CommentList";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import PostActions from "./post/PostActions";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { formatDistanceToNow } from 'date-fns';

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
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(post.likes_count);
  const voteCount = post.clip_votes?.[0]?.count || 0;
  const [isVoted, setIsVoted] = useState(false);
  const { user } = useAuth();
  const [isFollowing, setIsFollowing] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (user) {
      checkIfLiked();
      checkIfVoted();
      checkIfFollowing();
    }
  }, [user, post.id]);

  const checkIfLiked = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('likes')
      .select('id')
      .eq('post_id', post.id)
      .eq('user_id', user.id)
      .single();
    setIsLiked(!!data);
  };

  const checkIfVoted = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('clip_votes')
      .select('id')
      .eq('post_id', post.id)
      .eq('user_id', user.id)
      .single();
    setIsVoted(!!data);
  };

  const checkIfFollowing = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('follows')
      .select('follower_id')
      .eq('follower_id', user.id)
      .eq('following_id', post.user_id)
      .single();
    setIsFollowing(!!data);
  };

  return (
    <div className="relative h-full w-full bg-black">
      <div className="absolute top-0 left-0 right-0 z-10 p-4 bg-gradient-to-b from-black/60 to-transparent">
        <div className="flex items-center space-x-2">
          <Avatar className="h-8 w-8">
            <AvatarImage src={post.profiles?.avatar_url} />
            <AvatarFallback>{post.profiles?.username?.[0]?.toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <p className="font-semibold text-white">{post.profiles?.username}</p>
            <p className="text-xs text-gray-300">
              {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
            </p>
          </div>
        </div>
      </div>
      
      <PostContent
        content={post.content}
        imageUrl={post.image_url}
        videoUrl={post.video_url}
        postId={post.id}
      />
      
      <div className="absolute bottom-4 left-4 right-4 text-white">
        <PostActions
          postId={post.id}
          voteCount={voteCount}
          onCommentClick={() => setShowComments(!showComments)}
          showComments={showComments}
        />
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