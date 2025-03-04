import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Share2, ThumbsUp, MessageSquare, Clock, ArrowLeft } from 'lucide-react';
import ShareButton from '@/components/shared/ShareButton';
import { useAuth } from '@/contexts/AuthContext';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';
import { HelmetProvider, Helmet } from 'react-helmet-async';

interface StreamClip {
  id: string;
  title: string;
  stream_id: string;
  user_id: string;
  start_time: number;
  end_time: number;
  duration: number;
  created_at: string;
  clip_url?: string;
  thumbnail_url?: string;
  view_count: number;
  like_count: number;
  stream: {
    title: string;
    user_id: string;
    thumbnail_url?: string;
  };
  user: {
    username: string;
    display_name?: string;
    avatar_url?: string;
  };
}

export default function ClipPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [isLiked, setIsLiked] = useState(false);
  const [videoLoaded, setVideoLoaded] = useState(false);
  
  const { data: clip, isLoading, error } = useQuery({
    queryKey: ['clip', id],
    queryFn: async () => {
      if (!id) throw new Error("Clip ID is required");
      
      const { data, error } = await supabase
        .from('stream_clips')
        .select(`
          *,
          stream:stream_id (title, user_id, thumbnail_url),
          user:user_id (username, display_name, avatar_url)
        `)
        .eq('id', id)
        .single();
        
      if (error) throw error;
      if (!data) throw new Error("Clip not found");
      
      return data as StreamClip;
    },
    enabled: !!id,
    retry: 1,
    onError: (err) => {
      console.error("Error loading clip:", err);
    }
  });
  
  // Check if user has liked this clip
  useEffect(() => {
    if (!user || !clip) return;
    
    const checkLikeStatus = async () => {
      const { data } = await supabase
        .from('clip_likes')
        .select('*')
        .eq('clip_id', clip.id)
        .eq('user_id', user.id)
        .limit(1);
        
      setIsLiked(!!data && data.length > 0);
    };
    
    checkLikeStatus();
  }, [clip, user]);
  
  // Record view
  useEffect(() => {
    if (!clip || !videoLoaded) return;
    
    const recordView = async () => {
      // Record anonymous view
      await supabase
        .from('clip_views')
        .insert({
          clip_id: clip.id,
          user_id: user?.id || null,
          ip_hash: 'anonymous', // In a real app, you would hash the IP
          created_at: new Date().toISOString()
        });
        
      // Update view count
      await supabase
        .rpc('increment_clip_views', { clip_id: clip.id });
    };
    
    recordView();
  }, [clip, user, videoLoaded]);
  
  const handleLike = async () => {
    if (!user) {
      toast.error('You need to be signed in to like clips');
      return;
    }
    
    if (!clip) return;
    
    try {
      if (isLiked) {
        // Unlike
        await supabase
          .from('clip_likes')
          .delete()
          .match({ clip_id: clip.id, user_id: user.id });
          
        await supabase
          .rpc('decrement_clip_likes', { clip_id: clip.id });
          
        setIsLiked(false);
      } else {
        // Like
        await supabase
          .from('clip_likes')
          .insert({ clip_id: clip.id, user_id: user.id });
          
        await supabase
          .rpc('increment_clip_likes', { clip_id: clip.id });
          
        setIsLiked(true);
      }
    } catch (error) {
      console.error('Error toggling like:', error);
      toast.error('Failed to update like status');
    }
  };
  
  if (isLoading) {
    return (
      <div className="container max-w-5xl mx-auto py-8 px-4">
        <Skeleton className="w-full aspect-video rounded-lg mb-4" />
        <Skeleton className="h-8 w-2/3 mb-2" />
        <Skeleton className="h-5 w-1/3 mb-6" />
        <div className="flex gap-4 mb-6">
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-24" />
        </div>
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }
  
  if (error || !clip) {
    return (
      <div className="container max-w-5xl mx-auto py-16 px-4 text-center">
        <h1 className="text-2xl font-bold mb-4">Clip Not Found</h1>
        <p className="mb-6">The clip you're looking for doesn't exist or has been removed.</p>
        <Button asChild>
          <Link to="/">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Link>
        </Button>
      </div>
    );
  }
  
  const displayName = clip.user.display_name || clip.user.username;
  const pageTitle = `${clip.title} by ${displayName} | Clipt`;
  
  return (
    <HelmetProvider>
      <Helmet>
        <title>{pageTitle}</title>
        <meta name="description" content={`Watch this clip: ${clip.title}`} />
        <meta property="og:title" content={clip.title} />
        <meta property="og:description" content={`Watch this clip by ${displayName}`} />
        {clip.thumbnail_url && <meta property="og:image" content={clip.thumbnail_url} />}
        <meta property="og:type" content="video.other" />
      </Helmet>
      
      <div className="container max-w-5xl mx-auto py-8 px-4">
        <div className="mb-4">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/clips">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Clips
            </Link>
          </Button>
        </div>
        
        <div className="bg-black rounded-lg overflow-hidden mb-4">
          <video
            src={clip.clip_url || `https://stream.clipt.app/clips/${clip.id}`}
            poster={clip.thumbnail_url || clip.stream.thumbnail_url}
            controls
            autoPlay
            className="w-full aspect-video"
            onLoadedData={() => setVideoLoaded(true)}
          />
        </div>
        
        <h1 className="text-2xl font-bold mb-1">{clip.title}</h1>
        
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Link to={`/profile/${clip.user.username}`} className="flex items-center gap-2">
              <Avatar className="h-8 w-8">
                <AvatarImage src={clip.user.avatar_url || undefined} alt={displayName} />
                <AvatarFallback>{displayName.substring(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <span className="font-medium">{displayName}</span>
            </Link>
            
            <span className="text-sm text-muted-foreground flex items-center">
              <Clock className="h-3 w-3 mr-1" />
              {formatDistanceToNow(new Date(clip.created_at), { addSuffix: true })}
            </span>
          </div>
          
          <div className="flex gap-2">
            <Button 
              variant={isLiked ? "default" : "outline"} 
              size="sm"
              onClick={handleLike}
              className={isLiked ? "bg-pink-500 hover:bg-pink-600" : ""}
            >
              <ThumbsUp className="h-4 w-4 mr-1" />
              {clip.like_count}
            </Button>
            
            <ShareButton
              title={clip.title}
              text={`Check out this clip from ${displayName}`}
              url={window.location.href}
              size="sm"
            />
          </div>
        </div>
        
        <div className="flex flex-col md:flex-row gap-6">
          <div className="flex-grow">
            <h2 className="text-lg font-medium mb-2">From stream</h2>
            <Link 
              to={`/stream/${clip.stream_id}`}
              className="flex items-center gap-3 p-3 rounded-lg border hover:bg-accent transition"
            >
              {clip.stream.thumbnail_url && (
                <img 
                  src={clip.stream.thumbnail_url} 
                  alt={clip.stream.title} 
                  className="w-24 h-16 object-cover rounded"
                />
              )}
              <div>
                <h3 className="font-medium">{clip.stream.title}</h3>
                <p className="text-sm text-muted-foreground">
                  Watch the full stream
                </p>
              </div>
            </Link>
            
            <div className="mt-6">
              <h2 className="text-lg font-medium mb-2 flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Comments
              </h2>
              {/* Comments component would go here */}
              <div className="p-6 text-center text-muted-foreground border rounded-lg">
                Comments coming soon...
              </div>
            </div>
          </div>
          
          <div className="md:w-80">
            <h2 className="text-lg font-medium mb-2">More clips you might like</h2>
            <div className="space-y-4">
              {/* Recommended clips would go here */}
              <div className="p-6 text-center text-muted-foreground border rounded-lg">
                Recommended clips coming soon...
              </div>
            </div>
          </div>
        </div>
      </div>
    </HelmetProvider>
  );
}
