import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { BackButton } from '@/components/ui/back-button';
import { MessageSquare, ThumbsUp, Trophy, Share2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/AuthContext';

const PostPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

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
          trophy_count,
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
                <span className="text-sm font-semibold">{post?.likes_count || 0}</span>
              </button>
              <button className="flex items-center text-gray-300 hover:text-purple-400">
                <MessageSquare className="mr-1 h-5 w-5" />
                <span className="text-sm font-semibold">{post?.comments_count || 0}</span>
              </button>
              <button className="flex items-center text-gray-300 hover:text-purple-400">
                <Trophy className="mr-1 h-5 w-5" />
                <span className="text-sm font-semibold">{post?.trophy_count || 0}</span>
              </button>
            </div>
            <button className="text-gray-300 hover:text-purple-400">
              <Share2 className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PostPage;
