import React, { useState, useEffect } from 'react';
import { useNavigate } from "react-router-dom";
import { BackButton } from "@/components/ui/back-button";
import { Search, Filter, Gamepad2, Users, Tv, Trophy } from "lucide-react";
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import PostItem from '@/components/PostItem';
import { Post } from '@/types/post';
import GameCard from '@/components/GameCard';
import StreamerCard from '@/components/StreamerCard';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Discovery = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all');
  const [activeTab, setActiveTab] = useState('posts');
  
  // Posts Tab
  const { data: posts, isLoading: postsLoading, refetch: refetchPosts } = useQuery({
    queryKey: ['posts', 'discovery', searchTerm, filter],
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
      
      const { data, error } = await query;

      if (error) throw error;

      return data?.map(post => ({
        ...post,
        likes_count: post.likes?.[0]?.count || 0,
        clip_votes: post.clip_votes || []
      })) as Post[];
    },
    enabled: activeTab === 'posts',
  });

  // Games Tab
  const { data: games, isLoading: gamesLoading, refetch: refetchGames } = useQuery({
    queryKey: ['games', 'discovery', searchTerm],
    queryFn: async () => {
      let query = supabase
        .from('games')
        .select(`
          *,
          post_count:posts(count)
        `)
        .order('name');
      
      // Apply search filter if provided
      if (searchTerm) {
        query = query.ilike('name', `%${searchTerm}%`);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      return data || [];
    },
    enabled: activeTab === 'games',
  });

  // Streamers Tab
  const { data: streamers, isLoading: streamersLoading, refetch: refetchStreamers } = useQuery({
    queryKey: ['streamers', 'discovery', searchTerm],
    queryFn: async () => {
      let query = supabase
        .from('profiles')
        .select('*')
        .not('streaming_url', 'is', null)
        .order('username');
      
      // Apply search filter if provided
      if (searchTerm) {
        query = query.or(`username.ilike.%${searchTerm}%,display_name.ilike.%${searchTerm}%`);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      return data || [];
    },
    enabled: activeTab === 'streamers',
  });

  // Filter options
  const filterOptions = [
    { value: 'all', label: 'All' },
    { value: 'clipts', label: 'Clipts' },
    { value: 'discussions', label: 'Discussions' },
    { value: 'images', label: 'Images' }
  ];

  useEffect(() => {
    if (activeTab === 'posts') {
      refetchPosts();
    } else if (activeTab === 'games') {
      refetchGames();
    } else if (activeTab === 'streamers') {
      refetchStreamers();
    }
  }, [searchTerm, filter, activeTab, refetchPosts, refetchGames, refetchStreamers]);

  // Handle tab change
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    setSearchTerm('');
    if (value === 'posts') {
      setFilter('all');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1a1f3c] to-[#0d0f1e]">
      {/* Header */}
      <div className="fixed top-0 left-0 right-0 z-50 p-4 bg-black/60 backdrop-blur-lg border-b border-indigo-500/20">
        <div className="flex items-center justify-center max-w-7xl mx-auto relative">
          <BackButton className="absolute left-0 text-indigo-400 hover:text-indigo-300" />
          <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-500 flex items-center gap-2">
            <Gamepad2 className="text-indigo-400" size={28} />
            Discovery
          </h1>
        </div>
      </div>

      <div className="container mx-auto px-4 pt-24 pb-32 max-w-2xl">
        {/* Main Tabs */}
        <Tabs defaultValue="posts" value={activeTab} onValueChange={handleTabChange} className="w-full mb-6">
          <TabsList className="grid grid-cols-3 w-full rounded-xl p-1 bg-indigo-950/40 backdrop-blur-sm border border-indigo-500/20">
            <TabsTrigger 
              value="posts" 
              className="data-[state=active]:bg-gradient-to-r from-indigo-600 to-purple-600 data-[state=active]:text-white rounded-lg"
            >
              <Gamepad2 className="w-4 h-4 mr-2" />
              Posts
            </TabsTrigger>
            <TabsTrigger 
              value="games" 
              className="data-[state=active]:bg-gradient-to-r from-indigo-600 to-purple-600 data-[state=active]:text-white rounded-lg"
            >
              <Trophy className="w-4 h-4 mr-2" />
              Games
            </TabsTrigger>
            <TabsTrigger 
              value="streamers" 
              className="data-[state=active]:bg-gradient-to-r from-indigo-600 to-purple-600 data-[state=active]:text-white rounded-lg"
            >
              <Tv className="w-4 h-4 mr-2" />
              Streamers
            </TabsTrigger>
          </TabsList>

          {/* Search UI */}
          <div className="mb-6 mt-6 space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-indigo-400" size={18} />
              <Input 
                className="bg-indigo-950/30 border-indigo-500/30 pl-10 text-white placeholder:text-indigo-300/50 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 h-12 rounded-xl"
                placeholder={activeTab === 'posts' 
                  ? "Search for gaming content..." 
                  : activeTab === 'games' 
                    ? "Search for games..." 
                    : "Search for streamers..."}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            {/* Filters only for Posts tab */}
            {activeTab === 'posts' && (
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
                    {option.label}
                  </Button>
                ))}
              </div>
            )}
          </div>

          {/* Tab Content */}
          <TabsContent value="posts" className="mt-2 space-y-6">
            {postsLoading && (
              <div className="flex justify-center my-12">
                <div className="flex flex-col items-center">
                  <div className="animate-pulse flex space-x-2 items-center">
                    <div className="w-3 h-3 bg-indigo-400 rounded-full animate-bounce"></div>
                    <div className="w-3 h-3 bg-purple-400 rounded-full animate-bounce delay-75"></div>
                    <div className="w-3 h-3 bg-indigo-400 rounded-full animate-bounce delay-150"></div>
                  </div>
                  <div className="mt-3 text-indigo-300/70">Loading posts...</div>
                </div>
              </div>
            )}

            {!postsLoading && posts && posts.length > 0 && (
              <div className="space-y-6">
                {posts.map((post) => (
                  <PostItem key={post.id} post={post} />
                ))}
              </div>
            )}

            {!postsLoading && (!posts || posts.length === 0) && (
              <div className="flex items-center justify-center py-20">
                <div className="text-center space-y-4 bg-indigo-950/30 p-8 rounded-2xl border border-indigo-500/20 backdrop-blur-sm">
                  <div className="inline-block p-4 bg-indigo-900/30 rounded-full mb-4">
                    <Search className="h-10 w-10 text-indigo-400" />
                  </div>
                  <p className="text-2xl font-semibold text-white">No posts found</p>
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
              </div>
            )}
          </TabsContent>

          <TabsContent value="games" className="mt-2">
            {gamesLoading && (
              <div className="flex justify-center my-12">
                <div className="flex flex-col items-center">
                  <div className="animate-pulse flex space-x-2 items-center">
                    <div className="w-3 h-3 bg-indigo-400 rounded-full animate-bounce"></div>
                    <div className="w-3 h-3 bg-purple-400 rounded-full animate-bounce delay-75"></div>
                    <div className="w-3 h-3 bg-indigo-400 rounded-full animate-bounce delay-150"></div>
                  </div>
                  <div className="mt-3 text-indigo-300/70">Loading games...</div>
                </div>
              </div>
            )}

            {!gamesLoading && games && games.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {games.map((game) => (
                  <GameCard 
                    key={game.id} 
                    id={game.id}
                    name={game.name}
                    coverUrl={game.cover_url}
                    postCount={game.post_count?.[0]?.count || 0}
                    onClick={() => navigate(`/game/${game.id}`)}
                  />
                ))}
              </div>
            )}

            {!gamesLoading && (!games || games.length === 0) && (
              <div className="flex items-center justify-center py-20">
                <div className="text-center space-y-4 bg-indigo-950/30 p-8 rounded-2xl border border-indigo-500/20 backdrop-blur-sm">
                  <div className="inline-block p-4 bg-indigo-900/30 rounded-full mb-4">
                    <Trophy className="h-10 w-10 text-indigo-400" />
                  </div>
                  <p className="text-2xl font-semibold text-white">No games found</p>
                  <p className="text-indigo-300">Try a different search term</p>
                  <Button
                    className="mt-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 px-6 py-2"
                    onClick={() => {
                      setSearchTerm('');
                    }}
                  >
                    Clear search
                  </Button>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="streamers" className="mt-2">
            {streamersLoading && (
              <div className="flex justify-center my-12">
                <div className="flex flex-col items-center">
                  <div className="animate-pulse flex space-x-2 items-center">
                    <div className="w-3 h-3 bg-indigo-400 rounded-full animate-bounce"></div>
                    <div className="w-3 h-3 bg-purple-400 rounded-full animate-bounce delay-75"></div>
                    <div className="w-3 h-3 bg-indigo-400 rounded-full animate-bounce delay-150"></div>
                  </div>
                  <div className="mt-3 text-indigo-300/70">Loading streamers...</div>
                </div>
              </div>
            )}

            {!streamersLoading && streamers && streamers.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {streamers.map((streamer) => (
                  <StreamerCard 
                    key={streamer.id}
                    id={streamer.id}
                    username={streamer.username}
                    displayName={streamer.display_name}
                    avatarUrl={streamer.avatar_url}
                    streamingUrl={streamer.streaming_url}
                    game={streamer.current_game}
                    isLive={streamer.is_live}
                    onClick={() => navigate(`/profile/${streamer.id}`)}
                  />
                ))}
              </div>
            )}

            {!streamersLoading && (!streamers || streamers.length === 0) && (
              <div className="flex items-center justify-center py-20">
                <div className="text-center space-y-4 bg-indigo-950/30 p-8 rounded-2xl border border-indigo-500/20 backdrop-blur-sm">
                  <div className="inline-block p-4 bg-indigo-900/30 rounded-full mb-4">
                    <Users className="h-10 w-10 text-indigo-400" />
                  </div>
                  <p className="text-2xl font-semibold text-white">No streamers found</p>
                  <p className="text-indigo-300">Try a different search term</p>
                  <Button
                    className="mt-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 px-6 py-2"
                    onClick={() => {
                      setSearchTerm('');
                    }}
                  >
                    Clear search
                  </Button>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Discovery;
