import { useState, useEffect } from "react";
import PostContent from "./post/PostContent";
import { useAuth } from "@/contexts/AuthContext";
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
  const { user } = useAuth();

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
      
      {post.content && (
        <div className="absolute bottom-4 left-4 right-4 text-white">
          <p className="text-sm">{post.content}</p>
        </div>
      )}
    </div>
  );
};

export default PostItem;