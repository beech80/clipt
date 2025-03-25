import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Gamepad2, Trophy, Users as UsersIcon, Star, Search } from 'lucide-react';
import { supabase } from '@/lib/supabase'; 
import GameCard from '@/components/GameCard';
import StreamerCard from '@/components/StreamerCard';
import { allGames } from '@/data/gamesList';

interface Game {
  id: string;
  name: string;
  cover_url: string;
  post_count: number;
}

interface Streamer {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string;
  streaming_url: string;
  current_game: string;
  is_live: boolean;
  follower_count: number;
}

const Explore = () => {
  const navigate = useNavigate();
  const [topGames, setTopGames] = useState<Game[]>([]);
  const [topStreamers, setTopStreamers] = useState<Streamer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<{games: Game[], streamers: Streamer[]}>({games: [], streamers: []});
  const [isSearching, setIsSearching] = useState(false);

  // This function will be used in the future when tracking is implemented
  const trackUserActivity = async (type: 'search' | 'view', itemId: string, itemType: 'game' | 'user') => {
    try {
      console.log(`[FUTURE TRACKING] User ${type}ed ${itemType} ${itemId}`);
      
      // In the future, this will insert a record into analytics table
      /*
      const { error } = await supabase
        .from('analytics')
        .insert({
          user_id: currentUserId,
          activity_type: type,
          item_id: itemId,
          item_type: itemType,
          timestamp: new Date()
        });
        
      if (error) {
        console.error('Error tracking user activity:', error);
      }
      */
    } catch (error) {
      console.error('Error in tracking:', error);
    }
  };
  
  // This function will be used in the future to fetch live data for the top games section
  const fetchTopGames = async () => {
    try {
      /*
      const { data, error } = await supabase
        .from('games')
        .select('id, name, cover_url')
        .order('view_count', { ascending: false })
        .limit(3);
        
      if (error) throw error;
      
      return data.map(game => ({
        ...game,
        post_count: 0
      }));
      */
      return getFallbackGames();
    } catch (error) {
      console.error('Error fetching top games:', error);
      return getFallbackGames();
    }
  };
  
  // This function will be used in the future to fetch live data for the top users section
  const fetchTopUsers = async () => {
    try {
      /*
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, display_name, avatar_url, current_game')
        .order('follower_count', { ascending: false })
        .limit(3);
        
      if (error) throw error;
      
      return data.map(user => ({
        ...user,
        streaming_url: '',
        is_live: false,
        follower_count: 0
      }));
      */
      return getFallbackStreamers();
    } catch (error) {
      console.error('Error fetching top users:', error);
      return getFallbackStreamers();
    }
  };

  useEffect(() => {
    let isMounted = true;
    
    const fetchData = async () => {
      try {
        setTopGames(getFallbackGames());
        setTopStreamers(getFallbackStreamers());
        setLoading(false);
      } catch (error) {
        console.error('Error loading explore page data:', error);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };
    
    fetchData();
    
    return () => {
      isMounted = false;
    };
  }, []);

  // Fallback data for top games
  const getFallbackGames = (): Game[] => {
    return [
      {
        id: 'game1',
        name: 'Coming Soon',
        cover_url: 'https://i.imgur.com/zUwHCoQ.jpeg',
        post_count: 0
      },
      {
        id: 'game2',
        name: 'Coming Soon',
        cover_url: 'https://i.imgur.com/zUwHCoQ.jpeg',
        post_count: 0
      },
      {
        id: 'game3',
        name: 'Coming Soon',
        cover_url: 'https://i.imgur.com/zUwHCoQ.jpeg',
        post_count: 0
      }
    ];
  };
  
  // Fallback data for top streamers
  const getFallbackStreamers = (): Streamer[] => {
    return [
      {
        id: 'streamer1',
        username: 'Coming Soon',
        display_name: 'Coming Soon',
        avatar_url: 'https://i.imgur.com/zUwHCoQ.jpeg',
        streaming_url: '',
        current_game: 'Coming Soon',
        is_live: false,
        follower_count: 0
      },
      {
        id: 'streamer2',
        username: 'Coming Soon',
        display_name: 'Coming Soon',
        avatar_url: 'https://i.imgur.com/zUwHCoQ.jpeg',
        streaming_url: '',
        current_game: 'Coming Soon',
        is_live: false,
        follower_count: 0
      },
      {
        id: 'streamer3',
        username: 'Coming Soon',
        display_name: 'Coming Soon',
        avatar_url: 'https://i.imgur.com/zUwHCoQ.jpeg',
        streaming_url: '',
        current_game: 'Coming Soon',
        is_live: false,
        follower_count: 0
      }
    ];
  };

  // Completely rewritten search function with expanded game list and app-specific users
  const handleSearch = async () => {
    if (!searchTerm.trim()) return;
    
    setIsSearching(true);
    
    try {
      let gamesData = [];
      let usersData = [];
      
      try {
        const { data: dbGamesData, error: gamesError } = await supabase
          .from('games')
          .select('id, name, cover_url')
          .ilike('name', `%${searchTerm}%`)
          .limit(10);
          
        if (!gamesError && dbGamesData && dbGamesData.length > 0) {
          gamesData = dbGamesData.map(game => ({
            id: game.id,
            name: game.name,
            cover_url: game.cover_url,
            post_count: 0
          }));
          
          trackUserActivity('search', 'multiple', 'game');
        }
        
        const { data: dbUsersData, error: usersError } = await supabase
          .from('profiles')
          .select('id, username, display_name, avatar_url')
          .or(`username.ilike.%${searchTerm}%,display_name.ilike.%${searchTerm}%`)
          .limit(10);
          
        if (!usersError && dbUsersData && dbUsersData.length > 0) {
          usersData = dbUsersData.map(user => ({
            id: user.id,
            username: user.username,
            display_name: user.display_name,
            avatar_url: user.avatar_url,
            streaming_url: '',
            current_game: '',
            is_live: false,
            follower_count: 0
          }));
          
          trackUserActivity('search', 'multiple', 'user');
        }
      } catch (dbError) {
        console.log('Database search not available, using fallback data');
      }
      
      const appUsers = [
        {
          id: 'user1',
          username: 'ninja',
          display_name: 'Ninja',
          avatar_url: 'https://i.imgur.com/UYVnrVE.jpeg',
          streaming_url: 'https://twitch.tv/ninja',
          current_game: 'Fortnite',
          is_live: false,
          follower_count: 0
        },
        {
          id: 'user2',
          username: 'shroud',
          display_name: 'Shroud',
          avatar_url: 'https://i.imgur.com/xILQwCi.jpeg',
          streaming_url: 'https://twitch.tv/shroud',
          current_game: 'Valorant',
          is_live: false,
          follower_count: 0
        },
        {
          id: 'user3',
          username: 'pokimane',
          display_name: 'Pokimane',
          avatar_url: 'https://i.imgur.com/WVJnSA3.jpeg',
          streaming_url: 'https://twitch.tv/pokimane', 
          current_game: 'Just Chatting',
          is_live: false,
          follower_count: 0
        },
        {
          id: 'user4',
          username: 'timthetatman',
          display_name: 'TimTheTatman',
          avatar_url: 'https://i.imgur.com/5L69dNP.jpeg',
          streaming_url: 'https://youtube.com/timthetatman',
          current_game: 'Call of Duty',
          is_live: false,
          follower_count: 0
        },
        {
          id: 'user5',
          username: 'drlupo',
          display_name: 'DrLupo',
          avatar_url: 'https://i.imgur.com/QcKPLAk.jpeg',
          streaming_url: 'https://youtube.com/drlupo',
          current_game: 'Destiny 2',
          is_live: false,
          follower_count: 0
        },
        {
          id: 'user6',
          username: 'xqc',
          display_name: 'xQc',
          avatar_url: 'https://i.imgur.com/y2OHAMY.jpeg',
          streaming_url: 'https://twitch.tv/xqc',
          current_game: 'Just Chatting',
          is_live: false,
          follower_count: 0
        },
        {
          id: 'user7',
          username: 'summit1g',
          display_name: 'Summit1g',
          avatar_url: 'https://i.imgur.com/9iUxMW8.jpeg',
          streaming_url: 'https://twitch.tv/summit1g',
          current_game: 'Grand Theft Auto V',
          is_live: false,
          follower_count: 0
        },
        {
          id: 'user8',
          username: 'valkyrae',
          display_name: 'Valkyrae',
          avatar_url: 'https://i.imgur.com/rT8C1sK.jpeg',
          streaming_url: 'https://youtube.com/valkyrae',
          current_game: 'Valorant',
          is_live: false,
          follower_count: 0
        },
        {
          id: 'user9',
          username: 'nickmercs',
          display_name: 'NICKMERCS',
          avatar_url: 'https://i.imgur.com/UWY6dHy.jpeg',
          streaming_url: 'https://twitch.tv/nickmercs',
          current_game: 'Apex Legends',
          is_live: false,
          follower_count: 0
        },
        {
          id: 'user10',
          username: 'lirik',
          display_name: 'LIRIK',
          avatar_url: 'https://i.imgur.com/GUUYdGv.jpeg',
          streaming_url: 'https://twitch.tv/lirik',
          current_game: 'Just Chatting',
          is_live: false,
          follower_count: 0
        },
        {
          id: 'user11',
          username: 'sykkuno',
          display_name: 'Sykkuno',
          avatar_url: 'https://i.imgur.com/EhDckhY.jpeg',
          streaming_url: 'https://youtube.com/sykkuno',
          current_game: 'Among Us',
          is_live: false,
          follower_count: 0
        },
        {
          id: 'user12',
          username: 'ludwig',
          display_name: 'Ludwig',
          avatar_url: 'https://i.imgur.com/mndCTlF.jpeg',
          streaming_url: 'https://youtube.com/ludwig',
          current_game: 'Chess',
          is_live: false,
          follower_count: 0
        },
        {
          id: 'user13',
          username: 'hasanabi',
          display_name: 'HasanAbi',
          avatar_url: 'https://i.imgur.com/XqGI2D2.jpeg',
          streaming_url: 'https://twitch.tv/hasanabi',
          current_game: 'Just Chatting',
          is_live: false,
          follower_count: 0
        },
        {
          id: 'user14',
          username: 'amouranth',
          display_name: 'Amouranth',
          avatar_url: 'https://i.imgur.com/Yy2ruyX.jpeg',
          streaming_url: 'https://twitch.tv/amouranth',
          current_game: 'Just Chatting',
          is_live: false,
          follower_count: 0
        },
        {
          id: 'user15',
          username: 'mizkif',
          display_name: 'Mizkif',
          avatar_url: 'https://i.imgur.com/jRzVmwk.jpeg',
          streaming_url: 'https://twitch.tv/mizkif',
          current_game: 'Just Chatting',
          is_live: false,
          follower_count: 0
        }
      ];

      if (gamesData.length === 0) {
        const formattedGames = allGames.map(game => ({
          ...game,
          post_count: 0
        }));
        
        const searchTermLower = searchTerm.toLowerCase();
        
        gamesData = formattedGames.filter(game => {
          const nameLower = game.name.toLowerCase();
          return nameLower === searchTermLower || 
                 nameLower.startsWith(searchTermLower) || 
                 nameLower.includes(searchTermLower);
        });
      }
      
      if (usersData.length === 0) {
        const searchTermLower = searchTerm.toLowerCase();
        
        usersData = appUsers.filter(user => {
          const usernameLower = user.username.toLowerCase();
          const displayNameLower = user.display_name.toLowerCase();
          
          return usernameLower === searchTermLower || 
                 displayNameLower === searchTermLower ||
                 usernameLower.startsWith(searchTermLower) || 
                 displayNameLower.startsWith(searchTermLower) ||
                 usernameLower.includes(searchTermLower) || 
                 displayNameLower.includes(searchTermLower);
        });
      }
      
      setSearchResults({
        games: gamesData,
        streamers: usersData
      });
      
    } catch (error) {
      console.error('Error searching:', error);
      
      setSearchResults({
        games: [],
        streamers: []
      });
    } finally {
      setIsSearching(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm.trim()) {
        handleSearch();
      } else {
        setSearchResults({games: [], streamers: []});
      }
    }, 500);
    
    return () => clearTimeout(timer);
  }, [searchTerm]);

  return (
    <div className="min-h-screen bg-[#0f112a] text-white pb-24">
      <div className="fixed top-0 left-0 right-0 z-50 p-4 bg-[#141644] border-b-4 border-[#4a4dff] shadow-[0_4px_0_0_#000]">
        <div className="flex items-center justify-center max-w-7xl mx-auto relative">
          <h1 className="text-3xl font-bold text-white pixel-font retro-text-shadow">EXPLORE</h1>
        </div>
      </div>

      <div className="container mx-auto px-4 pt-24 pb-4 max-w-4xl">
        <div className="mb-6 relative">
          <div className="relative">
            <input
              type="text"
              placeholder="Search games or users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[#1a1c42] border-2 border-[#4a4dff] rounded-lg p-3 text-white pl-10 shadow-neon focus:outline-none focus:ring-2 focus:ring-[#5ce1ff] focus:border-transparent"
            />
            <Search className="absolute left-3 top-3.5 text-[#5ce1ff]" size={18} />
          </div>
          
          {searchTerm.trim() && (
            <div className="absolute w-full bg-[#1a1c42] border-2 border-[#4a4dff] rounded-lg mt-2 shadow-xl z-50 max-h-96 overflow-y-auto">
              {isSearching ? (
                <div className="p-4 text-center">
                  <div className="w-8 h-8 border-t-4 border-[#5ce1ff] border-solid rounded-full animate-spin mx-auto"></div>
                  <p className="mt-2 text-[#5ce1ff]">Searching...</p>
                </div>
              ) : (
                <>
                  {searchResults.games.length === 0 && searchResults.streamers.length === 0 ? (
                    <div className="p-4 text-center text-gray-400">No results found</div>
                  ) : (
                    <>
                      {searchResults.games.length > 0 && (
                        <div className="p-2">
                          <h3 className="px-2 py-1 text-[#5ce1ff] font-bold">Games</h3>
                          <div className="divide-y divide-[#4a4dff]/30">
                            {searchResults.games.map(game => (
                              <div 
                                key={game.id}
                                onClick={() => navigate(`/game/${game.id}`)}
                                className="flex items-center p-2 hover:bg-[#262966] cursor-pointer"
                              >
                                <div className="w-10 h-10 rounded overflow-hidden mr-3">
                                  {game.cover_url ? (
                                    <img src={game.cover_url} alt={game.name} className="w-full h-full object-cover" />
                                  ) : (
                                    <div className="w-full h-full bg-indigo-900 flex items-center justify-center">
                                      <Gamepad2 className="w-5 h-5 text-indigo-300" />
                                    </div>
                                  )}
                                </div>
                                <span>{game.name}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {searchResults.streamers.length > 0 && (
                        <div className="p-2">
                          <h3 className="px-2 py-1 text-[#ff66c4] font-bold">Users</h3>
                          <div className="divide-y divide-[#ff66c4]/30">
                            {searchResults.streamers.map(streamer => (
                              <div 
                                key={streamer.id}
                                onClick={() => navigate(`/profile/${streamer.id}`)}
                                className="flex items-center p-2 hover:bg-[#262966] cursor-pointer"
                              >
                                <div className="w-10 h-10 rounded-full overflow-hidden mr-3">
                                  {streamer.avatar_url ? (
                                    <img src={streamer.avatar_url} alt={streamer.username} className="w-full h-full object-cover" />
                                  ) : (
                                    <div className="w-full h-full bg-purple-900 flex items-center justify-center">
                                      <UsersIcon className="w-5 h-5 text-purple-300" />
                                    </div>
                                  )}
                                </div>
                                <span>{streamer.display_name || streamer.username}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </>
              )}
            </div>
          )}
        </div>
        
        {loading ? (
          <div className="flex flex-col items-center justify-center py-10">
            <div className="w-16 h-16 border-t-4 border-blue-500 border-solid rounded-full animate-spin"></div>
            <p className="mt-4 text-xl text-[#5ce1ff] pixel-font">Loading awesome content...</p>
          </div>
        ) : (
          <>
            <div className="mb-10">
              <div className="flex items-center mb-6">
                <Gamepad2 className="w-8 h-8 mr-3 text-[#5ce1ff]" />
                <h2 className="text-2xl font-bold text-[#5ce1ff] pixel-font retro-text-shadow">TOP GAMES</h2>
              </div>
              
              <div className="bg-[#1a1c42] border-4 border-[#4a4dff] rounded-lg p-2 shadow-[0_6px_0_0_#000] mb-4">
                <div className="bg-[#0f112a] p-4 rounded text-center">
                  <p className="text-xl text-[#5ce1ff] pixel-font mb-6">Coming Soon!</p>
                  <p className="text-sm text-gray-400">Stay tuned for the most popular games on the platform.</p>
                </div>
              </div>
            </div>
            
            <div>
              <div className="flex items-center mb-6">
                <UsersIcon className="w-8 h-8 mr-3 text-[#ff66c4]" />
                <h2 className="text-2xl font-bold text-[#ff66c4] pixel-font retro-text-shadow">TOP USERS</h2>
              </div>
              
              <div className="bg-[#1a1c42] border-4 border-[#ff66c4] rounded-lg p-2 shadow-[0_6px_0_0_#000]">
                <div className="bg-[#0f112a] p-4 rounded text-center">
                  <p className="text-xl text-[#ff66c4] pixel-font mb-6">Coming Soon!</p>
                  <p className="text-sm text-gray-400">Follow your favorite content creators when we launch.</p>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Explore;
