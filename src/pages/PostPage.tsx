import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { BackButton } from '@/components/ui/back-button';
import { MessageSquare, ThumbsUp, Trophy, Share2, ExternalLink, ChevronDown } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { CommentList } from '@/components/post/CommentList';
import { CommentForm } from '@/components/post/comment/CommentForm';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

const PostPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [showAllComments, setShowAllComments] = useState(false);

  // Fetch post details
  const { data: post, isLoading } = useQuery({
    queryKey: ['post-details', id],
    queryFn: async () => {
      if (!id) return null;
      
      const { data, error } = await supabase
        .from('posts')
        .select(`
          id,
          content,
          created_at,
          user_id,
          likes_count,
          comments_count,
          profiles:user_id (
            username,
            avatar_url
          )
        `)
        .eq('id', id)
        .single();
        
      if (error) {
        console.error("Error fetching post:", error);
        return null;
      }
      
      return data;
    },
    enabled: !!id,
  });

  const handleCommentAdded = () => {
    toast.success('Comment added!');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1a237e] to-[#0d1b3c]">
      <div className="fixed top-0 left-0 right-0 z-50 p-4 bg-black/40 backdrop-blur-lg border-b border-white/10">
        <div className="flex items-center justify-center max-w-7xl mx-auto relative">
          <BackButton />
          <h1 className="text-3xl font-bold text-white">Post</h1>
        </div>
      </div>

      <div className="container mx-auto px-4 pt-24 pb-20 max-w-2xl">
        <div className="bg-black/30 backdrop-blur-sm rounded-xl overflow-hidden border border-white/10 shadow-xl mb-4">
          {/* Post Author */}
          <div className="p-4 border-b border-white/10 flex items-center space-x-3">
            <Avatar className="w-10 h-10 rounded-full bg-purple-500 overflow-hidden">
              {post?.profiles?.avatar_url ? (
                <AvatarImage 
                  src={post.profiles.avatar_url}
                  alt={post.profiles.username || 'User'}
                />
              ) : (
                <AvatarFallback className="text-white font-bold">
                  {post?.profiles?.username?.substring(0, 1)?.toUpperCase() || 'U'}
                </AvatarFallback>
              )}
            </Avatar>
            <div>
              <p className="font-medium text-white">{post?.profiles?.username || 'Username'}</p>
              <p className="text-xs text-gray-400">
                {post?.created_at ? new Date(post.created_at).toLocaleDateString() : '2 hours ago'}
              </p>
            </div>
          </div>
          
          {/* Post Content */}
          <div className="p-4">
            <p className="text-gray-300">{post?.content || `This is a detailed view of post ID: ${id}`}</p>
            
            {/* Placeholder for media content */}
            {!post?.content && (
              <div className="mt-4 rounded-lg bg-gray-800 aspect-video flex items-center justify-center">
                <p className="text-gray-400">Media content would appear here</p>
              </div>
            )}
          </div>
          
          {/* Post Actions */}
          <div className="px-4 py-3 bg-black/40 flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <button className="flex items-center text-gray-300 hover:text-purple-400">
                <ThumbsUp className="mr-1 h-5 w-5" />
                <span className="text-sm">{post?.likes_count || 24}</span>
              </button>
              <button className="flex items-center text-gray-300 hover:text-purple-400">
                <MessageSquare className="mr-1 h-5 w-5" />
                <span className="text-sm">{post?.comments_count || 8}</span>
              </button>
              <button 
                className="flex items-center text-gray-300 hover:text-purple-400"
                onClick={() => navigate(`/post/${id}/comments`)}
              >
                <span className="text-xs ml-1 underline text-purple-400">See all comments</span>
              </button>
              <button className="flex items-center text-gray-300 hover:text-purple-400">
                <Trophy className="mr-1 h-5 w-5" />
              </button>
            </div>
            <button className="text-gray-300 hover:text-purple-400">
              <Share2 className="h-5 w-5" />
            </button>
          </div>
        </div>
        
        {/* Comments section */}
        <div className="bg-black/30 backdrop-blur-sm rounded-xl p-4 border border-white/10 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-white flex items-center">
              <MessageSquare className="mr-2 h-5 w-5 text-purple-400" />
              Comments
              {post?.comments_count > 0 && (
                <span className="ml-2 text-sm text-gray-400">({post.comments_count})</span>
              )}
            </h3>
            
            {/* Link to dedicated comments page */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(`/post/${id}/comments`)}
              className="text-xs flex items-center gap-1 text-purple-400 hover:text-purple-300 hover:bg-purple-950/30"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              View All Comments
            </Button>
          </div>
          
          {/* Display recent comments */}
          <div className="mb-4 border border-white/5 rounded-lg overflow-hidden">
            {id && (
              <div className="max-h-[400px] overflow-auto custom-scrollbar bg-black/20">
                <CommentList 
                  postId={id}
                  onCommentAdded={handleCommentAdded}
                />
              </div>
            )}
          </div>
          
          {/* Comment input */}
          <div className="mt-4">
            <CommentForm
              postId={id || ''}
              onCommentAdded={handleCommentAdded}
              autoFocus={false}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default PostPage;
