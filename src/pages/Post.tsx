import { useNavigate, useParams, useLocation } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Skeleton } from "@/components/ui/skeleton";
import { SEO } from "@/components/SEO";
import PostItem from "@/components/PostItem";
import { Calendar, MessageSquare, Share2, User, Grid, ChevronRight, ChevronLeft, ArrowUpRight } from "lucide-react";
import { Post as PostType } from "@/types/post";
import { toast } from "sonner";
import { useEffect, useRef, useState } from "react";
import { CommentList } from "@/components/post/CommentList";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";
import { createComment } from "@/services/commentService";
import { BackButton } from "@/components/ui/back-button";

const Post = () => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [userPosts, setUserPosts] = useState<PostType[]>([]);
  const [isLoadingUserPosts, setIsLoadingUserPosts] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showComments, setShowComments] = useState(false);
  const commentsRef = useRef<HTMLDivElement>(null);
  const [commentText, setCommentText] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  const { data: post, isLoading, error } = useQuery({
    queryKey: ['post', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          profiles:user_id (
            username,
            avatar_url,
            display_name
          ),
          likes_count:likes(count),
          clip_votes:clip_votes(count)
        `)
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;
      if (!data) throw new Error('Post not found');

      return {
        ...data,
        likes_count: data.likes_count?.[0]?.count || 0,
        clip_votes: data.clip_votes || []
      } as PostType;
    },
  });

  // Fetch more posts from the same user once we have the current post
  useEffect(() => {
    if (post && post.user_id) {
      setIsLoadingUserPosts(true);
      
      // Direct approach without React Query to avoid filter issues
      const fetchUserPosts = async () => {
        try {
          // Using a direct Supabase query without unnecessary filters that may block results
          const { data: userPostsData, error } = await supabase
            .from('posts')
            .select(`
              *,
              profiles:user_id (
                username,
                avatar_url,
                display_name
              )
            `)
            .eq('user_id', post.user_id)
            .neq('id', id) // Exclude current post
            .order('created_at', { ascending: false })
            .limit(20);
            
          if (error) {
            console.error('Error fetching user posts:', error);
            return;
          }
          
          console.log('User posts loaded:', userPostsData?.length);
          setUserPosts(userPostsData as unknown as PostType[]);
        } catch (err) {
          console.error('Error in fetchUserPosts:', err);
        } finally {
          setIsLoadingUserPosts(false);
        }
      };
      
      fetchUserPosts();
    }
  }, [post, id]);

  // Scroll functions for user posts carousel
  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -300, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 300, behavior: 'smooth' });
    }
  };

  if (error) {
    toast.error("Failed to load post");
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto max-w-2xl px-4 py-6">
          <BackButton />
          <div className="mt-8 text-center">
            <h2 className="text-xl font-semibold text-red-500">Failed to load post</h2>
            <p className="mt-2 text-muted-foreground">Please try again later</p>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto max-w-2xl px-4 py-6">
          <BackButton />
          <div className="mt-4 space-y-4">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-[400px] w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto max-w-2xl px-4 py-6">
          <BackButton />
          <div className="mt-8 text-center">
            <h2 className="text-xl font-semibold">Post not found</h2>
            <p className="mt-2 text-muted-foreground">This post may have been deleted or is no longer available</p>
          </div>
        </div>
      </div>
    );
  }

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "SocialMediaPosting",
    "headline": post.content || "Gaming clip",
    "author": {
      "@type": "Person",
      "name": post.profiles?.username || "Unknown"
    },
    "datePublished": post.created_at,
    "image": post.image_url,
    "video": post.video_url,
    "interactionStatistic": [
      {
        "@type": "InteractionCounter",
        "interactionType": "https://schema.org/LikeAction",
        "userInteractionCount": post.likes_count
      }
    ]
  };

  const formattedDate = new Date(post.created_at).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  // Check if URL has #comments hash on load
  useEffect(() => {
    if (location.hash === '#comments') {
      setShowComments(true);
      // Add slight delay to ensure DOM is ready
      setTimeout(() => {
        if (commentsRef.current) {
          commentsRef.current.scrollIntoView({ behavior: 'smooth' });
        }
      }, 300);
    }
  }, [location.hash]);

  // Handler for clicking on a user post
  const handleUserPostClick = (postId: string) => {
    navigate(`/post/${postId}`);
  };

  // Function to get the best media URL for a post
  const getMediaUrl = (post: PostType) => {
    if (!post) return null;
    
    // Try to get the media URL from different possible sources
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
    
    // Fallback to other potential fields
    return post.image_url || post.video_url || (post as any).thumbnail_url || null;
  };

  const submitComment = async () => {
    if (!commentText.trim()) return;
    setIsSubmittingComment(true);
    try {
      const { user } = useAuth();
      if (!user) {
        toast.error("You must be logged in to comment");
        return;
      }
      
      await createComment({
        post_id: id || '',
        user_id: user.id,
        content: commentText,
      });
      
      toast.success("Comment added successfully");
      setCommentText('');
      
      // Refresh comments data
      const queryClient = useQueryClient();
      queryClient.invalidateQueries({ queryKey: ['comments', id] });
      queryClient.invalidateQueries({ queryKey: ['comments-count', id] });
    } catch (err) {
      console.error('Error submitting comment:', err);
      toast.error("Failed to add comment");
    } finally {
      setIsSubmittingComment(false);
    }
  };

  return (
    <>
      <SEO 
        title={`${post.content || "Gaming clip"} - Clip`}
        description={post.content || "Check out this gaming clip on Clip"}
        image={post.image_url || "/og-image.png"}
        type="article"
        structuredData={structuredData}
      />
      <div className="min-h-screen bg-gradient-to-b from-[#0d1b3c] to-[#121212]">
        <div className="container mx-auto max-w-2xl px-4 py-6">
          <div className="mb-6 flex items-center justify-between">
            <BackButton />
            <div className="flex items-center space-x-4 text-sm text-white/70">
              <div className="flex items-center space-x-1">
                <Calendar className="h-4 w-4" />
                <span>{formattedDate}</span>
              </div>
              <div className="flex items-center space-x-1">
                <User className="h-4 w-4" />
                <span>{post.profiles?.username || "Anonymous"}</span>
              </div>
            </div>
          </div>
          
          <div className="gaming-card border border-[#2e4482]/30 rounded-lg overflow-hidden bg-[#1a1f30]" data-post-id={id}>
            <PostItem 
              post={post} 
              data-post-id={id} 
              onCommentClick={() => {
                setShowComments(true);
                setTimeout(() => {
                  if (commentsRef.current) {
                    commentsRef.current.scrollIntoView({ behavior: 'smooth' });
                  }
                }, 100);
              }}
            />
            
            {/* Comments section */}
            <div ref={commentsRef} id="comments" className="mt-6 px-4 pb-4" data-post-id={id}>
              {showComments ? (
                <>
                  <CommentList 
                    postId={id || ''} 
                    onBack={() => setShowComments(false)}
                    key={`comments-${id}`}
                    hideForm={false}
                  />
                </>
              ) : (
                <div className="bg-[#1A1F2C] rounded-lg p-4 text-center cursor-pointer border border-[#2e4482]/30" onClick={() => setShowComments(true)}>
                  <MessageSquare className="h-6 w-6 mx-auto mb-2 text-blue-400" />
                  <p>Click to view comments</p>
                </div>
              )}
            </div>
            
            {/* More from this user section - in Madden NFL 95 style */}
            {userPosts.length > 0 && (
              <div className="mt-12 mb-6">
                <div className="bg-[#1a237e] border border-[#2e4482] rounded-lg overflow-hidden">
                  {/* User banner */}
                  <div className="p-4 pb-0">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Avatar className="h-10 w-10 border-2 border-indigo-500">
                          <AvatarImage src={post.profiles?.avatar_url || ''} alt={post.profiles?.username || 'User'} />
                          <AvatarFallback className="bg-[#0d1b3c] text-white">
                            {post.profiles?.username?.substring(0, 2).toUpperCase() || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h3 className="text-lg font-bold text-white">More from {post.profiles?.display_name || post.profiles?.username || 'this user'}</h3>
                          <div 
                            className="text-indigo-300 hover:text-white text-sm cursor-pointer flex items-center" 
                            onClick={() => navigate(`/profile/${post.user_id}`)}
                          >
                            View all posts <ArrowUpRight className="h-3 w-3 ml-1" />
                          </div>
                        </div>
                      </div>
                      
                      {/* Scroll controls */}
                      <div className="flex space-x-2">
                        <button 
                          onClick={scrollLeft}
                          className="p-2 rounded bg-[#0d1b3c] text-white hover:bg-indigo-800 transition"
                          aria-label="Scroll left"
                        >
                          <ChevronLeft className="h-5 w-5" />
                        </button>
                        <button 
                          onClick={scrollRight}
                          className="p-2 rounded bg-[#0d1b3c] text-white hover:bg-indigo-800 transition"
                          aria-label="Scroll right"
                        >
                          <ChevronRight className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  {/* Scrollable posts */}
                  <div 
                    ref={scrollContainerRef}
                    className="flex overflow-x-auto py-4 px-4 gap-2 hide-scrollbar scroll-smooth"
                    style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                  >
                    {isLoadingUserPosts ? (
                      // Loading skeletons
                      Array.from({ length: 6 }).map((_, i) => (
                        <div key={`skeleton-${i}`} className="relative flex-shrink-0 w-40 h-40 bg-[#0d1b3c]/50 rounded">
                          <Skeleton className="w-full h-full" />
                        </div>
                      ))
                    ) : userPosts.length > 0 ? (
                      // User posts
                      userPosts.map(userPost => {
                        const mediaUrl = getMediaUrl(userPost);
                        return (
                          <div
                            key={userPost.id}
                            onClick={() => handleUserPostClick(userPost.id)}
                            className="relative flex-shrink-0 w-40 h-40 overflow-hidden rounded cursor-pointer border border-[#2e4482]/30 hover:border-indigo-400 transition group"
                          >
                            {mediaUrl ? (
                              <img
                                src={mediaUrl}
                                alt={userPost.content?.substring(0, 20) || "Post"}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' fill='%231a237e'/%3E%3Ctext x='50' y='50' font-family='Arial' font-size='12' fill='%236366f1' text-anchor='middle' dominant-baseline='middle'%3ENo Image%3C/text%3E%3C/svg%3E";
                                }}
                              />
                            ) : (
                              <div className="w-full h-full flex flex-col items-center justify-center bg-[#0d1b3c] p-2">
                                <div className="text-white text-xs text-center overflow-hidden line-clamp-3">
                                  {userPost.content || "No content"}
                                </div>
                              </div>
                            )}
                            {/* Post info overlay */}
                            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                              <div className="text-xs text-white line-clamp-1">
                                {userPost.content?.substring(0, 30) || "Post"}
                              </div>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="w-full h-40 flex items-center justify-center text-indigo-300">
                        No other posts from this user
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default Post;