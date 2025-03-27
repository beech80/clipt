import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { useQuery } from '@tanstack/react-query';
import { Post } from '@/types/post';
import PostItem from '@/components/PostItem';
import TabsNavigation from '@/components/TabsNavigation';

const Saved = () => {
  const { user } = useAuth();
  
  // Fetch saved posts 
  const { data: savedPosts, isLoading, error } = useQuery({
    queryKey: ['saved-posts'],
    queryFn: async () => {
      if (!user) return [];
      
      // First get the bookmarks
      const { data: bookmarks, error: bookmarksError } = await supabase
        .from('bookmarks')
        .select('post_id')
        .eq('user_id', user.id);
      
      if (bookmarksError) {
        console.error('Error fetching bookmarks:', bookmarksError);
        return [];
      }
      
      if (!bookmarks || bookmarks.length === 0) {
        return [];
      }
      
      // Then get the actual posts
      const postIds = bookmarks.map(bookmark => bookmark.post_id);
      const { data: posts, error: postsError } = await supabase
        .from('posts')
        .select(`
          id,
          content,
          created_at,
          user_id,
          image_url,
          video_url,
          game_id,
          post_type,
          profiles(id, username, display_name, avatar_url)
        `)
        .in('id', postIds)
        .eq('is_published', true)
        .order('created_at', { ascending: false });
      
      if (postsError) {
        console.error('Error fetching saved posts:', postsError);
        return [];
      }
      
      return posts as Post[];
    },
    enabled: !!user
  });

  return (
    <div className="relative min-h-screen bg-gaming-900">
      <TabsNavigation />
      
      <div className="pt-16 container mx-auto px-4 py-6">
        <h1 className="text-center text-2xl font-semibold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400 mb-6">
          Saved Clipts
        </h1>
        
        <div className="space-y-6 max-w-2xl mx-auto">
          {isLoading ? (
            <div className="flex justify-center items-center py-20">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-500"></div>
            </div>
          ) : error ? (
            <div className="text-center py-20 text-red-400">
              <p>Failed to load saved posts. Please try again later.</p>
            </div>
          ) : savedPosts && savedPosts.length > 0 ? (
            savedPosts.map((post) => (
              <PostItem key={post.id} post={post} />
            ))
          ) : (
            <div className="text-center py-20 text-gray-400">
              <p className="text-xl font-semibold mb-2">No saved posts yet</p>
              <p className="text-sm text-gray-500">Bookmark posts to save them for later</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Saved;
