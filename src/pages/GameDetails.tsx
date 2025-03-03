import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import PostItem from '@/components/PostItem';
import AchievementList from '@/components/achievements/AchievementList';
import { Gamepad2 } from 'lucide-react';
import { Spinner } from '@/components/ui/spinner';

const GameDetails = () => {
  const { gameId } = useParams<{ gameId: string }>();
  const [game, setGame] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('clips');

  useEffect(() => {
    const fetchGameDetails = async () => {
      if (!gameId) {
        setError('No game ID provided');
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      
      try {
        // Fetch game details
        const { data: gameData, error: gameError } = await supabase
          .from('games')
          .select('*')
          .eq('id', gameId)
          .single();
          
        if (gameError) throw gameError;
        
        if (!gameData) {
          setError('Game not found');
          setLoading(false);
          return;
        }
        
        setGame(gameData);
        
        // Fetch posts for this game
        const { data: postsData, error: postsError } = await supabase
          .from('posts')
          .select(`
            *,
            user:profiles(*)
          `)
          .eq('game_id', gameId)
          .order('created_at', { ascending: false });
          
        if (postsError) throw postsError;
        
        setPosts(postsData || []);
        setLoading(false);
      } catch (err: any) {
        console.error('Error fetching game details:', err);
        setError(err.message || 'Failed to load game details');
        setLoading(false);
      }
    };
    
    fetchGameDetails();
  }, [gameId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-8">
        <h2 className="text-2xl text-red-500 mb-4">Error</h2>
        <p>{error}</p>
      </div>
    );
  }

  if (!game) {
    return (
      <div className="text-center p-8">
        <h2 className="text-2xl mb-4">Game not found</h2>
        <p>We couldn't find the game you're looking for.</p>
      </div>
    );
  }

  return (
    <div className="container max-w-4xl mx-auto p-4 pb-20">
      <div className="mb-6 flex items-center gap-3">
        <div className="w-16 h-16 rounded overflow-hidden bg-gray-800 flex items-center justify-center">
          {game.image_url ? (
            <img
              src={game.image_url}
              alt={game.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <Gamepad2 className="w-8 h-8 text-gray-400" />
          )}
        </div>
        <div>
          <h1 className="text-2xl font-bold">{game.title}</h1>
          <p className="text-gray-400">{game.developer || 'Unknown developer'}</p>
        </div>
      </div>
      
      <Tabs defaultValue="clips" className="w-full" onValueChange={setActiveTab}>
        <TabsList className="mb-6 w-full justify-start">
          <TabsTrigger value="clips">Clips</TabsTrigger>
          <TabsTrigger value="about">About</TabsTrigger>
          <TabsTrigger value="achievements">Achievements</TabsTrigger>
        </TabsList>
        
        <TabsContent value="clips" className="mt-0">
          <h2 className="text-xl font-semibold mb-4">Clips for {game.title}</h2>
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
          <h2 className="text-xl font-semibold mb-4">About {game.title}</h2>
          <div className="bg-gray-800 rounded-lg p-6">
            <div className="mb-4">
              <h3 className="text-lg font-medium mb-2">Description</h3>
              <p className="text-gray-300">{game.description || 'No description available.'}</p>
            </div>
            
            <div className="grid grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-medium mb-2">Release Date</h3>
                <p className="text-gray-300">{game.release_date || 'Unknown'}</p>
              </div>
              
              <div>
                <h3 className="text-lg font-medium mb-2">Genre</h3>
                <p className="text-gray-300">{game.genre || 'Unknown'}</p>
              </div>
              
              <div>
                <h3 className="text-lg font-medium mb-2">Platforms</h3>
                <p className="text-gray-300">{game.platforms || 'Unknown'}</p>
              </div>
              
              <div>
                <h3 className="text-lg font-medium mb-2">Developer</h3>
                <p className="text-gray-300">{game.developer || 'Unknown'}</p>
              </div>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="achievements" className="mt-0">
          <h2 className="text-xl font-semibold mb-4">Achievements for {game.title}</h2>
          <AchievementList gameId={parseInt(gameId!, 10)} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default GameDetails;
