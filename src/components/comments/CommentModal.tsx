import React, { useEffect, useRef, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { CommentList } from '@/components/post/CommentList';
import { Button } from '@/components/ui/button';
import { X, MessageCircle, Heart, RefreshCw, User, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useNavigate } from 'react-router-dom';

// Import custom styles for the comment modal
import './comment-modal.css';

// Define type for post data
interface PostWithProfile {
  id: string;
  content?: string;
  title?: string;
  created_at: string;
  profiles?: {
    username: string;
    avatar_url: string;
  };
}

interface CommentModalProps {
  isOpen: boolean;
  onClose: () => void;
  postId?: string;
  autoFocusInput?: boolean;
}

const CommentModal: React.FC<CommentModalProps> = ({ 
  isOpen, 
  onClose, 
  postId,
  autoFocusInput = false 
}) => {
  const initialFocusRef = useRef<HTMLButtonElement>(null);
  const [totalComments, setTotalComments] = useState<number>(0);
  const navigate = useNavigate();

  // Fetch post details to show title
  const { data: postData } = useQuery<PostWithProfile | null>({
    queryKey: ['post-details', postId],
    queryFn: async () => {
      if (!postId) return null;
      
      try {
        const { data, error } = await supabase
          .from('posts')
          .select(`
            id,
            content,
            created_at,
            user_id,
            profiles:user_id (
              username,
              avatar_url
            )
          `)
          .eq('id', postId)
          .single();
          
        if (error) {
          console.error("Error fetching post:", error);
          return null;
        }
        
        // Ensure we have a valid post object
        if (!data || typeof data !== 'object') {
          return null;
        }
        
        // Return with proper type
        return {
          id: data.id || '',
          content: data.content,
          created_at: data.created_at || new Date().toISOString(),
          profiles: data.profiles
        } as PostWithProfile;
      } catch (err) {
        console.error("Failed to fetch post data:", err);
        return null;
      }
    },
    enabled: !!postId && isOpen,
  });

  // Count total comments
  const { data: commentCount } = useQuery<number>({
    queryKey: ['comment-count', postId],
    queryFn: async () => {
      if (!postId) return 0;
      
      const { count, error } = await supabase
        .from('comments')
        .select('id', { count: 'exact' })
        .eq('post_id', postId);
        
      if (error) throw error;
      return count || 0;
    },
    enabled: !!postId && isOpen,
  });

  useEffect(() => {
    if (commentCount !== undefined) {
      setTotalComments(commentCount);
    }
  }, [commentCount]);

  useEffect(() => {
    console.log(`Comment modal ${isOpen ? 'opened' : 'closed'} for post ${postId}`);
    
    // When opening, focus on the comment textarea after a small delay
    if (isOpen) {
      setTimeout(() => {
        const textarea = document.querySelector('.comment-form-input');
        if (textarea instanceof HTMLElement && (autoFocusInput || Math.random() > 0.5)) {
          textarea.focus();
          
          if (autoFocusInput) {
            textarea.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }
      }, 300);
    }
  }, [isOpen, postId, autoFocusInput]);

  // Close function with check
  const handleClose = () => {
    if (postId) {
      onClose();
    } else {
      console.error("No post ID provided");
      toast.error("Something went wrong");
    }
  };

  // Navigate to full comments page
  const handleViewAllComments = () => {
    if (postId) {
      onClose(); // Close the modal first
      navigate(`/post/${postId}/comments`); // Navigate to the dedicated comments page
    }
  };

  if (!postId) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()} modal={true}>
      <DialogContent 
        className="sm:max-w-[700px] h-[95vh] max-h-[950px] flex flex-col p-0 gap-0 bg-gaming-800 border-gaming-700 rounded-lg shadow-xl"
      >
        {/* Enhanced header with post info */}
        <DialogHeader className="sticky top-0 z-10 px-6 py-4 border-b border-gaming-700 bg-gaming-900 rounded-t-lg">
          <div className="flex items-center justify-between w-full">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={handleClose} 
              className="rounded-full hover:bg-gaming-700"
              ref={initialFocusRef}
            >
              <X className="h-5 w-5" />
            </Button>
            
            <DialogTitle className="text-center flex-1 text-xl font-bold bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">
              Comments ({totalComments})
            </DialogTitle>
            
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full hover:bg-gaming-700 opacity-0 pointer-events-none"
            >
              <X className="h-5 w-5 invisible" />
            </Button>
          </div>
          
          {/* Post summary */}
          {postData && (
            <div className="mt-2 px-2 py-3 bg-gaming-800 rounded-md border border-gaming-700">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-full bg-gaming-700 overflow-hidden flex items-center justify-center">
                  {postData?.profiles?.avatar_url ? (
                    <img 
                      src={postData?.profiles?.avatar_url} 
                      alt={postData?.profiles?.username || 'User'} 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="w-4 h-4 text-gray-400" />
                  )}
                </div>
                <span className="font-medium text-sm">{postData?.profiles?.username || 'Anonymous'}</span>
              </div>
              <p className="text-sm text-gray-300 line-clamp-2">{postData?.content || postData?.title || ''}</p>
              
              {/* View All Comments button */}
              <div className="flex justify-end mt-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleViewAllComments}
                  className="text-xs h-7 border-gaming-700 hover:bg-gaming-700 text-purple-400 hover:text-purple-300 flex items-center gap-1 px-2 py-1"
                >
                  <ExternalLink className="h-3 w-3" />
                  View All Comments
                </Button>
              </div>
            </div>
          )}
        </DialogHeader>
        
        {/* Comment list with visual enhancements */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden bg-gaming-800 custom-scrollbar">
          <div className="py-2 px-1">
            <CommentList 
              postId={postId} 
              onCommentAdded={() => {
                toast.success('Comment added!');
              }}
              autoFocus={autoFocusInput}
            />
          </div>
        </div>
        
        {/* Comment count footer */}
        <div className="border-t border-gaming-700 py-2 px-4 bg-gaming-900 text-xs text-gray-400 flex items-center justify-between">
          <span className="flex items-center gap-1">
            <MessageCircle className="w-3.5 h-3.5" /> {totalComments} comment{totalComments !== 1 ? 's' : ''}
          </span>
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleViewAllComments}
              className="text-xs h-7 px-2 text-purple-400 hover:text-purple-300"
            >
              <ExternalLink className="mr-1 h-3 w-3" /> Full View
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => window.location.reload()}
              className="text-xs h-7 px-2"
            >
              <RefreshCw className="mr-1 h-3 w-3" /> Refresh
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CommentModal;
