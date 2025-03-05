import React, { useState, useEffect } from 'react';
import { useNavigate } from "react-router-dom";
import { BackButton } from "@/components/ui/back-button";
import { Search, Filter, Gamepad2 } from "lucide-react";
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import PostItem from '@/components/PostItem';
import { Post } from '@/types/post';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

const Discovery = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all');

  const { data: posts, isLoading, refetch } = useQuery({
    queryKey: ['posts', 'discovery', searchTerm, filter],
    queryFn: async () => {
      let query = supabase
        .from('posts')
        .select(`
          *,
          profiles:user_id (
            username,
            avatar_url
          ),
          games:game_id (name),
          likes:likes(count),
          clip_votes:clip_votes(count)
        `)
        .order('created_at', { ascending: false });
      
      // Apply search filter if provided
      if (searchTerm) {
        query = query.or(`title.ilike.%${searchTerm}%,content.ilike.%${searchTerm}%`);
      }
      
      // Apply category filter
      if (filter !== 'all') {
        query = query.eq('post_type', filter);
      }
      
      const { data, error } = await query;

      if (error) throw error;

      return data?.map(post => ({
        ...post,
        likes_count: post.likes?.[0]?.count || 0,
        clip_votes: post.clip_votes || []
      })) as Post[];
    },
  });

  // Filter options
  const filterOptions = [
    { value: 'all', label: 'All' },
    { value: 'clipts', label: 'Clipts' },
    { value: 'discussions', label: 'Discussions' },
    { value: 'images', label: 'Images' }
  ];

  useEffect(() => {
    refetch();
  }, [searchTerm, filter, refetch]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1a237e] to-[#0d1b3c]">
      <div className="fixed top-0 left-0 right-0 z-50 p-4 bg-black/40 backdrop-blur-lg border-b border-white/10">
        <div className="flex items-center justify-center max-w-7xl mx-auto relative">
          <BackButton />
          <h1 className="text-3xl font-bold text-white flex items-center gap-2">
            <Gamepad2 className="text-purple-400" size={24} />
            Discovery
          </h1>
        </div>
      </div>

      <div className="container mx-auto px-4 pt-24 pb-20 max-w-2xl">
        {/* Search and Filter UI */}
        <div className="mb-6 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <Input 
              className="bg-gray-800/50 border-gray-700 pl-10 text-white placeholder:text-gray-400 focus:border-purple-500"
              placeholder="Search for gaming content..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="flex flex-wrap gap-2">
            {filterOptions.map(option => (
              <Button
                key={option.value}
                variant={filter === option.value ? "default" : "outline"}
                className={filter === option.value 
                  ? "bg-purple-600 hover:bg-purple-700 text-white"
                  : "bg-gray-800/50 border-gray-700 text-gray-300 hover:bg-gray-700/80"
                }
                size="sm"
                onClick={() => setFilter(option.value)}
              >
                {option.label}
              </Button>
            ))}
          </div>
        </div>

        {isLoading && (
          <div className="flex justify-center my-8">
            <div className="animate-pulse flex space-x-2 items-center">
              <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce delay-75"></div>
              <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce delay-150"></div>
              <div className="ml-2 text-white/70">Loading content...</div>
            </div>
          </div>
        )}

        {posts && posts.length > 0 && (
          <div className="space-y-6">
            {posts.map((post) => (
              <PostItem key={post.id} post={post} />
            ))}
          </div>
        )}

        {/* If no results found */}
        {!isLoading && (!posts || posts.length === 0) && (
          <div className="flex items-center justify-center py-20">
            <div className="text-center space-y-4">
              <p className="text-2xl font-semibold text-white/60">No results found</p>
              <p className="text-purple-400">Try adjusting your search or filter</p>
              <Button
                className="mt-4 bg-purple-600 hover:bg-purple-700"
                onClick={() => {
                  setSearchTerm('');
                  setFilter('all');
                }}
              >
                Clear filters
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Discovery;
