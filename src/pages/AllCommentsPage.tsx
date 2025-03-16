import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { 
  MoreHorizontal, 
  ChevronLeft, 
  MessageCircle, 
  Heart, 
  Loader2, 
  MoreVertical,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  ChevronLeftIcon,
  ChevronRightIcon
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { getAllComments, editComment, deleteComment, likeComment } from '@/services/commentService';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/hooks/useAuth';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface CommentData {
  id: string;
  content: string;
  created_at: string;
  updated_at?: string;
  user_id: string;
  post_id: string;
  parent_id: string | null;
  likes_count: number;
  liked_by_me?: boolean;
  profiles?: {
    username: string;
    avatar_url: string | null;
  };
  posts?: {
    id: string;
    title: string;
    thumbnail_url: string | null;
  };
  children?: CommentData[];
}

interface PaginatedResponse {
  comments: CommentData[];
  total: number;
  page: number;
  limit: number;
}

const AllCommentsPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [page, setPage] = useState(0);
  const [commentsPerPage] = useState(20);
  const [editingComment, setEditingComment] = useState<CommentData | null>(null);
  const [editContent, setEditContent] = useState('');
  const [expandedReplies, setExpandedReplies] = useState<Record<string, boolean>>({});

  // Fetch all comments with pagination
  const { data, isLoading, error, refetch } = useQuery<PaginatedResponse>({
    queryKey: ['all-comments', page, commentsPerPage],
    queryFn: async () => {
      const response = await getAllComments(page, commentsPerPage);
      if (response.error) throw response.error;
      return response.data as PaginatedResponse;
    },
    keepPreviousData: true,
  });

  const handleBackClick = () => {
    navigate(-1);
  };

  const handleEditClick = (comment: CommentData) => {
    setEditingComment(comment);
    setEditContent(comment.content);
  };

  const handleCancelEdit = () => {
    setEditingComment(null);
    setEditContent('');
  };

  const handleSaveEdit = async () => {
    if (!editingComment || !user || !editContent.trim()) return;
    
    try {
      await editComment(editingComment.id, user.id, editContent);
      setEditingComment(null);
      setEditContent('');
      refetch();
      toast.success('Comment updated successfully');
    } catch (error) {
      console.error('Error updating comment:', error);
      toast.error('Failed to update comment');
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!user) return;
    
    try {
      await deleteComment(commentId, user.id);
      refetch();
      toast.success('Comment deleted successfully');
    } catch (error) {
      console.error('Error deleting comment:', error);
      toast.error('Failed to delete comment');
    }
  };

  const handleLikeComment = async (commentId: string) => {
    if (!user) {
      toast.error('Please sign in to like comments');
      return;
    }
    
    try {
      await likeComment(commentId);
      refetch();
    } catch (error) {
      console.error('Error liking comment:', error);
      toast.error('Failed to like comment');
    }
  };

  const toggleReplies = (commentId: string) => {
    setExpandedReplies(prev => ({
      ...prev,
      [commentId]: !prev[commentId]
    }));
  };

  const formatTimeAgo = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch (error) {
      return 'some time ago';
    }
  };

  const totalPages = data ? Math.ceil(data.total / commentsPerPage) : 0;

  return (
    <div className="max-w-4xl mx-auto bg-[#1e1f2e] min-h-screen">
      <div className="sticky top-0 z-10 bg-[#1e1f2e] border-b border-[#3b3d4d] px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={handleBackClick}
              className="mr-2 text-gray-400 hover:text-white hover:bg-[#3d3e4d]"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-xl font-semibold text-white">All Comments</h1>
          </div>
        </div>
      </div>

      <div className="p-4">
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <Card key={i} className="p-4 bg-[#2d2e3d] border-[#3b3d4d]">
                <div className="flex items-start gap-3">
                  <Skeleton className="h-10 w-10 rounded-full bg-[#3b3d4d]" />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <Skeleton className="h-4 w-24 bg-[#3b3d4d] mb-2" />
                      <Skeleton className="h-3 w-16 bg-[#3b3d4d]" />
                    </div>
                    <Skeleton className="h-16 w-full bg-[#3b3d4d]" />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : error ? (
          <div className="p-6 text-center bg-[#2d2e3d] rounded-lg border border-[#3b3d4d]">
            <p className="text-red-400">Failed to load comments. Please try again later.</p>
            <Button 
              onClick={() => refetch()} 
              variant="outline"
              className="mt-4 border-[#3b3d4d] hover:bg-[#3d3e4d] text-indigo-400"
            >
              Retry
            </Button>
          </div>
        ) : (
          <>
            <div className="mb-4 text-sm text-gray-400">
              Showing {data?.comments.length || 0} of {data?.total || 0} comments
            </div>
            
            {data?.comments.length === 0 ? (
              <div className="p-8 text-center bg-[#2d2e3d] rounded-lg border border-[#3b3d4d]">
                <MessageCircle className="h-12 w-12 mx-auto text-gray-500 mb-3" />
                <h3 className="text-xl font-semibold text-white mb-2">No Comments Yet</h3>
                <p className="text-gray-400">Be the first to join the conversation.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {data?.comments.map((comment) => (
                  <Card key={comment.id} className="bg-[#2d2e3d] border-[#3b3d4d] overflow-hidden group">
                    {/* Post info */}
                    {comment.posts && (
                      <div className="bg-[#232433] px-4 py-2 flex items-center justify-between">
                        <Link 
                          to={`/post/${comment.post_id}`}
                          className="text-sm text-indigo-400 hover:text-indigo-300 flex items-center"
                        >
                          {comment.posts.thumbnail_url && (
                            <div className="w-6 h-6 rounded overflow-hidden mr-2 flex-shrink-0">
                              <img 
                                src={comment.posts.thumbnail_url} 
                                alt="" 
                                className="w-full h-full object-cover"
                              />
                            </div>
                          )}
                          <span className="truncate">{comment.posts.title || 'Untitled Post'}</span>
                          <ChevronRight className="h-4 w-4 ml-1 flex-shrink-0" />
                        </Link>
                      </div>
                    )}
                    
                    {/* Comment content */}
                    <div className="p-4">
                      <div className="flex items-start gap-3">
                        <Avatar className="h-10 w-10 border-2 border-[#3b3d4d] group-hover:border-indigo-500 transition-all">
                          <AvatarImage 
                            src={comment.profiles?.avatar_url || ''} 
                            alt={comment.profiles?.username} 
                          />
                          <AvatarFallback className="bg-[#3d3e4d] text-white">
                            {comment.profiles?.username?.[0]?.toUpperCase() || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-baseline justify-between mb-1">
                            <div className="font-semibold text-white">
                              {comment.profiles?.username}
                            </div>
                            <div className="text-xs text-gray-500">
                              {formatTimeAgo(comment.created_at)}
                              {comment.updated_at && ' (edited)'}
                            </div>
                          </div>
                          
                          {editingComment?.id === comment.id ? (
                            <div className="mt-2">
                              <Textarea
                                value={editContent}
                                onChange={(e) => setEditContent(e.target.value)}
                                className="min-h-[80px] bg-[#232433] border-[#3b3d4d] focus:border-indigo-500 rounded-lg text-white resize-none"
                                autoFocus
                              />
                              <div className="flex gap-2 mt-2 justify-end">
                                <Button 
                                  variant="ghost" 
                                  onClick={handleCancelEdit}
                                  className="text-gray-300 hover:text-white hover:bg-[#3d3e4d]"
                                >
                                  Cancel
                                </Button>
                                <Button 
                                  onClick={handleSaveEdit}
                                  disabled={!editContent.trim() || editContent.trim() === comment.content}
                                  className="bg-indigo-600 hover:bg-indigo-700 text-white"
                                >
                                  Save
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <div className="text-white break-words">
                              {comment.content}
                            </div>
                          )}
                          
                          <div className="flex items-center gap-4 mt-3">
                            <button 
                              onClick={() => handleLikeComment(comment.id)}
                              className={`flex items-center gap-1 text-sm ${comment.liked_by_me ? 'text-red-500' : 'text-gray-400 hover:text-red-500'}`}
                            >
                              <Heart className={`h-4 w-4 ${comment.liked_by_me ? 'fill-current' : ''}`} />
                              <span>{comment.likes_count || 0}</span>
                            </button>
                            
                            <Link 
                              to={`/post/${comment.post_id}`}
                              className="flex items-center gap-1 text-sm text-gray-400 hover:text-indigo-400"
                            >
                              <MessageCircle className="h-4 w-4" />
                              <span>Reply</span>
                            </Link>
                            
                            {user && user.id === comment.user_id && (
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <button className="text-gray-400 hover:text-white invisible group-hover:visible focus:visible">
                                    <MoreVertical className="h-4 w-4" />
                                  </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className="bg-[#2d2e3d] border border-[#3b3d4d]">
                                  <DropdownMenuItem 
                                    className="text-white cursor-pointer hover:bg-[#3d3e4d]"
                                    onClick={() => handleEditClick(comment)}
                                  >
                                    Edit
                                  </DropdownMenuItem>
                                  <DropdownMenuItem 
                                    className="text-red-400 cursor-pointer hover:bg-[#3d3e4d]"
                                    onClick={() => handleDeleteComment(comment.id)}
                                  >
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
            
            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center mt-6 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.max(0, p - 1))}
                  disabled={page === 0}
                  className="border-[#3b3d4d] hover:bg-[#3d3e4d] text-white"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                
                <div className="flex items-center text-sm px-3 text-gray-300">
                  Page {page + 1} of {totalPages}
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                  disabled={page >= totalPages - 1}
                  className="border-[#3b3d4d] hover:bg-[#3d3e4d] text-white"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default AllCommentsPage;
