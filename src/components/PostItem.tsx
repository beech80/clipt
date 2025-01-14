import { useState } from "react";
import { Card } from "@/components/ui/card";
import PostHeader from "./post/PostHeader";
import PostContent from "./post/PostContent";
import PostActions from "./post/PostActions";
import CommentList from "./post/CommentList";
import { useAuth } from "@/contexts/AuthContext";

interface PostItemProps {
  post: {
    id: string;
    content: string;
    image_url: string | null;
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

  return (
    <Card className="h-full overflow-hidden bg-black border border-purple-500/20">
      <div className="relative h-full">
        <PostContent
          content={post.content}
          imageUrl={post.image_url}
        />
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-4">
          <PostHeader
            avatarUrl={post.profiles?.avatar_url}
            username={post.profiles?.username}
            createdAt={post.created_at}
            postId={post.id}
            userId={post.user_id}
            content={post.content}
          />
          <PostActions
            postId={post.id}
            voteCount={voteCount}
            onCommentClick={() => setShowComments(!showComments)}
            showComments={showComments}
          />
          {showComments && <CommentList postId={post.id} />}
        </div>
      </div>
    </Card>
  );
};

export default PostItem;