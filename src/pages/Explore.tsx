import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Gamepad2, Trophy, Users as UsersIcon, Star, Search } from 'lucide-react';
import GameCard from '@/components/GameCard';
import StreamerCard from '@/components/StreamerCard';

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

  useEffect(() => {
    let isMounted = true;
    
    const fetchData = async () => {
      try {
        // Use the fallback data instead of trying to fetch from database
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
      // Extended game list with more popular titles
      const mockGames = [
        {
          id: 'game1',
          name: 'CyberPunk 2077',
          cover_url: 'https://i.imgur.com/9nGEh4e.jpeg',
          post_count: 0
        },
        {
          id: 'game2', 
          name: 'Elden Ring',
          cover_url: 'https://i.imgur.com/GNEDnLC.jpeg',
          post_count: 0
        },
        {
          id: 'game3',
          name: 'Call of Duty: Warzone',
          cover_url: 'https://i.imgur.com/D5KKcOj.jpeg',
          post_count: 0
        },
        {
          id: 'game4',
          name: 'Fortnite',
          cover_url: 'https://i.imgur.com/8FTAGAi.jpeg',
          post_count: 0
        },
        {
          id: 'game5',
          name: 'Minecraft',
          cover_url: 'https://i.imgur.com/zDekIFE.jpeg',
          post_count: 0
        },
        {
          id: 'game6',
          name: 'Apex Legends',
          cover_url: 'https://i.imgur.com/gzARcBl.jpeg',
          post_count: 0
        },
        {
          id: 'game7',
          name: 'League of Legends',
          cover_url: 'https://i.imgur.com/CzOwTIn.jpeg',
          post_count: 0
        },
        {
          id: 'game8',
          name: 'Valorant',
          cover_url: 'https://i.imgur.com/kz9I8ks.jpeg',
          post_count: 0
        },
        {
          id: 'game9',
          name: 'Grand Theft Auto V',
          cover_url: 'https://i.imgur.com/Yh5yUEK.jpeg',
          post_count: 0
        },
        {
          id: 'game10',
          name: 'The Witcher 3',
          cover_url: 'https://i.imgur.com/T9XKEhm.jpeg',
          post_count: 0
        },
        {
          id: 'game11',
          name: 'Counter-Strike 2',
          cover_url: 'https://i.imgur.com/1hAuXiI.jpeg',
          post_count: 0
        },
        {
          id: 'game12',
          name: 'Overwatch 2',
          cover_url: 'https://i.imgur.com/8fnhPF9.jpeg',
          post_count: 0
        },
        {
          id: 'game13',
          name: 'Rocket League',
          cover_url: 'https://i.imgur.com/5RRqZRb.jpeg',
          post_count: 0
        },
        {
          id: 'game14',
          name: 'FIFA 23',
          cover_url: 'https://i.imgur.com/VnrRdoO.jpeg',
          post_count: 0
        },
        {
          id: 'game15',
          name: 'NBA 2K23',
          cover_url: 'https://i.imgur.com/5Qq5gPH.jpeg',
          post_count: 0
        }
      ];

      // App users (representing users in the actual app)
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
        }
      ];

      // Filter the mock data based on search term
      const filteredGames = mockGames.filter(game => 
        game.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      
      const filteredUsers = appUsers.filter(user => 
        user.username.toLowerCase().includes(searchTerm.toLowerCase()) || 
        user.display_name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      
      // Set the search results with the filtered mock data
      setSearchResults({
        games: filteredGames,
        streamers: filteredUsers
      });
      
    } catch (error) {
      console.error('Error searching:', error);
      
      // Always show something even if search fails - don't display errors to the user
      setSearchResults({
        games: [],
        streamers: []
      });
    } finally {
      setIsSearching(false);
    }
  };

  // Effect to trigger search when user types
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
      {/* Header */}
      <div className="fixed top-0 left-0 right-0 z-50 p-4 bg-[#141644] border-b-4 border-[#4a4dff] shadow-[0_4px_0_0_#000]">
        <div className="flex items-center justify-center max-w-7xl mx-auto relative">
          <h1 className="text-3xl font-bold text-white pixel-font retro-text-shadow">EXPLORE</h1>
        </div>
      </div>

      <div className="container mx-auto px-4 pt-24 pb-4 max-w-4xl">
        {/* Search Bar */}
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
          
          {/* Search Results */}
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
            {/* Top Games Section */}
            <div className="mb-10">
              <div className="flex items-center mb-6">
                <Gamepad2 className="w-8 h-8 mr-3 text-[#5ce1ff]" />
                <h2 className="text-2xl font-bold text-[#5ce1ff] pixel-font retro-text-shadow">TOP GAMES</h2>
              </div>
              
              {/* Old-fashioned leaderboard style for games */}
              <div className="bg-[#1a1c42] border-4 border-[#4a4dff] rounded-lg p-2 shadow-[0_6px_0_0_#000] mb-4">
                <div className="bg-[#0f112a] p-4 rounded text-center">
                  <p className="text-xl text-[#5ce1ff] pixel-font mb-6">Coming Soon!</p>
                  <p className="text-sm text-gray-400">Stay tuned for the most popular games on the platform.</p>
                </div>
              </div>
            </div>
            
            {/* Top Streamers Section */}
            <div>
              <div className="flex items-center mb-6">
                <UsersIcon className="w-8 h-8 mr-3 text-[#ff66c4]" />
                <h2 className="text-2xl font-bold text-[#ff66c4] pixel-font retro-text-shadow">TOP USERS</h2>
              </div>
              
              {/* Streamer Cards */}
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
