import { supabase } from "@/lib/supabase";
import { extractHashtags } from "@/utils/hashtagUtils";

interface CreatePostParams {
  content: string;
  userId: string;
  imageUrl?: string | null;
  videoUrl?: string | null;
}

export const createPost = async ({ content, userId, imageUrl, videoUrl }: CreatePostParams) => {
  // Create the post
  const { data: post, error: postError } = await supabase
    .from('posts')
    .insert({
      content: content.trim(),
      user_id: userId,
      image_url: imageUrl,
      video_url: videoUrl
    })
    .select()
    .single();

  if (postError) throw postError;

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

    if (hashtagError) throw hashtagError;

    // Link hashtags to post
    const { error: linkError } = await supabase
      .from('post_hashtags')
      .insert(
        hashtagData.map(tag => ({
          post_id: post.id,
          hashtag_id: tag.id
        }))
      );

    if (linkError) throw linkError;
  }

  return post;
};