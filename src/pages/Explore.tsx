import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Gamepad2, Trophy, Users as UsersIcon, Star } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import GameCard from '@/components/GameCard';
import StreamerCard from '@/components/StreamerCard';
import { toast } from 'sonner';

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

  useEffect(() => {
    let isMounted = true;
    
    const fetchData = async () => {
      if (!isMounted) return;
      
      try {
        setLoading(true);
        
        // Fetch top games with specific column selection
        try {
          const { data, error } = await supabase
            .from('games')
            .select('id, name, cover_url, post_count')
            .order('post_count', { ascending: false })
            .limit(3);
            
          if (error) throw error;
          
          // Safely transform the data to Game[] type
          const gamesData: Game[] = (data || []).map(game => ({
            id: game.id || '',
            name: game.name || '',
            cover_url: game.cover_url || '',
            post_count: Number(game.post_count) || 0
          }));
          
          if (isMounted) {
            setTopGames(gamesData);
          }
          
        } catch (error) {
          console.error('Error fetching top games:', error);
          toast.error('Failed to load top games');
        }
        
        // Fetch top streamers with specific column selection
        try {
          const { data, error } = await supabase
            .from('profiles')
            .select('id, username, display_name, avatar_url, streaming_url, current_game, is_live, follower_count')
            .eq('is_streamer', true)
            .order('follower_count', { ascending: false })
            .limit(3);
            
          if (error) throw error;
          
          // Safely transform the data to Streamer[] type
          const streamersData: Streamer[] = (data || []).map(streamer => ({
            id: streamer.id || '',
            username: streamer.username || '',
            display_name: streamer.display_name || '',
            avatar_url: streamer.avatar_url || '',
            streaming_url: streamer.streaming_url || '',
            current_game: streamer.current_game || '',
            is_live: Boolean(streamer.is_live),
            follower_count: Number(streamer.follower_count) || 0
          }));
          
          if (isMounted) {
            setTopStreamers(streamersData);
          }
          
        } catch (error) {
          console.error('Error fetching top streamers:', error);
          toast.error('Failed to load top streamers');
        }
        
      } catch (error) {
        console.error('Error in fetchData:', error);
        toast.error('Failed to load explore page data');
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchData();
    
    // Cleanup function to prevent state updates if component unmounts
    return () => {
      isMounted = false;
    };
  }, []);

  // Fallback data in case of API failure
  const getFallbackGames = () => {
    return [
      {
        id: '1',
        name: 'CyberPunk 2077',
        cover_url: 'https://i.imgur.com/9nGEh4e.jpeg',
        post_count: 340
      },
      {
        id: '2',
        name: 'Elden Ring',
        cover_url: 'https://i.imgur.com/GNEDnLC.jpeg',
        post_count: 285
      },
      {
        id: '3',
        name: 'Call of Duty: Warzone',
        cover_url: 'https://i.imgur.com/D5KKcOj.jpeg',
        post_count: 210
      }
    ];
  };

  const getFallbackStreamers = () => {
    return [
      {
        id: '1',
        username: 'ninja',
        display_name: 'Ninja',
        avatar_url: 'https://i.imgur.com/UYVnrVE.jpeg',
        streaming_url: 'https://twitch.tv/ninja',
        current_game: 'Fortnite',
        is_live: true,
        follower_count: 18500000
      },
      {
        id: '2',
        username: 'shroud',
        display_name: 'Shroud',
        avatar_url: 'https://i.imgur.com/xILQwCi.jpeg',
        streaming_url: 'https://twitch.tv/shroud',
        current_game: 'Valorant',
        is_live: false,
        follower_count: 10200000
      },
      {
        id: '3',
        username: 'pokimane',
        display_name: 'Pokimane',
        avatar_url: 'https://i.imgur.com/WVJnSA3.jpeg',
        streaming_url: 'https://twitch.tv/pokimane',
        current_game: 'Just Chatting',
        is_live: true,
        follower_count: 9300000
      }
    ];
  };

  return (
    <div className="min-h-screen bg-[#0f112a] text-white pb-24">
      {/* Header */}
      <div className="fixed top-0 left-0 right-0 z-50 p-4 bg-[#141644] border-b-4 border-[#4a4dff] shadow-[0_4px_0_0_#000]">
        <div className="flex items-center justify-center max-w-7xl mx-auto relative">
          <h1 className="text-3xl font-bold text-white pixel-font retro-text-shadow">EXPLORE</h1>
        </div>
      </div>

      <div className="container mx-auto px-4 pt-24 pb-4 max-w-4xl">
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
                <div className="bg-[#0f112a] p-4 rounded">
                  {(topGames.length > 0 ? topGames : getFallbackGames()).map((game, index) => (
                    <div 
                      key={game.id}
                      onClick={() => navigate(`/game/${game.id}`)}
                      className={`flex items-center p-3 cursor-pointer ${index < 2 ? 'border-b-2 border-[#4a4dff]/40' : ''} hover:bg-[#262966] transition duration-200`}
                    >
                      <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-[#3e4099] to-[#2d2e68] rounded-lg mr-4 shadow-inner border-2 border-[#5ce1ff]/50">
                        <span className="font-bold text-2xl text-[#ffde3b] pixel-font retro-text-shadow">
                          {index === 0 ? '1' : index === 1 ? '2' : '3'}
                        </span>
                      </div>
                      
                      <div className="w-14 h-14 relative mr-4 overflow-hidden rounded border-2 border-[#5ce1ff]/50">
                        {game.cover_url ? (
                          <img 
                            src={game.cover_url} 
                            alt={game.name} 
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-indigo-900 flex items-center justify-center">
                            <Gamepad2 className="w-8 h-8 text-indigo-300" />
                          </div>
                        )}
                        {index === 0 && (
                          <div className="absolute top-0 right-0">
                            <Trophy className="w-5 h-5 text-[#ffd700] fill-[#ffd700]" />
                          </div>
                        )}
                      </div>
                      
                      <div className="flex-1">
                        <h3 className="font-bold text-lg text-white pixel-font truncate">{game.name}</h3>
                        <p className="text-[#5ce1ff] text-sm">{Number(game.post_count).toLocaleString()} posts</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <button 
                onClick={() => navigate('/games')}
                className="mt-2 w-full py-2 bg-gradient-to-r from-indigo-500 to-blue-600 hover:from-indigo-600 hover:to-blue-700 text-white rounded-xl text-center font-semibold pixel-font shadow-neon transition duration-200 transform hover:translate-y-[-2px]"
              >
                VIEW ALL GAMES
              </button>
            </div>
            
            {/* Top Streamers Section */}
            <div className="mb-10">
              <div className="flex items-center mb-6">
                <UsersIcon className="w-8 h-8 mr-3 text-[#ff66c4]" />
                <h2 className="text-2xl font-bold text-[#ff66c4] pixel-font retro-text-shadow">TOP STREAMERS</h2>
              </div>
              
              {/* Old-fashioned leaderboard style for streamers */}
              <div className="bg-[#1a1c42] border-4 border-[#ff66c4] rounded-lg p-2 shadow-[0_6px_0_0_#000] mb-4">
                <div className="bg-[#0f112a] p-4 rounded">
                  {(topStreamers.length > 0 ? topStreamers : getFallbackStreamers()).map((streamer, index) => (
                    <div 
                      key={streamer.id}
                      onClick={() => navigate(`/profile/${streamer.id}`)}
                      className={`flex items-center p-3 cursor-pointer ${index < 2 ? 'border-b-2 border-[#ff66c4]/40' : ''} hover:bg-[#262966] transition duration-200`}
                    >
                      <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-[#9c2dad] to-[#701b7e] rounded-lg mr-4 shadow-inner border-2 border-[#ff66c4]/50">
                        <span className="font-bold text-2xl text-[#ffde3b] pixel-font retro-text-shadow">
                          {index === 0 ? '1' : index === 1 ? '2' : '3'}
                        </span>
                      </div>
                      
                      <div className="w-14 h-14 relative mr-4 overflow-hidden rounded-full border-2 border-[#ff66c4]/50">
                        {streamer.avatar_url ? (
                          <img 
                            src={streamer.avatar_url} 
                            alt={streamer.username} 
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-purple-900 flex items-center justify-center">
                            <UsersIcon className="w-8 h-8 text-purple-300" />
                          </div>
                        )}
                        {index === 0 && (
                          <div className="absolute top-0 right-0">
                            <Trophy className="w-5 h-5 text-[#ffd700] fill-[#ffd700]" />
                          </div>
                        )}
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center">
                          <h3 className="font-bold text-lg text-white pixel-font">{streamer.display_name || streamer.username}</h3>
                          {streamer.is_live && (
                            <span className="ml-2 px-2 py-0.5 text-xs bg-red-600 text-white rounded-full pixel-font animate-pulse">LIVE</span>
                          )}
                        </div>
                        <p className="text-[#ff66c4] text-sm">{Number(streamer.follower_count).toLocaleString()} followers</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <button 
                onClick={() => navigate('/streamers')}
                className="mt-2 w-full py-2 bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white rounded-xl text-center font-semibold pixel-font shadow-neon transition duration-200 transform hover:translate-y-[-2px]"
              >
                VIEW ALL STREAMERS
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Explore;
