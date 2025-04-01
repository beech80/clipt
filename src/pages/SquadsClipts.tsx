import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Heart, MessageSquare, Trophy, Share2, Bookmark } from 'lucide-react';
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
  const [currentPostIndex, setCurrentPostIndex] = useState(0);

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

  // Function to navigate to previous/next post
  const navigatePost = (direction: 'prev' | 'next') => {
    if (squadPosts.length === 0) return;
    
    if (direction === 'next') {
      setCurrentPostIndex((prev) => (prev + 1) % squadPosts.length);
    } else {
      setCurrentPostIndex((prev) => (prev - 1 + squadPosts.length) % squadPosts.length);
    }
  };

  // Current post to display
  const currentPost = squadPosts[currentPostIndex];

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1A1C50] to-[#0F1033] text-white overflow-hidden">
      {/* Header */}
      <div className="pt-8 pb-4">
        <h1 className="text-center text-3xl font-bold text-purple-300">
          Squads Clipts
        </h1>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-2 max-w-md">
        {isLoading ? (
          <div className="flex justify-center items-center h-[60vh]">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
          </div>
        ) : squadPosts.length > 0 ? (
          <div className="border border-blue-900/50 rounded-lg overflow-hidden">
            {/* User info */}
            <div className="p-2 flex items-center space-x-2 bg-blue-900/20">
              <Avatar 
                className="w-8 h-8 rounded-full overflow-hidden"
                onClick={() => currentPost?.user_id && navigate(`/profile/${currentPost.user_id}`)}
              >
                {currentPost?.profiles?.avatar_url ? (
                  <AvatarImage 
                    src={currentPost.profiles.avatar_url}
                    alt={currentPost.profiles.username || 'User'}
                  />
                ) : (
                  <AvatarFallback className="text-white font-bold bg-purple-700">
                    {currentPost?.profiles?.username?.substring(0, 1)?.toUpperCase() || 'U'}
                  </AvatarFallback>
                )}
              </Avatar>
              <span className="font-medium">
                {currentPost?.profiles?.username || 'Username'}
              </span>
            </div>
            
            {/* Video content */}
            <div className="bg-[#0F1573] aspect-video flex items-center justify-center">
              {getMediaUrl(currentPost) && 
               (getMediaUrl(currentPost)?.includes('.mp4') || getMediaUrl(currentPost)?.includes('.webm')) ? (
                <video 
                  src={getMediaUrl(currentPost) || ''}
                  controls
                  className="w-full h-full object-contain"
                  poster={currentPost.thumbnail_url || ''}
                />
              ) : (
                <div className="text-center text-blue-300">
                  For video clips only!
                </div>
              )}
            </div>
            
            {/* Action buttons */}
            <div className="p-2 flex items-center justify-between bg-black/50">
              <button 
                className={`flex items-center ${currentPost?.liked_by_current_user ? 'text-red-400' : 'text-gray-300'}`}
                onClick={() => currentPost?.id && likeMutation.mutate(currentPost.id)}
              >
                <Heart className="mr-1 h-5 w-5 fill-current" />
                <span>{currentPost?.likes_count || 0}</span>
              </button>
              
              <button className="flex items-center text-blue-400">
                <MessageSquare className="mr-1 h-5 w-5" />
                <span>{currentPost?.comments_count || 0}</span>
              </button>
              
              <button className="flex items-center text-yellow-400">
                <Trophy className="mr-1 h-5 w-5" />
                <span>{currentPost?.trophy_count || 0}</span>
              </button>
              
              <button className="flex items-center text-purple-400">
                <Share2 className="mr-1 h-5 w-5" />
                <span>Share</span>
              </button>
              
              <button className="text-gray-300">
                <Bookmark className="h-5 w-5" />
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center py-12 px-4">
            <p className="text-xl font-semibold text-purple-300 mb-2">No squad clipts available</p>
            <p className="text-gray-400">Add friends to your squad or create new clipts!</p>
          </div>
        )}
      </div>

      {/* Game Controls */}
      <div className="fixed bottom-0 left-0 right-0 p-4">
        <div className="flex items-center justify-between">
          {/* D-Pad */}
          <div className="relative w-24 h-24">
            <div className="absolute inset-0 rounded-full bg-green-900/50 border border-green-500"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
            </div>
          </div>
          
          {/* Center Button */}
          <div className="relative w-16 h-16">
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 flex items-center justify-center">
              <span className="text-xs font-bold text-white">CLIPT</span>
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="relative w-24 h-24">
            <div className="absolute top-1/4 right-1/4 w-10 h-10 rounded-full bg-blue-900 border border-blue-400 flex items-center justify-center">
              <span className="text-xs">D</span>
            </div>
            <div className="absolute bottom-1/4 right-1/4 w-10 h-10 rounded-full bg-red-900 border border-red-400 flex items-center justify-center">
              <span className="text-xs">B</span>
            </div>
            <div className="absolute bottom-1/4 left-1/4 w-10 h-10 rounded-full bg-yellow-900 border border-yellow-400 flex items-center justify-center">
              <span className="text-xs">Y</span>
            </div>
            <div className="absolute top-1/4 left-1/4 w-10 h-10 rounded-full bg-purple-900 border border-purple-400 flex items-center justify-center">
              <span className="text-xs">X</span>
            </div>
          </div>
        </div>
        
        {/* Menu Buttons */}
        <div className="flex justify-center mt-2 space-x-8">
          <button className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center">
            <span className="text-sm">≡</span>
          </button>
          <button className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center">
            <span className="text-sm">◎</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default SquadsClipts;
