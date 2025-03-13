import React, { useEffect, useRef, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { CommentList } from '@/components/post/CommentList';
import { Button } from '@/components/ui/button';
import { X, MessageCircle, Heart, RefreshCw, User, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';

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
        className="sm:max-w-[500px] h-[95vh] max-h-[800px] flex flex-col p-0 gap-0 bg-white dark:bg-gaming-900 border-0 rounded-lg shadow-xl"
      >
        {/* Simple header with Comments title */}
        <DialogHeader className="sticky top-0 z-10 px-4 py-3 border-b border-gray-200 dark:border-gaming-800 bg-white dark:bg-gaming-900 rounded-t-lg">
          <div className="flex items-center justify-between w-full">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={handleClose} 
              className="rounded-full hover:bg-gray-100 dark:hover:bg-gaming-800"
            >
              <X className="h-5 w-5" />
            </Button>
            
            <DialogTitle className="text-center flex-1 text-xl font-semibold">
              Comments
            </DialogTitle>
            
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full hover:bg-gray-100 dark:hover:bg-gaming-800 opacity-0 pointer-events-none"
            >
              <X className="h-5 w-5 invisible" />
            </Button>
          </div>
        </DialogHeader>
        
        {/* Comment list with Instagram-style UI */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden bg-white dark:bg-gaming-900 custom-scrollbar">
          {/* Original post author */}
          {postData && (
            <div className="px-4 py-3 border-b border-gray-200 dark:border-gaming-800">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gaming-800 overflow-hidden flex items-center justify-center">
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
                <div className="flex-1">
                  <div className="flex items-center gap-1">
                    <span className="font-medium text-sm">{postData?.profiles?.username || 'Anonymous'}</span>
                    <span className="text-sm text-gray-500 dark:text-gray-400">•</span>
                    <span className="text-gray-500 dark:text-gray-400 text-sm">{formatDistanceToNow(new Date(postData.created_at), { addSuffix: false })}</span>
                  </div>
                  <p className="text-sm mt-1">{postData?.content || postData?.title || ''}</p>
                </div>
              </div>
            </div>
          )}
          
          {/* Comments section */}
          <div className="py-0">
            <CommentList 
              postId={postId} 
              onCommentAdded={() => {
                toast.success('Comment added!');
              }}
              autoFocus={autoFocusInput}
            />
          </div>
        </div>
        
        {/* Emoji reaction bar and comment input field */}
        <div className="border-t border-gray-200 dark:border-gaming-800 px-4 pt-2 pb-4 bg-white dark:bg-gaming-900">
          {/* Emoji reactions */}
          <div className="flex items-center justify-between mb-3 overflow-x-auto">
            <div className="flex gap-4">
              <button className="text-xl">❤️</button>
              <button className="text-xl">👏</button>
              <button className="text-xl">🔥</button>
              <button className="text-xl">👍</button>
              <button className="text-xl">😢</button>
              <button className="text-xl">😊</button>
              <button className="text-xl">😮</button>
              <button className="text-xl">😂</button>
            </div>
          </div>
          
          {/* Comment input */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gaming-800 overflow-hidden flex items-center justify-center">
              <User className="w-4 h-4 text-gray-400" />
            </div>
            <input 
              type="text" 
              placeholder="Add a comment..." 
              className="flex-1 bg-gray-100 dark:bg-gaming-800 border-0 rounded-full py-2 px-4 text-sm focus:outline-none focus:ring-0"
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CommentModal;
