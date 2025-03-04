import React, { useState, useEffect } from 'react';
import { FeaturedCarousel } from "@/components/content/FeaturedCarousel";
import { TopGames } from "@/components/discover/TopGames";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useNavigate } from 'react-router-dom';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { igdbService } from '@/services/igdbService';
import { Input } from '@/components/ui/input';
import { Search, Trophy, Flame, Clock, ArrowUp, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import PostItem from '@/components/PostItem';
import { useAuth } from '@/contexts/AuthContext';

interface StreamInfo {
  is_live: boolean;
  viewer_count: number;
}

interface Streamer {
  id: string;
  username: string;
  avatar_url: string | null;
  display_name: string | null;
  streams: StreamInfo[];
}

const Discover = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [gameFilter, setGameFilter] = useState<'top_rated' | 'most_played' | 'most_watched'>('top_rated');
  const [activeTab, setActiveTab] = useState('games');
  const [searchQuery, setSearchQuery] = useState('');
  const [trendingFilter, setTrendingFilter] = useState<'recent' | 'most_liked' | 'most_discussed'>('most_liked');

  // Query for streamers
  const { data: streamers, isLoading: streamersLoading } = useQuery({
    queryKey: ['streamers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          id,
          username,
          avatar_url,
          display_name,
          streams (
            is_live,
            viewer_count
          )
        `)
        .order('is_live', { ascending: false })
        .limit(50);

      if (error) throw error;
      
      return (data || []).map((profile: Streamer) => ({
        ...profile,
        is_live: profile.streams?.[0]?.is_live || false,
        viewer_count: profile.streams?.[0]?.viewer_count || 0
      }));
    }
  });

  // Search query for streamers
  const { data: searchedStreamers } = useQuery({
    queryKey: ['streamers', 'search', searchQuery, activeTab],
    enabled: !!searchQuery && searchQuery.length > 2 && activeTab === 'streamers',
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          id,
          username,
          avatar_url,
          display_name,
          streams (
            is_live,
            viewer_count
          )
        `)
        .ilike('username', `%${searchQuery}%`)
        .limit(10);

      if (error) throw error;
      
      return (data || []).map((profile: Streamer) => ({
        ...profile,
        is_live: profile.streams?.[0]?.is_live || false,
        viewer_count: profile.streams?.[0]?.viewer_count || 0
      }));
    }
  });

  // Search query for games
  const { data: searchedGames } = useQuery({
    queryKey: ['games', 'search', searchQuery, activeTab],
    enabled: !!searchQuery && searchQuery.length > 2 && activeTab === 'games',
    queryFn: async () => {
      return igdbService.searchGames(searchQuery);
    }
  });

  // Query for trending posts with improved algorithm
  const { data: trendingPosts, isLoading: postsLoading } = useQuery({
    queryKey: ['trending_posts', trendingFilter],
    queryFn: async () => {
      let query = supabase
        .from('posts')
        .select(`
          id,
          content,
          image_url,
          video_url,
          image_urls,
          user_id,
          created_at,
          post_type,
          likes_count:likes(count),
          comments_count:comments(count),
          clip_votes:clip_votes(count),
          profiles (
            username,
            avatar_url,
            display_name
          ),
          games (
            name,
            id
          )
        `)
        .eq('is_published', true);

      // Filter based on selected trending criteria
      switch (trendingFilter) {
        case 'recent':
          query = query.order('created_at', { ascending: false });
          break;
        case 'most_liked':
          query = query.order('likes_count', { ascending: false });
          break;
        case 'most_discussed':
          query = query.order('comments_count', { ascending: false });
          break;
      }

      // Fetch user's interests to enhance recommendations
      if (user) {
        const { data: userInterests } = await supabase
          .from('user_interests')
          .select('game_id')
          .eq('user_id', user.id);
          
        // If user has interests, prioritize posts related to those games
        if (userInterests && userInterests.length > 0) {
          const gameIds = userInterests.map(interest => interest.game_id);
          // We'll fetch some posts related to user interests and some general trending
          const { data: interestPosts } = await query
            .in('game_id', gameIds)
            .limit(5);
            
          // Then get general trending posts
          const { data: generalPosts } = await query.limit(15);
          
          // Combine and deduplicate
          if (interestPosts && generalPosts) {
            const combined = [...interestPosts];
            generalPosts.forEach(post => {
              if (!combined.some(p => p.id === post.id)) {
                combined.push(post);
              }
            });
            return combined.slice(0, 15);
          }
        }
      }

      // If no user or no interests, just return trending posts
      const { data, error } = await query.limit(15);
      
      if (error) throw error;
      return data || [];
    }
  });

  // Handle tab change
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    setSearchQuery(''); // Clear search when changing tabs
  };

  return (
    <div className="container mx-auto p-4 min-h-screen relative">
      <div className="header">
        <h1 className="text-2xl font-bold text-center py-4 text-white">Discovery</h1>
        
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <Input
              placeholder={`Search for ${activeTab === 'games' ? 'games' : activeTab === 'streamers' ? 'streamers' : 'content'}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-gray-800 border-gray-700 focus:ring-purple-600 focus:border-purple-600"
            />
            {searchQuery && (
              <Button 
                variant="ghost" 
                className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                onClick={() => setSearchQuery('')}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>

      <Tabs defaultValue="games" className="mt-6" onValueChange={handleTabChange}>
        <div className="flex justify-center mb-8">
          <TabsList className="grid w-full max-w-md grid-cols-3">
            <TabsTrigger
              value="games"
              className="data-[state=active]:bg-gaming-700"
              onClick={() => setActiveTab('games')}
            >
              Games
            </TabsTrigger>
            <TabsTrigger
              value="streamers"
              className="data-[state=active]:bg-gaming-700"
              onClick={() => setActiveTab('streamers')}
            >
              Streamers
            </TabsTrigger>
            <TabsTrigger
              value="trending"
              className="data-[state=active]:bg-gaming-700"
              onClick={() => setActiveTab('trending')}
            >
              Trending
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="games" className="mt-6">
          {searchQuery && searchQuery.length > 2 ? (
            /* Search results for games */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {searchedGames && searchedGames.length > 0 ? (
                searchedGames.map((game) => (
                  <Card 
                    key={game.id} 
                    className="relative overflow-hidden cursor-pointer transition duration-300 ease-in-out transform hover:scale-105"
                    onClick={() => navigate(`/game/${game.id}`)}
                  >
                    <div className="aspect-video">
                      <img 
                        src={game.cover_url || '/placeholder-game.jpg'}
                        alt={game.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/70 to-transparent p-4">
                      <h3 className="font-bold text-white">{game.name}</h3>
                      {game.rating && (
                        <div className="flex items-center mt-1">
                          <Badge variant="secondary" className="mr-2">
                            {Math.round(game.rating)}%
                          </Badge>
                          <span className="text-xs text-white/70">
                            {game.release_date || 'Unknown release date'}
                          </span>
                        </div>
                      )}
                    </div>
                  </Card>
                ))
              ) : (
                <div className="col-span-3 text-center p-12">
                  <p className="text-gray-400">No games found matching your search.</p>
                </div>
              )}
            </div>
          ) : (
            /* Default games view */
            <>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-white">Featured Games</h2>
                <Select value={gameFilter} onValueChange={(value: any) => setGameFilter(value)}>
                  <SelectTrigger className="w-36 sm:w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="top_rated">Top Rated</SelectItem>
                    <SelectItem value="most_played">Most Played</SelectItem>
                    <SelectItem value="most_watched">Most Watched</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <TopGames filter={gameFilter} />
            </>
          )}
        </TabsContent>

        <TabsContent value="streamers">
          {searchQuery && searchQuery.length > 2 ? (
            /* Search results for streamers */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {searchedStreamers && searchedStreamers.length > 0 ? (
                searchedStreamers.map((streamer: Streamer) => (
                  <Card 
                    key={streamer.id} 
                    className="p-4 flex items-center gap-4 bg-gaming-800/50 backdrop-blur-sm border-gaming-700"
                  >
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={streamer.avatar_url || ''} alt={streamer.username} />
                      <AvatarFallback>{streamer.username?.slice(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <h3 className="font-semibold">{streamer.display_name || streamer.username}</h3>
                      <div className="flex items-center gap-2">
                        {streamer.is_live && (
                          <>
                            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                            <span className="text-sm text-white/60">
                              {streamer.viewer_count} viewers
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                    <Button 
                      size="sm" 
                      onClick={() => navigate(`/user/${streamer.username}`)}
                    >
                      View Profile
                    </Button>
                  </Card>
                ))
              ) : (
                <div className="col-span-3 text-center p-12">
                  <p className="text-gray-400">No streamers found matching your search.</p>
                </div>
              )}
            </div>
          ) : (
            /* Default streamers view */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {streamers?.map((streamer) => (
                <Card 
                  key={streamer.id} 
                  className="p-4 flex items-center gap-4 bg-gaming-800/50 backdrop-blur-sm border-gaming-700"
                >
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={streamer.avatar_url || ''} alt={streamer.username} />
                    <AvatarFallback>{streamer.username?.slice(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <h3 className="font-semibold">{streamer.display_name || streamer.username}</h3>
                    <div className="flex items-center gap-2">
                      {streamer.is_live && (
                        <>
                          <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                          <span className="text-sm text-white/60">
                            {streamer.viewer_count} viewers
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                  <Button 
                    size="sm" 
                    onClick={() => navigate(`/user/${streamer.username}`)}
                  >
                    View Profile
                  </Button>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="trending">
          <div className="mb-6">
            <div className="flex justify-center mb-4">
              <div className="flex bg-gaming-800 p-1 rounded-lg">
                <Button 
                  variant={trendingFilter === 'most_liked' ? "default" : "ghost"}
                  size="sm"
                  className="flex gap-2 items-center"
                  onClick={() => setTrendingFilter('most_liked')}
                >
                  <Flame className="h-4 w-4" />
                  <span>Most Liked</span>
                </Button>
                <Button 
                  variant={trendingFilter === 'most_discussed' ? "default" : "ghost"}
                  size="sm"
                  className="flex gap-2 items-center"
                  onClick={() => setTrendingFilter('most_discussed')}
                >
                  <ArrowUp className="h-4 w-4" />
                  <span>Most Discussed</span>
                </Button>
                <Button 
                  variant={trendingFilter === 'recent' ? "default" : "ghost"}
                  size="sm"
                  className="flex gap-2 items-center"
                  onClick={() => setTrendingFilter('recent')}
                >
                  <Clock className="h-4 w-4" />
                  <span>Recent</span>
                </Button>
              </div>
            </div>

            {postsLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Card key={i} className="p-4 animate-pulse">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="rounded-full bg-gaming-700/50 h-10 w-10"></div>
                      <div className="flex-1 space-y-2">
                        <div className="h-3 bg-gaming-700/50 rounded w-1/4"></div>
                        <div className="h-2 bg-gaming-700/50 rounded w-1/6"></div>
                      </div>
                    </div>
                    <div className="h-4 bg-gaming-700/50 rounded w-3/4 mb-3"></div>
                    <div className="h-4 bg-gaming-700/50 rounded w-1/2 mb-3"></div>
                    <div className="aspect-video bg-gaming-700/50 rounded mb-4"></div>
                  </Card>
                ))}
              </div>
            ) : trendingPosts && trendingPosts.length > 0 ? (
              <div className="space-y-4">
                {trendingPosts.map((post) => (
                  <PostItem key={post.id} post={post} />
                ))}
              </div>
            ) : (
              <div className="text-center p-12">
                <Trophy className="mx-auto h-12 w-12 text-gaming-500 mb-4" />
                <h3 className="text-xl font-bold text-white mb-2">No trending posts yet</h3>
                <p className="text-gray-400">Be the first to share your gaming moments!</p>
                <Button 
                  className="mt-4"
                  onClick={() => navigate('/clipts/create')}
                >
                  Create Post
                </Button>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Discover;
