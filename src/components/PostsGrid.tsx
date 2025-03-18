import React from 'react';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { Heart, MessageCircle, Gamepad } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

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

  const handleProfileClick = (userId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    navigate(`/profile/${userId}`);
  };

  const handleGameClick = (gameId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    navigate(`/game/${gameId}`);
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part.charAt(0))
      .join('')
      .toUpperCase();
  };

  return (
    <div className="grid grid-cols-1 gap-6">
      {posts.map(post => (
        <div 
          key={post.id}
          onClick={() => handlePostClick(post.id)}
          className="bg-indigo-950/30 rounded-lg overflow-hidden border border-indigo-500/20 cursor-pointer hover:border-indigo-500/40 transition-all shadow-lg"
        >
          {/* Media Preview */}
          {post.media_url && (
            <div className="relative aspect-video bg-black w-full overflow-hidden">
              <img 
                src={post.media_url} 
                alt={post.title || "Post media"} 
                className="w-full h-full object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.onerror = null;
                  target.src = 'https://via.placeholder.com/640x360/1e1e2e/6366f1?text=Media+Unavailable';
                }}
              />
            </div>
          )}
          
          {/* Post Content */}
          <div className="p-4">
            {/* Header with user info */}
            <div className="flex items-center mb-3">
              <div 
                className="flex-shrink-0 cursor-pointer" 
                onClick={(e) => handleProfileClick(post.user_id, e)}
              >
                <Avatar className="h-8 w-8 mr-2 border border-indigo-500/30">
                  <AvatarImage 
                    src={post.profiles?.avatar_url || ''} 
                    alt={post.profiles?.display_name || post.profiles?.username || 'User'} 
                  />
                  <AvatarFallback className="bg-indigo-800 text-xs">
                    {post.profiles?.display_name 
                      ? getInitials(post.profiles.display_name)
                      : post.profiles?.username?.charAt(0).toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
              </div>
              
              <div className="flex-1 min-w-0">
                <div 
                  className="font-medium text-sm cursor-pointer hover:text-indigo-300 transition-colors"
                  onClick={(e) => handleProfileClick(post.user_id, e)}
                >
                  {post.profiles?.display_name || post.profiles?.username || 'Unknown User'}
                </div>
                <div className="text-xs text-gray-400">
                  {post.created_at 
                    ? formatDistanceToNow(new Date(post.created_at), { addSuffix: true })
                    : 'Recently'}
                </div>
              </div>
              
              {post.game_id && post.games && (
                <Badge 
                  variant="outline" 
                  className="ml-auto flex items-center space-x-1 bg-indigo-950/60 hover:bg-indigo-900/60 cursor-pointer"
                  onClick={(e) => handleGameClick(post.game_id!, e)}
                >
                  <Gamepad className="h-3 w-3 mr-1" />
                  <span className="truncate max-w-[100px]">{post.games.name || 'Unknown Game'}</span>
                </Badge>
              )}
            </div>
            
            {/* Post Title/Content */}
            {(post.title || post.content) && (
              <div className="mb-3">
                {post.title && <h3 className="font-semibold mb-1">{post.title}</h3>}
                {post.content && (
                  <p className="text-sm text-gray-300 line-clamp-2">{post.content}</p>
                )}
              </div>
            )}
            
            {/* Post Stats */}
            <div className="flex items-center text-xs text-gray-400">
              <div className="flex items-center mr-4">
                <Heart className="h-3 w-3 mr-1 text-pink-500" />
                <span>{post.likes_count || 0}</span>
              </div>
              <div className="flex items-center">
                <MessageCircle className="h-3 w-3 mr-1 text-indigo-400" />
                <span>{post.comments_count || 0}</span>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default PostsGrid;
