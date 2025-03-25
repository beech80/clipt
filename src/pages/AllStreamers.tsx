import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { BackButton } from '@/components/ui/back-button';
import { Users, TrendingUp, Search, Video, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface Streamer {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  is_live: boolean;
  follower_count: number;
  streaming_url: string | null;
  current_game: string | null;
}

interface FollowRecord {
  following_id: string;
}

type FilterType = 'all' | 'live' | 'following';

const AllStreamers = () => {
  const navigate = useNavigate();
  const [streamers, setStreamers] = useState<Streamer[]>([]);
  const [filteredStreamers, setFilteredStreamers] = useState<Streamer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<FilterType>('all');
  const [followingIds, setFollowingIds] = useState<string[]>([]);

  useEffect(() => {
    let isMounted = true;
    
    const fetchStreamers = async () => {
      setLoading(true);
      
      try {
        // Fetch streamers from database
        const { data: streamerData, error: streamerError } = await supabase
          .from('profiles')
          .select('id, username, display_name, avatar_url, is_live, follower_count, streaming_url, current_game')
          .eq('is_streamer', true)
          .order('follower_count', { ascending: false })
          .limit(50);
        
        if (streamerError) {
          console.error('Error fetching streamers:', streamerError);
          toast.error('Failed to load streamers data');
          if (isMounted) setLoading(false);
          return;
        }
        
        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        
        // Prepare following IDs if user is logged in
        let followingList: string[] = [];
        
        if (user) {
          const { data: followData, error: followError } = await supabase
            .from('follows')
            .select('following_id')
            .eq('follower_id', user.id);
            
          if (!followError && followData) {
            followingList = followData.map((item: FollowRecord) => item.following_id);
          }
        }
        
        // Only update state if component is still mounted
        if (isMounted) {
          // Transform raw data to proper types
          const transformedStreamers: Streamer[] = streamerData.map((item: any) => ({
            id: item.id || '',
            username: item.username || '',
            display_name: item.display_name || null,
            avatar_url: item.avatar_url || null,
            is_live: Boolean(item.is_live),
            follower_count: Number(item.follower_count || 0),
            streaming_url: item.streaming_url || null,
            current_game: item.current_game || null
          }));
          
          setStreamers(transformedStreamers);
          setFilteredStreamers(transformedStreamers);
          setFollowingIds(followingList);
          setLoading(false);
        }
      } catch (err) {
        console.error('Unexpected error fetching data:', err);
        if (isMounted) {
          toast.error('Failed to load streamers data');
          setLoading(false);
        }
      }
    };
    
    fetchStreamers();
    
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    // Apply filters and search
    let result = [...streamers];
    
    // Apply filter
    if (filter === 'live') {
      result = result.filter(streamer => streamer.is_live);
    } else if (filter === 'following' && followingIds.length > 0) {
      result = result.filter(streamer => followingIds.includes(streamer.id));
    }
    
    // Apply search
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim();
      result = result.filter(
        streamer => 
          streamer.username.toLowerCase().includes(term) || 
          (streamer.display_name && streamer.display_name.toLowerCase().includes(term))
      );
    }
    
    setFilteredStreamers(result);
  }, [streamers, searchTerm, filter, followingIds]);

  const handleFollow = async (streamerId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error('You need to login to follow streamers');
        navigate('/login');
        return;
      }
      
      const isFollowing = followingIds.includes(streamerId);
      
      if (isFollowing) {
        // Unfollow
        await supabase
          .from('follows')
          .delete()
          .eq('follower_id', user.id)
          .eq('following_id', streamerId);
          
        setFollowingIds(followingIds.filter(id => id !== streamerId));
        toast.success('Unfollowed successfully');
      } else {
        // Follow
        await supabase
          .from('follows')
          .insert([
            { follower_id: user.id, following_id: streamerId }
          ]);
          
        setFollowingIds([...followingIds, streamerId]);
        toast.success('Following successfully');
      }
    } catch (error) {
      console.error('Error following/unfollowing:', error);
      toast.error('Failed to update follow status');
    }
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
            <Users className="text-pink-400" size={24} />
            Top Streamers
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
                placeholder="Search streamers..." 
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
            
            <Tabs value={filter} onValueChange={(value) => setFilter(value as FilterType)}>
              <TabsList className="w-full grid grid-cols-3 bg-gray-800/50">
                <TabsTrigger value="all" className="data-[state=active]:bg-purple-600">
                  All
                </TabsTrigger>
                <TabsTrigger value="live" className="data-[state=active]:bg-red-600">
                  <Video size={14} className="mr-1" />
                  Live
                </TabsTrigger>
                <TabsTrigger value="following" className="data-[state=active]:bg-blue-600">
                  Following
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
          
          {/* Streamers List */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-10">
              <div className="w-12 h-12 border-t-4 border-pink-500 border-solid rounded-full animate-spin"></div>
              <p className="mt-4 text-white">Loading streamers...</p>
            </div>
          ) : filteredStreamers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center px-4">
              <Users size={48} className="text-gray-500 mb-4" />
              <p className="text-white text-lg mb-2">No streamers found</p>
              <p className="text-gray-400 text-sm">
                {filter === 'live' ? 'No live streamers at the moment.' : 
                 filter === 'following' ? 'You\'re not following any streamers yet.' : 
                 'Try adjusting your search or filters.'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-white/10">
              {filteredStreamers.map(streamer => (
                <div 
                  key={streamer.id}
                  className="flex items-center justify-between p-4 hover:bg-white/5 cursor-pointer transition-colors"
                  onClick={() => navigate(`/profile/${streamer.id}`)}
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 relative rounded-full overflow-hidden border border-gray-700">
                      {streamer.avatar_url ? (
                        <img
                          src={streamer.avatar_url}
                          alt={streamer.username}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                          <Users className="text-gray-400" size={20} />
                        </div>
                      )}
                      {streamer.is_live && (
                        <div className="absolute top-0 right-0 w-4 h-4 bg-red-600 rounded-full border-2 border-black animate-pulse"></div>
                      )}
                    </div>
                    <div>
                      <div className="flex items-center">
                        <h3 className="font-medium text-white">
                          {streamer.display_name || streamer.username}
                        </h3>
                        {streamer.is_live && (
                          <span className="ml-2 px-1.5 py-0.5 bg-red-500/20 text-red-400 text-xs rounded-md flex items-center">
                            <Video size={12} className="mr-1" />
                            Live
                          </span>
                        )}
                      </div>
                      <div className="flex items-center text-gray-400 text-sm mt-1">
                        <Users size={14} className="mr-1" />
                        {streamer.follower_count.toLocaleString()} followers
                        {streamer.current_game && (
                          <span className="ml-2">• {streamer.current_game}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <Button 
                    variant={followingIds.includes(streamer.id) ? "default" : "outline"}
                    size="sm"
                    className={followingIds.includes(streamer.id) 
                      ? "bg-pink-600 hover:bg-pink-700 text-white border-pink-600" 
                      : "border-gray-700 text-gray-300 hover:bg-pink-600 hover:text-white hover:border-pink-600"}
                    onClick={(e) => handleFollow(streamer.id, e)}
                  >
                    {followingIds.includes(streamer.id) ? 'Following' : 'Follow'}
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

export default AllStreamers;
