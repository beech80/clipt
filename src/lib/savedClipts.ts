import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

// Save a clipt to the user's saved collection
export const saveClipt = async (
  userId: string,
  postId: string,
  thumbnailUrl?: string,
  videoUrl?: string,
  title?: string
) => {
  try {
    // Check if already saved
    const { data: existingSaved } = await supabase
      .from('saved_videos')
      .select('id')
      .eq('user_id', userId)
      .eq('post_id', postId)
      .single();

    if (existingSaved) {
      // Already saved - show success toast 
      toast.success('Clipt is already in your collection');
      return { success: true, alreadySaved: true };
    }

    // Save to database
    const { data, error } = await supabase
      .from('saved_videos')
      .insert([
        {
          user_id: userId,
          post_id: postId,
          thumbnail_url: thumbnailUrl,
          video_url: videoUrl,
          title: title || 'Saved Clipt',
          saved_at: new Date().toISOString(),
        },
      ]);

    if (error) {
      console.error('Error saving clipt:', error);
      toast.error('Failed to save clipt');
      return { success: false, error };
    }

    toast.success('Clipt saved to your collection!');
    return { success: true, data };
  } catch (error) {
    console.error('Error in saveClipt function:', error);
    toast.error('Failed to save clipt');
    return { success: false, error };
  }
};

// Get all saved clipts for a user
export const getSavedClipts = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('saved_videos')
      .select(`
        id,
        post_id,
        thumbnail_url,
        video_url,
        title,
        saved_at,
        posts(
          id,
          content,
          title,
          image_url,
          video_url,
          likes_count,
          views_count,
          profiles(
            username,
            display_name,
            avatar_url
          )
        )
      `)
      .eq('user_id', userId)
      .order('saved_at', { ascending: false });

    if (error) {
      console.error('Error fetching saved clipts:', error);
      return { success: false, error };
    }

    return { 
      success: true, 
      data: data.map(item => ({
        id: item.id,
        postId: item.post_id,
        thumbnailUrl: item.thumbnail_url || item.posts?.image_url,
        videoUrl: item.video_url || item.posts?.video_url,
        title: item.title || item.posts?.title || 'Saved Clipt',
        savedAt: item.saved_at,
        // Include post details if available
        post: item.posts ? {
          id: item.posts.id,
          content: item.posts.content,
          title: item.posts.title,
          imageUrl: item.posts.image_url,
          videoUrl: item.posts.video_url,
          likesCount: item.posts.likes_count,
          viewsCount: item.posts.views_count,
          author: item.posts.profiles ? {
            username: item.posts.profiles.username,
            displayName: item.posts.profiles.display_name,
            avatarUrl: item.posts.profiles.avatar_url
          } : null
        } : null
      })) 
    };
  } catch (error) {
    console.error('Error in getSavedClipts function:', error);
    return { success: false, error };
  }
};

// Remove a clipt from saved collection
export const unsaveClipt = async (userId: string, postId: string) => {
  try {
    const { data, error } = await supabase
      .from('saved_videos')
      .delete()
      .eq('user_id', userId)
      .eq('post_id', postId);

    if (error) {
      console.error('Error removing saved clipt:', error);
      toast.error('Failed to remove from collection');
      return { success: false, error };
    }

    toast.success('Removed from your collection');
    return { success: true, data };
  } catch (error) {
    console.error('Error in unsaveClipt function:', error);
    toast.error('Failed to remove from collection');
    return { success: false, error };
  }
};
