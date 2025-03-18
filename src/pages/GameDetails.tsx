import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { igdbService } from '@/services/igdbService';
import { Game } from '@/types/game';
import { Post } from '@/types/post';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import PostItem from '@/components/PostItem';
import { gameIdToUuid, uuidToGameId } from '@/utils/idUtils';

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
        
      } catch (err) {
        console.error('Error fetching game details:', err);
        setError('Failed to load game details');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [id]);

  if (loading) {
    return <div className="p-8 text-center">Loading game details...</div>;
  }

  if (error) {
    return (
      <div className="p-8 text-center">
        <p className="text-red-500 mb-4">{error}</p>
        <Button onClick={() => navigate(-1)}>Go Back</Button>
      </div>
    );
  }

  if (!game) {
    return (
      <div className="p-8 text-center">
        <p className="mb-4">Game not found</p>
        <Button onClick={() => navigate(-1)}>Go Back</Button>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-6">
      <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back
      </Button>
      
      <div className="flex flex-col text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">{game.name}</h1>
        <h2 className="text-xl font-medium text-muted-foreground">Clipts</h2>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {posts.length === 0 ? (
          <div className="text-center py-8 border rounded-lg bg-muted/20 col-span-full">
            <p className="text-muted-foreground mb-2">No clipts found for this game</p>
            <Button asChild>
              <Link to="/create">Create the first clipt</Link>
            </Button>
          </div>
        ) : (
          posts.map((post) => (
            <PostItem key={post.id} post={post} />
          ))
        )}
      </div>
    </div>
  );
};

export default GameDetailsPage;
