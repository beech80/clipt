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
import { formatDistanceToNow } from "date-fns";

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
      <div className="min-h-screen bg-[#101d57]">
        {/* Header */}
        <div className="bg-[#0a1141] py-3 px-4 flex items-center">
          <button 
            onClick={() => navigate(-1)}
            className="mr-4 text-white"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-2xl font-bold text-white">Post</h1>
        </div>
        
        {/* Main content */}
        <div className="container mx-auto max-w-2xl px-4 py-6">
          {/* User's posts feed */}
          <div className="space-y-6">
            {/* Show all user posts in a vertical feed */}
            {[post, ...userPosts.filter(p => p.id !== id)].map(userPost => (
              <div 
                key={userPost.id} 
                className="bg-[#1a2366] rounded-lg overflow-hidden shadow-md" 
                data-post-id={userPost.id}
              >
                {/* User info header */}
                <div className="p-4 flex items-center">
                  <div className="w-10 h-10 bg-gray-700 rounded-full overflow-hidden mr-3">
                    {userPost.profiles?.avatar_url ? (
                      <img 
                        src={userPost.profiles.avatar_url} 
                        alt={userPost.profiles?.username || "User"}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = '/placeholder-avatar.png';
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-[#2a2a2a] text-white">
                        {userPost.profiles?.username?.[0]?.toUpperCase() || "U"}
                      </div>
                    )}
                  </div>
                  <div>
                    <div className="font-semibold text-white">{userPost.profiles?.username || "Username"}</div>
                    <div className="text-gray-400 text-sm">
                      {userPost.created_at ? formatDistanceToNow(new Date(userPost.created_at), { addSuffix: true }) : ""}
                    </div>
                  </div>
                </div>
                
                {/* Post content/caption */}
                {userPost.content && (
                  <div className="px-4 pb-2 text-white">
                    {userPost.content}
                  </div>
                )}
                
                {/* Post media */}
                <div className="bg-[#080e31] aspect-video flex items-center justify-center">
                  {userPost.video_url ? (
                    <video 
                      src={userPost.video_url} 
                      className="max-h-full max-w-full"
                      controls
                      poster={userPost.image_url || undefined}
                    />
                  ) : userPost.image_url ? (
                    <img 
                      src={userPost.image_url} 
                      alt={userPost.content || "Post content"} 
                      className="max-h-full max-w-full"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' fill='%23252525'/%3E%3Ctext x='50' y='50' font-family='Arial' font-size='12' fill='%23ffffff' text-anchor='middle' dominant-baseline='middle'%3ENo Image%3C/text%3E%3C/svg%3E";
                      }}
                    />
                  ) : (
                    <div className="p-4 text-center text-gray-400">
                      Media content would appear here
                    </div>
                  )}
                </div>
                
                {/* Interaction bar */}
                <div className="p-4 flex items-center">
                  <button className="flex items-center mr-4">
                    <svg className="w-6 h-6 text-white" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                    </svg>
                    <span className="ml-2 text-white text-sm">{userPost.likes_count || 0}</span>
                  </button>
                  
                  <button className="flex items-center mr-4" onClick={() => commentsRef.current?.scrollIntoView({ behavior: 'smooth' })}>
                    <svg className="w-6 h-6 text-white" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    <span className="ml-2 text-white text-sm">{userPost.comments_count || 0}</span>
                  </button>
                  
                  <button className="flex items-center mr-4">
                    <svg className="w-6 h-6 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                    </svg>
                    <span className="ml-2 text-white text-sm">1</span>
                  </button>
                  
                  <button className="flex items-center ml-auto">
                    <svg className="w-6 h-6 text-white" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                    </svg>
                  </button>
                </div>
                
                {/* Comments section - only show for the current post */}
                {userPost.id === id && (
                  <div 
                    className="px-4 pb-4 border-t border-[#283380]" 
                    ref={userPost.id === id ? commentsRef : undefined} 
                    id={userPost.id === id ? "comments" : undefined}
                  >
                    <CommentList 
                      postId={id || ''} 
                      key={`comments-${id}`}
                      hideForm={false}
                    />
                  </div>
                )}
              </div>
            ))}
            
            {isLoadingUserPosts && (
              <div className="space-y-4 mt-6">
                {[1, 2, 3].map(i => (
                  <div key={`skeleton-${i}`} className="bg-[#1a2366] rounded-lg overflow-hidden shadow-md p-4">
                    <div className="flex items-center mb-4">
                      <Skeleton className="h-10 w-10 rounded-full mr-3" />
                      <div>
                        <Skeleton className="h-5 w-32 mb-1" />
                        <Skeleton className="h-4 w-20" />
                      </div>
                    </div>
                    <Skeleton className="h-[200px] w-full mb-4" />
                    <div className="flex">
                      <Skeleton className="h-6 w-16 mr-2" />
                      <Skeleton className="h-6 w-16 mr-2" />
                      <Skeleton className="h-6 w-16 mr-2" />
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {!isLoadingUserPosts && userPosts.filter(p => p.id !== id).length === 0 && (
              <div className="text-center py-8 text-gray-400">
                No other posts from this user
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default Post;