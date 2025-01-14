import { useState } from "react";
import { Card } from "@/components/ui/card";
import PostHeader from "./post/PostHeader";
import PostContent from "./post/PostContent";
import PostActions from "./post/PostActions";
import CommentList from "./post/CommentList";

interface PostItemProps {
  post: {
    id: string;
    content: string;
    image_url: string | null;
    created_at: string;
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

  return (
    <Card className="mb-4 overflow-hidden">
      <div className="p-4">
        <PostHeader
          avatarUrl={post.profiles?.avatar_url}
          username={post.profiles?.username}
          createdAt={post.created_at}
        />
        <PostContent
          content={post.content}
          imageUrl={post.image_url}
        />
        <PostActions
          postId={post.id}
          voteCount={voteCount}
          onCommentClick={() => setShowComments(!showComments)}
          showComments={showComments}
        />
        {showComments && <CommentList postId={post.id} />}
      </div>
    </Card>
  );
};

export default PostItem;