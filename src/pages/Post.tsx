import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import PostItem from "@/components/PostItem";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Post as PostType } from "@/types/post";
import { SEO } from "@/components/SEO";

const Post = () => {
  const { id } = useParams();

  const { data: post, isLoading, error } = useQuery({
    queryKey: ['post', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          profiles:user_id (
            username,
            avatar_url
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
    return <div className="p-4">Failed to load post</div>;
  }

  if (isLoading) {
    return <Skeleton className="h-[600px] w-full" />;
  }

  if (!post) {
    return <div className="p-4">Post not found</div>;
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

  return (
    <>
      <SEO 
        title={`${post.content || "Gaming clip"} - Clip`}
        description={post.content || "Check out this gaming clip on Clip"}
        image={post.image_url || "/og-image.png"}
        type="article"
        structuredData={structuredData}
      />
      <div className="container mx-auto max-w-2xl py-8">
        <PostItem post={post} />
      </div>
    </>
  );
};

export default Post;