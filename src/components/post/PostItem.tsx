import { useState, useEffect } from "react";
import PostContent from "./PostContent";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { PostInteractions } from "./interactions/PostInteractions";
import { Post } from "@/types/post";
import { Heart, MessageSquare, Trophy, ChevronDown, ChevronUp, MoreVertical } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { useQuery } from "@tanstack/react-query";
import CommentModal from "../comments/CommentModal";
import { CommentList } from "./CommentList";
import { Button } from "../ui/button";
import { useAuth } from "@/hooks/useAuth";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "../ui/dropdown-menu";
import { Textarea } from "../ui/textarea";

interface PostItemProps {
  post: Post;
}

const PostItem = ({ post }: PostItemProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [commentModalOpen, setCommentModalOpen] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [comments, setComments] = useState<any[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [editingComment, setEditingComment] = useState(null);
  const [editContent, setEditContent] = useState('');

  const { data: commentsCount = 0, refetch: refetchCommentCount } = useQuery({
    queryKey: ['comments-count', post.id],
    queryFn: async () => {
      try {
        const { count, error } = await supabase
          .from('comments')
          .select('*', { count: 'exact', head: true })
          .eq('post_id', post.id);
          
        if (error) {
          console.error("Error fetching comment count:", error);
          return 0;
        }
        
        return count || 0;
      } catch (error) {
        console.error("Exception fetching comment count:", error);
        return 0;
      }
    },
    refetchOnWindowFocus: false,
    staleTime: 10000, // 10 seconds
  });

  useEffect(() => {
    setIsLoading(false);
  }, []);

  const fetchComments = async () => {
    if (!showComments) return;

    setLoadingComments(true);
    try {
      const { data, error } = await supabase
        .from('comments')
        .select(`
          *,
          profiles:user_id(id, username, avatar_url)
        `)
        .eq('post_id', post.id)
        .order('created_at', { ascending: false })
        .limit(5);  // Show only 5 most recent comments
        
      if (error) {
        console.error("Error fetching comments:", error);
        return;
      }
      
      setComments(data || []);
    } catch (error) {
      console.error("Exception fetching comments:", error);
    } finally {
      setLoadingComments(false);
    }
  };

  useEffect(() => {
    fetchComments();
  }, [showComments, post.id]);

  const handleCommentClick = () => {
    setShowComments(!showComments);
  };

  const handleViewAllComments = () => {
    setCommentModalOpen(true);
  };

  const handleProfileClick = (userId: string) => {
    navigate(`/profile/${userId}`);
  };

  const handleGameClick = (e: React.MouseEvent, gameId?: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!gameId) {
      console.warn("Attempted to navigate to game, but no game ID was provided");
      return;
    }
    
    console.log("Navigating to game from post:", gameId);
    navigate(`/game/${gameId}`);
  };

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !user) return;
    
    setIsSubmitting(true);
    try {
      const { data, error } = await supabase
        .from('comments')
        .insert({
          content: newComment,
          post_id: post.id,
          user_id: user.id,
          parent_id: null
        })
        .select(`
          *,
          profiles:user_id(id, username, avatar_url)
        `)
        .single();
        
      if (error) throw error;
      
      // Add new comment to the list and update count
      setComments(prev => [data, ...prev]);
      refetchCommentCount();
      setNewComment('');
      
      toast.success('Comment added successfully');
    } catch (error) {
      console.error('Error posting comment:', error);
      toast.error('Failed to post comment');
    } finally {
      setIsSubmitting(false);
    }
  };

  const username = post.profiles?.username || 'Anonymous';
  const avatarUrl = post.profiles?.avatar_url;
  const gameName = post.games?.name;
  const gameId = post.games?.id;

  const handleCommentModalClose = () => {
    setCommentModalOpen(false);
    refetchCommentCount();
    fetchComments();
  };

  const deleteComment = async (commentId: string, userId: string) => {
    try {
      const { error } = await supabase
        .from('comments')
        .delete()
        .eq('id', commentId)
        .eq('user_id', userId);
        
      if (error) throw error;
    } catch (error) {
      console.error('Error deleting comment:', error);
      throw error;
    }
  };

  const editComment = async (commentId: string, userId: string, content: string) => {
    try {
      const { error } = await supabase
        .from('comments')
        .update({ content })
        .eq('id', commentId)
        .eq('user_id', userId);
        
      if (error) throw error;
    } catch (error) {
      console.error('Error updating comment:', error);
      throw error;
    }
  };

  return (
    <div 
      id={`post-${post.id}`}
      className={`relative w-full gaming-card transition-opacity duration-300 ${
        isLoading ? 'opacity-0' : 'opacity-100 animate-fade-in'
      }`}
    >
      {/* User Header */}
      <div className="flex items-center justify-between p-4 border-b border-gaming-400/20 backdrop-blur-sm bg-gaming-800/80">
        <div className="flex items-center space-x-3">
          <Avatar 
            className="h-8 w-8 cursor-pointer hover:ring-2 hover:ring-purple-500/50 transition-all duration-200"
            onClick={() => handleProfileClick(post.user_id)}
          >
            <AvatarImage src={avatarUrl || ''} alt={username} />
            <AvatarFallback>{username[0]?.toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <span 
              onClick={() => handleProfileClick(post.user_id)}
              className="text-sm font-semibold text-gaming-100 hover:text-gaming-200 transition-all duration-200 cursor-pointer"
            >
              {username}
            </span>
            {post.games && (
              <span 
                className="block text-sm text-gaming-300 hover:text-gaming-100 cursor-pointer" 
                onClick={(e) => handleGameClick(e, String(post.games.id))}
              >
                Playing {post.games.name}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Post Content */}
      <div className="relative aspect-video">
        <PostContent
          imageUrl={post.image_url}
          videoUrl={post.video_url}
          postId={post.id}
        />
      </div>

      {/* Interaction Counts */}
      <div className="px-4 py-3 flex items-center space-x-6 border-t border-gaming-400/20">
        <div className="flex items-center space-x-1 group transition-all duration-200 hover:scale-110 active:scale-95">
          <Heart 
            className="h-5 w-5 text-red-500 group-hover:text-red-400 transition-colors group-active:scale-90" 
            fill={post.likes_count ? "currentColor" : "none"}
          />
          <span className="text-sm font-medium text-gaming-100 group-hover:text-red-400 transition-colors">
            {post.likes_count || 0}
          </span>
        </div>
        <div 
          className="flex items-center space-x-1 group transition-all duration-200 hover:scale-110 active:scale-95 cursor-pointer"
          onClick={handleCommentClick}
        >
          <MessageSquare 
            className="h-5 w-5 text-blue-400 group-hover:text-blue-300 transition-colors group-active:scale-90"
          />
          <span className="text-sm font-medium text-gaming-100 group-hover:text-blue-300 transition-colors">
            {commentsCount}
          </span>
        </div>
        <div className="flex items-center space-x-1 group transition-all duration-200 hover:scale-110 active:scale-95">
          <Trophy 
            className="h-5 w-5 text-yellow-500 group-hover:text-yellow-400 transition-colors group-active:scale-90"
            fill={post.clip_votes?.[0]?.count ? "currentColor" : "none"}
          />
          <span className="text-sm font-medium text-gaming-100 group-hover:text-yellow-400 transition-colors">
            {post.clip_votes?.[0]?.count || 0}
          </span>
        </div>
        
        {/* Added a more prominent comment button */}
        <div className="ml-auto">
          <Button 
            onClick={() => setCommentModalOpen(true)} 
            className="h-8 px-4 text-sm bg-gaming-700 hover:bg-gaming-600 text-white flex items-center space-x-1"
            variant="secondary"
          >
            <MessageSquare className="h-4 w-4 mr-1" />
            {commentsCount > 0 ? 'View Comments' : 'Add Comment'}
          </Button>
        </div>
      </div>

      {/* Caption */}
      {post.content && (
        <div className="px-4 py-3 border-t border-gaming-400/20">
          <p className="text-sm text-gaming-100">
            <span className="font-semibold hover:text-gaming-200 cursor-pointer transition-colors" onClick={() => handleProfileClick(post.user_id)}>
              {username}
            </span>
            {' '}
            <span className="text-gaming-200">{post.content}</span>
          </p>
        </div>
      )}

      {/* Instagram-style Comments Section */}
      {showComments && (
        <div className="px-4 py-2 border-t border-gaming-400/20">
          {/* Comments list */}
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {loadingComments ? (
              <div className="flex justify-center py-2">
                <div className="animate-spin h-5 w-5 border-2 border-blue-500 rounded-full border-t-transparent"></div>
              </div>
            ) : comments.length > 0 ? (
              comments.map((comment) => (
                <div key={comment.id} className="flex items-start space-x-2 py-1">
                  <Avatar 
                    className="h-6 w-6 flex-shrink-0 cursor-pointer"
                    onClick={() => handleProfileClick(comment.profiles?.id)}
                  >
                    <AvatarImage src={comment.profiles?.avatar_url || ''} alt={comment.profiles?.username || 'User'} />
                    <AvatarFallback>{(comment.profiles?.username?.[0] || 'U').toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-baseline justify-between">
                      <div>
                        <span 
                          className="text-xs font-semibold text-gaming-100 hover:text-gaming-200 cursor-pointer transition-colors"
                          onClick={() => handleProfileClick(comment.profiles?.id)}
                        >
                          {comment.profiles?.username || 'Anonymous'}
                        </span>
                        <span className="text-xs text-gaming-400 ml-2">
                          {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                        </span>
                      </div>
                      
                      {/* Dropdown menu for comment actions */}
                      {user && user.id === comment.user_id && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="xs" className="h-5 w-5 p-0">
                              <MoreVertical className="h-3 w-3 text-gaming-400" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-gaming-800 border-gaming-700">
                            <DropdownMenuItem 
                              className="text-xs cursor-pointer hover:bg-gaming-700 focus:bg-gaming-700 text-gaming-200"
                              onClick={() => {
                                // Edit logic - set up editing state for this comment
                                setEditingComment(comment);
                                setEditContent(comment.content);
                              }}
                            >
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              className="text-xs cursor-pointer hover:bg-gaming-700 focus:bg-gaming-700 text-red-400"
                              onClick={async () => {
                                try {
                                  await deleteComment(comment.id, user.id);
                                  // Remove comment from the list
                                  setComments(prev => prev.filter(c => c.id !== comment.id));
                                  refetchCommentCount();
                                  toast.success('Comment deleted');
                                } catch (error) {
                                  console.error('Error deleting comment:', error);
                                  toast.error('Failed to delete comment');
                                }
                              }}
                            >
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                    
                    {editingComment && editingComment.id === comment.id ? (
                      <div className="mt-1">
                        <Textarea
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                          className="min-h-[40px] text-xs bg-gaming-700 border-gaming-600 focus:border-blue-500 rounded-lg text-white resize-none"
                          autoFocus
                        />
                        <div className="flex gap-2 mt-1 justify-end">
                          <Button 
                            size="xs"
                            variant="ghost" 
                            onClick={() => {
                              setEditingComment(null);
                              setEditContent('');
                            }}
                            className="h-6 text-xs text-gray-300 hover:text-white hover:bg-gaming-700"
                          >
                            Cancel
                          </Button>
                          <Button 
                            size="xs"
                            onClick={async () => {
                              try {
                                await editComment(comment.id, user.id, editContent.trim());
                                // Update the comment in the list
                                setComments(prev => prev.map(c => 
                                  c.id === comment.id ? {...c, content: editContent.trim()} : c
                                ));
                                setEditingComment(null);
                                setEditContent('');
                                toast.success('Comment updated');
                              } catch (error) {
                                console.error('Error updating comment:', error);
                                toast.error('Failed to update comment');
                              }
                            }}
                            disabled={!editContent.trim() || editContent.trim() === comment.content}
                            className="h-6 text-xs bg-blue-600 hover:bg-blue-700 text-white"
                          >
                            Save
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-gaming-200 mt-0.5">{comment.content}</p>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-gaming-400 italic py-2">No comments yet. Be the first to comment!</p>
            )}
          </div>
          
          {/* View all comments button if there are more */}
          {commentsCount > comments.length && (
            <button 
              className="text-xs text-gaming-400 hover:text-gaming-200 mt-2 transition-colors block w-full text-left"
              onClick={handleViewAllComments}
            >
              View all {commentsCount} comments
            </button>
          )}
          
          {/* Instagram-style comment input */}
          <div className="mt-3 border-t border-gaming-700/30 pt-3">
            <form onSubmit={handleCommentSubmit} className="flex items-center">
              {user && (
                <Avatar className="h-6 w-6 mr-2 flex-shrink-0">
                  <AvatarImage 
                    src={user?.user_metadata?.avatar_url || ''} 
                    alt={user?.user_metadata?.username || 'User'} 
                  />
                  <AvatarFallback className="bg-gradient-to-br from-purple-700 to-blue-500 text-white">
                    {user?.user_metadata?.username?.[0]?.toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
              )}
              
              <input
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder={`Add a comment as ${user?.user_metadata?.username || 'user'}...`}
                className="flex-1 bg-transparent border-none outline-none text-xs text-white placeholder:text-gray-500 py-1.5 focus:outline-none focus:ring-0"
                disabled={isSubmitting || !user}
              />
              
              {newComment.trim() && (
                <button
                  type="submit"
                  disabled={isSubmitting || !newComment.trim() || !user}
                  className="ml-2 text-blue-400 font-semibold text-xs hover:text-blue-300 bg-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Post
                </button>
              )}
            </form>
          </div>
        </div>
      )}

      {/* Comment button if comments are hidden */}
      {!showComments && (
        <div className="px-4 py-2 border-t border-gaming-400/20 flex justify-between items-center">
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-gaming-300 hover:text-gaming-100 flex items-center"
            onClick={handleCommentClick}
          >
            <MessageSquare className="h-4 w-4 mr-1" />
            {commentsCount > 0 
              ? `Show ${commentsCount} comments` 
              : "Show comments"}
          </Button>
          
          <Button 
            variant="outline" 
            size="sm"
            className="text-gaming-300 hover:text-gaming-100 bg-gaming-700 hover:bg-gaming-600"
            onClick={() => setCommentModalOpen(true)}
          >
            Open Full Comments
          </Button>
        </div>
      )}

      {/* Comment Modal for full view */}
      <CommentModal 
        isOpen={commentModalOpen}
        onClose={handleCommentModalClose}
        postId={String(post.id)}
      />
    </div>
  );
};

export default PostItem;
