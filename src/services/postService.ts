import { supabase } from "@/lib/supabase";
import { Post } from "@/types/post";
import { useErrorHandler } from "@/hooks/useErrorHandler";

interface CreatePostParams {
  content: string;
  userId: string;
  imageUrl?: string | null;
  videoUrl?: string | null;
  scheduledPublishTime?: string | null;
  isPublished?: boolean;
}

export const postService = {
  async fetchPosts({ page, limit, userId, followedUserIds }: {
    page: number;
    limit: number;
    userId?: string;
    followedUserIds?: string[];
  }) {
    try {
      const query = supabase
        .from('posts')
        .select(`
          id,
          content,
          image_url,
          video_url,
          created_at,
          user_id,
          profiles:user_id (
            username,
            avatar_url
          ),
          likes:likes!post_id (
            count
          ),
          clip_votes:clip_votes!post_id (
            count
          )
        `)
        .range(page * limit, (page + 1) * limit - 1)
        .order('created_at', { ascending: false })
        .is('is_published', true);

      if (userId && followedUserIds && followedUserIds.length > 0) {
        query.in('user_id', followedUserIds);
      }

      const { data, error } = await query;
      
      if (error) throw error;
      return data as Post[];
    } catch (error) {
      const { handleError } = useErrorHandler();
      handleError(error, 'Error fetching posts');
      throw error;
    }
  },

  async createPost(params: CreatePostParams) {
    try {
      const { data, error } = await supabase
        .from('posts')
        .insert({
          content: params.content,
          user_id: params.userId,
          image_url: params.imageUrl,
          video_url: params.videoUrl,
          scheduled_publish_time: params.scheduledPublishTime,
          is_published: params.isPublished
        })
        .select()
        .single();

      if (error) throw error;
      return { data: data as Post, error: null };
    } catch (error) {
      const { handleError } = useErrorHandler();
      handleError(error, 'Error creating post');
      return { data: null, error };
    }
  },

  async likePost(postId: string, userId: string) {
    try {
      const { error } = await supabase
        .from('likes')
        .insert({ post_id: postId, user_id: userId });

      if (error) throw error;
    } catch (error) {
      const { handleError } = useErrorHandler();
      handleError(error, 'Error liking post');
      throw error;
    }
  },

  async unlikePost(postId: string, userId: string) {
    try {
      const { error } = await supabase
        .from('likes')
        .delete()
        .eq('post_id', postId)
        .eq('user_id', userId);

      if (error) throw error;
    } catch (error) {
      const { handleError } = useErrorHandler();
      handleError(error, 'Error unliking post');
      throw error;
    }
  },

  async trackAnalytics(postId: string, metricType: string, value: number = 1) {
    try {
      await supabase.rpc('track_post_analytics', {
        post_id_param: postId,
        metric_type: metricType,
        increment_value: value
      });
    } catch (error) {
      const { handleError } = useErrorHandler();
      handleError(error, 'Error tracking post analytics');
      // Don't throw here as analytics errors shouldn't break the app
    }
  }
};

// Export individual functions for direct import
export const { createPost, fetchPosts } = postService;
