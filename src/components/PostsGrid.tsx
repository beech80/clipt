import React from 'react';
import { useNavigate } from 'react-router-dom';

interface PostProps {
  id: string;
  title?: string;
  content?: string;
  created_at: string;
  media_url?: string;
  likes_count?: number;
  comments_count?: number;
  user_id: string;
  game_id?: string;
  profiles?: {
    username?: string;
    display_name?: string;
    avatar_url?: string;
  };
  games?: {
    name?: string;
    cover_url?: string;
  };
}

interface PostsGridProps {
  posts: PostProps[];
}

const PostsGrid: React.FC<PostsGridProps> = ({ posts }) => {
  const navigate = useNavigate();

  const handlePostClick = (postId: string) => {
    navigate(`/post/${postId}`);
  };

  return (
    <div className="grid grid-cols-3 gap-1">
      {posts.map(post => (
        <div 
          key={post.id}
          onClick={() => handlePostClick(post.id)}
          className="aspect-square overflow-hidden cursor-pointer relative"
        >
          {post.media_url ? (
            <img 
              src={post.media_url} 
              alt={post.title || "Post media"} 
              className="w-full h-full object-cover hover:opacity-90 transition-opacity"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.onerror = null;
                target.src = 'https://via.placeholder.com/300x300/1e1e2e/6366f1?text=Media';
              }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-indigo-900/30 text-white text-opacity-50 text-sm">
              No Image
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default PostsGrid;
