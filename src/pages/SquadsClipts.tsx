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

      {/* Main Content - Changed to horizontal layout */}
      <div className="container mx-auto px-4">
        {isLoading ? (
          <div className="flex justify-center items-center h-[60vh]">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
          </div>
        ) : squadPosts.length > 0 ? (
          <div className="overflow-x-auto hide-scrollbar">
            <div className="flex flex-row space-x-4 pb-4 min-w-min">
              {squadPosts.map((post, index) => (
                <div key={post.id} className="flex-shrink-0 w-72 border border-blue-900/50 rounded-lg overflow-hidden">
                  {/* User info */}
                  <div className="p-2 flex items-center space-x-2 bg-blue-900/20">
                    <Avatar 
                      className="w-8 h-8 rounded-full overflow-hidden"
                      onClick={() => post?.user_id && navigate(`/profile/${post.user_id}`)}
                    >
                      {post?.profiles?.avatar_url ? (
                        <AvatarImage 
                          src={post.profiles.avatar_url}
                          alt={post.profiles.username || 'User'}
                        />
                      ) : (
                        <AvatarFallback className="text-white font-bold bg-purple-700">
                          {post?.profiles?.username?.substring(0, 1)?.toUpperCase() || 'U'}
                        </AvatarFallback>
                      )}
                    </Avatar>
                    <span className="font-medium truncate">
                      {post?.profiles?.username || 'Username'}
                    </span>
                  </div>
                  
                  {/* Video content */}
                  <div className="bg-[#0F1573] aspect-video flex items-center justify-center">
                    {getMediaUrl(post) && 
                     (getMediaUrl(post)?.includes('.mp4') || getMediaUrl(post)?.includes('.webm')) ? (
                      <video 
                        src={getMediaUrl(post) || ''}
                        controls
                        className="w-full h-full object-contain"
                        poster={post.thumbnail_url || ''}
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
                      className={`flex items-center ${post?.liked_by_current_user ? 'text-red-400' : 'text-gray-300'}`}
                      onClick={() => post?.id && likeMutation.mutate(post.id)}
                    >
                      <Heart className="mr-1 h-5 w-5 fill-current" />
                      <span>{post?.likes_count || 0}</span>
                    </button>
                    
                    <button className="flex items-center text-blue-400">
                      <MessageSquare className="mr-1 h-5 w-5" />
                      <span>{post?.comments_count || 0}</span>
                    </button>
                    
                    <button className="flex items-center text-yellow-400">
                      <Trophy className="mr-1 h-5 w-5" />
                      <span>{post?.trophy_count || 0}</span>
                    </button>
                    
                    <button className="flex items-center text-purple-400">
                      <Share2 className="h-5 w-5" />
                    </button>
                    
                    <button className="text-gray-300">
                      <Bookmark className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-12 px-4">
            <p className="text-xl font-semibold text-purple-300 mb-2">No squad clipts available</p>
            <p className="text-gray-400">Add friends to your squad or create new clipts!</p>
          </div>
        )}
      </div>

      {/* Add custom CSS for hiding scrollbar but keeping functionality */}
      <style jsx>{`
        .hide-scrollbar {
          -ms-overflow-style: none;  /* IE and Edge */
          scrollbar-width: none;  /* Firefox */
        }
        .hide-scrollbar::-webkit-scrollbar {
          display: none;  /* Chrome, Safari and Opera */
        }
      `}</style>

      {/* Removed game controls display since we're using the global GameBoyControls component */}
    </div>
  );

};

export default SquadsClipts;
