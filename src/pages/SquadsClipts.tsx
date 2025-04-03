import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Heart, MessageSquare, Trophy, Share2, Bookmark, ArrowLeft } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ShareButton } from '@/components/ShareButton';

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
  const [currentPostIndex, setCurrentPostIndex] = useState(0);
  const [initialPostSet, setInitialPostSet] = useState(false);
  const [navigationDirection, setNavigationDirection] = useState<'next' | 'prev' | null>(null);

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
      console.error("Error getting media URL:", error);
      return null;
    }
  };

  // Navigation between posts
  const handleNavigation = (direction: 'next' | 'prev') => {
    if (squadPosts.length === 0) return;
    
    setNavigationDirection(direction);
    
    if (direction === 'next') {
      setCurrentPostIndex(prevIndex => 
        prevIndex < squadPosts.length - 1 ? prevIndex + 1 : 0
      );
    } else {
      setCurrentPostIndex(prevIndex => 
        prevIndex > 0 ? prevIndex - 1 : squadPosts.length - 1
      );
    }
  };

  // Set initial post when posts are loaded
  useEffect(() => {
    if (squadPosts.length > 0 && !initialPostSet) {
      setCurrentPostIndex(0);
      setInitialPostSet(true);
    }
  }, [squadPosts, initialPostSet]);

  // Add keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') {
        handleNavigation('next');
      } else if (e.key === 'ArrowLeft') {
        handleNavigation('prev');
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Optional: Add joystick control hook here if needed
  
  return (
    <div className="bg-gradient-to-b from-black to-purple-950 min-h-screen">
      <div className="relative min-h-screen overflow-hidden">
        {/* Fixed header with title */}
        <div className="fixed top-0 left-0 right-0 z-10 bg-black/60 backdrop-blur-sm">
          <div className="flex justify-center items-center h-16">
            <h1 className="text-xl font-bold text-center text-white">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-blue-600">
                Squad Clipts
              </span>
            </h1>
          </div>
        </div>
        
        {/* Main content area */}
        {squadPosts.length > 0 ? (
          <div className="pt-16 min-h-screen">
            <div className="relative h-[calc(100vh-64px)]">
              <div className="h-full">
                {/* Only render current post for better performance */}
                {squadPosts.length > 0 && squadPosts[currentPostIndex] && (
                  <div className="h-full">
                    <div className="flex flex-col h-full">
                      {/* Post container */}
                      <div className="flex-1 relative">
                        {/* User info */}
                        <div className="absolute top-0 left-0 right-0 z-10 p-4 bg-gradient-to-b from-black/80 to-transparent">
                          <div className="flex items-center">
                            <Avatar className="h-10 w-10 border-2 border-purple-500">
                              <AvatarImage src={squadPosts[currentPostIndex]?.profiles?.avatar_url || ""} />
                              <AvatarFallback className="bg-purple-950 text-purple-300">
                                {squadPosts[currentPostIndex]?.profiles?.username?.charAt(0).toUpperCase() || "U"}
                              </AvatarFallback>
                            </Avatar>
                            <div className="ml-2">
                              <div className="font-medium text-white">
                                {squadPosts[currentPostIndex]?.profiles?.display_name || 
                                  squadPosts[currentPostIndex]?.profiles?.username || "Anonymous"}
                              </div>
                              <div className="text-xs text-gray-400">
                                {squadPosts[currentPostIndex]?.created_at && 
                                  formatDistanceToNow(new Date(squadPosts[currentPostIndex].created_at), { addSuffix: true })}
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        {/* Post content */}
                        <div className="h-full flex flex-col justify-center items-center p-4 pt-16 pb-16">
                          {/* Caption with horizontal scroll */}
                          {squadPosts[currentPostIndex]?.content && (
                            <div className="w-full mb-4 pb-2 overflow-x-auto hide-scrollbar">
                              <p className="text-gray-200 text-center whitespace-pre-wrap px-4">
                                {squadPosts[currentPostIndex].content}
                              </p>
                            </div>
                          )}
                          
                          {/* Media container */}
                          <div className="flex-1 flex items-center justify-center w-full max-h-[60vh]">
                            <div className="relative w-full h-full flex items-center justify-center">
                              {(getMediaUrl(squadPosts[currentPostIndex])?.includes('.mp4') || 
                                getMediaUrl(squadPosts[currentPostIndex])?.includes('.webm')) ? (
                                <video 
                                  src={getMediaUrl(squadPosts[currentPostIndex]) || ''}
                                  controls
                                  className="max-h-[80vh] max-w-full object-contain"
                                  poster={squadPosts[currentPostIndex].thumbnail_url || ''}
                                />
                              ) : (
                                <div className="flex items-center justify-center h-full w-full text-center text-blue-300 bg-blue-900/20">
                                  For video clips only!
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Action buttons */}
                      <div className="p-4 flex items-center justify-between border-t border-purple-900/50 bg-black/30">
                        <button 
                          className={`flex items-center ${squadPosts[currentPostIndex]?.liked_by_current_user ? 'text-red-400' : 'text-gray-300'}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            squadPosts[currentPostIndex]?.id && likeMutation.mutate(squadPosts[currentPostIndex].id);
                          }}
                          aria-label="Like post"
                        >
                          <Heart className="mr-1 h-6 w-6 fill-current" />
                          <span className="text-base">{squadPosts[currentPostIndex]?.likes_count || 0}</span>
                        </button>
                        
                        <button 
                          className="text-blue-400" 
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/post/${squadPosts[currentPostIndex].id}`);
                          }}
                          aria-label="View comments"
                        >
                          <MessageSquare className="h-6 w-6" />
                        </button>
                        
                        <button 
                          className="flex items-center text-yellow-400"
                          onClick={(e) => e.stopPropagation()}
                          aria-label="Give trophy"
                        >
                          <Trophy className="mr-1 h-6 w-6" />
                          <span className="text-base">{squadPosts[currentPostIndex]?.trophy_count || 0}</span>
                        </button>
                        
                        <button 
                          className="text-purple-400"
                          onClick={(e) => e.stopPropagation()}
                          aria-label="Share post"
                        >
                          <Share2 className="h-6 w-6" />
                        </button>
                        
                        <button 
                          className="text-gray-300"
                          onClick={(e) => e.stopPropagation()}
                          aria-label="Save post"
                        >
                          <Bookmark className="h-6 w-6" />
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Navigation indicators */}
              <div className="absolute bottom-4 left-0 right-0 flex justify-center space-x-2">
                {squadPosts.map((_, index) => (
                  <div 
                    key={index} 
                    className={`w-2 h-2 rounded-full ${index === currentPostIndex ? 'bg-white' : 'bg-gray-500'}`}
                    onClick={() => setCurrentPostIndex(index)}
                  />
                ))}
              </div>
              
              {/* Navigation controls with glowing effect */}
              <div className="absolute left-0 right-0 top-1/2 transform -translate-y-1/2 flex justify-between pointer-events-none">
                <button 
                  onClick={() => handleNavigation('prev')}
                  className="h-full w-1/4 flex items-center justify-start pl-8 pointer-events-auto transition-all duration-300 active:scale-95 bg-transparent"
                  aria-label="Previous post"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" 
                    className="h-10 w-10 transition-all duration-300 hover:scale-110" 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="rgba(216, 180, 254, 0.9)"
                    style={{
                      filter: "drop-shadow(0 0 15px rgba(168, 85, 247, 0.9)) drop-shadow(0 0 5px rgba(255, 0, 255, 0.7))"
                    }}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                
                <button 
                  onClick={() => handleNavigation('next')}
                  className="h-full w-1/4 flex items-center justify-end pr-8 pointer-events-auto transition-all duration-300 active:scale-95 bg-transparent"
                  aria-label="Next post"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" 
                    className="h-10 w-10 transition-all duration-300 hover:scale-110" 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="rgba(216, 180, 254, 0.9)"
                    style={{
                      filter: "drop-shadow(0 0 15px rgba(168, 85, 247, 0.9)) drop-shadow(0 0 5px rgba(255, 0, 255, 0.7))"
                    }}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex justify-center items-center h-full pt-16">
            <div className="text-center p-4 max-w-md">
              <h3 className="text-xl font-bold text-purple-300 mb-2">No squad clipts available</h3>
              <p className="text-gray-400">Add friends to your squad or create new clipts!</p>
            </div>
          </div>
        )}
        
        {/* Add custom CSS for hiding scrollbar but keeping functionality */}
        <style dangerouslySetInnerHTML={{ __html: `
          .hide-scrollbar {
            -ms-overflow-style: none;  /* IE and Edge */
            scrollbar-width: none;  /* Firefox */
          }
          .hide-scrollbar::-webkit-scrollbar {
            display: none;  /* Chrome, Safari and Opera */
          }
        `}} />
      </div>
    </div>
  );
};

export default SquadsClipts;
