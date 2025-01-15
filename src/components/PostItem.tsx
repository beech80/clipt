import { useState, useEffect } from "react";
import PostContent from "./post/PostContent";
import CommentList from "./post/CommentList";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

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

  const handleLike = async () => {
    if (!user) {
      toast.error("Please login to like posts");
      return;
    }

    try {
      if (isLiked) {
        const { error } = await supabase
          .from('likes')
          .delete()
          .eq('post_id', post.id)
          .eq('user_id', user.id);

        if (error) throw error;
        setLikesCount(prev => prev - 1);
      } else {
        const { error } = await supabase
          .from('likes')
          .insert({
            post_id: post.id,
            user_id: user.id
          });

        if (error) throw error;
        setLikesCount(prev => prev + 1);
      }
      setIsLiked(!isLiked);
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    } catch (error) {
      toast.error("Error updating like");
    }
  };

  const handleVote = async () => {
    if (!user) {
      toast.error("Please login to vote for clips");
      return;
    }

    try {
      if (isVoted) {
        const { error } = await supabase
          .from('clip_votes')
          .delete()
          .eq('post_id', post.id)
          .eq('user_id', user.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('clip_votes')
          .insert({
            post_id: post.id,
            user_id: user.id
          });

        if (error) throw error;
      }
      setIsVoted(!isVoted);
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      toast.success(isVoted ? "Vote removed!" : "Vote added!");
    } catch (error) {
      toast.error("Error updating vote");
    }
  };

  const handleFollow = async () => {
    if (!user) {
      toast.error("Please login to follow users");
      return;
    }

    try {
      if (isFollowing) {
        const { error } = await supabase
          .from('follows')
          .delete()
          .eq('follower_id', user.id)
          .eq('following_id', post.user_id);

        if (error) throw error;
        setIsFollowing(false);
        toast.success("Unfollowed user!");
      } else {
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
      }
    } catch (error) {
      toast.error("Error updating follow status");
    }
  };

  return (
    <div className="relative h-full w-full bg-black">
      <PostContent
        content={post.content}
        imageUrl={post.image_url}
        videoUrl={post.video_url}
      />
      
      {/* User info overlay */}
      <div className="absolute bottom-4 left-4 right-4 text-white">
        <h3 className="font-bold">{post.profiles?.username}</h3>
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
