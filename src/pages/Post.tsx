import { useNavigate, useParams, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Skeleton } from "@/components/ui/skeleton";
import { SEO } from "@/components/SEO";
import PostItem from "@/components/PostItem";
import { Calendar, User } from "lucide-react";
import { Post as PostType } from "@/types/post";
import { toast } from "sonner";
import { useEffect, useRef, useState } from "react";
import { CommentList } from "@/components/post/CommentList";
import { BackButton } from "@/components/ui/back-button";

const Post = () => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const commentsRef = useRef<HTMLDivElement>(null);
  const [userPosts, setUserPosts] = useState<PostType[]>([]);
  const [isLoadingUserPosts, setIsLoadingUserPosts] = useState(false);

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
      // Add slight delay to ensure DOM is ready
      setTimeout(() => {
        if (commentsRef.current) {
          commentsRef.current.scrollIntoView({ behavior: 'smooth' });
        }
      }, 300);
    }
  }, [location.hash]);

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
              ),
              likes_count:likes(count),
              comments_count:comments(count)
            `)
            .eq('user_id', post.user_id)
            .order('created_at', { ascending: false })
            .limit(50);
            
          if (error) {
            console.error('Error fetching user posts:', error);
            return;
          }
          
          console.log('User posts loaded:', userPostsData?.length);
          // Process the data to ensure counts are numbers
          const processedPosts = userPostsData?.map(p => ({
            ...p,
            likes_count: p.likes_count?.[0]?.count || 0,
            comments_count: p.comments_count?.[0]?.count || 0
          })) as unknown as PostType[];
          
          setUserPosts(processedPosts);
        } catch (err) {
          console.error('Error in fetchUserPosts:', err);
        } finally {
          setIsLoadingUserPosts(false);
        }
      };
      
      fetchUserPosts();
    }
  }, [post, id]);

  return (
    <>
      <SEO 
        title={`${post.content || "Gaming clip"} - Clip`}
        description={post.content || "Check out this gaming clip on Clip"}
        image={post.image_url || "/og-image.png"}
        type="article"
        structuredData={structuredData}
      />
      <div className="min-h-screen bg-black text-white">
        {/* Header */}
        <div className="fixed top-0 left-0 right-0 bg-black border-b border-gray-800 z-10">
          <div className="container mx-auto px-4 py-3 flex items-center justify-between">
            <div className="flex items-center">
              <BackButton />
              <div className="ml-4 font-semibold text-lg">{post.profiles?.username || "User"}</div>
            </div>
          </div>
        </div>
        
        {/* Main content with padding for header */}
        <div className="pt-14 pb-20">
          {/* Current post */}
          <div className="border-b border-gray-800">
            {/* User info header */}
            <div className="px-4 py-3 flex items-center">
              <div className="w-8 h-8 rounded-full overflow-hidden mr-3">
                <img 
                  src={post.profiles?.avatar_url || '/placeholder-avatar.png'} 
                  alt={post.profiles?.username || "User"}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = '/placeholder-avatar.png';
                  }}
                />
              </div>
              <div className="font-medium text-sm">{post.profiles?.username || "User"}</div>
              <div className="ml-auto">
                <button className="p-1">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M6 10a2 2 0 11-4 0 2 2 0 014 0zM12 10a2 2 0 11-4 0 2 2 0 014 0zM16 12a2 2 0 100-4 2 2 0 000 4z" />
                  </svg>
                </button>
              </div>
            </div>
            
            {/* Post media/content */}
            <div className="aspect-square bg-gray-900 flex items-center justify-center overflow-hidden">
              {post.video_url ? (
                <video 
                  src={post.video_url} 
                  className="w-full h-full object-contain"
                  controls
                  poster={post.image_url || undefined}
                />
              ) : post.image_url ? (
                <img 
                  src={post.image_url} 
                  alt={post.content || "Post"} 
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' fill='%23252525'/%3E%3Ctext x='50' y='50' font-family='Arial' font-size='12' fill='%23ffffff' text-anchor='middle' dominant-baseline='middle'%3ENo Image%3C/text%3E%3C/svg%3E";
                  }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-900 p-4">
                  <p className="text-center text-gray-300">{post.content || "No content"}</p>
                </div>
              )}
            </div>
            
            {/* Post actions */}
            <div className="px-4 py-2 flex items-center">
              <button className="p-1 mr-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </button>
              <button className="p-1 mr-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </button>
              <button className="p-1 mr-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
              <button className="p-1 ml-auto">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                </svg>
              </button>
            </div>
            
            {/* Likes count */}
            <div className="px-4 py-1">
              <p className="font-semibold text-sm">{post.likes_count || 0} likes</p>
            </div>
            
            {/* Caption */}
            <div className="px-4 py-1">
              <p className="text-sm">
                <span className="font-semibold mr-2">{post.profiles?.username || "User"}</span>
                {post.content || "No caption"}
              </p>
            </div>
            
            {/* Comments */}
            <div className="px-4 py-2">
              <CommentList 
                postId={id || ''} 
                key={`comments-${id}`}
                hideForm={false}
              />
            </div>
          </div>
          
          {/* More posts section title */}
          <div className="px-4 py-4 border-b border-gray-800">
            <p className="text-sm text-gray-400 uppercase font-medium">More from {post.profiles?.username || "this user"}</p>
          </div>
          
          {/* More posts grid */}
          <div className="grid grid-cols-3 gap-[1px]">
            {isLoadingUserPosts ? (
              // Loading skeletons
              Array.from({ length: 9 }).map((_, i) => (
                <div key={`skeleton-${i}`} className="aspect-square bg-gray-900">
                  <Skeleton className="w-full h-full" />
                </div>
              ))
            ) : (
              userPosts
                .filter(p => p.id !== id) // Filter out the current post
                .map(userPost => (
                  <div 
                    key={userPost.id} 
                    className="aspect-square bg-gray-900 relative cursor-pointer"
                    onClick={() => navigate(`/post/${userPost.id}`)}
                  >
                    {userPost.video_url ? (
                      <div className="w-full h-full relative">
                        <img 
                          src={userPost.image_url || "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' fill='%23252525'/%3E%3Ctext x='50' y='50' font-family='Arial' font-size='12' fill='%23ffffff' text-anchor='middle' dominant-baseline='middle'%3EVideo%3C/text%3E%3C/svg%3E"} 
                          alt="Video thumbnail"
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute top-2 right-2">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="white">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                      </div>
                    ) : userPost.image_url ? (
                      <img 
                        src={userPost.image_url} 
                        alt={userPost.content || "Post"} 
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target =e.target as HTMLImageElement;
                          target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' fill='%23252525'/%3E%3Ctext x='50' y='50' font-family='Arial' font-size='12' fill='%23ffffff' text-anchor='middle' dominant-baseline='middle'%3ENo Image%3C/text%3E%3C/svg%3E";
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gray-900 p-2">
                        <p className="text-xs text-center text-gray-300 line-clamp-3">{userPost.content || "No content"}</p>
                      </div>
                    )}
                  </div>
                ))
            )}
          </div>
          
          {!isLoadingUserPosts && userPosts.filter(p => p.id !== id).length === 0 && (
            <div className="text-center py-8 text-gray-400">
              No other posts from this user
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Post;