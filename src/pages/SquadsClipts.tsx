import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Users, ChevronLeft, RefreshCw, Heart, MessageSquare, Trophy, Share2, Bookmark } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface PostType {
  id: string;
  user_id: string;
  content: string;
  media_urls: string[] | string;
  created_at: string;
  likes_count: number;
  comments_count: number;
  trophy_count: number;
  is_published: boolean;
  post_type?: string;
  thumbnail_url?: string;
  image_url?: string | null;
  video_url?: string | null;
  profiles: {
    username: string;
    avatar_url: string;
    display_name?: string;
  } | null;
  liked_by_current_user?: boolean;
}

const SquadsClipts = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Fetch squad clips
  const { data: squadPosts = [], isLoading, refetch } = useQuery({
    queryKey: ['squad-posts'],
    queryFn: async () => {
      if (!user) return [];
      
      // Get user's squad members from friends table (simplified approach)
      const { data: squadMembers, error: squadError } = await supabase
        .from('friends')
        .select('friend_id')
        .eq('user_id', user.id)
        .eq('status', 'accepted');
        
      if (squadError) {
        console.error("Error fetching squad members:", squadError);
        return [];
      }
      
      // Include current user in the squad
      const squadIds = [...(squadMembers?.map(member => member.friend_id) || []), user.id];
      
      if (squadIds.length === 0) {
        return [];
      }
      
      // Get posts from squad members
      const { data: posts, error: postsError } = await supabase
        .from('posts')
        .select(`
          id,
          content,
          created_at,
          user_id,
          likes_count,
          comments_count,
          trophy_count,
          is_published,
          post_type,
          media_urls,
          thumbnail_url,
          image_url,
          video_url,
          profiles:user_id (
            username,
            avatar_url,
            display_name
          )
        `)
        .in('user_id', squadIds)
        .eq('is_published', true)
        .order('created_at', { ascending: false });
        
      if (postsError) {
        console.error("Error fetching squad posts:", postsError);
        return [];
      }
      
      // Check which posts are liked by current user
      if (user) {
        const postIds = posts.map(post => post.id);
        const { data: likeData } = await supabase
          .from('likes')
          .select('post_id')
          .eq('user_id', user.id)
          .in('post_id', postIds);
        
        const likedPostIds = new Set(likeData?.map(like => like.post_id) || []);
        
        return posts.map(post => ({
          ...post,
          liked_by_current_user: likedPostIds.has(post.id)
        }));
      }
      
      return posts.map(post => ({
        ...post,
        liked_by_current_user: false
      }));
    },
    enabled: !!user,
  });
  
  // Like post mutation
  const likeMutation = useMutation({
    mutationFn: async (postId: string) => {
      if (!user) {
        toast.error("Please sign in to like posts");
        return;
      }
      
      const post = squadPosts.find(p => p.id === postId);
      const isLiked = post?.liked_by_current_user;
      
      if (isLiked) {
        // Unlike post
        const { error } = await supabase
          .from('likes')
          .delete()
          .eq('user_id', user.id)
          .eq('post_id', postId);
          
        if (error) throw error;
        
        // Decrement likes count
        const { error: updateError } = await supabase.rpc('decrement_likes_count', { post_id: postId });
        if (updateError) throw updateError;
        
        return { action: 'unliked', postId };
      } else {
        // Like post
        const { error } = await supabase
          .from('likes')
          .insert({
            user_id: user.id,
            post_id: postId
          });
          
        if (error) throw error;
        
        // Increment likes count
        const { error: updateError } = await supabase.rpc('increment_likes_count', { post_id: postId });
        if (updateError) throw updateError;
        
        return { action: 'liked', postId };
      }
    },
    onSuccess: (result) => {
      // Update query cache
      queryClient.invalidateQueries({ queryKey: ['squad-posts'] });
      
      toast.success(result?.action === 'liked' ? 'Post liked!' : 'Post unliked');
    },
    onError: (error) => {
      console.error("Error liking post:", error);
      toast.error("Failed to like post");
    }
  });

  // Function to get media URL from post
  const getMediaUrl = (post: PostType) => {
    try {
      // First try media_urls field
      if (post.media_urls) {
        if (typeof post.media_urls === 'string') {
          try {
            // Try to parse JSON string
            const parsed = JSON.parse(post.media_urls);
            return Array.isArray(parsed) && parsed.length > 0 ? parsed[0] : post.media_urls;
          } catch (e) {
            // If parsing fails, use the string directly
            return post.media_urls;
          }
        } else if (Array.isArray(post.media_urls) && post.media_urls.length > 0) {
          return post.media_urls[0];
        }
      }

      // Fallback to other fields if not found
      if (post.thumbnail_url) return post.thumbnail_url;
      else if (post.image_url) return post.image_url;
      else if (post.video_url) return post.video_url;
      
      return null;
    } catch (error) {
      console.error("Error processing media URL:", error);
      return null;
    }
  };

  // Function to refresh posts
  const refreshPosts = async () => {
    setIsRefreshing(true);
    await refetch();
    setIsRefreshing(false);
    toast.success("Squad content refreshed!");
    
    // Force user interaction for autoplay
    document.documentElement.setAttribute('data-user-interacted', 'true');
  };

  return (
    <div className="min-h-screen bg-[#0f112a] text-white">
      <div className="fixed top-0 left-0 right-0 z-50 p-4 bg-[#141644] border-b-4 border-[#4a4dff] shadow-[0_4px_0_0_#000]">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="text-white hover:bg-[#252968]"
          >
            <ChevronLeft className="h-6 w-6" />
          </Button>
          <h1 className="text-2xl font-bold text-white flex items-center pixel-font retro-text-shadow">
            <Users className="h-5 w-5 mr-2 text-purple-400" />
            CLIPTS
          </h1>
          <Button
            variant="ghost"
            size="icon"
            onClick={refreshPosts}
            className={`text-white transition-all duration-300 ${isRefreshing ? 'animate-spin' : ''}`}
            disabled={isRefreshing}
          >
            <RefreshCw className="h-5 w-5" />
          </Button>
        </div>
      </div>

      <div className="container mx-auto px-4 pt-20 pb-32 max-w-2xl">
        <div className="retro-border p-6 mb-6">
          <h2 className="text-xl font-bold mb-4 text-purple-400 pixel-font retro-text-shadow">YOUR SQUAD'S CONTENT</h2>
          
          {isLoading || isRefreshing ? (
            <div className="flex justify-center items-center py-20">
              <Button variant="outline" size="icon" className="animate-spin">
                <RefreshCw className="h-5 w-5" />
              </Button>
            </div>
          ) : squadPosts.length > 0 ? (
            <div className="space-y-6">
              {squadPosts.map((post) => (
                <div key={post.id} className="bg-[#191F35] backdrop-blur-sm rounded-xl overflow-hidden border border-white/10 shadow-xl">
                  {/* Post Author */}
                  <div className="p-4 border-b border-white/10 flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Avatar 
                        className="w-10 h-10 rounded-full bg-purple-500 overflow-hidden cursor-pointer"
                        onClick={() => navigate(`/profile/${post.user_id}`)}
                      >
                        {post.profiles?.avatar_url ? (
                          <AvatarImage 
                            src={post.profiles.avatar_url}
                            alt={post.profiles.username || 'User'}
                          />
                        ) : (
                          <AvatarFallback className="text-white font-bold">
                            {post.profiles?.username?.substring(0, 1)?.toUpperCase() || 'U'}
                          </AvatarFallback>
                        )}
                      </Avatar>
                      <div>
                        <p 
                          className="font-medium text-white cursor-pointer hover:text-purple-300"
                          onClick={() => navigate(`/profile/${post.user_id}`)}
                        >
                          {post.profiles?.username || 'Username'}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Post Content */}
                  <div 
                    className="p-4 cursor-pointer"
                    onClick={() => navigate(`/post/${post.id}`)}
                  >
                    {post.content && (
                      <p className="text-gray-300 mb-4">{post.content}</p>
                    )}
                    
                    {/* Media content */}
                    {getMediaUrl(post) && (
                      <div className="rounded-lg overflow-hidden bg-[#17205B] aspect-video flex items-center justify-center">
                        {(getMediaUrl(post)?.includes('.mp4') || getMediaUrl(post)?.includes('.webm')) ? (
                          <video 
                            src={getMediaUrl(post) || ''}
                            controls
                            className="w-full h-full object-contain max-h-[80vh]"
                            poster={post.thumbnail_url || ''}
                          />
                        ) : (
                          <img 
                            src={getMediaUrl(post) || ''} 
                            alt={post.content?.substring(0, 20) || "Post content"} 
                            className="w-full h-full object-contain max-h-[80vh]"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' fill='%23001133'/%3E%3Ctext x='50' y='50' font-family='Arial' font-size='12' fill='%234488cc' text-anchor='middle' dominant-baseline='middle'%3EFor video clips only!%3C/text%3E%3C/svg%3E";
                            }}
                          />
                        )}
                      </div>
                    )}
                  </div>
                  
                  {/* Post Actions */}
                  <div className="px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center space-x-6">
                      <button 
                        className={`flex items-center ${post.liked_by_current_user ? 'text-red-400' : 'text-gray-300'} hover:text-red-400`}
                        onClick={() => likeMutation.mutate(post.id)}
                      >
                        <Heart className={`mr-1 h-5 w-5 ${likeMutation.isPending && likeMutation.variables === post.id ? 'animate-pulse' : ''}`} />
                        <span className="text-sm font-semibold">{post.likes_count || 0}</span>
                      </button>
                      <button 
                        className="flex items-center text-gray-300 hover:text-blue-400"
                        onClick={() => navigate(`/post/${post.id}`)}
                      >
                        <MessageSquare className="mr-1 h-5 w-5" />
                        <span className="text-sm font-semibold">{post.comments_count || 0}</span>
                      </button>
                      <button className="flex items-center text-gray-300 hover:text-yellow-400">
                        <Trophy className="mr-1 h-5 w-5" />
                        <span className="text-sm font-semibold">{post.trophy_count || 0}</span>
                      </button>
                    </div>
                    <div className="flex space-x-4">
                      <button className="text-gray-300 hover:text-purple-400">
                        <Share2 className="h-5 w-5" />
                      </button>
                      <button className="text-gray-300 hover:text-blue-400">
                        <Bookmark className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                  
                  {/* Post Info */}
                  <div className="px-4 pb-3">
                    <p className="text-xs text-gray-500">
                      {post.created_at 
                        ? formatDistanceToNow(new Date(post.created_at), { addSuffix: true })
                        : '2 hours ago'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-300 mb-4">No squad content found.</p>
              <p className="text-gray-400 text-sm">Add friends to your squad to see their clipts here!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SquadsClipts;
