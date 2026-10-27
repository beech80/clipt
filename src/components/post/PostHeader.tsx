import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDistanceToNow } from "date-fns";
import { Heart, MessageCircle, Trophy } from "lucide-react";
import { PostHeaderProps } from "@/types/post";
import PostMenu from "./PostMenu";

export const PostHeader = ({ post, commentsCount }: PostHeaderProps) => {
  // Safely extract username and check if post and profiles exist
  const username = post?.profiles?.display_name || post?.profiles?.username || 'Anonymous';
  const avatarUrl = post?.profiles?.avatar_url || '';
  const firstLetter = username[0]?.toUpperCase() || 'A';
  
  // Function to safely navigate to a user profile
  const handleProfileClick = (e: React.MouseEvent, userId: string) => {
    e.stopPropagation();
    e.preventDefault();
    
    if (!userId) {
      console.error('Invalid user ID for profile navigation');
      return;
    }
    
    try {
      console.log(`PostHeader: Navigating to profile: ${userId}`);
      
      // Use window.location instead of navigate for more reliable navigation
      window.location.href = `/profile/${userId}`;
    } catch (error) {
      console.error('Error navigating to profile:', error);
    }
  };

  return (
    <div>
      <div className="flex items-center space-x-4">
        <Avatar 
          className="ring-2 ring-gaming-500 ring-offset-2 ring-offset-background cursor-pointer"
          onClick={(e) => post?.user_id ? handleProfileClick(e, post.user_id) : null}
        >
          <AvatarImage src={avatarUrl} />
          <AvatarFallback>{firstLetter}</AvatarFallback>
        </Avatar>
        
        <div className="space-y-1">
          <div className="flex flex-col space-y-2">
            <span 
              className="font-semibold text-lg text-gaming-400 cursor-pointer hover:text-gaming-300"
              onClick={(e) => post?.user_id ? handleProfileClick(e, post.user_id) : null}
            >
              {username}
            </span>
            <div className="flex items-center space-x-4 text-sm">
              <div className="flex items-center space-x-1">
                <Heart className="w-4 h-4 text-red-500" />
                <span className="font-medium">{post.likes_count || 0}</span>
              </div>
              <div className="flex items-center space-x-1">
                <MessageCircle className="w-4 h-4 text-gaming-400" />
                <span className="font-medium">{commentsCount}</span>
              </div>
              <div className="flex items-center space-x-1">
                <Trophy className="w-4 h-4 text-yellow-500" />
                <span className="font-medium">{post.clip_votes?.[0]?.count || 0}</span>
              </div>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
          </p>
        </div>
        <div>
          {post.games && (
            <a href={`/game/${post.games.id}`} onClick={event => event.stopPropagation()} className="text-sm text-gaming-300 mr-2 hover:text-gaming-100">
              {post.games.name}
            </a>
          )}
        </div>
      </div>

      <PostMenu 
        postId={post.id}
        userId={post.user_id}
        content={post.content || ""}
        imageUrl={post.image_url}
        videoUrl={post.video_url}
      />
    </div>
  );
};

export default PostHeader;
