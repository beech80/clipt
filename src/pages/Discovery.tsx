import React, { useState, useEffect } from 'react';
import { useNavigate } from "react-router-dom";
import { BackButton } from "@/components/ui/back-button";
import { Search, Filter, Gamepad2, Zap, TrendingUp, Award } from "lucide-react";
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import PostItem from '@/components/PostItem';
import { Post } from '@/types/post';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { motion } from "framer-motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Discovery = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all');
  const [activeTab, setActiveTab] = useState('trending');
  
  // Filter options with improved styling
  const filterOptions = [
    { value: 'all', label: 'All', icon: <Filter className="w-4 h-4 mr-1" /> },
    { value: 'clipts', label: 'Clipts', icon: <Gamepad2 className="w-4 h-4 mr-1" /> },
    { value: 'trending', label: 'Trending', icon: <TrendingUp className="w-4 h-4 mr-1" /> },
    { value: 'featured', label: 'Featured', icon: <Award className="w-4 h-4 mr-1" /> }
  ];

  const { data: posts, isLoading, refetch } = useQuery({
    queryKey: ['posts', 'discovery', searchTerm, filter, activeTab],
    queryFn: async () => {
      let query = supabase
        .from('posts')
        .select(`
          *,
          profiles:user_id (
            username,
            avatar_url,
            display_name
          ),
          games:game_id (name, cover_url),
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
      
      // Apply tab filter
      if (activeTab === 'trending') {
        query = query.order('views', { ascending: false });
      } else if (activeTab === 'featured') {
        query = query.eq('is_featured', true);
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

  useEffect(() => {
    refetch();
  }, [searchTerm, filter, activeTab, refetch]);

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        staggerChildren: 0.1 
      } 
    }
  };
  
  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { 
      y: 0, 
      opacity: 1,
      transition: { type: "spring", stiffness: 100 } 
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1a1f3c] to-[#0d0f1e]">
      {/* Enhanced Header with Glowing Gradient and Blur */}
      <div className="fixed top-0 left-0 right-0 z-50 p-4 bg-black/60 backdrop-blur-lg border-b border-indigo-500/20">
        <div className="flex items-center justify-center max-w-7xl mx-auto relative">
          <BackButton className="absolute left-0 text-indigo-400 hover:text-indigo-300" />
          <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-500 flex items-center gap-2">
            <Gamepad2 className="text-indigo-400" size={28} />
            Discovery Zone
          </h1>
        </div>
      </div>

      <div className="container mx-auto px-4 pt-24 pb-32 max-w-2xl">
        {/* Enchanced Tabs UI */}
        <Tabs defaultValue="trending" value={activeTab} onValueChange={setActiveTab} className="w-full mb-6">
          <TabsList className="grid grid-cols-3 w-full rounded-xl p-1 bg-indigo-950/40 backdrop-blur-sm border border-indigo-500/20">
            <TabsTrigger 
              value="trending" 
              className="data-[state=active]:bg-gradient-to-r from-indigo-600 to-purple-600 data-[state=active]:text-white rounded-lg"
            >
              <TrendingUp className="w-4 h-4 mr-2" />
              Trending
            </TabsTrigger>
            <TabsTrigger 
              value="latest" 
              className="data-[state=active]:bg-gradient-to-r from-indigo-600 to-purple-600 data-[state=active]:text-white rounded-lg"
            >
              <Zap className="w-4 h-4 mr-2" />
              Latest
            </TabsTrigger>
            <TabsTrigger 
              value="featured" 
              className="data-[state=active]:bg-gradient-to-r from-indigo-600 to-purple-600 data-[state=active]:text-white rounded-lg"
            >
              <Award className="w-4 h-4 mr-2" />
              Featured
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Enhanced Search UI with glowing effect */}
        <div className="mb-6 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-indigo-400" size={18} />
            <Input 
              className="bg-indigo-950/30 border-indigo-500/30 pl-10 text-white placeholder:text-indigo-300/50 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 h-12 rounded-xl"
              placeholder="Search for gaming content..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="flex flex-wrap gap-2 justify-center">
            {filterOptions.map(option => (
              <Button
                key={option.value}
                variant={filter === option.value ? "default" : "outline"}
                className={filter === option.value 
                  ? "bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white border-none shadow-lg shadow-purple-600/20"
                  : "bg-indigo-950/30 border-indigo-500/30 text-indigo-300 hover:bg-indigo-900/40 hover:text-white"
                }
                size="sm"
                onClick={() => setFilter(option.value)}
              >
                {option.icon}
                {option.label}
              </Button>
            ))}
          </div>
        </div>

        {isLoading && (
          <div className="flex justify-center my-12">
            <div className="flex flex-col items-center">
              <div className="animate-pulse flex space-x-2 items-center">
                <div className="w-3 h-3 bg-indigo-400 rounded-full animate-bounce"></div>
                <div className="w-3 h-3 bg-purple-400 rounded-full animate-bounce delay-75"></div>
                <div className="w-3 h-3 bg-indigo-400 rounded-full animate-bounce delay-150"></div>
              </div>
              <div className="mt-3 text-indigo-300/70">Discovering content...</div>
            </div>
          </div>
        )}

        {posts && posts.length > 0 && (
          <motion.div 
            className="space-y-6"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {posts.map((post) => (
              <motion.div key={post.id} variants={itemVariants}>
                <PostItem post={post} />
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* If no results found - with improved styling */}
        {!isLoading && (!posts || posts.length === 0) && (
          <motion.div 
            className="flex items-center justify-center py-20"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="text-center space-y-4 bg-indigo-950/30 p-8 rounded-2xl border border-indigo-500/20 backdrop-blur-sm">
              <div className="inline-block p-4 bg-indigo-900/30 rounded-full mb-4">
                <Search className="h-10 w-10 text-indigo-400" />
              </div>
              <p className="text-2xl font-semibold text-white">No results found</p>
              <p className="text-indigo-300">Try adjusting your search or filter</p>
              <Button
                className="mt-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 px-6 py-2"
                onClick={() => {
                  setSearchTerm('');
                  setFilter('all');
                }}
              >
                Clear filters
              </Button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default Discovery;
