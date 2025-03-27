import { useNavigate, useParams, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Skeleton } from "@/components/ui/skeleton";
import { SEO } from "@/components/SEO";
import PostItem from "@/components/PostItem";
import { Calendar, User } from "lucide-react";
import { Post as PostType } from "@/types/post";
import { toast } from "sonner";
import { useEffect, useRef } from "react";
import { CommentList } from "@/components/post/CommentList";
import { BackButton } from "@/components/ui/back-button";

const Post = () => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const commentsRef = useRef<HTMLDivElement>(null);

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
            />
            
            {/* Comments section */}
            <div ref={commentsRef} id="comments" className="mt-6 px-4 pb-4" data-post-id={id}>
              <CommentList 
                postId={id || ''} 
                key={`comments-${id}`}
                hideForm={false}
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Post;