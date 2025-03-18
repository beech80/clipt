import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { igdbService } from '@/services/igdbService';
import { Game } from '@/types/game';
import { Post } from '@/types/post';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Users, Calendar } from 'lucide-react';
import PostItem from '@/components/PostItem';
import { gameIdToUuid, uuidToGameId } from '@/utils/idUtils';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

const GameDetailsPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [game, setGame] = useState<Game | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFollowing, setIsFollowing] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!id) {
        setError('Game ID is missing');
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      
      try {
        // Ensure we have a numeric game ID
        const numericGameId = uuidToGameId(id);
        console.log(`Fetching game details for ID: ${id} (numeric: ${numericGameId})`);
        
        // Fetch game details from IGDB
        const gameData = await igdbService.getGameById(numericGameId);
        
        if (!gameData) {
          setError('Game not found');
          setLoading(false);
          return;
        }
        
        console.log('Game data received:', JSON.stringify(gameData));
        
        // Ensure all game data properties are safe to render
        const safeGameData = {
          ...gameData,
          genres: gameData.genres ? gameData.genres.map(g => 
            typeof g === 'string' ? g : (g.name || String(g.id))
          ) : [],
          platforms: gameData.platforms ? gameData.platforms.map(p => 
            typeof p === 'string' ? p : (p.name || String(p.id))
          ) : [],
          developers: gameData.developers ? gameData.developers.map(d => 
            typeof d === 'string' ? d : (d.name || String(d.id))
          ) : []
        };
        
        setGame(safeGameData);
        
        // Create a UUID-compatible version of the game ID for database queries
        const uuidCompatibleId = gameIdToUuid(numericGameId);
        console.log(`Using UUID-compatible ID for database queries: ${uuidCompatibleId}`);
        
        // Fetch posts for this game using the UUID-compatible ID
        const { data: postsData, error: postsError } = await supabase
          .from('posts')
          .select(`
            *,
            user:profiles(*)
          `)
          .eq('game_id', uuidCompatibleId)
          .order('created_at', { ascending: false })
          .limit(5);
          
        if (postsError) {
          console.error('Error fetching posts:', postsError);
          throw postsError;
        }
        
        console.log('Posts data:', postsData);
        setPosts(postsData || []);
        
      } catch (err) {
        console.error('Error fetching game details:', err);
        setError('Failed to load game details');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [id]);

  const toggleFollow = () => {
    setIsFollowing(!isFollowing);
    // Here you would add real follow functionality
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#14163a] text-white">
        <div className="p-4 fixed top-0 left-0 right-0 z-50 flex items-center bg-[#0c0e26]">
          <Button variant="ghost" onClick={() => navigate(-1)} className="text-white">
            <ArrowLeft className="h-5 w-5 mr-2" />
          </Button>
          <h1 className="text-xl font-bold">Game Details</h1>
        </div>
        <div className="pt-16 flex justify-center items-center h-[60vh]">
          <div className="animate-pulse">Loading...</div>
        </div>
      </div>
    );
  }

  if (error || !game) {
    return (
      <div className="min-h-screen bg-[#14163a] text-white">
        <div className="p-4 fixed top-0 left-0 right-0 z-50 flex items-center bg-[#0c0e26]">
          <Button variant="ghost" onClick={() => navigate(-1)} className="text-white">
            <ArrowLeft className="h-5 w-5 mr-2" />
          </Button>
          <h1 className="text-xl font-bold">Game Details</h1>
        </div>
        <div className="pt-16 p-4">
          <div className="bg-red-900/20 text-red-300 p-4 rounded-lg">
            <h2 className="text-xl font-semibold mb-2">Error</h2>
            <p>{error || 'Failed to load game details'}</p>
            <Button 
              variant="outline" 
              className="mt-4"
              onClick={() => navigate(-1)}
            >
              Go Back
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const releaseYear = game.first_release_date 
    ? new Date(game.first_release_date).getFullYear() 
    : 'Unknown';

  return (
    <div className="min-h-screen bg-[#14163a] text-white">
      {/* Header */}
      <div className="p-4 fixed top-0 left-0 right-0 z-50 flex items-center bg-[#0c0e26]">
        <Button variant="ghost" onClick={() => navigate(-1)} className="text-white">
          <ArrowLeft className="h-5 w-5 mr-2" />
        </Button>
        <h1 className="text-xl font-bold">Game Details</h1>
      </div>

      <div className="pt-16 pb-20">
        {/* Game Banner */}
        <div className="w-full aspect-[21/9] bg-[#1a1a2e] flex items-center justify-center">
          {game.screenshots && game.screenshots.length > 0 ? (
            <img 
              src={game.screenshots[0].url.replace('t_thumb', 't_screenshot_big')} 
              alt={`${game.name} screenshot`} 
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="text-center text-gray-400">Game Banner</div>
          )}
        </div>

        {/* Game Info */}
        <div className="bg-[#1a1c38] p-6">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold">{game.name}</h2>
              <p className="text-gray-400 mt-1">
                {game.developers && game.developers.length > 0 ? game.developers[0] : 'Developer'} • {' '}
                {game.publishers && game.publishers ? game.publishers[0] : 'Publisher'}
              </p>

              <div className="flex items-center mt-4 space-x-6">
                <div className="flex items-center">
                  <Users className="h-4 w-4 mr-2 text-gray-400" />
                  <span>{Math.floor(Math.random() * 50) + 5}K players</span>
                </div>
                <div className="flex items-center">
                  <span className="mr-2">🏆</span>
                  <span>{Math.floor(Math.random() * 100)} tournaments</span>
                </div>
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                  <span>Released {releaseYear}</span>
                </div>
              </div>
            </div>
            
            <Button 
              className={cn(
                "border border-white/20 px-4 py-2 rounded",
                isFollowing ? "bg-white/20" : "bg-transparent hover:bg-white/10"
              )}
              onClick={toggleFollow}
            >
              {isFollowing ? "Following" : "Follow"}
            </Button>
          </div>

          {/* About Section */}
          <div className="mt-6">
            <h3 className="text-xl font-bold mb-2">About</h3>
            <p className="text-gray-300 leading-relaxed">
              {game.summary || `This is a sample description for ${game.name}. Here we would display information about the game, including its genre, gameplay features, and other relevant details that would interest players.`}
            </p>
          </div>
        </div>

        {/* Recent Clipts */}
        <div className="p-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold">Recent Clipts</h3>
            <Link to={`/game/${id}/clipts`} className="text-blue-400 text-sm">
              View All
            </Link>
          </div>

          {posts.length === 0 ? (
            <div className="text-center p-8 bg-[#1a1c38] rounded-lg">
              <p className="text-gray-400">No clipts for this game yet. Be the first to share one!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {posts.map((post) => (
                <div key={post.id} className="bg-[#1a1c38] rounded-lg overflow-hidden">
                  <div className="aspect-video bg-black flex items-center justify-center">
                    {post.thumbnail_url ? (
                      <img 
                        src={post.thumbnail_url} 
                        alt="Clipt Thumbnail" 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="text-center text-gray-400">Clipt Thumbnail</div>
                    )}
                  </div>
                  <div className="p-3">
                    <h4 className="font-medium truncate">{post.title || 'Untitled Clipt'}</h4>
                    <p className="text-sm text-gray-400 mt-1">{post.user.username || 'Anonymous'}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GameDetailsPage;
