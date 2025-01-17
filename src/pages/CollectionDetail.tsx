import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import PostItem from "@/components/PostItem";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Post } from "@/types/post";

const CollectionDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data: collection, isLoading: collectionLoading } = useQuery({
    queryKey: ['collection', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('collections')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    },
  });

  const { data: posts, isLoading: postsLoading } = useQuery({
    queryKey: ['collection-posts', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('collection_posts')
        .select(`
          post:posts (
            id,
            content,
            image_url,
            video_url,
            created_at,
            user_id,
            profiles (
              username,
              avatar_url,
              display_name
            )
          )
        `)
        .eq('collection_id', id);

      if (error) throw error;

      // Get likes count and clip votes for each post
      const postsWithCounts = await Promise.all(
        data.map(async ({ post }) => {
          const [likesResponse, clipVotesResponse] = await Promise.all([
            supabase
              .from('likes')
              .select('*', { count: 'exact' })
              .eq('post_id', post.id),
            supabase
              .from('clip_votes')
              .select('*', { count: 'exact' })
              .eq('post_id', post.id),
          ]);

          return {
            ...post,
            likes_count: likesResponse.count || 0,
            clip_votes: [{ count: clipVotesResponse.count || 0 }],
          };
        })
      );

      return postsWithCounts as Post[];
    },
    enabled: !!id,
  });

  if (collectionLoading || postsLoading) {
    return <div className="container mx-auto px-4 py-8">Loading...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <Button 
          variant="ghost" 
          onClick={() => navigate('/collections')}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Collections
        </Button>
        <h1 className="text-3xl font-bold">{collection?.name}</h1>
        {collection?.description && (
          <p className="text-muted-foreground mt-2">{collection.description}</p>
        )}
      </div>

      <div className="grid gap-6">
        {posts?.map((post) => (
          <PostItem
            key={post.id}
            post={post}
          />
        ))}
        {posts?.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            No posts in this collection yet
          </div>
        )}
      </div>
    </div>
  );
};

export default CollectionDetail;