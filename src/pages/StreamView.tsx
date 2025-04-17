import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { BackButton } from '@/components/ui/back-button';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { EnhancedStreamPlayer } from '@/components/streaming/EnhancedStreamPlayer';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, Share2, Heart, MessageSquare, Gamepad2, Zap, Trophy, Users } from 'lucide-react';
import { toast } from 'sonner';
import { followService } from '@/services/followService';
import { motion } from 'framer-motion';

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
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-purple-950/20 to-black">
      {/* Animated Background Effects */}
      <div className="fixed inset-0 z-0 opacity-20">
        <div className="absolute inset-0 bg-[url('/images/grid.svg')] bg-repeat opacity-20"></div>
        <div className="absolute top-0 left-0 right-0 h-screen bg-gradient-to-b from-purple-600/10 via-transparent to-transparent"></div>
      </div>

      {/* Header Area */}
      <motion.div 
        className="bg-gradient-to-b from-purple-900/70 to-transparent absolute top-0 left-0 right-0 h-40 z-10"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.5 }}
      >
        <div className="container mx-auto px-4 pt-4">
          <BackButton />
          <motion.h1 
            className="text-3xl font-bold flex items-center gap-3 text-white mt-4 px-2 py-1 rounded-lg border-l-4 border-red-500 shadow-[0_0_15px_rgba(255,0,0,0.3)]"
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <Badge className="bg-gradient-to-r from-red-600 to-red-500 flex items-center gap-1 border-none shadow-[0_0_10px_rgba(255,0,0,0.5)] px-3 py-1">
              <span className="h-2 w-2 rounded-full bg-white animate-pulse"></span>
              LIVE NOW
            </Badge>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 ml-1">STREAMING</span>
            <Gamepad2 className="h-5 w-5 text-purple-400 ml-2" />
          </motion.h1>
        </div>
      </motion.div>

      <div className="container mx-auto px-4 pt-32 pb-20 max-w-6xl relative z-10">
        {/* Stream Info Banner */}
        <motion.div
          className="mb-6 px-4 py-3 bg-gradient-to-r from-purple-900/40 to-indigo-900/40 rounded-lg border border-purple-500/30 shadow-[0_0_20px_rgba(120,0,255,0.3)] flex items-center justify-between"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex items-center gap-4">
            <motion.div 
              className="cursor-pointer relative" 
              onClick={() => navigate(`/profile/${streamer?.id}`)}
              whileHover={{ scale: 1.05 }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full opacity-50 blur-sm"></div>
              <Avatar className="h-12 w-12 border-2 border-white/30 relative">
                <AvatarImage src={streamer?.avatar_url || ''} />
                <AvatarFallback className="bg-gradient-to-br from-purple-600 to-blue-600 text-white font-bold">
                  {streamer?.display_name?.charAt(0) || streamer?.username?.charAt(0) || '?'}
                </AvatarFallback>
              </Avatar>
            </motion.div>
            
            <div>
              <motion.div 
                className="text-white font-bold text-xl cursor-pointer hover:text-purple-400 transition-colors"
                onClick={() => navigate(`/profile/${streamer?.id}`)}
                whileHover={{ x: 2 }}
              >
                {streamer?.display_name || streamer?.username}
              </motion.div>
              <div className="text-purple-300 text-sm">@{streamer?.username}</div>
              <div className="flex items-center gap-2 mt-1 text-gray-400 text-xs">
                <Users className="h-3 w-3" />
                <span>{streamer?.followers_count} followers</span>
              </div>
            </div>
          </div>
          
          <motion.div 
            className="flex gap-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            {user && user.id !== streamer?.id && (
              <>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button
                    onClick={handleFollowToggle}
                    variant={streamer?.is_following ? "outline" : "default"}
                    className={streamer?.is_following ? 
                      "bg-transparent border border-purple-500 text-purple-400 hover:bg-purple-500/20" : 
                      "bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-700 hover:to-purple-600 border-none shadow-[0_0_10px_rgba(120,0,255,0.3)]"}
                    disabled={followLoading}
                  >
                    {followLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : null}
                    {streamer?.is_following ? 'Following' : 'Follow'}
                  </Button>
                </motion.div>
                
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button 
                    onClick={handleMessageStreamer}
                    variant="outline" 
                    size="icon"
                    className="border-purple-500/30 bg-black/30 hover:bg-black/50 shadow-[0_0_10px_rgba(120,0,255,0.2)]"
                  >
                    <MessageSquare className="h-4 w-4 text-purple-300" />
                  </Button>
                </motion.div>
              </>
            )}
            
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button 
                onClick={handleShareStream}
                variant="outline" 
                size="icon"
                className="border-purple-500/30 bg-black/30 hover:bg-black/50 shadow-[0_0_10px_rgba(120,0,255,0.2)]"
              >
                <Share2 className="h-4 w-4 text-purple-300" />
              </Button>
            </motion.div>
          </motion.div>
        </motion.div>

        {/* Stream Title */}
        <motion.div 
          className="mb-6"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <h2 className="text-white text-2xl font-bold px-4 py-3 bg-gradient-to-r from-indigo-900/30 to-black/40 rounded-lg border-l-4 border-indigo-500 shadow-[0_0_15px_rgba(80,0,255,0.2)]">
            {stream?.title || 'Live Stream'}
          </h2>
          <div className="flex items-center gap-3 mt-3 ml-4">
            {stream?.game_name && (
              <Badge className="bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 border-none shadow-[0_0_8px_rgba(0,120,255,0.3)] px-3 py-1 font-bold">
                <Gamepad2 className="h-3 w-3 mr-1" />
                {stream?.game_name}
              </Badge>
            )}
            <div className="text-gray-300 text-sm flex items-center gap-1">
              <Zap className="h-3 w-3 text-yellow-400" />
              <span>Started {new Date(stream?.started_at || '').toLocaleString()}</span>
            </div>
          </div>
        </motion.div>

        {/* Stream Player */}
        <motion.div
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <EnhancedStreamPlayer 
            streamId={stream?.id || id || ''} 
          />
        </motion.div>
      </div>
    </div>
  );
};

export default StreamView;
