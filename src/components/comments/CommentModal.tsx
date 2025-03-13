import React, { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X, Heart, ArrowLeft, MoreVertical } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { CommentItem, Comment } from "@/components/post/comment/CommentItem";
import { CommentForm } from "@/components/post/comment/CommentForm";
import { getComments, getCommentCount } from "@/services/commentService";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";

interface CommentModalProps {
  isOpen: boolean;
  onClose: () => void;
  postId: string;
}

const CommentModal: React.FC<CommentModalProps> = ({ isOpen, onClose, postId }) => {
  const { user } = useAuth();
  const [replyToCommentId, setReplyToCommentId] = useState<string | null>(null);
  const [selectedEmoji, setSelectedEmoji] = useState<string | null>(null);
  const [post, setPost] = useState<any>(null);
  
  // Get the post content to display in the modal header
  useEffect(() => {
    if (isOpen && postId) {
      const fetchPost = async () => {
        try {
          const { data, error } = await supabase
            .from("posts")
            .select(`
              id,
              content,
              image_url,
              profiles:user_id (
                username,
                avatar_url
              )
            `)
            .eq("id", postId)
            .single();
          
          if (error) throw error;
          setPost(data);
        } catch (error) {
          console.error("Error fetching post:", error);
        }
      };
      
      fetchPost();
    }
  }, [isOpen, postId]);
  
  // Query comments for the post
  const { data: comments, isLoading, error, refetch } = useQuery({
    queryKey: ['comments', postId],
    queryFn: async () => {
      const result = await getComments(postId);
      return result.data || [];
    },
    enabled: isOpen && !!postId,
    staleTime: 10000, // 10 seconds
  });
  
  // Get comment count
  const { data: commentCount = 0 } = useQuery({
    queryKey: ['comments-count', postId],
    queryFn: () => getCommentCount(postId),
    enabled: isOpen && !!postId,
    staleTime: 10000,
  });
  
  // Handle adding a new comment or reply
  const handleCommentAdded = () => {
    refetch();
    setReplyToCommentId(null);
  };
  
  // Handle reply to comment
  const handleReplyClick = (commentId: string) => {
    setReplyToCommentId(commentId);
    
    // Scroll to the reply form after a short delay
    setTimeout(() => {
      const replyElement = document.getElementById(`reply-${commentId}`);
      if (replyElement) {
        replyElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 100);
  };
  
  const handleEmojiSelect = (emoji: string) => {
    setSelectedEmoji(emoji);
    toast.success(`Reacted with ${emoji}`);
  };
  
  // Organize comments into threaded view
  const organizedComments = React.useMemo(() => {
    if (!comments || !Array.isArray(comments)) return [];
    
    // Create a map of comments by ID for quick lookup
    const commentMap = new Map<string, Comment>();
    const topLevelComments: Comment[] = [];
    
    // First pass - add all comments to the map
    comments.forEach(comment => {
      commentMap.set(comment.id, { ...comment, children: [] });
    });
    
    // Second pass - organize into parent-child relationships
    comments.forEach(comment => {
      const currentComment = commentMap.get(comment.id);
      if (!currentComment) return;
      
      if (comment.parent_id && commentMap.has(comment.parent_id)) {
        // This is a reply - add to parent's children
        const parentComment = commentMap.get(comment.parent_id);
        if (parentComment && parentComment.children) {
          parentComment.children.push(currentComment);
        }
      } else {
        // This is a top-level comment
        topLevelComments.push(currentComment);
      }
    });
    
    // Sort top level comments by created_at (newest first)
    return topLevelComments.sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }, [comments]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-gaming-900 border-gaming-700 text-white p-0 max-h-[90vh] flex flex-col">
        {/* Instagram-style header */}
        <DialogTitle className="flex justify-between items-center p-3 border-b border-gaming-700 sticky top-0 bg-gaming-900 z-10">
          <div className="flex items-center">
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8 mr-2" 
              onClick={onClose}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h3 className="text-lg font-semibold">Comments</h3>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8" 
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </DialogTitle>
        
        {/* Original post creator section - Instagram style */}
        {post && (
          <div className="p-4 border-b border-gaming-700 flex gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={post.profiles?.avatar_url || ''} />
              <AvatarFallback>{post.profiles?.username?.[0]?.toUpperCase() || 'U'}</AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center">
                <span className="font-semibold text-gaming-100 mr-2">
                  {post.profiles?.username || 'Anonymous'}
                </span>
                <span className="text-gaming-300 text-xs">Original poster</span>
              </div>
              <p className="text-gaming-200 mt-1">{post.content || ''}</p>
            </div>
          </div>
        )}
        
        {/* Comments section - scrollable */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="p-12 text-center text-gaming-300">Loading comments...</div>
          ) : error ? (
            <div className="p-12 text-center text-red-500">Failed to load comments</div>
          ) : organizedComments.length === 0 ? (
            <div className="p-12 text-center text-gaming-300">
              No comments yet. Be the first to comment!
            </div>
          ) : (
            <div className="divide-y divide-gaming-800/30">
              {organizedComments.map(comment => (
                <div key={comment.id} className="px-4 py-3">
                  <CommentItem 
                    comment={comment} 
                    onReply={handleReplyClick}
                    isReplying={replyToCommentId === comment.id}
                    onReplyCancel={() => setReplyToCommentId(null)}
                    onReplyAdded={handleCommentAdded}
                  />
                  
                  {/* Reply form */}
                  {replyToCommentId === comment.id && (
                    <div id={`reply-${comment.id}`} className="ml-11 mt-3">
                      <CommentForm 
                        postId={postId}
                        parentId={comment.id}
                        onReplyComplete={handleCommentAdded}
                        onCancel={() => setReplyToCommentId(null)}
                        placeholder={`Reply to ${comment.profiles?.username || 'User'}...`}
                        buttonText="Reply"
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* Instagram-style emoji reactions at bottom */}
        <div className="pt-3 pb-2 px-4 border-t border-gaming-800 flex items-center justify-between">
          <div className="flex space-x-6">
            <button 
              className={`text-2xl ${selectedEmoji === '❤️' ? 'text-red-500' : 'text-gaming-400 hover:text-gaming-300'}`}
              onClick={() => handleEmojiSelect('❤️')}
            >
              ❤️
            </button>
            <button 
              className={`text-2xl ${selectedEmoji === '🙌' ? 'text-yellow-500' : 'text-gaming-400 hover:text-gaming-300'}`}
              onClick={() => handleEmojiSelect('🙌')}
            >
              🙌
            </button>
            <button 
              className={`text-2xl ${selectedEmoji === '🔥' ? 'text-orange-500' : 'text-gaming-400 hover:text-gaming-300'}`}
              onClick={() => handleEmojiSelect('🔥')}
            >
              🔥
            </button>
            <button 
              className={`text-2xl ${selectedEmoji === '👏' ? 'text-yellow-500' : 'text-gaming-400 hover:text-gaming-300'}`}
              onClick={() => handleEmojiSelect('👏')}
            >
              👏
            </button>
            <button 
              className={`text-2xl ${selectedEmoji === '😊' ? 'text-yellow-500' : 'text-gaming-400 hover:text-gaming-300'}`}
              onClick={() => handleEmojiSelect('😊')}
            >
              😊
            </button>
            <button 
              className={`text-2xl ${selectedEmoji === '😂' ? 'text-yellow-500' : 'text-gaming-400 hover:text-gaming-300'}`}
              onClick={() => handleEmojiSelect('😂')}
            >
              😂
            </button>
            <button 
              className={`text-2xl ${selectedEmoji === '😮' ? 'text-yellow-500' : 'text-gaming-400 hover:text-gaming-300'}`}
              onClick={() => handleEmojiSelect('😮')}
            >
              😮
            </button>
          </div>
        </div>
        
        {/* Comment input at bottom - Instagram style */}
        <div className="border-t border-gaming-700 p-3 sticky bottom-0 bg-gaming-900">
          <CommentForm
            postId={postId}
            onReplyComplete={handleCommentAdded}
            placeholder="Add a comment..."
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CommentModal;
