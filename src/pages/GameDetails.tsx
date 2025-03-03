import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { igdbService } from '@/services/igdbService';
import { Game } from '@/types/game';
import { Post } from '@/types/post';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import PostItem from '@/components/PostItem';
import { gameIdToUuid, uuidToGameId } from '@/utils/idUtils';
import { toast } from 'sonner';

// Helper function to safely render any value that might be an object
const safeRender = (value: any): string => {
  if (value === null || value === undefined) return 'Unknown';
  if (typeof value === 'string') return value;
  if (typeof value === 'number') return String(value);
  if (typeof value === 'object') {
    if (Array.isArray(value)) {
      return value.map(safeRender).join(', ');
    }
    if (value.name) return value.name;
    if (value.id) return String(value.id);
    return JSON.stringify(value);
  }
  return String(value);
};

const GameDetailsPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [game, setGame] = useState<Game | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
          .order('created_at', { ascending: false });
          
        if (postsError) {
          console.error('Error fetching posts:', postsError);
          throw postsError;
        }
        
        console.log('Posts data:', postsData);
        setPosts(postsData || []);
        setLoading(false);
      } catch (err: any) {
        console.error('Error fetching game data:', err);
        setError(err.message || 'Failed to fetch game details');
        setLoading(false);
        
        // Show a toast with error info
        toast.error('Could not load game details', {
          description: 'Please try again later or contact support.'
        });
      }
    };

    fetchData();
  }, [id]);

  if (loading) {
    return (
      <div className="container max-w-4xl mx-auto p-4 flex justify-center items-center h-[60vh]">
        <p>Loading...</p>
      </div>
    );
  }

  if (error || !game) {
    return (
      <div className="container max-w-4xl mx-auto p-4">
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
    );
  }

  return (
    <div className="page-container container max-w-4xl mx-auto pb-24">
      <div className="gameboy-header">
        <div className="flex flex-col items-center">
          <div className="flex items-center gap-2 w-full">
            <Button 
              variant="ghost" 
              className="p-2 text-black" 
              onClick={() => navigate(-1)}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="gameboy-title">{game.name}</h1>
          </div>
          <div className="gameboy-title text-sm mt-1">CLIPTS</div>
        </div>
      </div>
      
      <div className="mt-20 space-y-6">
        {posts.length > 0 ? (
          posts.map((post) => (
            <PostItem key={post.id} post={post} />
          ))
        ) : (
          <div className="text-center p-8 bg-gray-800 rounded-lg mt-6">
            <p className="text-gray-400">No clips for this game yet. Be the first to share one!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default GameDetailsPage;
