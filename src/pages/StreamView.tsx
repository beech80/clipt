import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { BackButton } from '@/components/ui/back-button';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { StreamPlayer } from '@/components/streaming/StreamPlayer';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, Share2, Heart, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';
import { followService } from '@/services/followService';

interface StreamData {
  id: string;
  title: string;
  user_id: string;
  viewer_count: number;
  started_at: string;
  game_id?: string;
  game_name?: string;
  thumbnail_url?: string;
}

interface StreamerProfile {
  id: string;
  username: string;
  display_name?: string;
  avatar_url?: string;
  followers_count?: number;
  is_following?: boolean;
}

const StreamView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [stream, setStream] = useState<StreamData | null>(null);
  const [streamer, setStreamer] = useState<StreamerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [followLoading, setFollowLoading] = useState(false);

  useEffect(() => {
    const fetchStreamData = async () => {
      try {
        setLoading(true);
        
        if (!id) {
          toast.error('Stream ID not provided');
          navigate('/discover');
          return;
        }

        // Fetch stream data
        const { data: streamData, error: streamError } = await supabase
          .from('active_streams')
          .select('*')
          .eq('id', id)
          .single();

        if (streamError || !streamData) {
          toast.error('Stream not found or has ended');
          navigate('/discover');
          return;
        }

        // Fetch streamer profile
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', streamData.user_id)
          .single();

        if (profileError) {
          toast.error('Failed to load streamer data');
          return;
        }

        // Check if current user is following the streamer
        let isFollowing = false;
        if (user && user.id !== streamData.user_id) {
          isFollowing = await followService.isFollowing(user.id, streamData.user_id);
        }

        // Get follower count
        const followersCount = await followService.getFollowersCount(streamData.user_id);

        setStream(streamData);
        setStreamer({
          id: profileData.id,
          username: profileData.username,
          display_name: profileData.display_name,
          avatar_url: profileData.avatar_url,
          followers_count: followersCount,
          is_following: isFollowing
        });

      } catch (error) {
        console.error('Error fetching stream data:', error);
        toast.error('Failed to load stream');
      } finally {
        setLoading(false);
      }
    };

    fetchStreamData();

    // Set up real-time listener for stream updates
    const subscription = supabase
      .channel('stream_updates')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'active_streams',
        filter: `id=eq.${id}`
      }, (payload) => {
        if (payload.eventType === 'DELETE') {
          // Stream ended
          toast.info('This stream has ended');
          navigate(`/profile/${streamer?.id}`);
        } else if (payload.eventType === 'UPDATE') {
          // Stream updated
          setStream(payload.new as StreamData);
        }
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [id, user, navigate]);

  const handleFollowToggle = async () => {
    if (!user || !streamer) return;
    
    try {
      setFollowLoading(true);
      
      if (streamer.is_following) {
        await followService.unfollow(user.id, streamer.id);
        setStreamer(prev => prev ? {
          ...prev,
          is_following: false,
          followers_count: (prev.followers_count || 0) - 1
        } : null);
        toast.success(`Unfollowed @${streamer.username}`);
      } else {
        await followService.follow(user.id, streamer.id);
        setStreamer(prev => prev ? {
          ...prev,
          is_following: true,
          followers_count: (prev.followers_count || 0) + 1
        } : null);
        toast.success(`Following @${streamer.username}`);
      }
      
    } catch (error) {
      console.error('Error toggling follow:', error);
      toast.error('Failed to update follow status');
    } finally {
      setFollowLoading(false);
    }
  };

  const handleShareStream = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    toast.success('Stream URL copied to clipboard');
  };

  const handleMessageStreamer = () => {
    if (!streamer) return;
    navigate(`/messages?user=${streamer.id}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#1a237e] to-[#0d1b3c] flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-white animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1a237e] to-[#0d1b3c]">
      <div className="fixed top-0 left-0 right-0 z-50 p-4 bg-black/40 backdrop-blur-lg border-b border-white/10">
        <div className="flex items-center justify-center max-w-7xl mx-auto relative">
          <BackButton />
          <h1 className="text-3xl font-bold text-white flex items-center gap-2">
            <Badge className="bg-red-500 hover:bg-red-600 flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-white animate-pulse"></span>
              LIVE
            </Badge>
            Stream
          </h1>
        </div>
      </div>

      <div className="container mx-auto px-4 pt-24 pb-20 max-w-4xl">
        {/* Stream Player */}
        <StreamPlayer 
          streamId={stream?.id || id || ''} 
          title={stream?.title || 'Live Stream'} 
          isLive={true}
          viewerCount={stream?.viewer_count || 0}
        />

        {/* Streamer Info */}
        <div className="bg-black/30 backdrop-blur-sm rounded-lg border border-white/10 mt-4 p-4">
          <div className="flex items-center gap-4">
            <div 
              className="cursor-pointer" 
              onClick={() => navigate(`/profile/${streamer?.id}`)}
            >
              <Avatar className="h-12 w-12">
                <AvatarImage src={streamer?.avatar_url || ''} />
                <AvatarFallback className="bg-purple-600 text-white font-bold">
                  {streamer?.display_name?.charAt(0) || streamer?.username?.charAt(0) || '?'}
                </AvatarFallback>
              </Avatar>
            </div>
            
            <div className="flex-1">
              <div 
                className="text-white font-bold text-lg cursor-pointer hover:text-purple-400 transition-colors"
                onClick={() => navigate(`/profile/${streamer?.id}`)}
              >
                {streamer?.display_name || streamer?.username}
              </div>
              <div className="text-gray-400 text-sm">@{streamer?.username}</div>
              <div className="text-gray-400 text-sm mt-1">{streamer?.followers_count} followers</div>
            </div>
            
            <div className="flex gap-2">
              {user && user.id !== streamer?.id && (
                <>
                  <Button
                    onClick={handleFollowToggle}
                    variant={streamer?.is_following ? "outline" : "default"}
                    className={streamer?.is_following ? 
                      "bg-transparent border border-purple-500 text-purple-400 hover:bg-purple-500/10" : 
                      "bg-purple-600 hover:bg-purple-700"
                    }
                    disabled={followLoading}
                  >
                    {followLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : null}
                    {streamer?.is_following ? 'Following' : 'Follow'}
                  </Button>
                  
                  <Button 
                    onClick={handleMessageStreamer}
                    variant="outline" 
                    size="icon"
                    className="border-white/10 bg-black/30 hover:bg-black/50"
                  >
                    <MessageSquare className="h-4 w-4" />
                  </Button>
                </>
              )}
              
              <Button 
                onClick={handleShareStream}
                variant="outline" 
                size="icon"
                className="border-white/10 bg-black/30 hover:bg-black/50"
              >
                <Share2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          {/* Stream Title */}
          <div className="mt-4">
            <h2 className="text-white text-xl font-bold">{stream?.title}</h2>
            <div className="flex items-center gap-2 mt-2">
              {stream?.game_name && (
                <Badge className="bg-blue-600 hover:bg-blue-700">
                  {stream.game_name}
                </Badge>
              )}
              <div className="text-gray-400 text-sm">
                Started {new Date(stream?.started_at || '').toLocaleString()}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StreamView;
