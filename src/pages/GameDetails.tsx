import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { igdbService } from '@/services/igdbService';
import { Game } from '@/types/game';
import { Post } from '@/types/post';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import PostItem from '@/components/PostItem';
import AchievementList from '@/components/achievements/AchievementList';
import { gameIdToUuid, uuidToGameId } from '@/utils/idUtils';
import { toast } from 'sonner';

const GameDetailsPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [game, setGame] = useState<Game | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('clips');

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
        
        setGame(gameData);
        
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
        <p>Loading game details...</p>
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

  // Ensure we have a numeric ID for the achievements section
  const numericGameId = uuidToGameId(id as string);

  return (
    <div className="container max-w-4xl mx-auto p-4 pb-20">
      <div className="mb-6 flex items-center gap-3">
        <Button 
          variant="ghost" 
          className="p-2" 
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-bold">{game.name}</h1>
      </div>
      
      <div className="flex flex-col md:flex-row gap-6 mb-6">
        {game.cover_url ? (
          <div className="flex-shrink-0">
            <img 
              src={game.cover_url} 
              alt={game.name} 
              className="w-32 h-42 object-cover rounded-md shadow-md" 
            />
          </div>
        ) : null}
        
        <div className="flex-grow">
          <div className="space-y-2">
            <div className="flex items-center text-sm text-gray-400">
              <p>{game.first_release_date ? formatDate(game.first_release_date) : 'Release date unknown'}</p>
            </div>
            
            {game.genres && game.genres.length > 0 && (
              <div className="flex gap-2 flex-wrap">
                {game.genres.map(genre => (
                  <span key={genre} className="bg-gray-700 text-gray-200 px-2 py-1 rounded text-xs">
                    {genre}
                  </span>
                ))}
              </div>
            )}
            
            <p className="text-gray-300 text-sm line-clamp-3">
              {game.summary || 'No description available.'}
            </p>
          </div>
        </div>
      </div>
      
      <Tabs defaultValue="clips" className="w-full" onValueChange={setActiveTab}>
        <TabsList className="mb-6 w-full justify-start">
          <TabsTrigger value="clips">Clips</TabsTrigger>
          <TabsTrigger value="about">About</TabsTrigger>
          <TabsTrigger value="achievements">Achievements</TabsTrigger>
        </TabsList>
        
        <TabsContent value="clips" className="mt-0">
          <h2 className="text-xl font-semibold mb-4">Clips for {game.name}</h2>
          {posts.length > 0 ? (
            <div className="space-y-6">
              {posts.map((post) => (
                <PostItem key={post.id} post={post} />
              ))}
            </div>
          ) : (
            <div className="text-center p-8 bg-gray-800 rounded-lg">
              <p className="text-gray-400">No clips for this game yet. Be the first to share one!</p>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="about" className="mt-0">
          <h2 className="text-xl font-semibold mb-4">About {game.name}</h2>
          <div className="bg-gray-800 rounded-lg p-6">
            <div className="mb-4">
              <h3 className="text-lg font-medium mb-2">Description</h3>
              <p className="text-gray-300">{game.summary || 'No description available.'}</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-medium mb-2">Release Date</h3>
                <p className="text-gray-300">{game.first_release_date ? formatDate(game.first_release_date) : 'Unknown'}</p>
              </div>
              
              <div>
                <h3 className="text-lg font-medium mb-2">Genres</h3>
                <p className="text-gray-300">
                  {game.genres && game.genres.length > 0 
                    ? game.genres.join(', ') 
                    : 'Unknown'}
                </p>
              </div>
              
              <div>
                <h3 className="text-lg font-medium mb-2">Platforms</h3>
                <p className="text-gray-300">
                  {game.platforms && game.platforms.length > 0 
                    ? game.platforms.join(', ') 
                    : 'Unknown'}
                </p>
              </div>
              
              <div>
                <h3 className="text-lg font-medium mb-2">Developer</h3>
                <p className="text-gray-300">{game.developers && game.developers.length > 0 ? game.developers[0] : 'Unknown'}</p>
              </div>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="achievements" className="mt-0">
          <h2 className="text-xl font-semibold mb-4">Achievements for {game.name}</h2>
          <AchievementList gameId={numericGameId} userId="" />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default GameDetailsPage;
