import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { igdbService } from '@/services/igdbService';
import { Game } from '@/types/game';
import { Post } from '@/types/post';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Video, Users } from 'lucide-react';
import PostItem from '@/components/PostItem';
import StreamerCard from '@/components/StreamerCard';
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

interface Stream {
  id: string;
  title: string;
  is_live: boolean;
  viewer_count: number;
  user_id: string;
  game_id: string;
  started_at: string;
  thumbnail_url: string;
  profiles: {
    username: string;
    avatar_url: string;
  };
}

const GameDetailsPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [game, setGame] = useState<Game | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [liveStreams, setLiveStreams] = useState<Stream[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("clips");

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

        // Fetch live streams for this game
        const { data: streamsData, error: streamsError } = await supabase
          .from('streams')
          .select(`
            *,
            profiles(username, avatar_url)
          `)
          .eq('game_id', uuidCompatibleId)
          .eq('is_live', true)
          .order('viewer_count', { ascending: false });

        if (streamsError) {
          console.error('Error fetching streams:', streamsError);
          throw streamsError;
        }

        console.log('Streams data:', streamsData);
        setLiveStreams(streamsData || []);
        
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
      
      <div className="flex flex-col md:flex-row gap-8 mb-8">
        {game.cover_url && (
          <div className="w-full md:w-1/4 flex-shrink-0">
            <img 
              src={game.cover_url.replace('t_thumb', 't_cover_big')} 
              alt={game.name} 
              className="w-full rounded-lg shadow-md object-cover"
            />
          </div>
        )}
        
        <div className="flex-1">
          <h1 className="text-3xl font-bold mb-4">{game.name}</h1>
          
          {game.summary && (
            <p className="mb-4 text-muted-foreground">{game.summary}</p>
          )}
        </div>
      </div>
      
      <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="clips" className="flex items-center">
            <Video className="mr-2 h-4 w-4" />
            Clipts
          </TabsTrigger>
          <TabsTrigger value="streamers" className="flex items-center">
            <Users className="mr-2 h-4 w-4" />
            Live Streamers
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="clips" className="mt-4">
          <h2 className="text-2xl font-semibold mb-4">{game.name} Clipts</h2>
          
          {posts.length === 0 ? (
            <div className="text-center py-8 border rounded-lg bg-muted/20">
              <p className="text-muted-foreground mb-2">No clipts found for this game</p>
              <Button asChild>
                <Link to="/create">Create the first clipt</Link>
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {posts.map((post) => (
                <PostItem key={post.id} post={post} />
              ))}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="streamers" className="mt-4">
          <h2 className="text-2xl font-semibold mb-4">Live Streamers Playing {game.name}</h2>
          
          {liveStreams.length === 0 ? (
            <div className="text-center py-8 border rounded-lg bg-muted/20">
              <p className="text-muted-foreground">No one is streaming this game right now</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {liveStreams.map((stream) => (
                <StreamerCard 
                  key={stream.id}
                  id={stream.id}
                  username={stream.profiles.username || 'Unknown'}
                  title={stream.title}
                  thumbnail={stream.thumbnail_url || '/placeholder-stream.jpg'}
                  avatarUrl={stream.profiles.avatar_url || ''}
                  viewerCount={stream.viewer_count}
                  isLive={stream.is_live}
                  game={game.name}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default GameDetailsPage;
