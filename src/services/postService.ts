import { supabase } from "@/lib/supabase";
import { extractHashtags } from "@/utils/hashtagUtils";
import { gameIdToUuid } from '@/utils/idUtils';

interface CreatePostParams {
  content: string;
  userId: string;
  imageUrl?: string | null;
  videoUrl?: string | null;
  scheduledPublishTime?: string | null;
  isPublished?: boolean;
  gameId?: string | number | null;
  postType?: 'regular' | 'clip' | null;
}

interface CreatePostResponse {
  data: {
    id: string;
    content: string;
    user_id: string;
    image_url: string | null;
    video_url: string | null;
    game_id: string | null;
    created_at: string;
  } | null;
  error: Error | null;
}

export const createPost = async ({ content, userId, imageUrl, videoUrl, scheduledPublishTime, isPublished, gameId, postType }: CreatePostParams): Promise<CreatePostResponse> => {
  try {
    // Convert numeric gameId to UUID-compatible format if provided
    const formattedGameId = gameId ? gameIdToUuid(gameId) : null;

    // Create the post
    const { data: post, error: postError } = await supabase
      .from('posts')
      .insert({
        content: content.trim(),
        user_id: userId,
        image_url: imageUrl,
        video_url: videoUrl,
        scheduled_publish_time: scheduledPublishTime,
        is_published: isPublished,
        game_id: formattedGameId,
        post_type: postType || 'regular'
      })
      .select()
      .single();

    if (postError) {
      return { data: null, error: postError };
    }

    // Extract and save hashtags
    const hashtags = extractHashtags(content);
    if (hashtags.length > 0) {
      // Insert hashtags
      const { data: hashtagData, error: hashtagError } = await supabase
        .from('hashtags')
        .upsert(
          hashtags.map(tag => ({ name: tag.toLowerCase() })),
          { onConflict: 'name' }
        )
        .select('id, name');

      if (hashtagError) {
        return { data: post, error: hashtagError };
      }

      // Link hashtags to post
      const { error: linkError } = await supabase
        .from('post_hashtags')
        .insert(
          hashtagData.map(tag => ({
            post_id: post.id,
            hashtag_id: tag.id
          }))
        );

      if (linkError) {
        return { data: post, error: linkError };
      }
    }

    return { data: post, error: null };
  } catch (error) {
    return { data: null, error: error as Error };
  }
};

export const track_post_analytics = async (postId: string, metricType: 'view' | 'share' | 'share_click' | 'hashtag_click' | 'time_spent', value: number = 1) => {
  const { error } = await supabase.rpc('track_post_analytics', {
    post_id_param: postId,
    metric_type: metricType,
    increment_value: value
  });

  if (error) throw error;
};