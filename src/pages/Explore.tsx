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
        
        // Fetch top games with specific column selection - use explicit types
        const { data, error: gamesError } = await supabase
          .from('games')
          .select('id, name, cover_url, post_count')
          .order('post_count', { ascending: false })
          .limit(3);
          
        if (gamesError) {
          console.error('Error fetching top games:', gamesError);
          toast.error('Failed to load top games');
          return;
        }
        
        const gamesData = data as Game[] || [];
        
        // Fetch top streamers with specific column selection - use explicit types
        const { data: streamersRawData, error: streamersError } = await supabase
          .from('profiles')
          .select('id, username, display_name, avatar_url, streaming_url, current_game, is_live, follower_count')
          .eq('is_streamer', true)
          .order('follower_count', { ascending: false })
          .limit(3);
          
        if (streamersError) {
          console.error('Error fetching top streamers:', streamersError);
          toast.error('Failed to load top streamers');
          return;
        }
        
        const streamersData = streamersRawData as Streamer[] || [];
        
        // Only update state if component is still mounted
        if (isMounted) {
          setTopGames(gamesData);
          setTopStreamers(streamersData);
          setLoading(false);
        }
      } catch (error) {
        console.error('Error in fetchData:', error);
        toast.error('Failed to load explore page data');
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
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {(topGames.length > 0 ? topGames : getFallbackGames()).map((game) => (
                  <GameCard 
                    key={game.id}
                    id={game.id}
                    name={game.name}
                    coverUrl={game.cover_url}
                    postCount={Number(game.post_count)}
                    onClick={() => navigate(`/game/${game.id}`)}
                  />
                ))}
              </div>
              
              <button 
                onClick={() => navigate('/games')}
                className="mt-4 w-full py-2 bg-gradient-to-r from-indigo-500 to-blue-600 hover:from-indigo-600 hover:to-blue-700 text-white rounded-xl text-center font-semibold pixel-font shadow-neon transition duration-200 transform hover:translate-y-[-2px]"
              >
                VIEW ALL GAMES
              </button>
            </div>
            
            {/* Top Streamers Section */}
            <div className="mb-10">
              <div className="flex items-center mb-6">
                <UsersIcon className="w-8 h-8 mr-3 text-[#ff5cce]" />
                <h2 className="text-2xl font-bold text-[#ff5cce] pixel-font retro-text-shadow">TOP STREAMERS</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {(topStreamers.length > 0 ? topStreamers : getFallbackStreamers()).map((streamer) => (
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
              
              <button 
                onClick={() => navigate('/streamers')}
                className="mt-4 w-full py-2 bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white rounded-xl text-center font-semibold pixel-font shadow-neon transition duration-200 transform hover:translate-y-[-2px]"
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
