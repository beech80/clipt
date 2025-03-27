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
            {/* First show the current post */}
            <div className="gaming-card border border-[#2e4482]/30 rounded-lg overflow-hidden bg-[#1a1f30] shadow-md" data-post-id={id}>
              <div className="p-4">
                {/* User info header */}
                <div className="flex items-center mb-4">
                  <div className="h-10 w-10 rounded-full overflow-hidden border-2 border-indigo-500 mr-3">
                    <img 
                      src={post.profiles?.avatar_url || '/placeholder-avatar.png'}
                      alt={post.profiles?.username || 'User'}
                      className="h-full w-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = '/placeholder-avatar.png';
                      }}
                    />
                  </div>
                  <div>
                    <div className="font-bold text-white">{post.profiles?.username || 'User'}</div>
                  </div>
                </div>
                
                {/* Post content */}
                <PostItem 
                  post={post} 
                  data-post-id={id} 
                />
              </div>
              
              {/* Comments section */}
              <div ref={commentsRef} id="comments" className="px-4 pb-4" data-post-id={id}>
                <CommentList 
                  postId={id || ''} 
                  key={`comments-${id}`}
                  hideForm={false}
                />
              </div>
            </div>
            
            {/* Then show other posts from the same user */}
            {userPosts
              .filter(p => p.id !== id) // Filter out the current post
              .map(userPost => (
                <div 
                  key={userPost.id} 
                  className="gaming-card border border-[#2e4482]/30 rounded-lg overflow-hidden bg-[#1a1f30] shadow-md cursor-pointer"
                  onClick={() => navigate(`/post/${userPost.id}`)}
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