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
      <div className="min-h-screen bg-[#131626]">
        <div className="container mx-auto max-w-2xl px-4 py-6">
          <BackButton />
          
          {/* User's posts feed */}
          <div className="space-y-6 mt-4">
            {/* Show all user posts in a vertical feed */}
            {[post, ...userPosts.filter(p => p.id !== id)].map(userPost => (
              <div 
                key={userPost.id} 
                className="gaming-card border border-[#2e4482]/30 rounded-lg overflow-hidden bg-[#1a1f30] shadow-md" 
                data-post-id={userPost.id}
              >
                <div className="p-4">
                  {/* User info header */}
                  <div className="flex items-center mb-4">
                    <div className="h-10 w-10 rounded-full overflow-hidden border-2 border-indigo-500 mr-3">
                      <img 
                        src={userPost.profiles?.avatar_url || '/placeholder-avatar.png'}
                        alt={userPost.profiles?.username || 'User'}
                        className="h-full w-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = '/placeholder-avatar.png';
                        }}
                      />
                    </div>
                    <div>
                      <div className="font-bold text-white">{userPost.profiles?.username || 'User'}</div>
                    </div>
                  </div>
                  
                  {/* Post content */}
                  <PostItem 
                    post={userPost} 
                    data-post-id={userPost.id} 
                  />
                </div>
                
                {/* Interactive elements */}
                <div className="px-4 pb-2 flex items-center space-x-4">
                  <button className="flex items-center space-x-1 text-red-500">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                    </svg>
                    <span className="text-white">{userPost.likes_count || 0}</span>
                  </button>
                  
                  <button className="flex items-center space-x-1 text-blue-500">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    <span className="text-white">{userPost.comments_count || 0}</span>
                  </button>
                  
                  <button className="flex items-center space-x-1 text-yellow-500">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2L8.52 8.15l-7.15.62 5.42 4.8L4.99 21 12 17.27 19.01 21l-1.8-7.43 5.42-4.8-7.15-.62L12 2z" />
                    </svg>
                    <span className="text-white">1</span>
                  </button>
                  
                  <button className="flex items-center space-x-1 text-purple-500 ml-auto">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                    </svg>
                    <span className="text-white">Share</span>
                  </button>
                </div>
                
                {/* Caption */}
                <div className="px-4 pb-4">
                  <div className="flex items-start">
                    <span className="font-bold text-white mr-2">{userPost.profiles?.username || 'User'}</span>
                    <span className="text-gray-300">{userPost.content || "Post test"}</span>
                  </div>
                </div>
                
                {/* Comments section - only show for the current post */}
                {userPost.id === id && (
                  <div className="px-4 pb-4" ref={userPost.id === id ? commentsRef : undefined} id={userPost.id === id ? "comments" : undefined}>
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
                  <div key={`skeleton-${i}`} className="gaming-card border border-[#2e4482]/30 rounded-lg overflow-hidden bg-[#1a1f30] shadow-md p-4">
                    <div className="flex items-center mb-4">
                      <Skeleton className="h-10 w-10 rounded-full mr-3" />
                      <Skeleton className="h-5 w-32" />
                    </div>
                    <Skeleton className="h-[300px] w-full mb-4" />
                    <Skeleton className="h-6 w-3/4 mb-2" />
                    <Skeleton className="h-4 w-1/2" />
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