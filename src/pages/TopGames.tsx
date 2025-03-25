import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { BackButton } from '@/components/ui/back-button';
import { Gamepad2, TrendingUp, Users, Search, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface Game {
  id: string;
  name: string;
  cover_url: string | null;
  post_count: number;
  follower_count: number;
  is_trending: boolean;
}

// Make filter type more specific
type FilterType = 'all' | 'trending' | 'following';

const TopGames = () => {
  const navigate = useNavigate();
  const [games, setGames] = useState<Game[]>([]);
  const [filteredGames, setFilteredGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<FilterType>('all');
  const [followingIds, setFollowingIds] = useState<string[]>([]);

  useEffect(() => {
    let isMounted = true;
    
    const fetchGames = async () => {
      try {
        setLoading(true);
        
        // Fetch games from Supabase
        const { data, error } = await supabase
          .from('games')
          .select('id, name, cover_url, post_count, follower_count, is_trending')
          .order('post_count', { ascending: false })
          .limit(50);
          
        if (error) throw error;
        
        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        
        // Fetch user's followed games if logged in
        if (user) {
          const { data: followingData, error: followingError } = await supabase
            .from('game_follows')
            .select('game_id')
            .eq('user_id', user.id);
            
          if (!followingError && followingData) {
            setFollowingIds(followingData.map(follow => follow.game_id));
          }
        }
        
        if (isMounted && data) {
          const gamesData = data.map(game => ({
            id: game.id,
            name: game.name,
            cover_url: game.cover_url,
            post_count: Number(game.post_count || 0),
            follower_count: Number(game.follower_count || 0),
            is_trending: Boolean(game.is_trending)
          }));
          
          setGames(gamesData);
          setFilteredGames(gamesData);
        }
      } catch (error) {
        console.error('Error fetching games:', error);
        toast.error('Failed to load games data');
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };
    
    fetchGames();
    
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    // Apply filters and search
    let result = [...games];
    
    // Apply filter
    if (filter === 'trending') {
      result = result.filter(game => game.is_trending);
    } else if (filter === 'following' && followingIds.length > 0) {
      result = result.filter(game => followingIds.includes(game.id));
    }
    
    // Apply search
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim();
      result = result.filter(game => game.name.toLowerCase().includes(term));
    }
    
    setFilteredGames(result);
  }, [games, searchTerm, filter, followingIds]);

  // Handle filter change safely
  const handleFilterChange = (value: string) => {
    if (value === 'all' || value === 'trending' || value === 'following') {
      setFilter(value);
    }
  };

  const handleFollow = async (gameId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error('You need to login to follow games');
        navigate('/login');
        return;
      }
      
      const isFollowing = followingIds.includes(gameId);
      
      if (isFollowing) {
        // Unfollow
        await supabase
          .from('game_follows')
          .delete()
          .eq('user_id', user.id)
          .eq('game_id', gameId);
          
        setFollowingIds(followingIds.filter(id => id !== gameId));
        toast.success('Unfollowed successfully');
      } else {
        // Follow
        await supabase
          .from('game_follows')
          .insert([
            { user_id: user.id, game_id: gameId }
          ]);
          
        setFollowingIds([...followingIds, gameId]);
        toast.success('Following game successfully');
      }
    } catch (error) {
      console.error('Error following/unfollowing game:', error);
      toast.error('Failed to update follow status');
    }
  };

  // Navigate to game details
  const navigateToGame = (gameId: string) => {
    navigate(`/game/${gameId}`);
  };

  const clearSearch = () => {
    setSearchTerm('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1a237e] to-[#0d1b3c]">
      <div className="fixed top-0 left-0 right-0 z-50 p-4 bg-black/40 backdrop-blur-lg border-b border-white/10">
        <div className="flex items-center justify-center max-w-7xl mx-auto relative">
          <BackButton />
          <h1 className="text-3xl font-bold text-white flex items-center gap-2">
            <TrendingUp className="text-purple-400" size={24} />
            Top Games
          </h1>
        </div>
      </div>

      <div className="container mx-auto px-4 pt-24 pb-20 max-w-2xl">
        <div className="bg-black/30 backdrop-blur-sm rounded-xl border border-white/10 shadow-xl overflow-hidden">
          {/* Filters and Search */}
          <div className="p-4 border-b border-white/10">
            <div className="relative mb-4">
              <input 
                type="text" 
                placeholder="Search games..." 
                className="w-full bg-gray-800/50 border border-gray-700 rounded-full py-2 px-4 text-white placeholder:text-gray-400 pl-10 pr-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <Search 
                className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" 
              />
              {searchTerm && (
                <button 
                  onClick={clearSearch} 
                  className="absolute right-3 top-2.5 text-gray-400 hover:text-white"
                >
                  <X size={18} />
                </button>
              )}
            </div>
            
            <Tabs value={filter} onValueChange={handleFilterChange}>
              <TabsList className="w-full grid grid-cols-3 bg-gray-800/50">
                <TabsTrigger value="all" className="data-[state=active]:bg-purple-600">
                  All
                </TabsTrigger>
                <TabsTrigger value="trending" className="data-[state=active]:bg-blue-600">
                  <TrendingUp size={14} className="mr-1" />
                  Trending
                </TabsTrigger>
                <TabsTrigger value="following" className="data-[state=active]:bg-green-600">
                  Following
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
          
          {/* Games List */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-10">
              <div className="w-12 h-12 border-t-4 border-purple-500 border-solid rounded-full animate-spin"></div>
              <p className="mt-4 text-white">Loading games...</p>
            </div>
          ) : filteredGames.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center px-4">
              <Gamepad2 size={48} className="text-gray-500 mb-4" />
              <p className="text-white text-lg mb-2">No games found</p>
              <p className="text-gray-400 text-sm">
                {filter === 'trending' ? 'No trending games at the moment.' : 
                 filter === 'following' ? 'You\'re not following any games yet.' : 
                 'Try adjusting your search or filters.'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-white/10">
              {filteredGames.map(game => (
                <div 
                  key={game.id}
                  className="flex items-center justify-between p-4 hover:bg-white/5 cursor-pointer transition-colors"
                  onClick={() => navigateToGame(game.id)}
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 rounded-lg overflow-hidden border border-gray-700">
                      {game.cover_url ? (
                        <img
                          src={game.cover_url}
                          alt={game.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-indigo-900 flex items-center justify-center">
                          <Gamepad2 className="text-indigo-400" size={20} />
                        </div>
                      )}
                    </div>
                    <div>
                      <div className="flex items-center">
                        <h3 className="font-medium text-white">{game.name}</h3>
                        {game.is_trending && (
                          <span className="ml-2 px-1.5 py-0.5 bg-blue-500/20 text-blue-400 text-xs rounded-md flex items-center">
                            <TrendingUp size={12} className="mr-1" />
                            Hot
                          </span>
                        )}
                      </div>
                      <div className="flex items-center text-gray-400 text-sm mt-1">
                        <Users size={14} className="mr-1" />
                        {game.follower_count.toLocaleString()} followers
                        <span className="mx-1">•</span>
                        {game.post_count.toLocaleString()} posts
                      </div>
                    </div>
                  </div>
                  <Button 
                    variant={followingIds.includes(game.id) ? "default" : "outline"}
                    size="sm"
                    className={followingIds.includes(game.id) 
                      ? "bg-purple-600 hover:bg-purple-700 text-white border-purple-600" 
                      : "border-gray-700 text-gray-300 hover:bg-purple-600 hover:text-white hover:border-purple-600"}
                    onClick={(e) => handleFollow(game.id, e)}
                  >
                    {followingIds.includes(game.id) ? 'Following' : 'Follow'}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TopGames;
