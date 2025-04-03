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
      console.error("Error processing media URL:", error);
      return null;
    }
  };

  // Function to navigate to previous/next post
  const handleNavigation = (direction: 'next' | 'prev') => {
    setNavigationDirection(direction);
    
    if (direction === 'next') {
      setCurrentPostIndex((prev) => Math.min(prev + 1, squadPosts.length - 1));
    } else {
      setCurrentPostIndex((prev) => Math.max(prev - 1, 0));
    }
  };

  useEffect(() => {
    if (squadPosts.length > 0 && !initialPostSet) {
      setCurrentPostIndex(0);
      setInitialPostSet(true);
    }
  }, [squadPosts, initialPostSet]);

  useEffect(() => {
    // Listen for custom navigation events from GameBoyControls
    const handlePostNavigation = (event: CustomEvent) => {
      const { direction } = event.detail;
      handleNavigation(direction);
    };
    
    // Add event listener for custom navigatePost event
    document.addEventListener('navigatePost', handlePostNavigation as EventListener);
    
    // Cleanup
    return () => {
      document.removeEventListener('navigatePost', handlePostNavigation as EventListener);
    };
  }, [squadPosts.length]);

  // Current post to display

  const currentPost = squadPosts[currentPostIndex];

  return (
    <div className="fixed inset-0 bg-black text-white overflow-hidden touch-none select-none">
      <div className="h-screen w-screen overflow-hidden relative">
        {/* Back button removed for cleaner full-screen experience */}
        <div className="fixed top-0 left-0 right-0 z-10 flex justify-center p-4">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">Squads Clipts</h1>
        </div>
  {isLoading ? (
    <div className="flex justify-center items-center h-full">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
    </div>
        ) : squadPosts.length > 0 ? (
          <div className="h-full relative">
            {/* Main content area that fills the screen */}
            <div className="h-full w-full relative overflow-hidden">
              {/* Current post display */}
              <div className="h-full w-full">
                {/* User info and caption at top */}
                <div className="absolute top-14 left-0 right-0 z-10 flex flex-col items-start">
                  <div className="w-full px-4 py-2 flex items-center space-x-2 bg-black/60 backdrop-blur-sm">
                    <Avatar 
                      className="w-8 h-8 rounded-full overflow-hidden cursor-pointer"
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
                    <div>
                      <span className="font-medium text-sm text-white">
                        {currentPost?.profiles?.username || 'Username'}
                      </span>
                      {/* Caption with horizontal scrolling */}
                      {currentPost?.content && (
                        <div className="overflow-x-auto max-w-[85vw] hide-scrollbar whitespace-nowrap">
                          <p className="text-gray-300 text-sm">{currentPost.content}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Video content centered in screen */}
                <div className="h-full w-full flex items-center justify-center bg-black">
                  {getMediaUrl(currentPost) && 
                   (getMediaUrl(currentPost)?.includes('.mp4') || getMediaUrl(currentPost)?.includes('.webm')) ? (
                    <video 
                      src={getMediaUrl(currentPost) || ''}
                      autoPlay
                      loop
                      muted
                      playsInline
                      className="h-full max-h-[80vh] max-w-full object-contain"
                      poster={currentPost.thumbnail_url || ''}
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full w-full text-center text-gray-400">
                      No video available
                    </div>
                  )}
                </div>

                {/* Action buttons on the right side */}
                <div className="absolute right-4 bottom-24 flex flex-col gap-6 items-center z-10">
                  <button 
                    className={`flex flex-col items-center ${currentPost?.liked_by_current_user ? 'text-red-500' : 'text-white'}`}
                    onClick={() => currentPost?.id && likeMutation.mutate(currentPost.id)}
                    aria-label="Like post"
                  >
                    <Heart className={`h-8 w-8 ${currentPost?.liked_by_current_user ? 'fill-red-500' : ''}`} />
                    <span className="text-xs mt-1">{currentPost?.likes_count || 0}</span>
                  </button>
                  
                  <button 
                    className="flex flex-col items-center text-white" 
                    onClick={() => currentPost?.id && navigate(`/post/${currentPost.id}`)}
                    aria-label="View comments"
                  >
                    <MessageSquare className="h-8 w-8" />
                    <span className="text-xs mt-1">{currentPost?.comments_count || 0}</span>
                  </button>
                  
                  <button 
                    className="flex flex-col items-center text-yellow-400"
                    aria-label="Give trophy"
                  >
                    <Trophy className="h-8 w-8" />
                    <span className="text-xs mt-1">{currentPost?.trophy_count || 0}</span>
                  </button>
                  
                  <button className="text-white" aria-label="Save video">
                    <Bookmark className="h-8 w-8" />
                  </button>
                  
                  <ShareButton 
                    url={`${window.location.origin}/post/${currentPost?.id}`} 
                    title={`Check out this clip from ${currentPost?.profiles?.username || 'a user'}`}
                    iconClassName="h-8 w-8 text-white hover:text-purple-400 transition-all"
                    style={{
                      filter: "drop-shadow(0 0 10px rgba(168, 85, 247, 0.8)) drop-shadow(0 0 3px rgba(255, 0, 255, 0.6))"
                    }}
                  />
                </div>
        {isLoading ? (
          <div className="flex justify-center items-center h-full">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
          </div>
        ) : squadPosts.length > 0 ? (
          <div className="h-full relative">
            {/* Horizontal Scrollable Container - Full Height */}
            <div className="relative overflow-x-auto h-full hide-scrollbar">
              <div className="flex flex-row h-full snap-x snap-mandatory">
                {squadPosts.map((post, index) => (
                  <div key={post.id} className="flex-shrink-0 w-screen h-full snap-center" onClick={() => setCurrentPostIndex(index)}>
                    <div className="h-full w-full flex items-center justify-center">
                      {/* Full-width post container */}
                      <div className="w-screen h-full flex flex-col bg-gradient-to-b from-[#1a237e] to-[#0d1b3c] border-y border-purple-900/50 overflow-hidden">
                        {/* User info */}
                        <div className="p-3 flex items-center gap-2 bg-blue-900/40 border-b border-purple-900/50">
                          <Avatar 
                            className="w-10 h-10 rounded-full overflow-hidden cursor-pointer"
                            onClick={(e) => {
                              e.stopPropagation();
                              post?.user_id && navigate(`/profile/${post.user_id}`);
                            }}
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
                          <span className="font-medium text-lg text-white">
                            {post?.profiles?.username || 'Username'}
                          </span>
                        </div>
                        
                        {/* Video content container that fills more of the screen */}
                        <div className="flex-grow flex items-center justify-center">
                          <div className="w-full h-full flex items-center justify-center">
                          {getMediaUrl(post) && 
                           (getMediaUrl(post)?.includes('.mp4') || getMediaUrl(post)?.includes('.webm')) ? (
                            <video 
                              src={getMediaUrl(post) || ''}
                              controls
                              className="max-h-[80vh] max-w-full object-contain"
                              poster={post.thumbnail_url || ''}
                            />
                          ) : (
                            <div className="flex items-center justify-center h-full w-full text-center text-blue-300 bg-blue-900/20">
                              For video clips only!
                            </div>
                          )}
                          </div>
                        </div>
                      
                        {/* Action buttons - Only in the post container, not at the bottom */}
                        <div className="p-4 flex items-center justify-between border-t border-purple-900/50 bg-black/30">
                          <button 
                            className={`flex items-center ${post?.liked_by_current_user ? 'text-red-400' : 'text-gray-300'}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              post?.id && likeMutation.mutate(post.id);
                            }}
                            aria-label="Like post"
                          >
                            <Heart className="mr-1 h-6 w-6 fill-current" />
                            <span className="text-base">{post?.likes_count || 0}</span>
                          </button>
                          
                          <button 
                            className="text-blue-400" 
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/post/${post.id}`);
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
                      </div>
                    )}
                    </div>
                  </div>
                  
                  {/* Action buttons - Only in the post container, not at the bottom */}
                  <div className="p-4 flex items-center justify-between border-t border-purple-900/50 bg-black/30">
                    <button 
                      className={`flex items-center ${post?.liked_by_current_user ? 'text-red-400' : 'text-gray-300'}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        post?.id && likeMutation.mutate(post.id);
                      }}
                      aria-label="Like post"
                    >
                      <Heart className="mr-1 h-6 w-6 fill-current" />
                      <span className="text-base">{post?.likes_count || 0}</span>
                    </button>
                    
                    <button 
                      className="text-blue-400" 
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/post/${post.id}`);
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
                      <span className="text-base">{post?.trophy_count || 0}</span>
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
                    
                    <button 
                      className="text-gray-300"
                      onClick={(e) => e.stopPropagation()}
                      aria-label="Back"
                    >
                      <ArrowLeft className="h-6 w-6" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
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
          </div>
        ) : (
          <div className="flex justify-center items-center h-full">
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
